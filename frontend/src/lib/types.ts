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

export type RaceId = "human" | "elf" | "dwarf" | "halfling" | "halforc" | "tiefling";
export type ClassId =
  | "warrior"
  | "mage"
  | "rogue"
  | "paladin"
  | "ranger"
  | "cleric"
  | "barbarian"
  | "bard";

export type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type SkillKey = "combat" | "stealth" | "magic" | "social" | "knowledge" | "survival";

export interface Appearance {
  gender: "male" | "female" | "androgynous";
  skin: string;
  hairColor: string;
  hairStyle: string;
  eyes: string;
  beard: string;
  clothing: string;
}

export interface Character {
  id: string;
  ownerUid: string;
  name: string;
  race?: RaceId;
  classId?: ClassId;
  className: string;
  level: number;
  stats: Record<StatKey, number>;
  skills?: Record<SkillKey, number>;
  appearance?: Appearance;
  portraitSeed?: number;
  portraitPrompt?: string;
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
