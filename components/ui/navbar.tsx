import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

import {
  Sun,
  Moon,
  User,
  UserCheck2,
  ArrowLeftFromLineIcon,
  CircleDollarSign,
  Disc,
} from "lucide-react";

import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { useQuestContext, User as UserType } from "../context/quest";
import { usePathname, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "../fb/config";
import { useToast } from "./use-toast";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Timer from "./timer";

export function Navbar({ qName }: { qName?: string }) {
  const user: UserType | undefined = useQuestContext()?.user;
  const path = usePathname();
  const s = useSearchParams();
  const { toast } = useToast();
  const q = useQuestContext();
  // if(!user) redirect("/signin?c="+path)

  return (
    <div
      className={cn(
        "w-full h-[7%] p-1 pt-2 ",
        s.get("app")
          ? " bg-gradient-to-t from-transparent to-black z-[200] absolute "
          : ""
      )}
    >
      <div className="flex items-center mx-3 justify-between gap-2 flex-row">
        <div className="flex items-center flex-row gap-2">
          {s.get("app") ? (
            <>
              <Link href="/">
                <ArrowLeftFromLineIcon
                  size={35}
                  className="cursor-pointer mr-2 border rounded-md p-2"
                />
              </Link>
              <p>{s.get("app")}</p>
            </>
          ) : (
            <Timer />
            
          )}
        </div>
        {s.get("app") ? (
          <div className="flex items-center justify-center gap-2">
            <CircleDollarSign size={16} />
            {(q?.team?.questPoints || 0).toString()}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {user ? (
                  <Avatar className="w-10 h-10">
                    <Image
                      height={25}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="aspect-square h-full w-full"
                      width={25}
                      src={user.photoURL || ""}
                      alt={user.displayName || ""}
                    />
                  </Avatar>
                ) : null}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (!user)
                      signInWithPopup(auth, new GoogleAuthProvider()).then(
                        (v) =>
                          v.user
                            ? toast({
                                title: "Signed in Successfully!",
                                icon: <UserCheck2 />,
                              })
                            : null
                      );
                    else signOut(auth);
                  }}
                >
                  {user ? "Signout" : "Signin"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
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
    <div className="flex justify-center flex-row gap-3 items-center w-full">
      <h1 className="text-xl">
        {date
          .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          .toLocaleUpperCase()}
      </h1>
      {/* <h3 style={{margin: '0'}} className="">{date.toLocaleDateString([], {dateStyle:'medium'})}</h3> */}
    </div>
  );
};
