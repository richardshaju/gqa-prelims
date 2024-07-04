import { NextResponse } from "next/server";
import { Mission, GenericConverter, QuestMetadata, User, Team, Quest } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { encodeToken } from '@/lib/utils';
import { Timestamp } from "firebase/firestore";
import { validate } from "../validator";

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

/*
  JOIN TEAM:
    Endpoint: /api/quest/[qid]/team/joinTeam
    Headers : {
      'X-Token' : Firebase IDToken
      'X-TID': TeamID
    }
    Method: POST
    Returns: A JWT Token with 'joinTeam' command.
*/

export async function POST(req: Request, {params}:{params:{ qid: string }}) {

  // Validate the request.
  const v = await validate(req, {params});
  if (typeof v != "object") return v;

  const {tid , qData} = v as {tid: string, qData: Quest};
  
  // Return the Token with the 'joinTeam' command.
  return NextResponse.json(
    { 
      token: encodeToken({ qid: params.qid, type: "joinTeam", data: tid }, qData.qToken)
    }
  );

}