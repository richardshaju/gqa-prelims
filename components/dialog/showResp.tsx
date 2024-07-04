import { useDebugValue, useEffect, useRef, useState } from "react";

import "../styles/qrStyles.css";
import { useQuestContext } from "../context/quest";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { QRCode } from "react-qrcode-logo";
import { ifError } from "assert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-dropdown-menu";
import { FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";

import carAnim from "@/public/anims/car.json";
import ytAnime from "@/public/anims/yt.json";
import Lottie from "lottie-react";
import { app } from "../fb/config";
import { Mission } from "@/lib/models";

export function ShowResponse({
  resp,
  setRespData,
}: {
  resp: {
    type: string;
    data: { tname?: string; tid?: string; mid?: string; role?: string };
  };
  setRespData: React.Dispatch<
    React.SetStateAction<
      | {
          type: string;
          data: { tname?: string; tid?: string; mid?: string; role?: string };
        }
      | undefined
    >
  >;
}) {
  const q = useQuestContext();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [icon, setIcon] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  // setLoading(false);

  return <Dialog
      open={open}
      defaultOpen
      onOpenChange={(open) => {
        setOpen(open);
        setRespData(undefined);
      }}
      modal={true}
    >
      <DialogContent className="bg-transparent h-full" about={"noCloseBtn"}>
        {loading ? (
          <div className="flex items-center justify-center flex-row gap-3">
            {" "}
            <Loader2 className="animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            {(resp.type == "createTeam") && <CreateTeamDialog setLoading={setLoading} resp={resp}/>}
            {(resp.type == "joinTeam") && <JoinTeamDialog setLoading={setLoading} resp={resp}/>}
            {(resp.type == "roleAssigned") && <RoleAssignedDialog setLoading={setLoading} resp={resp}/>}
            {(resp.type == "missionCompleted") && <div className="flex items-center justify-center flex-col heading bg-black text-green-700"><div>Mission Passed</div></div>}
            {(resp.type == "missionFailed") && <div className="flex items-center justify-center flex-col bg-black text-red-600">Misson failed</div>}
            {resp.type == "submitVideoLink" && <SubmitVideoLink setLoading={setLoading} resp={resp}/>}
          </>)}
        </DialogContent>
      </Dialog>
  }

function SubmitVideoLink({
  setLoading,
  resp,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resp: { type: string; data: { tname?: string; tid?: string; mid?: string } };
}) {
  const { toast } = useToast();
  const q = useQuestContext();
  // form submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!resp.data.tid) return;
    e.preventDefault();
    setLoading(true);
    updateDoc(
      doc(getFirestore(app), `quest/${q.quest?.id}/teams/`, resp.data.tid),
      {
        videoLink: e.currentTarget.vLink.value,
      }
    )
      .then(() => {
        toast({ title: "Team created successfully!", variant: "default" });
        location.reload();
      })
      .catch((err) => {
        toast({
          title: "Error adding name. Try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <>
      <div className="flex items-center justify-center flex-col">
        <Lottie animationData={ytAnime} />
        <div className="heading text-5xl mt-5 mb-3">Welcome, Shadow!</div>
        <div className="">
          You are the face of the your team. Follow the instructions given and
          go live with your team. And submit the youtube video link below.
        </div>
      </div>

      <DialogFooter className="flex flex-row gap-3 pt-3 justify-center items-center text-muted-foreground ">
        <form className="" onSubmit={handleSubmit}>
          <Label className="mb-1">Paste link here</Label>
          <Input
            type="text"
            name="vLink"
            placeholder="https://www.youtube.com/watch?v=#######"
            required
          />
          <span className="flex gap-1 mt-1 items-center text-muted-foreground text-sm">
            <FaExclamationTriangle size={14} /> Make sure the video is set as
            unlisted.
          </span>
          <button className="btn btn-secondary mt-3">Submit</button>
        </form>
      </DialogFooter>
    </>
  );
}

function CreateTeamDialog({
  setLoading,
  resp,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resp: { type: string; data: { tname?: string; tid?: string; mid?: string } };
}) {
  const { toast } = useToast();
  const q = useQuestContext();
  // form submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!resp.data.tid) return;
    e.preventDefault();
    setLoading(true);
    updateDoc(
      doc(getFirestore(app), `quest/${q.quest?.id}/teams/`, resp.data.tid),
      {
        name: e.currentTarget.tName.value,
      }
    )
      .then(() => {
        toast({ title: "Team created successfully!", variant: "default" });
        location.reload();
      })
      .catch((err) => {
        toast({
          title: "Error adding name. Try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <>
      <div className="flex items-center justify-center flex-col">
        <Lottie animationData={carAnim} />
        <div className="heading text-5xl mt-5 mb-3">Welcome, Boss!</div>
        <div className="">
          Your team is ready to add members! Now give your team a Name and
          finish team signup!
        </div>
      </div>

      <DialogFooter className="flex flex-row gap-3 pt-3 justify-center items-center text-muted-foreground ">
        <form className="" onSubmit={handleSubmit}>
          <Label className="mb-1">Team Name</Label>
          <Input type="text" name="tName" placeholder="Team Name" required />
          <span className="flex gap-1 mt-1 items-center text-muted-foreground text-sm">
            <FaExclamationTriangle size={14} /> This cannot be changed later.
          </span>
          <button className="btn btn-secondary mt-3">Finish</button>
        </form>
      </DialogFooter>
    </>
  );
}

function JoinTeamDialog({
  setLoading,
  resp,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resp: { type: string; data: { tname?: string; tid?: string; mid?: string } };
}) {
  const { toast } = useToast();
  const q = useQuestContext();
  // form submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!resp.data.tid) return;
    e.preventDefault();
    setLoading(true);
    updateDoc(
      doc(getFirestore(app), `quest/${q.quest?.id}/teams/`, resp.data.tid),
      {
        name: e.currentTarget.tName.value,
      }
    )
      .then(() => {
        toast({ title: "Team created successfully!", variant: "default" });
        location.reload();
      })
      .catch((err) => {
        toast({
          title: "Error adding name. Try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <>
      <div className="flex items-center justify-center flex-col">
        <Lottie animationData={carAnim} />
        <div className="heading text-5xl mt-5 mb-3">{resp.data.tname}</div>
        <div className="text-center">
          You have successfully joined the team. Now, get your roles assigned
          and you are ready to start your quest.
        </div>
      </div>

      <DialogFooter className="flex flex-row gap-3 pt-3 justify-center items-center text-muted-foreground ">
        <DialogClose asChild>
          <button className="btn btn-primary">Close</button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

function RoleAssignedDialog({
  setLoading,
  resp,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resp: {
    type: string;
    data: { tname?: string; tid?: string; mid?: string; role?: string };
  };
}) {
  const { toast } = useToast();

  return (
    <>
      <div className="flex items-center justify-center flex-col">
        <Lottie animationData={carAnim} />
        <div className="text-3xl mt-5">Your role is</div>
        <div className="heading text-5xl mb-3">{resp.data.role}</div>
        <div className="text-center">
          Your role have been assigned. View your powers in the next page.
        </div>
      </div>

      <DialogFooter className="flex flex-row gap-3 pt-3 justify-center items-center text-muted-foreground ">
        <DialogClose asChild>
          <button className="btn btn-primary">Close</button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

function MissionAssignedDialog({
  setLoading,
  resp,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resp: {
    type: string;
    data: { tname?: string; tid?: string; mid?: string; role?: string };
  };
}) {
  const q = useQuestContext();

  return (
    <>
      <div className="flex items-center justify-center flex-col text-white">
  
          <>
          <h1>Mission Assigned</h1>
            <div className="heading text-5xl mt-5 mb-3">
              {q.mission?.missionTitle}
            </div>
            <div className="text-center">
              {q.mission?.availablePoints.toString()}
            </div>
          </>
        
      </div>
      
      <DialogFooter className="flex flex-row gap-3 pt-3 justify-center items-center text-muted-foreground ">
        <DialogClose asChild>
          <button className="btn btn-primary">Close</button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
