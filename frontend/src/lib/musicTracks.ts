import type { CurrentScene, Npc } from "./types";

// Toutes les pistes proviennent du catalogue de Kevin MacLeod / Incompetech,
// sous licence Creative Commons By Attribution 4.0 (CC-BY 4.0). Une mention
// d'attribution est affichée dans le lecteur.
// https://incompetech.com/music/royalty-free/

export type MusicMood =
  | "tavern"
  | "town"
  | "exploration"
  | "dungeon"
  | "combat"
  | "mystery";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  mood: MusicMood;
}

const INCOMPETECH = "https://incompetech.com/music/royalty-free/mp3-royaltyfree";
const KM = "Kevin MacLeod";

function tk(filename: string, title: string, mood: MusicMood): MusicTrack {
  return {
    id: filename.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    title,
    artist: KM,
    url: `${INCOMPETECH}/${encodeURIComponent(filename)}.mp3`,
    mood,
  };
}

export const MUSIC_TRACKS: MusicTrack[] = [
  // Taverne / auberge / intérieurs sociaux
  tk("Dragon and Toast", "Dragon and Toast", "tavern"),
  tk("Marty Gots a Plan", "Marty Gots a Plan", "tavern"),
  tk("Devonshire Waltz Moderato", "Devonshire Waltz", "tavern"),

  // Ville / marché / extérieur peuplé
  tk("Mystery Bazaar", "Mystery Bazaar", "town"),
  tk("Lord of the Land", "Lord of the Land", "town"),
  tk("Ancient Mystery Waltz Allegro", "Ancient Mystery Waltz", "town"),

  // Voyage / exploration / nature
  tk("Skye Cuillin", "Skye Cuillin", "exploration"),
  tk("Achaidh Cheide", "Achaidh Cheide", "exploration"),
  tk("Magic Forest", "Magic Forest", "exploration"),
  tk("Past the Edge", "Past the Edge", "exploration"),
  tk("Shores of Avalon", "Shores of Avalon", "exploration"),

  // Donjon / sombre / horreur
  tk("Anguish", "Anguish", "dungeon"),
  tk("Night Vigil", "Night Vigil", "dungeon"),
  tk("The Path of the Goblin King", "The Path of the Goblin King", "dungeon"),
  tk("Hidden Past", "Hidden Past", "dungeon"),
  tk("Spellbound", "Spellbound", "dungeon"),

  // Combat / bataille / climax
  tk("Crusade", "Crusade", "combat"),
  tk("Strength of the Titans", "Strength of the Titans", "combat"),
  tk("Voltaic", "Voltaic", "combat"),
  tk("Rite of Passage", "Rite of Passage", "combat"),
  tk("Danse Macabre - No Violin", "Danse Macabre", "combat"),

  // Mystère / introduction / suspense
  tk("Black Vortex", "Black Vortex", "mystery"),
  tk("Mesmerize", "Mesmerize", "mystery"),
  tk("Brittle Rille", "Brittle Rille", "mystery"),
];

export const MOOD_LABEL: Record<MusicMood, string> = {
  tavern: "Taverne",
  town: "Ville",
  exploration: "Voyage",
  dungeon: "Donjon",
  combat: "Combat",
  mystery: "Mystère",
};

export function tracksByMood(mood: MusicMood): MusicTrack[] {
  return MUSIC_TRACKS.filter((t) => t.mood === mood);
}

// Choisit l'ambiance en fonction de la scène + présence de PNJ hostiles.
// Les hostiles écrasent tout — un combat doit s'entendre tout de suite.
export function pickMoodForContext(
  scene: CurrentScene | undefined,
  npcs: Record<string, Npc> | undefined
): MusicMood {
  const hasHostile = npcs ? Object.values(npcs).some((n) => n.role === "hostile") : false;
  if (hasHostile) return "combat";
  if (!scene) return "mystery";
  switch (scene.category) {
    case "dungeon":
      return "dungeon";
    case "interior":
      return "tavern";
    case "exterior":
      return "town";
    case "wild":
      return "exploration";
    default:
      return "mystery";
  }
}

export const MUSIC_ATTRIBUTION = {
  text: "Musique : Kevin MacLeod (incompetech.com) — CC-BY 4.0",
  url: "https://incompetech.com/",
};
