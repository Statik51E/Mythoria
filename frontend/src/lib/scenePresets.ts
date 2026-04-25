export interface ScenePreset {
  id: string;
  label: string;
  category: "exterior" | "interior" | "dungeon" | "wild";
  prompt: string;
  hint?: string;
}

const STYLE_PREFIX =
  "tabletop RPG battlemap in the style of Forgotten Adventures and Mike Schley, strict orthographic top-down bird's eye view, no perspective, no isometric, square map";

const STYLE_SUFFIX =
  "richly textured surfaces (stone, wood, grass, dirt, water), hand-painted digital fantasy cartography, soft natural lighting with subtle ambient shadows, dnd 5e battlemap, high detail, photorealistic textures with painterly finish, no characters, no tokens, no creatures, no people, no text, no labels, no grid lines, no UI";

export function buildMapPrompt(scenePrompt: string): string {
  return `${STYLE_PREFIX}, ${scenePrompt}, ${STYLE_SUFFIX}`;
}

export function buildMapUrl(scenePrompt: string, seed: number, width = 1536, height = 768): string {
  const enc = encodeURIComponent(buildMapPrompt(scenePrompt));
  const params = new URLSearchParams({
    seed: String(seed),
    width: String(width),
    height: String(height),
    nologo: "true",
    enhance: "true",
    model: "flux",
  });
  return `https://image.pollinations.ai/prompt/${enc}?${params.toString()}`;
}

export const SCENE_PRESETS: ScenePreset[] = [
  // Exteriors / village
  {
    id: "market_square",
    label: "Place du Marché",
    category: "exterior",
    prompt: "medieval village market square, cobblestone, wooden stalls with awnings, fountain in the center, bakery, blacksmith shop, surrounding timber-framed houses",
    hint: "Marchands, foule, rumeurs.",
  },
  {
    id: "central_plaza",
    label: "Place Centrale",
    category: "exterior",
    prompt: "medieval town central plaza with stone statue of a hero in the middle, cobblestone paths, well, surrounding two-story houses, lanterns",
    hint: "Lieu de rassemblement, annonces.",
  },
  {
    id: "forest_path",
    label: "Sentier des Arbres",
    category: "exterior",
    prompt: "winding dirt forest path, tall ancient trees with twisted roots, dappled sunlight, ferns and mushrooms, stone milestone, mossy log bridge",
    hint: "Voyage, embuscade possible.",
  },
  {
    id: "stone_bridge",
    label: "Pont de Pierre",
    category: "exterior",
    prompt: "old stone arch bridge over a rushing river, mossy stones, weathered statues at the entrances, river banks with reeds, distant watchtower",
    hint: "Passage obligé, péage ou trolls.",
  },
  {
    id: "harbor",
    label: "Port",
    category: "exterior",
    prompt: "small medieval fishing harbor, wooden docks, three sailboats moored, fish barrels, harbormaster's hut, lighthouse on a small island",
    hint: "Marins, contrebande, départ en mer.",
  },

  // Interiors
  {
    id: "tavern",
    label: "Taverne",
    category: "interior",
    prompt: "cozy medieval tavern interior top-down view, wooden floorboards, long tables and benches, central stone fireplace, bar counter with barrels, hanging lanterns, kitchen door at back",
    hint: "Repos, rencontres, bagarres.",
  },
  {
    id: "house_interior",
    label: "Maison Intérieure",
    category: "interior",
    prompt: "modest medieval cottage interior top-down floor plan, multiple rooms with wooden walls, bedroom with bed, kitchen with hearth, dining table, herbs hanging from beams",
    hint: "Intimité, fouille, dialogue.",
  },
  {
    id: "library",
    label: "Bibliothèque",
    category: "interior",
    prompt: "grand wizard library interior top-down view, tall bookshelves forming aisles, reading desks with candles, scrolls and tomes scattered, ornate carpet, alchemy table",
    hint: "Recherche, indices.",
  },
  {
    id: "throne_room",
    label: "Salle du Trône",
    category: "interior",
    prompt: "grand royal throne room top-down view, long red carpet, stone throne on a raised dais, columns flanking the sides, banners on walls, polished marble floor",
    hint: "Audience, intrigue de cour.",
  },
  {
    id: "shop",
    label: "Boutique",
    category: "interior",
    prompt: "medieval magic shop interior top-down, wooden shelves filled with potions and curios, central counter with abacus, hanging dried herbs, rugs, small back room with chest",
    hint: "Commerce, négociation.",
  },

  // Dungeons / hidden
  {
    id: "crypt",
    label: "Crypte",
    category: "dungeon",
    prompt: "ancient stone crypt interior top-down, sarcophagi lining the walls, central altar, broken columns, cobwebs, dim torchlight, scattered bones, secret passage in floor",
    hint: "Morts-vivants, pièges.",
  },
  {
    id: "secret_passage",
    label: "Passage Secret",
    category: "dungeon",
    prompt: "narrow stone secret passage with hidden chambers, glowing crystal lanterns, runes on walls, small altar with offering bowl, false wall, ancient mosaic floor",
    hint: "Trésor, énigme.",
  },
  {
    id: "dungeon_corridor",
    label: "Couloir de Donjon",
    category: "dungeon",
    prompt: "dark dungeon stone corridor top-down view, multiple cell doors with iron bars, torches on walls, drainage channel in floor, blood stains, branching passages",
    hint: "Évasion, gardes.",
  },
  {
    id: "wizard_tower",
    label: "Tour du Mage",
    category: "dungeon",
    prompt: "wizard tower top floor interior top-down view, circular room, magical circle on floor, telescope, alchemy table with bubbling potions, books floating, crystal ball",
    hint: "Magie sauvage, rituel.",
  },
  {
    id: "bandit_camp",
    label: "Camp de Bandits",
    category: "wild",
    prompt: "outlaw bandit camp clearing in the woods top-down, three canvas tents, central campfire, log seats, weapon rack, captured cart, lookout perch on a tree",
    hint: "Combat, infiltration.",
  },

  // Wild
  {
    id: "ruined_temple",
    label: "Temple en Ruines",
    category: "wild",
    prompt: "ancient ruined stone temple overgrown with vines, broken columns, partial dome, central altar, vegetation reclaiming the floor, statues missing heads, jungle around",
    hint: "Mystère, gardiens oubliés.",
  },
  {
    id: "snowy_pass",
    label: "Col Enneigé",
    category: "wild",
    prompt: "snow-covered mountain pass top-down, narrow trail between cliffs, evergreen trees with snow, frozen creek, abandoned wooden cart, wolf tracks",
    hint: "Survie, prédateurs.",
  },
  {
    id: "swamp",
    label: "Marais",
    category: "wild",
    prompt: "murky swamp top-down, twisted dead trees, pools of stagnant water, wooden plank walkways, glowing will-o-wisps, ruined hut on stilts, mist",
    hint: "Maladie, créatures rampantes.",
  },
];

export const CATEGORY_LABELS: Record<ScenePreset["category"], string> = {
  exterior: "Extérieurs",
  interior: "Intérieurs",
  dungeon: "Donjons",
  wild: "Nature sauvage",
};
