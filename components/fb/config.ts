import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_0brYB5E64rpWE42aNAnhp0gFTV2xMfk",
  authDomain: "gqa-prelims.firebaseapp.com",
  projectId: "gqa-prelims",
  storageBucket: "gqa-prelims.appspot.com",
  messagingSenderId: "198944256009",
  appId: "1:198944256009:web:159551a9a1111a9d0108d8"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const auth = getAuth(app)
