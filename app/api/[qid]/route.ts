import { NextRequest, NextResponse } from "next/server";
import { GenericConverter, Quest, QuestMetadata, User, genericConverter } from "@/lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { generateID } from '@/lib/utils';

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

/* CRED OPERATIONS FOR QUESTs [Host API] */


/*
  CREATE QUEST:
    Endpoint: /api/quest/create
    Method: POST
*/
export async function POST(req: Request,{params}:{params:{ qid: string }}) {

  const qRef = adminDb.collection("quest");
  const uRef = adminDb.collection("users");
  const { qName, qDesc, qImg, qStartTime, qEndTime, maxBonus, totalMembers}  = await req.json()
  const token = req.headers.get("X-Token")
  
  if(params.qid !="create") return NextResponse.json({ msg: 'Unsupported Method.' }, { status: 405 });
  if (!token || !qName || !qDesc) {
    return NextResponse.json(
      { msg: 'Missing required arguments.' },
      { status: 400 }
    );
  }

  return await adminAuth.verifyIdToken(token)
  .then(async (decodedToken) => {
    const u = await uRef.doc(decodedToken.uid).withConverter(GenericConverter<User>()).get()
    if(u.exists){
      const qId:string = generateID(7);
      
      // Checks if qId already exists.
      if((await qRef.doc(qId).get()).exists) return NextResponse.json({ msg: "Try Again." }, { status:500 })

      // Quest's Data
      const qMd: QuestMetadata = {
        name: qName,
        id: qId,
        active: false,
        desc: qDesc,
        host: decodedToken.uid,

        img: qImg || "",
        startTime: qStartTime || 0,
        endTime: qEndTime || 0,
        MAX_BONUS : maxBonus || 30,
        TOTAL_ALLOWED_MEMBERS : totalMembers || 4
      }
      const q:Quest = {
        qToken: generateID(100),
        metadata : qMd
      }

      return await qRef.doc(qId).withConverter(GenericConverter<Quest>()).set(q).then(()=>{
        return NextResponse.json({ s: true, qid: qId})
      }).catch(()=>{
        return NextResponse.json({ msg: "Unexpected Error Occured." }, { status:500 })
      })
    }else{
      return NextResponse.json(
        { msg: "Unauthenticated: Unidentified User." },
        { status: 401 }
      )
    }
  })
  .catch((error) => {
    return NextResponse.json(
      { msg: "Unauthenticated: Invalid Token." },
      { status: 401 }
    )
  });
}
/*
  GET QUEST METADATA:
    Endpoint: /api/quest/[qid]
    Method: GET
*/
export async function GET(req: NextRequest, {params}:{params:{ qid: string }}) {

  const qid:string = params.qid
  const qRef = adminDb.collection("quest");
  const token  = req.headers.get("X-Token")

  if (!token) {
    return NextResponse.json(
      { msg: 'Missing required arguments.' },
      { status: 400 }
    );
  }

  return await adminAuth.verifyIdToken(token)
  .then(async (decodedToken) => {
      // Gets the Quest's metadata
      const qMetadata =  (await qRef.where("metadata.id","==",qid).select("metadata").withConverter(GenericConverter<Quest>()).get())

      if(!qMetadata.empty){
        return NextResponse.json(qMetadata.docs[0].data().metadata)
      }else{
        return NextResponse.json(
          { msg: "Not Found, Nice Try Bruhh." },
          { status: 404 }
        )
      }
  })
  .catch((error) => {
    return NextResponse.json(
      { msg: "Unauthenticated: Invalid Token." },
      { status: 403 }
    )
  });
}

/*
  DELETE QUEST:
    Endpoint: /api/quest/[qid]
    Method: DELETE
*/
export async function DELETE(req: NextRequest, {params}:{params:{ qid: string }}) {

  const qid:string = params.qid
  const qRef = adminDb.collection("quest");
  const token  = req.headers.get("X-Token")

  if (!token) {
    return NextResponse.json(
      { msg: 'Missing required arguments.' },
      { status: 400 }
    );
  }

  return await adminAuth.verifyIdToken(token)
  .then(async (decodedToken) => {
      // Gets the Quest's metadata
      const qMetadata =  (await qRef.where("metadata.id","==",qid).select("metadata").withConverter(GenericConverter<Quest>()).get())

      if(!qMetadata.empty){
        const d:QuestMetadata | undefined = qMetadata.docs[0].data().metadata
        if(d?.host == decodedToken.uid){
          return qRef.doc(qid).delete().then(()=>{
            return NextResponse.json({'msg':"Success."})
          })
        }else{
          return NextResponse.json(
            { msg: "Unauthorized" },
            { status: 401 }
          )
        }
      }else{
        return NextResponse.json(
          { msg: "Not Found, Nice Try Bruhh." },
          { status: 404 }
        )
      }
  })
  .catch((error) => {
    return NextResponse.json(
      { msg: "Unauthenticated: Invalid Token." },
      { status: 403 }
    )
  });
}

/*
  UPDATE QUEST DATA:
    Endpoint: /api/quest/[qid]
    Method: PUT
*/
export async function PUT(req: Request,{params}:{params:{ qid: string }}) {

  const qRef = adminDb.collection("quest");
  const qid = params.qid;
  const { qName, qDesc, qImg, qStartTime, qEndTime, qActive, maxBonus, totalMembers }  = await req.json()
  const token  = req.headers.get("X-Token")

  if (!token) {
    return NextResponse.json(
      { msg: 'Missing required arguments.' },
      { status: 400 }
    );
  }

  return await adminAuth.verifyIdToken(token)
  .then(async (decodedToken) => {
    const quest = await qRef.doc(qid).withConverter(GenericConverter<Quest>()).get()
    // Check if `quest` exists.
      if(!quest.exists) return NextResponse.json({ msg: "Not Found" }, { status:404 });

      const d = quest.data() as Quest
      // Check if the authenticated user owns the `quest`.
      if(d.metadata?.host != decodedToken.uid) return NextResponse.json({ msg: "Unauthorized" }, { status: 401 })

      const qMd:QuestMetadata = {
          name: qName || d?.metadata?.name,
          id: qid,
          active: qActive || d?.metadata?.active,
          desc: qDesc || d?.metadata?.desc,
          host: d?.metadata?.host,
  
          img: qImg || "",
          startTime: qStartTime || 0,
          endTime: qEndTime || 0,

          MAX_BONUS : maxBonus || 30, 
          TOTAL_ALLOWED_MEMBERS : totalMembers || 4
          
        }
        const q:Quest = {
          metadata : qMd,
          qToken: d?.qToken
        }
  
        return await qRef.doc(qid).withConverter(GenericConverter<Quest>()).update(q).then(()=>{
          return NextResponse.json({ s: true, qid: qid})
        }).catch(()=>{
          return NextResponse.json({ msg: "Unexpected Error Occured." }, { status:500 })
        })
  })
  .catch((error) => {
    return NextResponse.json(
      { msg: "Unauthenticated: Invalid Token." },
      { status: 401 }
    )
  });
}