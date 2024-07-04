import { NextRequest, NextResponse } from "next/server";
import { Command, GenericConverter, QuestPoints, Quest, QuestMetadata, Team, User, genericConverter, Mission, Level } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { decodeToken, generateID } from '@/lib/utils';

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)


/*
  UPDATE MISSION:
  Endpoint: /api/quest/[qid]/host/updateMission
  Headers : {
    'X-Token' : Firebase IDToken
    'X-MID': Mission ID
  }
  Method: POST
*/
export async function POST(req: Request, {params} :{ params:{ qid: string }}) {

  const token = req.headers.get("X-Token")
  const mid = req.headers.get("X-MID")
  let decodedToken;

  if (!token || !mid) return NextResponse.json(
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

    const qrToken  = await req.text()

    if(!qrToken) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });

    const qRef = adminDb.collection("quest").doc(params.qid)
    const mRef = qRef.collection('missions').doc(mid)

    const {qid , type, data} = decodeToken(qrToken, qData.qToken)
    // Create Quest Task

    if(qid != params.qid) return NextResponse.json({ msg: 'Invalid Quest Token.' }, { status: 400 });

    mRef.collection('level').doc("init").update({value: data} as Level)

    return NextResponse.json({'msg': "QR Added"})
}

async function generateQuestTaskID(qRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>){
  const qtid:string = generateID(20);

  // Checks if qpid already exists and recursively call the function again if true 
  if((await qRef.get()).docs.find((v)=> v.data().id == qtid)) return generateQuestTaskID(qRef)
  return qtid
}
