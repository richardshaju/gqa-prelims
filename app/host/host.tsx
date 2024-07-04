"use client";

import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import { useQuestContext } from "@/components/context/quest";
import { app } from "@/components/fb/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar"
import { genericConverter, QuestMetadata } from "@/lib/models";
import { User } from "firebase/auth";
import { collection, doc, getDoc, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home({ params }: {params: {questId:string}}) {

    const [qData, setQData] = useState<QuestMetadata | 404>()
    const qid = params.questId
    const q = useQuestContext()
    const user = q.user;

    useEffect(()=>{
        user?.getIdToken()
        .then((s) => fetch(`/api/quest/${qid}`,{
                headers: { "Content-Type": "application/json",
                    "X-Token": s
                },
                method:'GET'
            }))
        .then(async (resp)=>{
            if(resp.ok){
                setQData(await resp.json())
            }else{
                setQData(404)
            }
        })

        
},[])

    return (qData)? (qData != 404)?<div className="flex w-full h-full flex-col">
        <Navbar qName={qData?.name} />
        <main className="flex items-center justify-center">
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Host Page
                        </CardTitle>
                        <Button>Create Quest</Button>
                    </CardHeader>
                    <CardContent>

                    </CardContent>
                </Card>
            </div>
        </main>
    </div>:
    <NotFound p={window.location.href}/>:
    <Loading msg="Loading Quest..."/>


}