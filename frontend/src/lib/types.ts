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

export type ItemType = "weapon" | "armor" | "accessory" | "potion" | "scroll" | "tool" | "misc";
export type EquipSlot = "weapon" | "armor" | "accessory";

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  slot?: EquipSlot;
  flavor?: string;
  consumable?: boolean;
  quantity?: number;
}

export interface Equipment {
  weapon?: Item | null;
  armor?: Item | null;
  accessory?: Item | null;
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
  inventory: Item[];
  equipment?: Equipment;
}

export type NpcRole = "ally" | "neutral" | "hostile";

export interface Npc {
  id: string;
  name: string;
  role: NpcRole;
  description: string;
  race?: RaceId;
  classId?: ClassId;
  appearance?: Partial<Appearance>;
  portraitSeed?: number;
  hp?: number;
  maxHp?: number;
}

export interface TokenPosition {
  x: number;
  y: number;
}

export interface CurrentScene {
  id: string;
  label: string;
  prompt: string;
  seed: number;
  category?: string;
  setAt?: Timestamp;
}

export interface SessionDoc {
  id: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  activePlayerUid?: string;
  sceneSummary?: string;
  currentScene?: CurrentScene;
  tokens?: Record<string, TokenPosition>;
  npcs?: Record<string, Npc>;
  npcTokens?: Record<string, TokenPosition>;
}

export type MessageType = "player" | "gm" | "system" | "dice" | "npc";

export interface SuggestedAction {
  label: string;
  prompt: string;
}

export interface SceneSuggestion {
  id?: string;
  label: string;
  prompt: string;
}

export interface Message {
  id: string;
  type: MessageType;
  authorUid: string;
  content: string;
  createdAt: Timestamp;
  tokensUsed?: number;
  suggestedActions?: SuggestedAction[];
  sceneSuggestion?: SceneSuggestion;
  npcId?: string;
  interactionNpcId?: string;
}
