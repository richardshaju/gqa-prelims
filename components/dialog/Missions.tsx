import React from "react";
import { useQuestContext } from "../context/quest";
import { Mission } from "@/lib/models";
import { CircleDollarSign, Component, LockKeyhole } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CgDanger } from "react-icons/cg";
import { Alert, AlertDescription } from "../ui/alert";
import { FaExclamationTriangle } from "react-icons/fa";

function MissionsDialog({ open }: { open: boolean }) {
  const q = useQuestContext();
  const user = q?.user;
  const mission = q?.mission;

  const [progress, setProgress] = React.useState(0);
  const [minutes, setMinutes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [hint, setHint] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 1;
        if (newProgress === 100) {
          clearInterval(interval);
        }
        return newProgress;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prevSeconds) => {
        let newSeconds = prevSeconds + 1;
        let newMinutes = minutes;
        if (newSeconds === 60) {
          newSeconds = 0;
          newMinutes += 1;
        }
        if (newMinutes === 60) {
          newMinutes = 0;
        }
        return newSeconds;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function exitMission(){
    if(!user || !q.team?.currentMission || !q.team.id) return

    fetch(`/api/${q.quest?.id}/team/mission`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Token": await user.getIdToken(),
        "X-MID": q.team.currentMission,
        "X-TID": q.team.id
      },
    })
      .then(async (data) => {
        const Data = await data.json();
        console.log(Data);
        // setMission(Data as Mission)
      })
      .catch((err) => {});
  }

  async function getHint(){
    if(!user || !q.team?.currentMission || !q.team.id) return

    fetch(`/api/${q.quest?.id}/team/mission/getHint`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Token": await user.getIdToken(),
        "X-MID": q.team.currentMission,
        "X-TID": q.team.id
      },
    })
      .then(async (data) => {
        const Data = await data.json();
        console.log(Data);
        // setMission(Data as Mission)
      })
      .catch((err) => {});
  }

  return (
    open && (
      <div className="w-full h-[100%] flex fixed z-[50] bottom-0 bg-[#07020bba] backdrop-blur-md  flex-col overflow-auto">  
        {(!mission) ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-1">
            <Component size={64} className="mb-5" /> 
            <h1 className="text-xl mb-3">Your mission will be assigned soon! </h1>
            <h1 className="text-md">Don&apos;t waste your time.</h1>
            <h1 className="text-md">Build your team strategies.</h1>
          </div>
        ) : (
          <>
            <div className="relative w-full h-full">
              <img
                src={""}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            </div>

            {/* <Progress value={progress} className="mt-[-229px]" /> */}
            <div className=" flex flex-col gap-5 bg-black">
              <div
                className="text-white text-center mt-2"
                style={{ fontFamily: "pricedown" }}
              >
                <h1 className="text-3xl font-semibold">{}</h1>
                <p><CircleDollarSign size={25} color="#FFD700"/>{mission.availablePoints.toString()}</p>
                <div>
                  <p>{`${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`}</p>
                </div>
              </div>
              <div className="px-4 flex flex-col gap-4">
                <div>
                  <h3 className="text-[13px] font-semibold">Context</h3>
                  <p className="text-[12px]">
                    {}
                  </p>
                </div>
                <div>
                  {!hint ? (
                    <Dialog>
                      <DialogTrigger>
                        <span className="w-[11.5rem] p-2 gap-2 text-white border rounded-sm flex flex-row items-center text-sm overflow-hidden">
                          <LockKeyhole size={16} />
                          Unlock Hint:
                          <CircleDollarSign size={16} />
                          20
                        </span>
                      </DialogTrigger>
                      <DialogContent className="px-4 bg-[#00000040] backdrop-blur-sm border-0 ">
                        Are you sure you to unlock the hint for 20 QPs?
                        <Button type="submit" onClick={() => setHint(true)}>
                          Yes
                        </Button>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div>
                      <h3 className="text-[13px] font-semibold">Hint</h3>
                      <p className="text-[12px]">
                        It is a long established fact that a reader will be
                        distracted by the readable content of a page when
                        looking at its layout. The point of using Lorem Ipsum is
                        that it has a moreoress nrmal distribution
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full my-3">
                  <Dialog >
                    <DialogTrigger className="w-full">
                      <button className="rounded w-full  bg-red-600 text-white p-2 font-semibold text-[12px]">
                        Get us out of this
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-transparent backdrop-blur-sm border-0 flex justify-center items-center flex-col">
                      <FaExclamationTriangle size={40}/>
                      
                      <p>
                        {" "}
                        Are you sure you to{" "}
                        <span className="text-red-600">terminate</span> this
                        misson?
                      </p>
                      <Alert
                        variant="destructive"
                        className="bg-white my-2 font-semibold"
                      >
                        <CgDanger />
                        <AlertDescription>
                          Once this mission is canceled your team cannot play
                          the current mission again.
                        </AlertDescription>
                      </Alert>
                      <div className="flex flex-row gap-4">
                        <Button variant={"destructive"} type="submit" onClick={() => setHint(true)}>
                          Yes, Terminate
                        </Button>
                        <DialogClose asChild>
                        <Button variant={"outline"} type="submit" onClick={() => setHint(true)}>
                          No, Continue the mission
                        </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  );
}

export default MissionsDialog;
