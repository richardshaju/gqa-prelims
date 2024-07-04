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
  Endpoint: /api/quest/[qid]/host/startQuest
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'generateQP' command.
*/
export async function POST(req: Request, {params} :{ params:{ qid: string }}) {

  const token = req.headers.get("X-Token")
  let decodedToken;

  if (!token) return NextResponse.json(
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

    const mRef = (await adminDb.collection("quest").doc(params.qid).collection('missions').doc('initial').get()).data()
    const tRef = await adminDb.collection("quest").doc(params.qid).collection('teams').get()

    let missions: Array<{id: string; ref:FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>}> = []
    // Cleaning up unclaimed teams
    tRef.docs.forEach(async (team) => {
      if(team.data().initiated == true) team.ref.delete()
    })

    if(tRef.size == 0) return NextResponse.json({"msg": "No Teams Found."}, {status: 409})
    if(!mRef) return NextResponse.json({"msg": "No Missions Found."}, {status: 409})
    if(mRef.size < tRef.size) return NextResponse.json({"msg": "Not enough missions for the teams."}, {status: 409})

    var keys = Object.keys(mRef);

    // Assign random missions to the teams    
    tRef.docs.forEach(async (team) => {
      // Get a random mission
      const msID = keys[keys.length * Math.random() << 0]
      keys.splice(keys.indexOf(msID), 1)
      
      await team.ref.update({currentMission: mRef[msID][0], msID: msID})
      await adminDb.collection("quest").doc(params.qid).collection('missions').doc(mRef[msID][0]).update({crnt: {team: team.id, level: "init"}})
    })

    return NextResponse.json({"msg": "Quest Started."})

}

async function generateQuestTaskID(qRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>){
  const qtid:string = generateID(20);

  // Checks if qpid already exists and recursively call the function again if true 
  if((await qRef.get()).docs.find((v)=> v.data().id == qtid)) return generateQuestTaskID(qRef)
  return qtid
}

async function createTeam(qid: string, qData: Quest) {

  const tRef = adminDb.collection("quest").doc(qid).collection('teams')
  const tid:string = generateID(15)
      
  // Checks if tid already exists (TIDs must be unique) and recursively call the function again if true 
  if((await tRef.doc(tid).get()).exists) return createTeam(qid, qData)

  // Intializing the Team
  await tRef.doc(tid).set({tid: tid, initiated: true})

  return NextResponse.json(
      { token: encodeToken({
        qid: qid,
        data: tid,
        type: "createTeam"
      }, qData.qToken), tid: tid }
    );
  
}