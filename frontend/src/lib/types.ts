import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  role: "ally" | "neutral" | "hostile";
  description: string;
  appearancePrompt?: string;
  outcome?: "defeated" | "left" | "departed";
  encounters?: number;
  lastSeenAt?: Timestamp;
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
  bestiary?: Record<string, BestiaryEntry>;
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
  hp?: number;
  maxHp?: number;
  mana?: number;
  maxMana?: number;
  xp?: number;
  deceased?: boolean;
  diedAt?: Timestamp;
}

export type NpcRole = "ally" | "neutral" | "hostile";

export interface Npc {
  id: string;
  name: string;
  role: NpcRole;
  description: string;
  appearancePrompt?: string;
  race?: RaceId;
  classId?: ClassId;
  appearance?: Partial<Appearance>;
  portraitSeed?: number;
  hp?: number;
  maxHp?: number;
  level?: number;
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

export type QuestStatus = "active" | "completed" | "failed";

export interface Quest {
  id: string;
  title: string;
  summary: string;
  status: QuestStatus;
  updatedAt?: Timestamp;
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
  quests?: Record<string, Quest>;
  // Running 4-8 sentence chapter summary maintained by the MJ. Survives
  // beyond the message window so long campaigns stay coherent.
  chapterSummary?: string;
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

export interface NpcSpawn {
  id?: string;
  name: string;
  role: NpcRole;
  description: string;
  appearancePrompt?: string;
}

export interface QuestUpdate {
  // Stable slug; same id = update existing quest. New id = new quest.
  id: string;
  title?: string;
  summary?: string;
  status?: QuestStatus;
}

export interface HpChange {
  // Name of the affected character or NPC. Matched case-insensitively.
  target: string;
  // Negative = damage, positive = healing. Mana shifts use deltaMana instead.
  delta?: number;
  deltaMana?: number;
  reason?: string;
}

export interface XpAward {
  // Player character name. Matched case-insensitively. Defaults to whole party
  // when missing.
  target?: string;
  amount: number;
  reason?: string;
}

export interface ItemGrant {
  name: string;
  type: ItemType;
  description: string;
  slot?: EquipSlot;
  flavor?: string;
  consumable?: boolean;
  quantity?: number;
  // Optional: name of the character meant to receive it. If absent, the grant
  // goes to every character in the party (shared loot).
  character?: string;
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
  npcSpawns?: NpcSpawn[];
  // NPC ids or names that should leave the scene (player walked past, NPC
  // departed, was killed, etc.). Matching is case-insensitive on name.
  npcDespawns?: string[];
  itemGrants?: ItemGrant[];
  hpChanges?: HpChange[];
  xpAwards?: XpAward[];
  questUpdates?: QuestUpdate[];
  chapterSummary?: string;
  npcId?: string;
  interactionNpcId?: string;
}
