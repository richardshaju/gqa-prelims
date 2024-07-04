import { NextRequest, NextResponse } from "next/server";
import { Command, GenericConverter, QuestPoints, Quest, QuestMetadata, Team, User, genericConverter, Mission, Level } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { generateID } from '@/lib/utils';

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

    const qpRef = adminDb.collection("quest").doc(params.qid).collection('questPoints')



/*
  ADD MISSIONS TO THE QUEST:
  Endpoint: /api/quest/[qid]/host/addMission
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'generateQP' command.
*/
    const { levelTitle, missionTitle, context, hint, type, showInQuest, timeout, availablePoints } = await req.json()

    if(!missionTitle || !levelTitle || !context) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });

    const qRef = adminDb.collection("quest").doc(params.qid)
    const qtRef = qRef.collection('missions')

    const qtid = await generateQuestTaskID(qtRef)

    const data = {
      id: qtid,
      crnt: {
        team: "",
        level: "",
        startTime: 0
      },
      availablePoints: availablePoints,
      missionTitle: missionTitle,
      timeout: timeout,

      showInQuest: (typeof showInQuest == "undefined")? true : showInQuest,
    } as Mission
    // Create Quest Task
    await qtRef.doc(qtid).set(data)

    qtRef.doc(qtid).collection('level').doc("init").set({ id: "init", next:"end", usedHint: false, title: levelTitle, context: context, hint: hint } as Level)
    qtRef.doc(qtid).collection('level').doc("end").set({ id: "end", type: "end" } as Level)

    return NextResponse.json({'msg': "Mission Added", 'qid': qtid})
}

async function generateQuestTaskID(qRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>){
  const qtid:string = generateID(20);

  // Checks if qpid already exists and recursively call the function again if true 
  if((await qRef.get()).docs.find((v)=> v.data().id == qtid)) return generateQuestTaskID(qRef)
  return qtid
}
