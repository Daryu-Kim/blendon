import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const getFirebaseAdmin = () => {
  const config = useRuntimeConfig();
  if (!config.firebaseServiceAccountJson) return null;

  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert(JSON.parse(config.firebaseServiceAccountJson)),
    });

  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
};
