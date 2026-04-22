import type { Appearance, ClassId, RaceId } from "./types";
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

export function portraitUrl(prompt: string, seed: number, size = 512): string {
  const enc = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    seed: String(seed),
    width: String(size),
    height: String(size),
    nologo: "true",
    enhance: "true",
    model: "flux",
  });
  return `${POLLINATIONS_BASE}/${enc}?${params.toString()}`;
}

export function buildPortraitUrl(input: PortraitInput, seed: number, size = 512): string {
  return portraitUrl(buildPortraitPrompt(input), seed, size);
}

export function newSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

export function buildNpcPortraitUrl(
  npc: { race?: RaceId; classId?: ClassId; appearance?: Partial<Appearance>; name?: string; portraitSeed?: number },
  size = 192
): string | null {
  if (!npc.portraitSeed) return null;
  return buildPortraitUrl(
    {
      race: npc.race,
      classId: npc.classId,
      appearance: npc.appearance,
      name: npc.name,
    },
    npc.portraitSeed,
    size
  );
}
