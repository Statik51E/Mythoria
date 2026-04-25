import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

// Llama sometimes ignores response_format and wraps JSON in ```json fences,
// or prepends a sentence before the object. This tolerates both.
function parseJsonLoose(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const attempts: string[] = [trimmed];
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) attempts.push(fence[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) attempts.push(trimmed.slice(start, end + 1));
  for (const candidate of attempts) {
    try {
      const result = JSON.parse(candidate);
      if (result && typeof result === "object" && !Array.isArray(result)) {
        return result as Record<string, unknown>;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

interface CallGroqInput {
  campaignId: string;
  sessionId: string;
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  persistAs?: "gm" | "system" | "npc";
  structured?: boolean;
  npcId?: string;
  interactionNpcId?: string;
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
    const {
      campaignId, sessionId, messages, model, temperature, maxTokens,
      persistAs, structured, npcId, interactionNpcId,
    } = body;

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
    const groqBody: Record<string, unknown> = {
      model: model ?? DEFAULT_MODEL,
      messages,
      temperature: temperature ?? 0.8,
      max_tokens: maxTokens ?? 1024,
    };
    if (structured) {
      groqBody.response_format = { type: "json_object" };
    }
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqBody),
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
    const rawContent = json.choices?.[0]?.message?.content ?? "";
    const tokensUsed = json.usage?.total_tokens ?? null;

    let narration = rawContent;
    let suggestedActions: { label: string; prompt: string }[] | undefined;
    let sceneSuggestion: { id?: string; label: string; prompt: string } | undefined;
    let npcSpawns:
      | { id?: string; name: string; role: "ally" | "neutral" | "hostile"; description: string }[]
      | undefined;

    if (structured) {
      const parsed = parseJsonLoose(rawContent);
      if (parsed && typeof parsed === "object") try {
        if (typeof parsed.narration === "string") narration = parsed.narration;
        else if (typeof parsed.text === "string") narration = parsed.text;

        if (Array.isArray(parsed.suggested_actions)) {
          suggestedActions = parsed.suggested_actions
            .filter((a: unknown): a is { label: string; prompt: string } =>
              typeof a === "object" && a !== null
              && typeof (a as { label?: unknown }).label === "string"
              && typeof (a as { prompt?: unknown }).prompt === "string"
            )
            .slice(0, 5)
            .map((a) => ({ label: String(a.label).slice(0, 40), prompt: String(a.prompt).slice(0, 200) }));
        }
        if (parsed.scene_change && typeof parsed.scene_change === "object") {
          const sc = parsed.scene_change as Record<string, unknown>;
          if (typeof sc.label === "string" && typeof sc.prompt === "string") {
            sceneSuggestion = {
              id: typeof sc.id === "string" ? sc.id : undefined,
              label: sc.label.slice(0, 60),
              prompt: sc.prompt.slice(0, 600),
            };
          }
        }
        if (Array.isArray(parsed.npc_spawns)) {
          npcSpawns = parsed.npc_spawns
            .filter((n: unknown): n is { name: string; description: string; role?: string; id?: string } =>
              typeof n === "object" && n !== null
              && typeof (n as { name?: unknown }).name === "string"
              && typeof (n as { description?: unknown }).description === "string"
            )
            .slice(0, 3)
            .map((n) => {
              const role = n.role === "ally" || n.role === "hostile" ? n.role : "neutral";
              return {
                id: typeof n.id === "string" ? n.id.slice(0, 40) : undefined,
                name: String(n.name).slice(0, 40),
                role,
                description: String(n.description).slice(0, 400),
              };
            });
          if (npcSpawns.length === 0) npcSpawns = undefined;
        }
      } catch {
        // If parsing fails, fall back to using rawContent as narration text.
      }
    }

    if (persistAs) {
      mark("persist");
      const docData: Record<string, unknown> = {
        type: persistAs,
        authorUid: "system",
        content: narration,
        createdAt: FieldValue.serverTimestamp(),
        tokensUsed,
      };
      if (suggestedActions && suggestedActions.length > 0) docData.suggestedActions = suggestedActions;
      if (sceneSuggestion) docData.sceneSuggestion = sceneSuggestion;
      if (npcSpawns && npcSpawns.length > 0) docData.npcSpawns = npcSpawns;
      if (npcId) docData.npcId = npcId;
      if (interactionNpcId) docData.interactionNpcId = interactionNpcId;
      await db
        .collection(`campaigns/${campaignId}/sessions/${sessionId}/messages`)
        .add(docData);
    }

    mark("done");
    res.status(200).json({ content: narration, tokensUsed, suggestedActions, sceneSuggestion });
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
