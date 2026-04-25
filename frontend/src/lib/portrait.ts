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
    "highly detailed, realistic oil painting style, dramatic cinematic lighting from the side, dark moody background, painterly digital art, artstation quality, intricate textures, depth of field",
  ].filter(Boolean) as string[];

  return parts.join(", ");
}

export function portraitUrl(
  prompt: string,
  seed: number,
  size = 512,
  model: "flux" | "turbo" = "turbo"
): string {
  const enc = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    seed: String(seed),
    width: String(size),
    height: String(size),
    nologo: "true",
    nofeed: "true",
    model,
  });
  return `${POLLINATIONS_BASE}/${enc}?${params.toString()}`;
}

export function buildPortraitFallbackUrls(
  prompt: string,
  seed: number,
  size = 512
): string[] {
  return [
    portraitUrl(prompt, seed, size, "turbo"),
    portraitUrl(prompt, seed + 1, size, "flux"),
    portraitUrl(prompt, seed + 2, size, "turbo"),
  ];
}

export function buildPortraitUrl(input: PortraitInput, seed: number, size = 512): string {
  return portraitUrl(buildPortraitPrompt(input), seed, size);
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

export function buildNpcPortraitPrompt(npc: Partial<Npc>): string | null {
  const hasManualAppearance =
    npc.race ||
    npc.classId ||
    (npc.appearance && Object.keys(npc.appearance).length > 0);

  if (!hasManualAppearance) {
    const visualText = npc.appearancePrompt ?? npc.description;
    if (!visualText) return null;
    const roleHint =
      npc.role === "hostile"
        ? "menacing villain, intimidating"
        : npc.role === "ally"
        ? "noble companion, trustworthy"
        : "mysterious figure";
    return [
      "fantasy character portrait, headshot, head and shoulders",
      roleHint,
      asciiOnly(visualText).slice(0, 300),
      "oil painting style, cinematic side lighting, dark moody background, artstation",
    ].join(", ");
  }

  return buildPortraitPrompt({
    race: npc.race,
    classId: npc.classId,
    appearance: npc.appearance,
    name: npc.name,
  });
}

export function buildNpcPortraitUrls(npc: Partial<Npc>, size = 256): string[] {
  if (!npc.portraitSeed) return [];
  const prompt = buildNpcPortraitPrompt(npc);
  if (!prompt) return [];
  return buildPortraitFallbackUrls(prompt, npc.portraitSeed, size);
}

export function buildNpcPortraitUrl(npc: Partial<Npc>, size = 256): string | null {
  const urls = buildNpcPortraitUrls(npc, size);
  return urls[0] ?? null;
}
