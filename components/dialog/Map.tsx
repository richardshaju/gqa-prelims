import { useEffect, useRef, useState } from "react";

import "../styles/qrStyles.css";
import { useQuestContext } from "../context/quest";
import { useToast } from "../ui/use-toast";
import { useSearchParams } from "next/navigation";
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
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { app } from "../fb/config";

export function ShowMapDialog({ open }: { open: boolean }) {
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

  return (
    open && (
      <div
        className={`transition-all h-full w-full flex bg-[#07020bba] items-center justify-center flex-col fixed z-[50] backdrop-blur-md  `}
      >
        <div className="w-full h-full  rounded-[10px] flex flex-col justify-center">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m10!1m8!1m3!1d1385.9603228567878!2d76.88500552203344!3d8.56442679883699!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1719997429734!5m2!1sen!2sin"
            width="100%"
            height = "100%"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    )
  );
}
