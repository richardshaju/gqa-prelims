import { NextResponse } from "next/server";
import {
  Mission,
  GenericConverter,
  QuestMetadata,
  User,
  Team,
  Quest,
  Player,
} from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { validate } from "../validator";

const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

/*
  POST assignRoles:
    Endpoint: /api/quest/[qid]/team/assignRoles
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
    }
    data : Player[] with roles assigned.
    Method: POST
*/
export async function POST(
  req: Request,
  { params }: { params: { qid: string; cmd: string } }
) {
  // Validate the request.
  const v = await validate(req, { params });
  if (typeof v != "object") return v;

  const { tid, tRef, uid, tData } = v as {
    tid: string;
    tRef: FirebaseFirestore.DocumentSnapshot<Team>;
    uid: string;
    tData: Team;
  };
  
  const data  = await req.json();

  if (tData.lead != uid)
    return NextResponse.json({ msg: "Not Authorized.", status: 403 });

  const memRef = adminDb
    .collection(`quest/${params.qid}/teams`)
    .doc(tid)
    .collection("members");

  if (data.filter((member:any) => member.role == "unassigned").length > 0)
    return NextResponse.json({
      msg: "All team members are not assigned.",
      status: 409,
    });

  data.forEach((a:any) => {
    memRef.doc(a.uid).update({ role: a.role });
  });

  return NextResponse.json({ msg: "All roles assigned." });
}
