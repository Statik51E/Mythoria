import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { HttpError, requireAuth, requireMembership } from "./_lib/auth";
import { adminDb } from "./_lib/firebaseAdmin";
import { enforceRateLimit } from "./_lib/rateLimit";
import { applyCors, handleError } from "./_lib/http";

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
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const uid = await requireAuth(req);
    const { campaignId, sessionId, messages, model, temperature, maxTokens, persistAs } =
      req.body as CallGroqInput;

    if (!campaignId || !sessionId) {
      throw new HttpError(400, "campaignId and sessionId required.");
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpError(400, "messages must be a non-empty array.");
    }

    await requireMembership(uid, campaignId);
    await enforceRateLimit(uid, "groq", 30, 60);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new HttpError(500, "GROQ_API_KEY not configured.");

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

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error", groqRes.status, errText);
      throw new HttpError(502, `Groq API error (${groqRes.status}).`);
    }

    const json = (await groqRes.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens: number };
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const tokensUsed = json.usage?.total_tokens ?? null;

    if (persistAs) {
      await adminDb()
        .collection(`campaigns/${campaignId}/sessions/${sessionId}/messages`)
        .add({
          type: persistAs,
          authorUid: "system",
          content,
          createdAt: FieldValue.serverTimestamp(),
          tokensUsed,
        });
    }

    res.status(200).json({ content, tokensUsed });
  } catch (err) {
    handleError(res, err);
  }
}
