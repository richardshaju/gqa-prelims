import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';

export default !getApps().length ? initializeApp({credential: cert(JSON.parse(process.env.CREDS || ""))}) : getApp();
        