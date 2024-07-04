import { NextRequest, NextResponse } from "next/server";
import { Command, GenericConverter, QuestPoints, Quest, QuestMetadata, Team, User, genericConverter, Mission } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { decodeToken, encodeToken, generateID } from '@/lib/utils';

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)


/*
  HOST API [EXTENDED]
    Endpoint: /api/quest/[qid]/host/[cmd]
    Headers : {
      'X-Token' : Firebase IDToken
    }
    Method: POST
*/
export async function POST(req: Request, {params} :{ params:{ cmd: Command['type'] | "generateQP" | "addQP" | "addMission", qid: string }}) {

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

    const qpRef = adminDb.collection("quest").doc(params.qid).collection('questPoints')



  /*
  CREATE TEAM:
    Endpoint: /api/quest/[qid]/host/createTeam
    Headers : {
      'X-Token' : Firebase IDToken
    }
    Method: POST
    Returns: A JWT Token with 'createTeam' command.
*/
  if(params.cmd == "createTeam"){

  return await createTeam(params.qid, qData)
  }

/*
  GENERATE QP QRs:  
  Endpoint: /api/quest/[qid]/host/generateQP
  Headers : {
    'X-Token' : Firebase IDToken
    'X-count' : Number of QPs to generate
  }
  Method: POST
*/
  else if(params.cmd == "generateQP"){
    
    let n = Number(req.headers.get("X-count"))

    if(!n) n = 1
    let ls = []

    for(let i=0; i<n; i++){
      ls.push(await generateQP(params.qid, qData, qpRef))
    }

    return NextResponse.json(
      { tokens: ls }
    );
  }

/*
  ADD QPs TO THE QUEST:
  Endpoint: /api/quest/[qid]/host/addQP
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'addQP' command.
*/
  else if(params.cmd == "addQP"){

    const { token, qpName, qp_type, qp_value } = await req.json()

    if(!token || !qpName || !qp_value || !qp_type) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });

    try{
      const cmd = decodeToken(token, qData.qToken) as Command

      // Check if the given token is a QuestPoint
      if(cmd.type != "awardQP") return NextResponse.json({ msg: 'Given Token is not a QuestPoint QR.' }, { status: 409 });

      // Adding the QP to the Quest's DB
      await qpRef.doc(cmd.data).set({
        qpid: cmd.data,
        type: qp_type,
        value: qp_value,
        name: qpName
      } as QuestPoints)

      return NextResponse.json({'msg':"Success.", qpid: cmd.data})

    }catch{
      return NextResponse.json(
        { msg: 'Invalid Token.' },
        { status: 403 }
      );
    }
  }

/*
  ADD MISSIONS TO THE QUEST:
  Endpoint: /api/quest/[qid]/host/addMission
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'generateQP' command.
*/
}

async function generateQP(qid:string, qData:Quest, qpRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>){
  const qpid:string = generateID(20);

  // Checks if qpid already exists and recursively call the function again if true 
  if((await qpRef.get()).docs.find((v)=> v.data().qpid == qpid)) return generateQP(qid, qData, qpRef)
    
  return encodeToken({
    qid: qid,
    data: qpid,
    type: "awardQP"
  } as Command,qData.qToken)

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