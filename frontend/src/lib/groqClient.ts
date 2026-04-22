import { apiPost } from "./apiClient";

export type GroqRole = "system" | "user" | "assistant";
export interface GroqMessage { role: GroqRole; content: string }

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

interface CallGroqOutput {
  content: string;
  tokensUsed: number | null;
  suggestedActions?: { label: string; prompt: string }[];
  sceneSuggestion?: { id?: string; label: string; prompt: string };
}

export async function callGroq(input: CallGroqInput): Promise<CallGroqOutput> {
  return apiPost<CallGroqOutput>("/api/groq", input);
}
