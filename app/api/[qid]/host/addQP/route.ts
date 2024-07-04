import { NextRequest, NextResponse } from "next/server";
import { Command, GenericConverter, QuestPoints, Quest, QuestMetadata, Team, User, genericConverter, Mission } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { decodeToken, encodeToken, generateID } from '@/lib/utils';

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)


/*
  ADD QPs TO THE QUEST:
  Endpoint: /api/quest/[qid]/host/addQP
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'addQP' command.
*/
export async function POST(req: Request, {params} :{ params:{ cmd: Command['type'] | "generateQP" | "addQP" | "addMission", qid: string }}) {

  const token = req.headers.get("X-Token")
  const {qpName, qp_type, qp_value } = await req.json()
  let decodedToken;

  if (!token) return NextResponse.json(
    { msg: 'Missing required arguments.' },
    { status: 400 }
  );

  if(!qpName || !qp_value || !qp_type) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });
  
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