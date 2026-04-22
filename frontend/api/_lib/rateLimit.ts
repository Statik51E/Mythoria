import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { HttpError } from "./auth";

export async function enforceRateLimit(
  uid: string,
  bucket: string,
  maxCalls: number,
  windowSeconds: number
): Promise<void> {
  const ref = adminDb().doc(`rateLimits/${uid}_${bucket}`);
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const calls: number[] = (snap.data()?.calls ?? []).filter((t: number) => t > cutoff);
    if (calls.length >= maxCalls) {
      throw new HttpError(429, `Rate limit: ${maxCalls} calls / ${windowSeconds}s.`);
    }
    calls.push(now);
    tx.set(ref, { calls, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}
