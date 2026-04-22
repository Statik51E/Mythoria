import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

interface CallGroqInput {
  campaignId: string;
  sessionId: string;
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  persistAs?: "gm" | "system";
}

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

    mark("parse-body");
    const body = (req.body ?? {}) as Partial<CallGroqInput>;
    const { campaignId, sessionId, messages, model, temperature, maxTokens, persistAs } = body;

    if (!campaignId || !sessionId) {
      res.status(400).json({ error: "campaignId and sessionId required.", trace });
      return;
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages must be a non-empty array.", trace });
      return;
    }

    mark("check-auth-header");
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing bearer token.", trace });
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
    const auth = getAuth();
    const db = getFirestore();

    mark("verify-token");
    let uid: string;
    try {
      const decoded = await auth.verifyIdToken(token);
      uid = decoded.uid;
    } catch (e) {
      res.status(401).json({
        error: "Invalid or expired token.",
        detail: e instanceof Error ? e.message : String(e),
        trace,
      });
      return;
    }
    mark(`uid=${uid}`);

    mark("read-campaign");
    const campSnap = await db.doc(`campaigns/${campaignId}`).get();
    if (!campSnap.exists) {
      res.status(404).json({ error: "Campaign not found.", trace });
      return;
    }
    const camp = campSnap.data() as { hostUid?: string; playerUids?: string[] };
    mark(`hostUid=${camp.hostUid} playerUids=${JSON.stringify(camp.playerUids)}`);
    if (!camp.playerUids?.includes(uid)) {
      res.status(403).json({ error: "Not a member of this campaign.", trace });
      return;
    }

    mark("rate-limit");
    const rlRef = db.doc(`rateLimits/${uid}_groq`);
    const now = Date.now();
    const cutoff = now - 60 * 1000;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(rlRef);
      const calls: number[] = (snap.data()?.calls ?? []).filter((t: number) => t > cutoff);
      if (calls.length >= 30) throw new Error("RATE_LIMIT");
      calls.push(now);
      tx.set(rlRef, { calls, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    mark("check-groq-key");
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "GROQ_API_KEY not configured.", trace });
      return;
    }

    mark("fetch-groq");
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model ?? DEFAULT_MODEL,
        messages,
        temperature: temperature ?? 0.8,
        max_tokens: maxTokens ?? 1024,
      }),
    });
    mark(`groq-status=${groqRes.status}`);

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      res.status(502).json({
        error: `Groq API error (${groqRes.status}).`,
        detail: errText,
        trace,
      });
      return;
    }

    mark("parse-groq");
    const json = (await groqRes.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens: number };
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const tokensUsed = json.usage?.total_tokens ?? null;

    if (persistAs) {
      mark("persist");
      await db
        .collection(`campaigns/${campaignId}/sessions/${sessionId}/messages`)
        .add({
          type: persistAs,
          authorUid: "system",
          content,
          createdAt: FieldValue.serverTimestamp(),
          tokensUsed,
        });
    }

    mark("done");
    res.status(200).json({ content, tokensUsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    try {
      res.status(500).json({ error: message, stack, trace });
    } catch {
      /* response already committed */
    }
  }
}
