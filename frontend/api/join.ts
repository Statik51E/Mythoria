import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const trace: string[] = [];
  const mark = (s: string) => trace.push(`${Date.now()} ${s}`);

  try {
    mark("start");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed.", trace });
      return;
    }

    const body = (req.body ?? {}) as { inviteCode?: string };
    if (!body.inviteCode || typeof body.inviteCode !== "string") {
      res.status(400).json({ error: "Code d'invitation manquant.", trace });
      return;
    }
    const code = body.inviteCode.trim().toUpperCase();

    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentification requise.", trace });
      return;
    }
    const token = header.slice("Bearer ".length).trim();

    mark("import-firebase");
    const { cert, getApps, initializeApp } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

    mark("init-firebase");
    if (getApps().length === 0) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) {
        res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT missing.", trace });
        return;
      }
      initializeApp({ credential: cert(JSON.parse(raw)) });
    }

    mark("verify-token");
    let uid: string;
    try {
      const decoded = await getAuth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (e) {
      res.status(401).json({
        error: "Session expirée, reconnecte-toi.",
        detail: e instanceof Error ? e.message : String(e),
        trace,
      });
      return;
    }
    mark(`uid=${uid}`);

    mark("query-campaign");
    const db = getFirestore();
    const matches = await db
      .collection("campaigns")
      .where("inviteCode", "==", code)
      .limit(1)
      .get();

    if (matches.empty) {
      res.status(404).json({ error: "Code d'invitation invalide.", trace });
      return;
    }

    const doc = matches.docs[0];
    const data = doc.data() as { playerUids?: string[] };

    if (data.playerUids?.includes(uid)) {
      mark("already-member");
      res.status(200).json({ campaignId: doc.id, alreadyMember: true });
      return;
    }

    mark("add-member");
    await doc.ref.update({
      playerUids: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });

    mark("done");
    res.status(200).json({ campaignId: doc.id, alreadyMember: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    try {
      res.status(500).json({ error: message, stack, trace });
    } catch {
      /* ignore */
    }
  }
}
