import { CollectionReference, DocumentReference, FieldValue } from "firebase-admin/firestore"
import { PartialWithFieldValue, QueryDocumentSnapshot } from "firebase-admin/firestore"
import { QueryDocumentSnapshot as qds } from "firebase/firestore"


/*
    Data Interface for `Command Messages`
*/
export interface Command {
    type: "createTeam" | "joinTeam" | "awardQP" ;
    qid: string;
    data: string;
}

export interface Player {
    uid:string;
    name:string;
    dp:string;
    role : 'boss' | 'shadow' | 'nomad' | 'thug' | 'unassigned'
}

export interface QuestPoints {
    name?: string;
    qpid: string;
    value:Number;
    type: 'quest' | 'bonus';
    tm?: string | Number
}
/*
    Data Type for `QuestTask`
*/
export type Mission = {
    id: string
    missionTitle: string
    showInQuest: boolean

    availablePoints: Number
    timeout: Number

    crnt?: {
        team?: string
        level?: string
        startTime?: Number
    }
    level?: Level
}

export type Level = {
    id: string
    type: "text" | "video" | "audio" | "image" | "location" | "end"
    input: "none" | "text"
    usedHint: boolean
    value: string

    context?: string
    title?: string
    hint?: string
    next?: string
}

/*
    Data Type for `Quest`
*/
export type Quest = {
    metadata: QuestMetadata 
    qToken: string
    missions?: CollectionReference<Mission>
    teams?: CollectionReference<Team>
    questPoints?: CollectionReference<QuestPoints>
}

export type QuestMetadata = {
    id: string
    name: string
    desc: string
    host?: string
    img?: string

    startTime?: Number
    endTime?: Number
    active?:boolean

    TOTAL_ALLOWED_MEMBERS?: Number
    CAN_ASSIGN_ROLES?: boolean
    MAX_BONUS?: Number
}

/*
    Data Type for `User`
*/
export type User =  {
    phno: string
    uid: string
    name: string
    email: string
    dp: string
    c_quest: string
    c_team: string
    token?: string
    fcmToken?: string
    boss?: boolean
}

/*
    Data Type for `Team`
*/
export type Team = {
    id: string
    name?: string
    lead: string
    msId?: string
    members?: CollectionReference

    questPoints: Number
    currentMission?: string
    videoLink?: string
    qpLog?: CollectionReference
}


export const GenericConverter = <T>() => ({
    toFirestore: (data: Partial<T>) => data,
    fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
  });

export const genericConverter = <T>() => ({
    toFirestore(data: Partial<T>) { return data },
    fromFirestore(snapshot: qds): T { return snapshot.data() as T; }
});