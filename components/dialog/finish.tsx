import * as React from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Logo } from "../ui/logo";

export function FinishDialog({open, setOpen}:{open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>}) {

    return (<div className="h-[100dvh] w-full flex items-center justify-center flex-col" style={{
      backgroundImage:"url('/bg/plain.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Logo className="text-6xl mb-5" size={2}/>
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="items-center justify-center title flex flex-col gap-4">
            Quest Finished!
          </CardTitle>
          <CardDescription className="text-slate-300">
            
          </CardDescription>
        </CardHeader>
        <CardContent>
        You played well! Your quest has been completed.
        </CardContent>
      </Card>
    </div>)
}
