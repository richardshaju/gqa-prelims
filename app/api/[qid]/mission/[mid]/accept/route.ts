import { NextResponse } from "next/server";
import { Mission, GenericConverter, QuestMetadata, User, Team, Quest, Level } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { Timestamp } from "firebase/firestore";

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

/*
  GET Mission:
    Endpoint: /api/[qid]/team/mission
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
    }
    Method: GET
*/

// Get the Mission
export async function POST(req: Request, {params}:{params:{ mid: string, qid: string}}) {

  const token = req.headers.get("X-Token")

  if (!token && token != "gqa.btnTask.MLwwBQ") return NextResponse.json(
    { msg: 'Missing required arguments.' },
    { status: 400 }
  );

  if(params.mid == "btnTask"){
    if(token != "gqa.btnTask.MLwwBQ") return NextResponse.json(
      { msg: 'Unauthorized.' },
      { status: 401 }
    );

    return adminDb.collection("quest").doc(params.qid).collection('missions').doc(params.mid).get().then(async (doc) => {
      if(doc.exists){
        const mData = doc.data() as unknown as Mission

        if(!mData.crnt?.team) return NextResponse.json({ msg: "Mission is not assigned." }, { status: 403 });
        
        (await adminDb.collection("quest").doc(params.qid).collection('teams').doc(mData.crnt?.team).get())

        return NextResponse.json({mission: mData});
      }else{
        return NextResponse.json(
          { msg: "Not Found, Nice Try Bruhh." },
          { status: 404 }
        )
      }
    })

  
  }
}
