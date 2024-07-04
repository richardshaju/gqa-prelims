import { NextResponse } from "next/server";
import { Mission, GenericConverter, QuestMetadata, User, Team, Quest, Level } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { Timestamp } from "firebase/firestore";
import { validate } from "../validator";

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

/*
  GET Mission:
    Endpoint: /api/quest/[qid]/team/mission
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
    }
    Method: GET
*/

// Get the Mission
export async function GET(req: Request, {params}:{params:{ qid: string, cmd: string}}) {

  // Validate the request.
  const v = await validate(req, {params});
  if (typeof v != "object") return v;

  const { tid, tRef, tData} = v as {tid: string, tRef: FirebaseFirestore.DocumentSnapshot<Team>, tData: Team};
  
  const mid = req.headers.get("X-MID")

  if(!mid || mid?.length == 0) return NextResponse.json(
    { msg: "Start the mission first." },
    { status: 409 }
  )
  const [missionId, levelId] = mid.split(".");


  let qtRef = await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).get()
  
  // Check if the Mission  exists.
  if(!qtRef.exists) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." },{ status: 404 })
  
  const mData = qtRef.data() as Mission

  // Check if the Mission is visible to the team.
  if(!mData.showInQuest) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." }, { status: 404 })

  if(tData.currentMission != mid) return NextResponse.json({ mission: mData })

  // Check if the Mission is assigned to the team.
  if(mData.crnt?.team != tid) return NextResponse.json({mission: mData})
  
  let levelData = (await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).collection('level').doc(mData.crnt.level || "init").get()).data()

  return NextResponse.json({mission: mData, level: levelData});

}

/*
  START Mission:
    Endpoint: /api/quest/[qid]/team/mission
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
      'X-MID': Mission ID
    }
    Method: POST
*/
export async function POST(req: Request, {params}:{params:{ qid: string, cmd: string}}) {

  // Validate the request.
  const v = await validate(req, {params});
  if (typeof v != "object") return v;

  const { tid, tRef} = v as {tid: string, tRef: FirebaseFirestore.DocumentSnapshot<Team>};
  
  const mid = req.headers.get("X-MID")

  if(!mid) return NextResponse.json(
    { msg: "Missing required arguments." },
    { status: 400 }
  )
  const [missionId, levelId] = mid.split(".");

  let qtRef = await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).get()
  let mLog = await adminDb.collection("quest").doc(params.qid).collection('teams').doc(tid).collection("missionLog").doc(mid).get()
  
  
  // Check if the Mission exists.
  if(!qtRef.exists) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." },{ status: 404 })
  
  const qtData = qtRef.data() as Mission

  // Check if the Mission is visible to the team.
  if(!qtData.showInQuest) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." }, { status: 404 })

  // Check if the Mission is already taken.
  if(qtData.crnt?.team) return NextResponse.json({ msg: "Already Taken." }, { status: 403 })

  // Check if the Team already has a Mission.
  if(tRef.data()?.currentMission) return NextResponse.json({ msg: "Finish the current Mission." }, { status: 403 })

  // Check if the Team has already completed the Mission.
  if(mLog.exists) return NextResponse.json({ msg: "Claimed Already." }, { status: 403 })

  // Assign the Mission to the team.
  await qtRef.ref.update({ crnt: {'startTime': Timestamp.fromDate(new Date()), team: tid, level:"init" }})
  await tRef.ref.update({ currentMission: mid })
  await mLog.ref.set({ startTime: Timestamp.fromDate(new Date()), endTime: null, level: "init", status: "init", mid: mid})

  return NextResponse.json(qtData);
}


/*
  EXIT Mission:
    Endpoint: /api/quest/[qid]/team/mission
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
    }
    Method: DELETE
*/
export async function DELETE(req: Request, {params}:{params:{ qid: string}}) {

  // Validate the request.
  const v = await validate(req, {params});
  if (typeof v != "object") return v;

  const { tid, tRef, tData} = v as {tid: string, tRef: FirebaseFirestore.DocumentSnapshot<Team>, tData: Team};
  
  const mid = tData.currentMission

  if(!mid || mid?.length == 0) return NextResponse.json(
    { msg: "Start the mission first." },
    { status: 409 }
  )
  const [missionId, levelId] = mid.split(".");

  let qtRef = await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).get()
  let mLog = await adminDb.collection("quest").doc(params.qid).collection('teams').doc(tid).collection("missionLog").doc(mid).get()
  
  // Check if the Mission exists.
  if(!qtRef.exists) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." },{ status: 404 })
  
  const qtData = qtRef.data() as Mission

  // Check if the team is assigned to the Mission.
  if(qtData.crnt?.team != tid) return NextResponse.json({ msg: "Invalid Request." }, { status: 403 })

  // Check if the Mission is claimed by the team.
  if(!mLog.exists) return NextResponse.json({ msg: "Mission not claimed." }, { status: 403 })

  // Exit the mission
  await qtRef.ref.update({ crnt: {'startTime':0, team: "", level:"" }})
  await tRef.ref.update({ currentMission: "" })
  await mLog.ref.update({ endTime: Timestamp.fromDate(new Date()), status: "exited"})

  return NextResponse.json(qtData);
}


/*
  Validate Mission Level:
    Endpoint: /api/quest/[qid]/team/mission
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
    }
    Method: PUT
    Body: {
      data: string
    }

    Returns: {
      200 -> Correct Answer
      409 -> Incorrect Answer
      }
*/
export async function PUT(req: Request, {params}:{params:{ qid: string, cmd: string}}) {

  // Validate the request.
  const v = await validate(req, {params});
  if (typeof v != "object") return v;

  const { tid, tRef, tData} = v as {tid: string, tRef: FirebaseFirestore.DocumentSnapshot<Team>, tData: Team};
  const { data } = await req.json() as {data: string}
  
  const mid = tData.currentMission

  if(!mid || mid?.length == 0) return NextResponse.json(
    { msg: "Start the mission first." },
    { status: 409 }
  )
  if(!data || data == "") return NextResponse.json({ msg: "Missing Required Parameters." }, { status: 400 })

  const [missionId, levelId] = mid.split(".");

  let qtRef = await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).get()
  let mLog = await adminDb.collection("quest").doc(params.qid).collection('teams').doc(tid).collection("missionLog").doc(mid).get()
  
  // Check if the Mission  exists.
  if(!qtRef.exists) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." },{ status: 404 })
  
  const mData = qtRef.data() as Mission

  // Check if the Mission is assigned to the team.
  if(mData.crnt?.team != tid) return NextResponse.json({ msg: "Mission not claimed." }, { status: 403 })
  if(!mLog.exists) return NextResponse.json({ msg: "Mission not claimed." }, { status: 403 })
  
  let levelData = (await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).collection('level').doc(mData.crnt.level || "init").get()).data() as Level

  if(!levelData) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." }, { status: 404 })

  if(levelData.input != "text") return NextResponse.json({ msg: "Invalid Request." }, { status: 403 })

  if(levelData.next == "") return NextResponse.json({ msg: "You finished this mission." }, { status: 409 })
  
    if(data.trim() == levelData.value){
      // Advance to next level
      await qtRef.ref.update({ crnt: {level: levelData.next}})
      await tRef.ref.update({ currentMission: `${missionId}.${levelData.next}` })
      await mLog.ref.update({ level: levelData.next})
     
      return NextResponse.json({msg: "Yes."});
    }
      
    return NextResponse.json({ msg: "Nope, that's not it. Think Again, Try Again." }, { status: 409 })

}