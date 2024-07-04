import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { auth, db } from "../fb/config"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { FaLock } from "react-icons/fa";
import { useTheme } from "next-themes";
import { useToast } from "../ui/use-toast";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { Logo } from "../ui/logo";
import { Separator } from "../ui/separator";
import { User } from "@/lib/models"
import { doc, getDoc, setDoc } from "firebase/firestore"

export function SigninDialog({open, setOpen}:{open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>}) {

    return (<div className="h-[100dvh] w-full flex items-center justify-center flex-col" style={{
      backgroundImage:"url('/bg/plain.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Logo className="text-6xl mb-5" size={2}/>
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="items-center justify-center flex flex-col gap-4">
            <FaLock className="mr-2" size={60}/>
            Let&apos;s Get Started!
          </CardTitle>
          <CardDescription className="text-slate-300">
            Signin with Google to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <SigninForm/>
        </CardContent>
        
      </Card>
    </div>)
}

function SigninForm({ className }: React.ComponentProps<"form">) {

  const { toast } = useToast()
  const { theme } = useTheme()

  const [phNo, setPhNo] = React.useState<string>("####")
  const [batch, setBatch] = React.useState<string>("###")
  const [subject, setSubject] = React.useState<string>("######")
  const [title, setTitle] = React.useState<string>()
  const [loading, setLoading] = React.useState("")
  const [error, setError] = React.useState(false)

 
  function handleSignin() {
    setLoading("Authenticating...")

    signInWithPopup(auth, new GoogleAuthProvider()).then(async (userCred) => {
      const user = userCred.user
      if(user){
        // Create a new user in the database

        const d = await getDoc(doc(db, "users", user.uid))
        
        if(!d.exists()) {
          await setDoc(doc(db,"users",user.uid), {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            dp: user.photoURL,
            phno: phNo,
            c_quest: "gqa",
            c_team: "",
          })
        }
        toast({ title: `Welcome, ${user.displayName}`, variant: "default" })
        setLoading("")
        location.reload();
      }
    }).catch((err) => {
      console.error(err)
      setLoading("")
    })
  }

  return <div className={cn("flex items-center justify-center flex-col gap-4", className)}>
      <div className="flex w-fit p-2 cursor-pointer border rounded-md flex-row justify-center items-center bg-white text-black hover:bg-slate-300 transition-all" onClick={handleSignin}>
                        <FcGoogle size={20} className="mr-2" />
                        Signin with Google
      </div>

    </div>
}
