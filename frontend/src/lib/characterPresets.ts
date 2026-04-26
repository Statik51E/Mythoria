import type { ClassId, RaceId, SkillKey, StatKey } from "./types";

export interface RacePreset {
  id: RaceId;
  label: string;
  flavor: string;
  prompt: string;
  bonus: Partial<Record<StatKey, number>>;
}

export const RACES: RacePreset[] = [
  {
    id: "human",
    label: "Humain",
    flavor: "Polyvalent, ambitieux. Aussi à l'aise dans les cours que sur les champs de bataille.",
    prompt: "human",
    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  },
  {
    id: "elf",
    label: "Elfe",
    flavor: "Longévité gracieuse, oreilles pointues, pas léger. Né de la forêt et de la lune.",
    prompt: "elven, sharp pointed ears, slender features",
    bonus: { dex: 2 },
  },
  {
    id: "dwarf",
    label: "Nain",
    flavor: "Trapu, têtu, fier de sa barbe et de son enclume. Endurance légendaire.",
    prompt: "dwarven, stocky muscular build, broad shoulders",
    bonus: { con: 2 },
  },
  {
    id: "halfling",
    label: "Halfelin",
    flavor: "Petit, agile, chanceux. On l'oublie facilement, c'est son meilleur atout.",
    prompt: "halfling, small stature, youthful curious face",
    bonus: { dex: 2 },
  },
  {
    id: "halforc",
    label: "Demi-orque",
    flavor: "Force brute, défenses vivaces, tribu et orgueil. Souvent jugé sur sa peau verte.",
    prompt: "half-orc, prominent tusks, green-tinted skin, intimidating",
    bonus: { str: 2 },
  },
  {
    id: "tiefling",
    label: "Tieffelin",
    flavor: "Sang infernal, cornes recourbées, charisme de l'étrange. Toujours dévisagé.",
    prompt: "tiefling, curved horns, glowing eyes, infernal heritage",
    bonus: { cha: 2 },
  },
];

export interface ClassPreset {
  id: ClassId;
  label: string;
  flavor: string;
  clothingPrompt: string;
  primarySkills: SkillKey[];
  startingStat: StatKey;
  baseHp: number;
  baseMana: number;
}

export const CLASSES: ClassPreset[] = [
  {
    id: "warrior",
    label: "Guerrier",
    flavor: "Maître des armes, discipline et acier. Survit en encaissant ce que d'autres esquivent.",
    clothingPrompt: "wearing plate armor, holding a longsword, battle-worn",
    primarySkills: ["combat"],
    startingStat: "str",
    baseHp: 30,
    baseMana: 0,
  },
  {
    id: "mage",
    label: "Mage",
    flavor: "Pages froissées, sortilèges, savoir interdit. La force est dans le mot juste.",
    clothingPrompt: "wearing arcane robes with mystical symbols, holding a glowing staff",
    primarySkills: ["magic", "knowledge"],
    startingStat: "int",
    baseHp: 18,
    baseMana: 30,
  },
  {
    id: "rogue",
    label: "Voleur",
    flavor: "Couteau dans l'ombre, sourire en plein jour. Une serrure n'est qu'une suggestion.",
    clothingPrompt: "wearing dark leather armor with hood up, twin daggers at the belt",
    primarySkills: ["stealth", "social"],
    startingStat: "dex",
    baseHp: 22,
    baseMana: 0,
  },
  {
    id: "paladin",
    label: "Paladin",
    flavor: "Serment, lumière, jugement. Bouclier de ceux qui n'en ont pas.",
    clothingPrompt: "wearing ornate silver plate armor, holy symbol pendant, holding a warhammer",
    primarySkills: ["combat", "magic"],
    startingStat: "str",
    baseHp: 28,
    baseMana: 12,
  },
  {
    id: "ranger",
    label: "Rôdeur",
    flavor: "La forêt parle, il écoute. Arc bandé, capuche basse, traces lues comme un livre.",
    clothingPrompt: "wearing forest green ranger leathers with cloak, longbow on the back, weathered face",
    primarySkills: ["survival", "stealth"],
    startingStat: "dex",
    baseHp: 24,
    baseMana: 8,
  },
  {
    id: "cleric",
    label: "Clerc",
    flavor: "Voix de son dieu, main qui guérit ou foudroie. Dévot autant que tacticien.",
    clothingPrompt: "wearing chainmail under priest robes, holding an ornate mace, holy aura",
    primarySkills: ["magic", "social"],
    startingStat: "wis",
    baseHp: 24,
    baseMana: 24,
  },
  {
    id: "barbarian",
    label: "Barbare",
    flavor: "Rage primordiale, peaux et fourrures. Le calme est un luxe qu'il offre à d'autres.",
    clothingPrompt: "wearing fur and leather armor, wielding a huge two-handed axe, fierce expression, war paint",
    primarySkills: ["combat", "survival"],
    startingStat: "str",
    baseHp: 32,
    baseMana: 0,
  },
  {
    id: "bard",
    label: "Barde",
    flavor: "Chansons qui ouvrent les portes (et les coffres). L'histoire, c'est lui qui la raconte.",
    clothingPrompt: "wearing fancy traveling clothes with feathered hat, lute slung over shoulder, charming smile",
    primarySkills: ["social", "magic"],
    startingStat: "cha",
    baseHp: 20,
    baseMana: 18,
  },
];

// Adds the CON modifier (D&D-ish: (con-10)/2) to baseHp, with a sane floor.
export function rollStartingVitals(
  classId: ClassId,
  con: number
): { hp: number; maxHp: number; mana: number; maxMana: number } {
  const cls = CLASSES.find((c) => c.id === classId);
  const base = cls?.baseHp ?? 24;
  const baseMana = cls?.baseMana ?? 0;
  const conMod = Math.floor((con - 10) / 2);
  const maxHp = Math.max(8, base + conMod);
  const maxMana = baseMana;
  return { hp: maxHp, maxHp, mana: maxMana, maxMana };
}

export const STAT_LABELS: Record<StatKey, { short: string; full: string }> = {
  str: { short: "FOR", full: "Force" },
  dex: { short: "DEX", full: "Dextérité" },
  con: { short: "CON", full: "Constitution" },
  int: { short: "INT", full: "Intelligence" },
  wis: { short: "SAG", full: "Sagesse" },
  cha: { short: "CHA", full: "Charisme" },
};

export const SKILL_LABELS: Record<SkillKey, { label: string; flavor: string }> = {
  combat: { label: "Combat", flavor: "Frapper, parer, tenir la ligne." },
  stealth: { label: "Discrétion", flavor: "Crochetage, infiltration, larcin." },
  magic: { label: "Magie", flavor: "Sortilèges, incantation, savoir occulte." },
  social: { label: "Social", flavor: "Persuader, intimider, séduire, mentir." },
  knowledge: { label: "Savoir", flavor: "Histoire, arcanes, langues, religions." },
  survival: { label: "Survie", flavor: "Pister, soigner, lire la nature." },
};

export const POINT_BUY_TOTAL = 27;
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export const SKILL_POINTS_TOTAL = 10;
export const SKILL_POINTS_MAX_PER_SKILL = 5;

export interface AppearanceOption {
  id: string;
  label: string;
  prompt: string;
}

export const SKIN_TONES: AppearanceOption[] = [
  { id: "pale", label: "Pâle", prompt: "pale white" },
  { id: "fair", label: "Claire", prompt: "fair" },
  { id: "olive", label: "Olive", prompt: "olive" },
  { id: "tan", label: "Mate", prompt: "tan" },
  { id: "bronze", label: "Bronzée", prompt: "bronze" },
  { id: "brown", label: "Brune", prompt: "brown" },
  { id: "dark", label: "Foncée", prompt: "dark brown" },
  { id: "ebony", label: "Ébène", prompt: "deep ebony" },
];

export const HAIR_COLORS: AppearanceOption[] = [
  { id: "black", label: "Noir", prompt: "black" },
  { id: "brown", label: "Brun", prompt: "brown" },
  { id: "auburn", label: "Auburn", prompt: "auburn" },
  { id: "blond", label: "Blond", prompt: "blonde" },
  { id: "red", label: "Roux", prompt: "fiery red" },
  { id: "white", label: "Blanc", prompt: "snow white" },
  { id: "silver", label: "Argenté", prompt: "silver" },
  { id: "raven", label: "Corbeau", prompt: "jet black with blue sheen" },
];

export const HAIR_STYLES: AppearanceOption[] = [
  { id: "short", label: "Court", prompt: "short cropped hair" },
  { id: "medium", label: "Mi-long", prompt: "shoulder-length hair" },
  { id: "long", label: "Long", prompt: "long flowing hair" },
  { id: "braided", label: "Tressé", prompt: "intricately braided hair" },
  { id: "ponytail", label: "Catogan", prompt: "hair tied in a ponytail" },
  { id: "wild", label: "Sauvage", prompt: "wild unkempt hair" },
  { id: "bald", label: "Chauve", prompt: "bald" },
];

export const EYE_COLORS: AppearanceOption[] = [
  { id: "blue", label: "Bleus", prompt: "icy blue eyes" },
  { id: "green", label: "Verts", prompt: "emerald green eyes" },
  { id: "brown", label: "Marrons", prompt: "warm brown eyes" },
  { id: "hazel", label: "Noisette", prompt: "hazel eyes" },
  { id: "grey", label: "Gris", prompt: "stormy grey eyes" },
  { id: "amber", label: "Ambrés", prompt: "glowing amber eyes" },
  { id: "violet", label: "Violets", prompt: "rare violet eyes" },
];

export const BEARDS: AppearanceOption[] = [
  { id: "none", label: "Imberbe", prompt: "clean-shaven smooth face" },
  { id: "stubble", label: "Naissante", prompt: "light stubble" },
  { id: "short", label: "Courte", prompt: "short trimmed beard" },
  { id: "full", label: "Pleine", prompt: "thick full beard" },
  { id: "long", label: "Longue", prompt: "long flowing beard" },
  { id: "braided", label: "Tressée", prompt: "intricately braided beard" },
];

export const GENDERS: AppearanceOption[] = [
  { id: "male", label: "Masculin", prompt: "male" },
  { id: "female", label: "Féminin", prompt: "female" },
  { id: "androgynous", label: "Androgyne", prompt: "androgynous" },
];

export function getRace(id: RaceId | undefined): RacePreset | undefined {
  return RACES.find((r) => r.id === id);
}
export function getClass(id: ClassId | undefined): ClassPreset | undefined {
  return CLASSES.find((c) => c.id === id);
}
export function getOption(list: AppearanceOption[], id: string | undefined): AppearanceOption | undefined {
  return list.find((o) => o.id === id);
}
