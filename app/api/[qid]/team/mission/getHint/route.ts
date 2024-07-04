import { NextResponse } from "next/server";
import { Mission, GenericConverter, QuestMetadata, User, Team, Quest, Level } from "@/lib/models";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { Timestamp } from "firebase/firestore";
import { validate } from "../../validator";

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
  
  const mid = tData.currentMission

  if(!mid || mid?.length == 0) return NextResponse.json(
    { msg: "Start the mission first." },
    { status: 409 }
  )
  const [missionId, levelId] = mid.split(".");

  let qtRef = await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).get()
  
  // Check if the Mission  exists.
  if(!qtRef.exists) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." },{ status: 404 })
  
  const mData = qtRef.data() as Mission

  // // Check if the Mission is visible to the team.
  // if(!mData.showInQuest) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." }, { status: 404 })

  // Check if the Mission is assigned to the team.
  if(mData.crnt?.team != tid) return NextResponse.json({ msg: "Not Found, Nice Try Bruhh." }, { status: 403 })
  
  let levelData = (await adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).collection('level').doc(mData.crnt.level || "init").get()).data() as Level

  tRef.ref.update({ qp: FieldValue.increment(-20)})
  adminDb.collection("quest").doc(params.qid).collection('missions').doc(missionId).collection('level').doc(mData.crnt.level || "init").update({usedHint: true})
  
  return NextResponse.json({hint: levelData.hint});

}