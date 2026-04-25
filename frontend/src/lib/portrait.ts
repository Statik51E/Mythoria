import type { Appearance, ClassId, Npc, RaceId } from "./types";
import {
  BEARDS,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  getClass,
  getOption,
  getRace,
} from "./characterPresets";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

// Pollinations free tier rotated again (April 2026): /models now only lists
// `sana`, and gpt-image-2 / klein return 429 instantly from the anon tier.
// `flux` (Schnell) is still the most reliable workhorse for fantasy portraits;
// `sana` is the documented fallback. CharacterPortrait renders a stylized
// initials badge if both fail, which matches the oil-painted aesthetic far
// better than DiceBear's cartoon avatars (which we removed for this reason).
type PollinationsModel = "flux" | "sana";
const PORTRAIT_MODELS: PollinationsModel[] = ["flux", "sana"];

interface PortraitInput {
  race?: RaceId;
  classId?: ClassId;
  appearance?: Partial<Appearance>;
  name?: string;
}

export function buildPortraitPrompt(c: PortraitInput): string {
  const race = getRace(c.race);
  const cls = getClass(c.classId);
  const a = c.appearance ?? {};
  const gender = getOption(GENDERS, a.gender);
  const skin = getOption(SKIN_TONES, a.skin);
  const hairColor = getOption(HAIR_COLORS, a.hairColor);
  const hairStyle = getOption(HAIR_STYLES, a.hairStyle);
  const eyes = getOption(EYE_COLORS, a.eyes);
  const beard = getOption(BEARDS, a.beard);

  const parts = [
    "fantasy character portrait, headshot",
    gender?.prompt,
    race?.prompt,
    cls?.label.toLowerCase(),
    skin ? `${skin.prompt} skin` : undefined,
    hairColor && hairStyle ? `${hairColor.prompt} ${hairStyle.prompt}` : hairStyle?.prompt,
    eyes?.prompt,
    a.gender !== "female" && beard?.id !== "none" ? beard?.prompt : undefined,
    cls?.clothingPrompt,
    a.clothing ? `additional details: ${a.clothing}` : undefined,
    "fantasy book cover illustration in the style of Wayne Reynolds and Magic the Gathering art, highly detailed face, cinematic rim lighting, dark moody atmospheric background, painterly digital oil painting, intricate armor and clothing textures, dramatic three-quarter view portrait, artstation trending, no text, no watermark",
  ].filter(Boolean) as string[];

  return parts.join(", ");
}

// Pollinations bakes width/height into its seeding — the same prompt+seed at a
// different size returns a different image. We pin generation to ONE canonical
// size so the forge preview, the battlemap token, and any other display match
// pixel-for-pixel; CSS scales the rendered <img> wherever it appears.
const PORTRAIT_GEN_SIZE = 512;

export function portraitUrl(
  prompt: string,
  seed: number,
  _displaySize?: number,
  model: PollinationsModel = "flux"
): string {
  void _displaySize;
  const enc = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    seed: String(seed),
    width: String(PORTRAIT_GEN_SIZE),
    height: String(PORTRAIT_GEN_SIZE),
    nologo: "true",
    model,
  });
  return `${POLLINATIONS_BASE}/${enc}?${params.toString()}`;
}

export function buildPortraitFallbackUrls(
  prompt: string,
  seed: number,
  size = 512,
  _diceSeed?: string | number
): string[] {
  void _diceSeed;
  // Same seed across all models so the character "stays the same person" even
  // if we fall through; only the rendering style differs between attempts.
  // No DiceBear at the end on purpose — its cartoon avatars clash hard with
  // the oil-painted aesthetic. CharacterPortrait already renders a stylized
  // initials badge when all sources fail, which matches the look.
  return PORTRAIT_MODELS.map((m) => portraitUrl(prompt, seed, size, m));
}

export function buildPortraitUrl(input: PortraitInput, seed: number, size = 512): string {
  return portraitUrl(buildPortraitPrompt(input), seed, size);
}

export function buildPlayerPortraitUrls(input: PortraitInput, seed: number, size = 512): string[] {
  const prompt = buildPortraitPrompt(input);
  const diceSeed = `${input.name ?? "player"}_${seed}`;
  return buildPortraitFallbackUrls(prompt, seed, size, diceSeed);
}

export function newSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

function asciiOnly(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Same closing brushwork the player-character template uses, so portraits
// generated for NPCs share the realistic oil-painting aesthetic.
const PLAYER_STYLE_SUFFIX =
  "fantasy book cover illustration in the style of Wayne Reynolds and Magic the Gathering art, highly detailed face, cinematic rim lighting, dark moody atmospheric background, painterly digital oil painting, intricate armor and clothing textures, dramatic three-quarter view portrait, artstation trending, no text, no watermark";

// Deterministic archetype (race + class) derived from the NPC seed + role,
// used when the MJ did not supply concrete appearance details. Keeps the
// same look as the player templates instead of a free-form description.
const ROLE_ARCHETYPES: Record<NonNullable<Npc["role"]>, ClassId[]> = {
  hostile: ["warrior", "barbarian", "rogue"],
  ally: ["paladin", "ranger", "cleric"],
  neutral: ["bard", "mage", "warrior"],
};
const ALL_RACES: RaceId[] = ["human", "elf", "dwarf", "halfling", "halforc", "tiefling"];

function pick<T>(arr: T[], seed: number, salt: number): T {
  const i = Math.abs(Math.floor(seed * 9301 + salt * 49297)) % arr.length;
  return arr[i];
}

function deriveArchetype(npc: Partial<Npc>): { race: RaceId; classId: ClassId; gender: "male" | "female" } {
  const seed = npc.portraitSeed ?? 0;
  const role = (npc.role ?? "neutral") as NonNullable<Npc["role"]>;
  const classes = ROLE_ARCHETYPES[role] ?? ROLE_ARCHETYPES.neutral;
  // Bias gender from name: simple heuristic, falls back to seed parity.
  const name = (npc.name ?? "").toLowerCase();
  const femaleHint = /(a|e|ie|ette|elle|ine|ille)$/.test(name);
  const gender: "male" | "female" = femaleHint ? "female" : seed % 2 === 0 ? "male" : "female";
  return {
    race: pick(ALL_RACES, seed, 13),
    classId: pick(classes, seed, 29),
    gender,
  };
}

export function buildNpcPortraitPrompt(npc: Partial<Npc>): string | null {
  // If the MJ supplied an explicit English appearance prompt, use it but keep
  // the player-character suffix so the style matches.
  if (npc.appearancePrompt) {
    return [
      "fantasy character portrait, headshot",
      asciiOnly(npc.appearancePrompt).slice(0, 320),
      PLAYER_STYLE_SUFFIX,
    ].join(", ");
  }

  const hasManualAppearance =
    npc.race ||
    npc.classId ||
    (npc.appearance && Object.keys(npc.appearance).length > 0);

  if (hasManualAppearance) {
    return buildPortraitPrompt({
      race: npc.race,
      classId: npc.classId,
      appearance: npc.appearance,
      name: npc.name,
    });
  }

  // Legacy NPCs (no appearancePrompt, no manual fields): derive a stable
  // archetype from seed + role and reuse the player template verbatim.
  const arch = deriveArchetype(npc);
  return buildPortraitPrompt({
    race: arch.race,
    classId: arch.classId,
    appearance: { gender: arch.gender },
    name: npc.name,
  });
}

export function buildNpcPortraitUrls(npc: Partial<Npc>, size = 192): string[] {
  if (!npc.portraitSeed) return [];
  const prompt = buildNpcPortraitPrompt(npc);
  if (!prompt) return [];
  return buildPortraitFallbackUrls(prompt, npc.portraitSeed, size);
}

export function buildNpcPortraitUrl(npc: Partial<Npc>, size = 192): string | null {
  const urls = buildNpcPortraitUrls(npc, size);
  return urls[0] ?? null;
}
