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
  persistAs?: "gm" | "system";
}

interface CallGroqOutput {
  content: string;
  tokensUsed: number | null;
}

export async function callGroq(input: CallGroqInput): Promise<CallGroqOutput> {
  return apiPost<CallGroqOutput>("/api/groq", input);
}
