"use client"

import { cn } from '@/lib/utils'
import { Pixelify_Sans } from 'next/font/google'
import Image from 'next/image'

const font = Pixelify_Sans({ subsets: ['latin'], weight: ['400']})
export function Logo({size, className} : {size?:number, className?:string}){
    return <Image src="/logo_white-cropped.svg" width={100*(size || 1)} height={100*(size || 1)} className={cn("ml-4",className)} alt="GrandQuestAuto" />
}
