"use client";

import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import { useQuestContext } from "@/components/context/quest";
import { app } from "@/components/fb/config";
import { Card, CardHeader,CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar"
import { genericConverter, QuestMetadata } from "@/lib/models";
import { User } from "firebase/auth";
import { collection, doc, getDoc, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function Home({ params }: {params: {questId:string}}) {

    const [qrResult, setQrResult] = useState<string>()
    const [resp, setResp] = useState<string>()
    const qid = params.questId
    const q = useQuestContext()
    const user = q.user;

    useEffect(()=>{
      if(qrResult && qrResult != "") {
        navigator.vibrate(300)
        user?.getIdToken()
        .then((s) => fetch(`/api/quest/${qid}/execute`,{
          headers: { 
            "Content-Type": "application/json",
            "X-Token": s
          },
          method:'POST',
          body: qrResult
        })).then(async (r)=> setResp(await r.text()))
      }
    
    },[qrResult])

    return <div className="flex w-full h-full flex-col">
        <Navbar />
        <main className="flex items-center justify-center flex-col">
                <Card className="w-full m-5 h-fit">
                  <Scanner
                      components={{
                        tracker:true
                      }}
                      onResult={(result) => {
                        console.log(result)
                        setQrResult(result)}}
                      onError={(error) => console.info(error)}
                  />
                <CardContent>
                  {qrResult}
                </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    {resp}
                  </CardContent>
                </Card>
        </main>
    </div>


}