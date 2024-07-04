import { NextResponse } from "next/server";
import { Mission, GenericConverter, QuestMetadata, User, Team, Quest } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { encodeToken } from '@/lib/utils';
import { Timestamp } from "firebase/firestore";

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

export async function validate(req: Request, {params}:{params:{ qid: string }}) {

  let uid:string;
  const tid  = req.headers.get("X-TID")
  const token  = req.headers.get("X-Token")
  
  const uRef = adminDb.collection("users"); 

  if (!token || !tid) {
    return NextResponse.json(
      { msg: 'Missing required arguments.' },
      { status: 400 }
    );
  }

  // Verifying User Authentication
  try { uid = (await adminAuth.verifyIdToken(token)).uid }
  catch {
    return NextResponse.json(
      { msg: "Unauthenticated." },
      { status: 401 }
    )
  }

  
  // Verifying Assigned Quest and Team of the User
  const u = await uRef.doc(uid).withConverter(GenericConverter<User>()).get()
  if(u.exists){
    const userData = u.data()
    // Checks if the database has `c_team` and `c_quest` assigned to the user.
    if (userData?.c_team == ("" ||undefined) || userData?.c_quest == ("" || undefined)) return NextResponse.json({ msg: "Join a Quest/Team." },{ status: 400 })
    // Check if the requested user is actually in the team. 
    if (userData?.c_team != tid || userData?.c_quest != params.qid) return NextResponse.json({ msg: "Unauthorized." },{ status: 401 })
    } else {
  return NextResponse.json(
    { msg: "Unauthenticated." },
    { status: 401 }
  )
}

const qData = (await adminDb.collection("quest").doc(params.qid).get()).data() as Quest
let tRef = await adminDb.collection("quest").doc(params.qid).collection('teams').doc(tid).get()

// Check if the team exists.
if(!tRef.exists || !qData) return NextResponse.json(
  { msg: "Not Found, Nice Try Bruhh." },
  { status: 404 }
)
const tData = tRef.data() as Team

return {tData: tData, qData: qData, uid: uid, tid: tid, tRef: tRef} as {tData: Team, qData: Quest, uid: string, tid: string, tRef: FirebaseFirestore.DocumentSnapshot<Team>}
}