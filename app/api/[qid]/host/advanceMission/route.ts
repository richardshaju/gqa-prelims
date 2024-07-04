import { NextRequest, NextResponse } from "next/server";
import { Command, GenericConverter, QuestPoints, Quest, QuestMetadata, Team, User, genericConverter, Mission } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { decodeToken, encodeToken, generateID } from '@/lib/utils';

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)


/*
  START QUEST:
  Endpoint: /api/[qid]/host/startQuest
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'generateQP' command.
*/
export async function POST(req: Request, {params} :{ params:{ qid: string }}) {

  const token = req.headers.get("X-Token")
  const tid = req.headers.get("X-TID")

  let decodedToken;

  if (!token || !tid) return NextResponse.json(
    { msg: 'Missing required arguments.' },
    { status: 400 }
  );
  
  try{
    decodedToken = await adminAuth.verifyIdToken(token)
  }catch{
    return NextResponse.json(
      { msg: "Unauthenticated: Invalid IDToken." },
      { status: 401 }
    )
  }

  let qRref = (await adminDb.collection("quest").doc(params.qid).get());
  
    // Check if the Quest exists
    if(!qRref.exists) return NextResponse.json(
      { msg: "Not Found, Nice Try Bruhh." },
      { status: 404 }
    )
    const qData = (qRref.data() as unknown as Quest)

    // Check if the user has host privilages.
    if(qData.metadata.host != decodedToken.uid) return NextResponse.json(
      { msg: "Unauthorized." },
      { status: 401 }
    )

    const msData: { [key: string]: [] } = (await adminDb.collection("quest").doc(params.qid).collection('missions').doc('initial').get()).data() || {};
    const tRef = await adminDb.collection("quest").doc(params.qid).collection('teams').doc(tid).get()

    if(!tRef.exists) return NextResponse.json(
      { msg: "Team not found." },
      { status: 404 }
    )

    const team = tRef.data() as Team

    const [crntMid, level] = team.currentMission?.split('.') || ['','']

    if(level != "end") return NextResponse.json(
      { msg: "Mission not completed." },
      { status: 400 }
    )

    if(!team?.msId) return NextResponse.json(
      { msg: "Missions not found." },
      { status: 404 }
    )

    const cd = msData[team?.msId]
    const newMid = cd[cd.findIndex((mid) => mid == crntMid) + 1]

    if(!newMid) return NextResponse.json(
      { msg: "No more missions." },
      { status: 400 }
    )

    tRef.ref.update({ currentMission: newMid + ".init" } as Team)
    adminDb.collection("quest").doc(params.qid).collection('missions').doc(newMid).update({crnt: {level: "", team: "", startTime: 0}})
    adminDb.collection("quest").doc(params.qid).collection('missions').doc(newMid).collection('level').doc("init").update({usedHint : false})

    return NextResponse.json({"msg": "Mission Advanced."})

}