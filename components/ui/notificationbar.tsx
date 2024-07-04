import React, { useEffect, useState } from "react";
import { Navbar } from "./navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuItem } from "./dropdown-menu";
import { useQuestContext, User as UserType } from "../context/quest";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../fb/config";
import Image from "next/image";
import { useToast } from "./use-toast";
import { CircleUser, UserCheck2 } from "lucide-react";
import { Button } from "./button";
import { Separator } from "./separator";
import { useTheme } from "next-themes";

const NotificationBar = ({ isOpen }: any) => {
  const [date, setDate] = useState(new Date());
  const user: UserType | undefined = useQuestContext()?.user;

  const {theme, setTheme} = useTheme()
  const { toast } = useToast();
  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return function cleanup() {
      clearInterval(timerID);
    };
  });

  function tick() {
    setDate(new Date());
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
}


  return (

  
    <div className="">
      {isOpen ? (
        <div className="w-full backdrop-blur-sm  bg-[#ececec52] dark:bg-[#32323252] z-10 absolute">
          <div className="flex flex-row justify-between p-2 text-black dark:text-white">
            <div>
              <h1 className="text-xl">
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </h1>
              <p className="text-sm">
                {date
                  .toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "2-digit",
                    month: "short",
                  })
                  .replace(/, /, " ")}
              </p>
            </div>
            <div className="flex gap-2 items-center">
                <label className="swap swap-rotate" onClick={toggleTheme}>
                  {/* this hidden checkbox controls the state */}
                  <input type="checkbox" />

                  {/* sun icon */}
                  <svg
                    className="swap-on fill-current w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                  </svg>

                  {/* moon icon */}
                  <svg
                    className="swap-off fill-current w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                  </svg>
                </label>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="cursor-pointer ">
                  {user ? (
                    <Avatar className="w-9 h-9">
                      <Image
                        height={30}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="aspect-square h-full w-full"
                        width={30}
                        src={user.photoURL || ""}
                        alt={user.displayName || ""}
                      />
                    </Avatar>
                  ) : (
                    <Button variant="outline" size="icon">
                      <CircleUser />
                    </Button>
                  )}
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
          </div>
          <Separator className="w-[80%] text-center" />
          <div></div>
        </div>
      ) : (
        null
      )}
    </div>
  );
};

export default NotificationBar;
