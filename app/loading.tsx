"use client"
import { Logo } from '@/components/ui/logo';
import { Loader2 } from "lucide-react";
import Image from 'next/image';
import { use, useEffect, useState } from 'react';

export default function Loading({msg}:{msg: string}) {
    const roleSrc = ['/roles/shadow.png', '/roles/nomad.png', '/roles/thug.png', '/roles/boss.png'];
    const randomRoleSrc = roleSrc[Math.floor(Math.random() * roleSrc.length)];

    return (
        <div className={`flex gap-3  h-[100dvh] w-screen flex-col z-50`} style={{
            backgroundImage:"url('/bg/loading.svg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <div className="flex justify-center  h-full w-full animate-pulse transition-all drop-shadow-xl">
                <Logo size={2.5} className='mb-80'/>
            </div> 
            {/* Add image from roles */}
            <div className='absolute bottom-0'>
                <Image src={randomRoleSrc} width={500} height={600} alt="Role" priority={true}/>
            </div>
            <div className="flex z-50 justify-center items-center mb-10 flex-row gap-2 text-secondary-foreground text-center">
                <Loader2 size={20} className="animate-spin"/>
                <small className={"heading text-lg"}>{msg}</small>
            </div>
        </div>
    )
  }

  