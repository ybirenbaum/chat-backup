"use client";

import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Media and chat JSON are stored in Cloudinary (see src/lib/cloudinary.ts),
// not Firebase Storage, since Cloud Storage for Firebase now requires the
// paid Blaze plan to even enable. Firebase here only backs Auth + Firestore.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

// Fall back to a syntactically-valid placeholder config when real Firebase
// credentials haven't been set yet, so the app still builds/renders (with
// sign-in disabled, see firebaseConfigured) instead of throwing.
const safeConfig: FirebaseOptions = firebaseConfigured
  ? firebaseConfig
  : {
      apiKey: "placeholder-api-key",
      authDomain: "placeholder.firebaseapp.com",
      projectId: "placeholder-project",
      messagingSenderId: "0",
      appId: "1:0:web:0",
    };

const app = getApps().length ? getApps()[0]! : initializeApp(safeConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
