import { useEffect, useRef, useState } from "react";

import "../styles/qrStyles.css";
import { useQuestContext } from "../context/quest";
import { useToast } from "../ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { QRCode } from 'react-qrcode-logo';
import { ifError } from "assert";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShowQRDialog({ open, setOpen}: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>>;}) {

    const q = useQuestContext();
    const user = q?.user; 

    const { toast } = useToast();
    const [qrData, setQrData] = useState<string>("");
    const [qrVisible, setQRVisible] = useState(false);
    
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

  useEffect(()=>{
    if(!open) return
    (async () => {
        if(!user) return
        const qid = q.quest?.id
        const tid = q.team?.id

        if(!qid || !tid) return

          fetch(`/api/${qid}/team/joinTeam`,{
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token": await user.getIdToken(),
              "X-TID": tid
            }
          }).then(async (data) => {
            const qrData = await data.json();
            setQrData(qrData.token)
          }).catch((err) => { 
            toast({ title: "Error generating QR code. Try Again.", variant: "destructive" });
          });
    })()
  }, [open])
  
    return <Dialog open={open} onOpenChange={(open)=>setOpen(open)}>
        <DialogContent className="bg-transparent h-full" onPointerUp={()=>setQRVisible(false)} onPointerDown={()=>setQRVisible(true)}>
          <DialogHeader className="flex items-start justify-center">
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription className="flex justify">Ask your team members to scan this QR code to join your team. </DialogDescription>
          </DialogHeader>

       {(qrData == "")?<div className="flex items-center justify-center flex-row gap-2"><Loader2 className="animate-spin"/> Loading...</div>:
       <div className="flex items-center justify-center flex-col">
        <div className={cn("fixed z-50", qrVisible? "hidden":"")}>Press and hold to unblur.</div>
           <span className={cn(qrVisible? "" : "blur")}><QRCode value={qrData} size={256}/></span>
      </div>}

      {qrData != "" &&<DialogFooter className="flex flex-row gap-3 pt-3 justify-center items-center text-muted-foreground ">
        <Loader2 size={20} className="animate-spin"/>  Waiting for team members to join...
      </DialogFooter>}
        </DialogContent>
      </Dialog>;
  }

  
