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

// Pollinations 2026 free model lineup, ordered by fantasy-art quality based on
// our own testing. gpt-image-2 nails composition + style adherence (lighting,
// gear, race traits) but is slower; klein (FLUX.2) is the best Flux generation
// and very fast; flux (Schnell) is the workhorse fallback. DiceBear sits below
// as the can't-fail SVG safety net.
type PollinationsModel = "gpt-image-2" | "klein" | "flux";
const PORTRAIT_MODELS: PollinationsModel[] = ["gpt-image-2", "klein", "flux"];

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
  model: PollinationsModel = "gpt-image-2"
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

// DiceBear "adventurer" never fails — small SVG/PNG, instant CDN response.
// Used as ultimate fallback so NPCs always have *some* visual.
function diceBearUrl(seed: string | number, size: number): string {
  return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(
    String(seed)
  )}&size=${size}&backgroundColor=2a2219`;
}

export function buildPortraitFallbackUrls(
  prompt: string,
  seed: number,
  size = 512,
  diceSeed?: string | number
): string[] {
  // Same seed across all models so the character "stays the same person" even
  // if we fall through; only the rendering style differs between attempts.
  return [
    ...PORTRAIT_MODELS.map((m) => portraitUrl(prompt, seed, size, m)),
    diceBearUrl(diceSeed ?? seed, Math.min(size, 256)),
  ];
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
  const diceSeed = `${npc.id ?? npc.name ?? "npc"}_${npc.portraitSeed}`;
  if (!prompt) {
    // No usable prompt at all — go straight to the procedural avatar.
    return [diceBearUrl(diceSeed, Math.min(size, 256))];
  }
  return buildPortraitFallbackUrls(prompt, npc.portraitSeed, size, diceSeed);
}

export function buildNpcPortraitUrl(npc: Partial<Npc>, size = 192): string | null {
  const urls = buildNpcPortraitUrls(npc, size);
  return urls[0] ?? null;
}
