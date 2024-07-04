import { NextRequest, NextResponse } from "next/server";
import { Command, GenericConverter, Player, QuestPoints, Quest, QuestMetadata, Team, User, genericConverter, Level, Mission } from "@/lib/models";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/components/fb/admin";
import { decodeToken } from '@/lib/utils';

const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)


export async function POST(req: Request, {params}:{params:{ qid: string }}) {

  const data  = await req.text()
  let uid = "";
  const token  = req.headers.get("X-Token")

  if (!data || !token) {
    return NextResponse.json(
      { msg: 'Missing required arguments.' },
      { status: 400 }
    );
  }

  try{
    uid = (await adminAuth.verifyIdToken(token)).uid
  }catch{
    return NextResponse.json(
      { msg: 'Unauthorised: Invalid IDToken.' },
      { status: 401 }
    );
  }
  
  const qRef = adminDb.collection("quest").doc(params.qid);
  const uData = (await adminDb.collection("users").doc(uid).get()).data() as User;
  const qData =  (await qRef.get()).data() as unknown as Quest


  try { 
    const cmd = decodeToken(data, qData.qToken)

    // Checks if the Player's QID and QID in the QR matches 
    if (params.qid != cmd.qid) {
      return NextResponse.json(
        { msg: 'QIDs dont match.' },
        { status: 403 }
      );
    }

/*
  CREATE TEAM (for team captain):
    Endpoint: /api/quest/[qid]/execute
    Method: POST
    Body: JWT with data
          {
            type : 'createTeam'
            data : TeamID
            qid : QuestID
          }
*/
    if(cmd.type == 'createTeam'){
      const tRef = qRef.collection("teams").doc(cmd.data)
      
      // Check if the user already joined a team.
      if(uData.c_team != "") return NextResponse.json({ msg: "User Already joined a team." }, { status: 409 })

      // Check if the team is initiated
      if (!(await tRef.get()).exists) return NextResponse.json({ msg: "Team not Initiated." }, { status: 409 })

      // Check if the team already exists
      if(typeof (await tRef.get()).data()?.lead != 'undefined') return NextResponse.json({ msg: "Team Already Exists." },{ status: 409 })

      await tRef.set({ id: cmd.data, lead: uData.uid, questPoints: 0, currentMission: ""} as Team)
      await tRef.collection("members").doc(uid).set({uid: uid, name: uData.name, role: "boss", dp: uData.dp} as Player)
      await adminDb.collection("users").doc(uid).update({c_quest: params.qid, c_team: cmd.data} as User)

      return NextResponse.json(
        { 
          type: "createTeam",
          msg: "You have successfully created a team.",
          data:{
            tid: cmd.data
          }
        }
      ) 

    }
/*
  JOIN TEAM (for team members):
    Endpoint: /api/quest/[qid]/execute
    Method: POST
    Body: JWT with data
          {
            type : 'joinTeam'
            data : TeamID
            qid : QuestID
          }
*/
    if(cmd.type == "joinTeam"){

      const tRef = qRef.collection("teams").doc(cmd.data)

      const tData = await tRef.get()

      // Check if the given team already exists
      if (!tData.exists)
        return NextResponse.json(
          { msg: "Team Doesn't Exist." },
          { status: 404 }
        );

      // Checks if the given team has reached maximum member limit
      if (((await tRef.collection("members").count().get()).data().count) >= (qData.metadata.TOTAL_ALLOWED_MEMBERS  as unknown as number)) 
        return NextResponse.json(
          { msg: "Reached maximum member limit." },
          { status: 409 }
        );

      // Check if the user already joined a team.
      if(uData.c_team != "") 
        return NextResponse.json(
        { msg: "User Already joined a team." },
        { status: 409 }
      )

      await tRef.collection("members").doc(uid).set({uid: uid, name: uData.name, role: "unassigned", dp: uData.dp} as Player)
      await adminDb.collection("users").doc(uid).update({c_quest: params.qid, c_team: cmd.data} as User)
      return NextResponse.json(
        { 
          type: "joinTeam",
          msg: "You have successfully joined the team.",
          data: {
            tid: cmd.data,
            tname: tData.data()?.name
          }
        }
      ) 

    }

/*
  VALIDATE QRs AND AWARD QPs:
    Endpoint: /api/quest/[qid]/execute
    Method: POST
    Body: JWT with data
          {
            type : 'awardQP'
            data : QuestPoint ID
            qid : QuestID
          }
    Headers : {
      'X-TID' : TeamID
    }
*/
    if(cmd.type =='awardQP'){
      const tm = await qRef.collection("teams").where("lead","==",uid).get()
      
      if (tm.empty) {
        return NextResponse.json(
          { msg: 'Unauthorised: You are not a team lead.' },
          { status: 400 }
        );
      }

      const tRef = tm.docs[0].ref
      const qpRef = await qRef.collection("questPoints").doc(cmd.data).get()

      const tData = tm.docs[0].data() as Team

      const [mid, lvlID] = tData.currentMission?.split(".") || ["",""]

      // Checks if the team has started a mission
      if(mid.length == 0) return NextResponse.json(
        { msg: "Start the mission first." },
        { status: 409 }
      )

      const missionData = (await qRef.collection("missions").doc(mid).get()).data() as unknown as Mission
      const levelData = (await qRef.collection("missions").doc(mid).collection("level").doc(lvlID).get()).data() as unknown as Level
      
      if(cmd.data == levelData.value){
        tRef.update({ qp: FieldValue.increment(Number(missionData.availablePoints))})
        return NextResponse.json(
          { 
            type: "awardQP",
            msg: "You have successfully claimed the QuestPoints.",
            data: {
              qptype : "mission",
              qpid: cmd.data,
              qp: 20
            }
          }
        ) 
      }


      // Checks if the QP is added in the Quest by the host
      if(!qpRef.exists){
        return NextResponse.json(
          { msg: "Invalid QP" },
          { status: 404 }
        )
      }
      // Checks if the team has claimed the QuestPoints(QPs) already
      if((await tRef.collection("qpLog").doc(cmd.data).get()).exists){
        return NextResponse.json(
          { msg: "Claimed Already." },
          { status: 409 }
        )
      }
      let qpData = qpRef.data() as QuestPoints

      // For QuestPoints issued after completing Quests (>100QP)
      if (qpData.type == 'quest'){

        // TODO: 
        //  Implement checking location data if it matches with the question's assigned location data.
        // 

      }
      // For Bonus QuestPoints issued during the game (<100QP)
      else if(qpData.type == 'bonus'){
        if (qpData.value > (qData.metadata.MAX_BONUS || 30)) 
        return NextResponse.json(
          { msg: "Invalid Request: Exceeds max allowable bonus." },
          { status: 400 }
        );
      }
     
      // Increments their QPs, and add it to QP Log.
      tRef.update({ qp: FieldValue.increment(Number(qpData.value))})
      tRef.collection("qpLog").doc(qpData.qpid).set({ qp: qpRef.ref, tm: Date.now(), v: qpData.value})

      return NextResponse.json(
        { 
          type: "awardQP",
          msg: "You have successfully claimed the QuestPoints.",
          data: {
            qptype : qpData.type,
            qpid: qpData.qpid,
            qp: qpData.value
          }
        }
      ) 
    
    }
    
    } catch(err)  {
      console.log(err)
      return NextResponse.json(
        { msg: "Unauthorized: Invalid Token." },
        { status: 401 }
      )
  }
}