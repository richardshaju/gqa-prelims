"use client";
import React, { useDebugValue, useEffect } from 'react';
import { onAuthStateChanged, User, getAuth, signOut } from 'firebase/auth';
import { app } from '@/components/fb/config';
import Loading from '@/app/loading';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { GenericConverter, Level, Mission, Player, Quest, Team, User as UserDt } from '@/lib/models';
import { SigninDialog } from '../dialog/signin';
import { useAnimate, useInView } from "framer-motion"
import { set } from 'react-hook-form';

export const QuestContext = React.createContext<QuestContextProps>({});

interface QuestContextProps {
    user?: User;
    quest?: Quest['metadata'];
    team?: Team;
    userData?: UserDt;
    mission?: Mission;
}   

export const useQuestContext = () => React.useContext(QuestContext);

export const QuestContextProvider = ({ children }: { children: React.ReactNode} ) => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const [user, setUser] = React.useState<User>();
    const [quest, setQuest] = React.useState<Quest['metadata']>();
    const [team, setTeam] = React.useState<Team>();
    const [mission, setMission] = React.useState<Mission>();
    const [userData, setUserData] = React.useState<UserDt>();
    const [loading, setLoading] = React.useState(0);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                let uData = (await getDoc(doc(db, "users", user.uid))).data() as UserDt
                setUserData(uData);

                if(uData && uData.c_quest != "") {
                    uData.token = await user.getIdToken();
                    fetch(`/api/${uData?.c_quest}`, {
                        headers: {
                            'X-Token': uData.token
                        }
                    }).then(res =>  res.json() as unknown as Quest['metadata'])
                    .then(data => setQuest(data))
                    .then(() => setLoading(2));
                    
                if(uData?.c_team != "") 
                    onSnapshot(doc(db, "quest", uData?.c_quest, "teams", uData?.c_team), async (d) => {
                        const t = d.data() as Team
                        
                        if(t.currentMission && t.currentMission != "")
                            fetch(`/api/${uData?.c_quest}/team/mission`, {
                                headers: {
                                    'X-Token': await user.getIdToken(),
                                    'X-TID': uData.c_team,
                                    'X-MID': t.currentMission || ''
                                }
                            }).then(res =>  res.json() as unknown as {mission: Mission, level?: Level})
                            .then(data => {
                                let a = data.mission;
                                a.level = data.level;
                                setMission(a)
                            })
                            
                        setTeam(t);
                        uData.boss = t.lead == user.uid;
                        setUserData(uData);
                });
                }else{
                }
                
            } else {
                setUser(undefined);
                setLoading(2);
            }
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <QuestContext.Provider value={{ user, quest ,team, userData, mission } }>
                {loading<2 ? <Loading msg="Cooking your quest..."/> : ((user)? children: 
                <SigninDialog open={true} setOpen={function (value: React.SetStateAction<boolean>): void {} }/>)}
        </QuestContext.Provider>
    );
};

export type {User}