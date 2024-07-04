import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Command } from "./models"
import crypto from 'crypto'
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateID(length: number) {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  for(let i = 0; i < length; i++)  {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

export function encodeToken({qid, type, data}: Command, evntSecretKey: string) {
  const c = crypto.createCipheriv('aes-192-cbc', Buffer.from(evntSecretKey), Buffer.alloc(16, 0))
  return qid + "." + c.update(JSON.stringify([type, data]),'utf-8','base64').toString() + c.final('base64').toString();
}

export function decodeToken(token: string, evntSecretKey: string) {
  const [qid, cData] = token.split(".")
  const d = crypto.createDecipheriv('aes-192-cbc', Buffer.from(evntSecretKey), Buffer.alloc(16, 0))
  const [type, data] = JSON.parse(d.update(cData, 'base64', 'utf-8').toString() + d.final('utf-8').toString())
  return { qid, type, data }
}