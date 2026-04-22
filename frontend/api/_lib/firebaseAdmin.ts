import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | undefined;

function getApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var missing.");
  const parsed = JSON.parse(raw);
  app = initializeApp({ credential: cert(parsed) });
  return app;
}

export const adminAuth = () => getAuth(getApp());
export const adminDb = () => getFirestore(getApp());
