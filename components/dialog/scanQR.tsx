import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

// Styles
import "../styles/qrStyles.css";

// Qr Scanner
import QrScanner from "qr-scanner";
import QrFrame from "@/public/qr-frame.svg";
import { useQuestContext } from "../context/quest";
import { useToast } from "../ui/use-toast";
import { useSearchParams, useRouter, redirect } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, X } from "lucide-react";

export function ScanQRDialog({
  open,
  setOpen,
  scanFor,
  id,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  scanFor?: string;
  id?: string;
}) {
  const q = useQuestContext();
  const { toast } = useToast();
  const router = useRouter();

  const s = useSearchParams();
  const { theme } = useTheme();
  const user = q?.user;

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

  return open ? (
    <div className="transition-all animate-in h-full w-full flex items-center justify-center flex-col fixed z-10  bg-transparent backdrop-blur-md">
      <QrReader
        open={open}
        setOpen={setOpen}
        scanFor={scanFor}
        missionId={id}
      />
    </div>
  ) : null;
}

function QrReader({
  open,
  setOpen,
  scanFor,
  missionId,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  scanFor?: string;
  missionId?: string;
}) {
  // QR States
  const scanner = useRef<QrScanner>();
  const videoEl = useRef<HTMLVideoElement>(null);
  const qrBoxEl = useRef<HTMLDivElement>(null);
  const [qrOn, setQrOn] = useState<boolean>(true);
  const [successQr, setSuccessQr] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | undefined>("");

  const { toast } = useToast();
  const q = useQuestContext();

  const user = q.user;
  const tid = q.team?.id;
  const qid = q.quest?.id;

  const qrs: any = [
    "gqa.wAHQ/UVaVzcVioAv9B+Bbqq7b1A1Ot76yswP0BTtpfp3rUsV5XOq1KS9vqALy0m6",
    "gqa.ENM6LuAwUdRAiIbbVyVqPVzfIrVfFWlMsDEp3CQYIQZHzHWWPEuKKKa7Vyt6fsOS",
    "gqa.q68JyUO4LIhibHElki36Hl/CnEaJrYPCi7OfKOjzIIQYN8Nh1ZSY/b9xqChaHYZ4",
    "gqa.zRokhbm8j/ofaMRB2Q9DYt1lt2lsAKFwf9fieNkbcD/e6LxGjKat2CTOXIJ9Hfkr",
    "gqa.d9mCJZBOa91oeNOPQVAJb2ZgDXhdh5RhvF3F+snsRweP/8CcqNEE++45T06DVJpb",
    "gqa.gFxzXjLwbuY9ObV0c8UfryGNXv76TuFCvKTaZ6JaOkNdXAOenjJrIJHBwzp5bOgR",
    "gqa.HvjZ54evKynDcS0MytZLmPHa5q4B+a3g9yeLGyq8ZUSoJc5g3olkp83Z5Om28noB",
    "gqa.5O9k1H5H/YqPja2vLhr88fS+0KcLTdF/3JYn1Cu3XuqQX5aSXenAtqpG7GRNP7dx",
    "gqa.O71DSlOmCpPEiC+k02e9/L1FvCkqTjvuyEPfzO48hlBZNfIqq8eEgld7zJrUWVGB",
  ];

  const onScanSuccess = async (result: QrScanner.ScanResult) => {
    if (!user || !qid) return null;

    setSuccessQr(true);
    // videoEl.current?.pause();
    try {
      navigator.vibrate(200);
    } catch (err) {
      console.log("Vibration not supported.");
    }
    setLoading(true);

    if (qrs.includes(result?.data)) {
      toast({
        title: "Success QR",
        variant: "default",
      });
      redirect(`whatsapp://send?text=${encodeURIComponent(result?.data)}`);
      setOpen(false);
      return;
    }

    if (result?.data.startsWith("gqa")) {
      console.log(result?.data);

      if (scanFor == "assignMission") {
        fetch(`/api/${qid}/host/updateMission`, {
          method: "POST",
          headers: {
            "X-Token": await user.getIdToken(),
            "X-MID": missionId || "",
          },
          body: result?.data,
        })
          .then(async (data) => {
            const qrData = await data.json();
            if (data.ok) {
              setMsg(qrData.msg);
              setOpen(false);
            } else {
              toast({
                title: qrData.msg,
                variant: "destructive",
              });
            }
          })
          .catch((err) => {
            console.log(err);

            toast({
              title: "Error Ocuured. Please Try Again.",
              variant: "destructive",
            });
          });
      } else {
        fetch(`/api/${qid}/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": await user.getIdToken(),
            "X-TID": tid || "",
          },
          body: result?.data,
        })
          .then(async (data) => {
            const qrData = await data.json();
            if (data.ok) {
              setMsg(qrData.msg);
              toast({
                title: qrData.msg,
                variant: "default",
              });
              setOpen(false);
            } else {
              toast({
                title: qrData.msg,
                variant: "destructive",
              });
            }
          })
          .catch((err) => {
            toast({
              title: "Error Ocuured. Please Try Again.",
              variant: "destructive",
            });
          });
      }
    }
  };

  useEffect(() => {
    if (videoEl?.current && !scanner.current) {
      scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        overlay: qrBoxEl?.current || undefined,
      });

      // Start QR Scanner
      scanner?.current
        ?.start()
        .then(() => setQrOn(true))
        .catch((err) => {
          if (err) setQrOn(false);
        });
    }

    return () => {
      if (!videoEl?.current) {
        scanner?.current?.stop();
      }
    };
  }, []);

  //  If "camera" is not allowed in browser permissions, show an alert.
  useEffect(() => {
    if (!qrOn)
      alert(
        "Camera is blocked or not accessible. Please allow camera in your browser permissions and Reload."
      );
  }, [qrOn]);

  return (
    <div className="qr-reader">
      {/* QR */}
      {!successQr && (
        <>
          <video ref={videoEl}></video>
          <div ref={qrBoxEl} className="qr-box">
            <img
              src={QrFrame.src}
              alt="Qr Frame"
              width={256}
              height={256}
              className="qr-frame"
            />
          </div>
        </>
      )}

      {/* Show Data Result if scan is success */}
      {successQr && (
        <div className="h-full flex justify-center items-center">
          <Card className="bg-gray-700">
            <CardHeader>
              <CardTitle></CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin" /> : msg}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
