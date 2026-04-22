import type { VercelRequest } from "@vercel/node";
import { adminAuth, adminDb } from "./firebaseAdmin";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireAuth(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token.");
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new HttpError(401, "Invalid or expired token.");
  }
}

export async function requireMembership(
  uid: string,
  campaignId: string
): Promise<{ hostUid: string; playerUids: string[] }> {
  const snap = await adminDb().doc(`campaigns/${campaignId}`).get();
  if (!snap.exists) throw new HttpError(404, "Campaign not found.");
  const data = snap.data() as { hostUid: string; playerUids: string[] };
  if (!data.playerUids?.includes(uid)) {
    throw new HttpError(403, "Not a member of this campaign.");
  }
  return data;
}
