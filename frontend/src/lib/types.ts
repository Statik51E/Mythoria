import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  hostUid: string;
  playerUids: string[];
  inviteCode: string;
  status: "active" | "paused" | "ended";
  systemRules?: string;
  createdAt: Timestamp;
}

export interface Character {
  id: string;
  ownerUid: string;
  name: string;
  className: string;
  level: number;
  stats: Record<string, number>;
  inventory: string[];
}

export interface Npc {
  id: string;
  name: string;
  persona: string;
  stats?: Record<string, number>;
  visibleToPlayers: boolean;
}

export interface SessionDoc {
  id: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  activePlayerUid?: string;
  sceneSummary?: string;
}

export type MessageType = "player" | "gm" | "system" | "dice";

export interface Message {
  id: string;
  type: MessageType;
  authorUid: string;
  content: string;
  createdAt: Timestamp;
  tokensUsed?: number;
}
