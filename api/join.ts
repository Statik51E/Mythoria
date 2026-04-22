import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { HttpError, requireAuth } from "./_lib/auth";
import { adminDb } from "./_lib/firebaseAdmin";
import { applyCors, handleError } from "./_lib/http";

interface JoinInput {
  inviteCode: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const uid = await requireAuth(req);
    const { inviteCode } = req.body as JoinInput;

    if (!inviteCode || typeof inviteCode !== "string") {
      throw new HttpError(400, "inviteCode required.");
    }
    const code = inviteCode.trim().toUpperCase();

    const db = adminDb();
    const matches = await db.collection("campaigns").where("inviteCode", "==", code).limit(1).get();
    if (matches.empty) throw new HttpError(404, "Invalid invite code.");

    const doc = matches.docs[0];
    const data = doc.data();

    if (data.playerUids?.includes(uid)) {
      return res.status(200).json({ campaignId: doc.id, alreadyMember: true });
    }

    await doc.ref.update({
      playerUids: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await doc.ref.collection("members").doc(uid).set({
      role: "player",
      joinedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ campaignId: doc.id, alreadyMember: false });
  } catch (err) {
    handleError(res, err);
  }
}
