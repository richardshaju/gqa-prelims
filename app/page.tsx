"use client";

import React, { useEffect, useState } from "react";
import SwipeableViews from "react-swipeable-views";

import { useQuestContext } from "@/components/context/quest";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/ui/logo";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ScanQRDialog } from "@/components/dialog/scanQR";
import { ShowQRDialog } from "@/components/dialog/showQR";
import { CalcDialog } from "@/components/dialog/Calculator";
import { PhoneDialog } from "@/components/dialog/Phone";
import { ShowMapDialog } from "@/components/dialog/Map";

import { Player, Team } from "@/lib/models";
import { cn } from "@/lib/utils";
import "./globals.css";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import { ShowResponse } from "@/components/dialog/showResp";
import MissionsDialog from "@/components/dialog/Missions";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import { app } from "@/components/fb/config";
import ViewMemberDialog from "@/components/dialog/viewMember";
import { FaHouse } from "react-icons/fa6";
import { FaCircle } from "react-icons/fa";
import { CircleDollarSign } from "lucide-react";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400"] });
interface AppIconData {
  name: string;
  onClick: () => void;
  disabled: boolean;
  for: string;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { toast } = useToast();
  const q = useQuestContext();
  const user = q?.userData;

  const [isScanQRDialogOpen, setScanQRDialogOpen] = useState<boolean>(false);
  const [isShowQRDialogOpen, setShowQRDialogOpen] = useState<boolean>(false);
  const [respDialog, setRespDialogData] = useState<{
    type: string;
    data: { tname?: string; tid?: string; mid?: string; role?: string };
  }>();

  const [isCalculatorDialogOpen, setCalculatorDialogOpen] =
    useState<boolean>(false);
  const [isPhoneDialogOpen, setPhoneDialogOpen] = useState<boolean>(false);
  const [isMissionsDialogOpen, setMissionsDialogOpen] =
    useState<boolean>(false);
  const [isViewMembersDialogOpen, setViewMembersDialogOpen] =
    useState<boolean>(false);
  const [isMapDialogOpen, setMapDialogOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);

  const functionMap: any = new Map([
    ["calc", setCalculatorDialogOpen],
    ["scanner", setScanQRDialogOpen],
    ["phone", setPhoneDialogOpen],
    ["missions", setMissionsDialogOpen],
    ["viewmembers", setViewMembersDialogOpen],
    ["map", setMapDialogOpen],
  ]);

  useEffect(() => {
    const search = searchParams.get("app");
    if (search) {
      const setFunction: Function = functionMap.get(search);
      setFunction(true);
    } else {
      const values = [...functionMap.values()];
      values.forEach((element) => {
        element(false);
      });
    }
  }, [searchParams]);

  const [appIcons, setAppIcons] = useState<AppIconData[]>([
    {
      name: "Missions",
      onClick: () => router.push("?app=missions"),
      disabled: false,
      for: "boss,nomad, shadow",
    },
    {
      name: "Scanner",
      onClick: () => router.push("?app=scanner"),
      disabled: false,
      for: "boss",
    },
    {
      name: "Calculator",
      onClick: () => router.push("?app=calc"),
      disabled: false,
      for: "nomad",
    },
    // {
    //   name: "Chat",
    //   onClick: () => console.log("Chat clicked"),
    //   disabled: true,
    //   for: "thug",
    // },
    {
      name: "Phone",
      onClick: () => router.push("?app=phone"),
      disabled: false,
      for: "boss, nomad, shadow",
    },
    {
      name: "Map",
      onClick: () => router.push("?app=map"),
      disabled: false,
      for: "nomad",
    },
  ]);
  const [teamInfo, setTeamInfo] = useState<Player[]>([]);

  let firstTime = true;
  useEffect(() => {
    if (!q.team || !q.quest) return;

    if (q.team.currentMission) {
      if (firstTime) {
        firstTime = false;
        return;
      }
      // setRespDialogData({
      //   type: "missionAssigned",
      //   data: { mid: q.team.currentMission, tid: q.team.id },
      // });
    }
  }, [q.team]);

  useEffect(() => {
    if (!q.quest || !q.team) return;

    if (!q.team.name) {
      setRespDialogData({ type: "createTeam", data: { tid: q.team.id } });
    }

    if (q.quest && q.team) {
      let isFirstTime = true;
      onSnapshot(
        collection(
          getFirestore(app),
          `quest/${q.quest?.id}/teams`,
          q.team.id,
          "members"
        ),
        (snap) => {
          setTeamInfo(snap.docs.map((doc) => doc.data() as Player));
          if (isFirstTime) {
            isFirstTime = false;
            return;
          }
          snap.docChanges().forEach((change) => {
            if (change.type === "added")
              toast({
                title: change.doc.data().name,
                description: `joined the team.`,
                icon: (
                  <Avatar className="w-8 h-8">
                    <Image
                      src={change.doc.data().dp}
                      alt={""}
                      height={32}
                      width={32}
                    />
                  </Avatar>
                ),
              });

            if (
              change.type === "modified" &&
              change.doc.data().uid == user?.uid
            )
              setRespDialogData({
                type: "roleAssigned",
                data: { role: change.doc.data().role },
              });
          });
        }
      );
    }
  }, [q.quest]);

  // call setRespDialogData when team.currentMission changes
  useEffect(() => {
    if (!q.team || !q.quest) return;

    if (q.team.currentMission) {
      setRespDialogData({
        type: "missionAssigned",
        data: { mid: q.team.currentMission, tid: q.team.id },
      });
    }
  }, [q.team]);

  const userRole =
    teamInfo.find((member: any) => member.uid === user?.uid)?.role ?? "";

  const [index, setIndex] = useState(0);
  const handleChangeIndex = (index: number) => {
    setIndex(index);
  };

  useEffect(() => {
    if (q.team?.currentMission) {
      setRespDialogData({
        type: "missionAssigned",
        data: { mid: q.team.currentMission, tid: q.team.id },
      });
    }
  }, [q.team?.currentMission, q.team?.id]);

  return (
    <>
      <div
        className={`${font.className} hidden sm:flex items-center justify-center bg-black w-full h-full flex-col`}
      >
        <p>OOPS !</p>
        <p>
          This App does not support the current screen size. Please use in
          Potrait mode OR use smartphone.
        </p>
      </div>

      <div
        className="h-full visible sm:hidden"
        style={{
          backgroundImage: "url('/bg/plain.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {respDialog && (
          <ShowResponse resp={respDialog} setRespData={setRespDialogData} />
        )}

        {/* {(!q.team?.videoLink || q.team?.videoLink === "") &&
          userRole === "shadow" && (
            <ShowResponse
              resp={{
                type: "submitVideoLink",
                data: { tid: q.team?.id },
              }}
              setRespData={setRespDialogData}
            />
          )} */}

        {user?.boss && (
          <ShowQRDialog
            open={isShowQRDialogOpen}
            setOpen={setShowQRDialogOpen}
          />
        )}
        <ScanQRDialog open={isScanQRDialogOpen} setOpen={setScanQRDialogOpen} />
        <Navbar />
        <CalcDialog open={isCalculatorDialogOpen} />
        <PhoneDialog open={isPhoneDialogOpen} />
        <MissionsDialog open={isMissionsDialogOpen} />
        <ShowMapDialog open={isMapDialogOpen} />

        {teamInfo && q.team && (
          <ViewMemberDialog
            open={isViewMembersDialogOpen}
            data={teamInfo}
            boss={user?.boss || false}
            team={q.team}
          />
        )}
        <div className="w-full bottom-[132px] z-20 absolute flex justify-center gap-2">
          <FaHouse
            size={10}
            className={` ${index == 0 ? "text-white" : "text-slate-400"}`}
          />
          <FaCircle
            size={10}
            className={` ${index == 1 ? "text-white" : "text-slate-400"}`}
          />
        </div>
        <SwipeableViews
          enableMouseEvents
          style={{ display: "flex", height: "93%" }}
          index={index}
          onChangeIndex={handleChangeIndex}
        >
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-center mt-10">
              <Logo size={2} />
            </div>
            <div className="flex justify-center">
              <Card className="w-[93%] overflow-hidden  flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <p className="heading text-4xl">{q.team?.name}</p>
                    <div className="flex gap-2">
                      <CircleDollarSign size={25} color="#FFD700" />
                      <p className="text-lg">
                        {(q?.team?.questPoints || 0).toString()}
                      </p>
                    </div>
                  </CardTitle>
                  {q.quest && q.team && (
                    <CardDescription className="text-white flex flex-col justify-center items-center">
                      <div className="z-0 flex items-center -space-x-2 *:ring *:ring-white">
                        {teamInfo?.map((a, i) => (
                          <Avatar key={i} className={`z-${i * 10} w-8 h-8`}>
                            <Image src={a.dp} width={32} height={32} alt={""} />
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-lg mt-1 ">
                        <span className="font-bold">{teamInfo?.length}</span> of{" "}
                        {q.quest.TOTAL_ALLOWED_MEMBERS?.toString()} joined.
                      </span>
                      {teamInfo?.length != q.quest.TOTAL_ALLOWED_MEMBERS
                        ? "To begin the quest, you need a total of 4 members."
                        : user?.boss
                        ? "Your team is ready, Boss! Now assign roles to your team members."
                        : "Your team is ready. Wait while your roles are being assigned."}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col justify-between text-base font-normal">
                  {!q.quest && <span>No Quest Selected.</span>}
                  {q.team ? (
                    <div className="flex flex-col gap-2">
                      {user?.boss &&
                        teamInfo?.length != q.quest?.TOTAL_ALLOWED_MEMBERS && (
                          <Button
                            variant={"secondary"}
                            onClick={() => setShowQRDialogOpen(true)}
                          >
                            Add Members
                          </Button>
                        )}
                      <Button
                        variant={"outline"}
                        onClick={() => router.push("?app=viewmembers")}
                      >
                        {user?.boss && teamInfo?.length == 4
                          ? "Assign Roles"
                          : "View Members"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-base font-normal">
                      {" "}
                      Join a Team to continue. (Use Scanner)
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent text-center p-3 pb-14">
                <div
                  className={"flex flex-col items-center pt-[47px]"}
                  onClick={() => router.push("?app=scanner")}
                >
                  <Image
                    src={`/icons/scanner_icon.svg`}
                    alt={""}
                    width={40}
                    height={40}
                  />
                  <span className="text-[13px]">Scanner</span>
                </div>
              </div>
            </div>
          </div>

          {q.team ? (
            <div className="h-[93%] text-white">
              {userRole != "unassigned" ? (
                <div className="mt-5 flex flex-col gap-5 ">
                  <h2 className="title stroke-black text-center text-5xl ">
                    {userRole}
                  </h2>
                  <Image
                    src={`/roles/${userRole}.png`}
                    alt=""
                    className="bottom-0 absolute"
                    width={500}
                    height={600}
                  ></Image>
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent text-center  p-3 pb-14">
                    <span className=" text-lg ">Your Toolkit</span>
                    <div
                      className={`${font.className} grid grid-cols-4 justify-items-center gap-5 pt-3`}
                    >
                      {appIcons
                        .filter((app) =>
                          app.for.includes(userRole?.toLowerCase())
                        )
                        .map((app, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex flex-col items-center gap-2",
                              app.disabled ? "grayscale" : ""
                            )}
                            onClick={() =>
                              !app.disabled ? app.onClick() : null
                            }
                          >
                            <Image
                              src={`/icons/${app.name.toLowerCase()}_icon.svg`}
                              alt={""}
                              width={40}
                              height={40}
                            />
                            <span className="text-[13px]">{app.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-5 p-5 items-center h-full justify-center text-center">
                  <h3>Ask your team lead to assign you the role</h3>
                  <div className="absolute h-[130px] bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent text-center  p-3">
                    <span className="text-lg mb-32">
                      Your Toolkit will be added here
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80%] mt-10">
              <span className="text-xl text-secondary-foreground">
                Join the team to explore
              </span>
              <div className="absolute h-[130px] bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent text-center  p-3">
                <span className="text-lg mb-32">
                  Your Toolkit will be added here
                </span>
              </div>
            </div>
          )}
        </SwipeableViews>
      </div>
    </>
  );
}

const Clock: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return function cleanup() {
      clearInterval(timerID);
    };
  });

  function tick() {
    setDate(new Date());
  }

  return (
    <div className="flex justify-center flex-col items-center w-full mt-20">
      <h1 className="text-6xl">
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </h1>
      <h3 style={{ margin: "0" }}>{date.toLocaleDateString()}</h3>
    </div>
  );
};
