import type { ReactNode } from "react";

interface Props {
  label: string;
  prompt: string;
  seed: number;
}

type Floor = "wood" | "stone" | "cobble" | "grass" | "dirt" | "snow" | "swamp" | "sand";

type Sub =
  | "tavern" | "library" | "cottage" | "throne" | "shop"
  | "crypt" | "corridor" | "tower" | "cave"
  | "market" | "plaza" | "harbor" | "bridge" | "camp"
  | "forest" | "swamp" | "snow" | "ruin" | "exterior";

interface Palette {
  floor: string;
  floorDark: string;
  floorLight: string;
  wall: string;
  wallShadow: string;
  accent: string;
  glow: string;
  shadow: string;
}

interface SceneSpec {
  floor: Floor;
  palette: Palette;
  walls: boolean;
  sub: Sub;
}

const P = {
  warmWood: { floor: "#5c3c20", floorDark: "#3a2614", floorLight: "#7a522a", wall: "#2a1a0e", wallShadow: "#1a0f06", accent: "#8a5a2e", glow: "#f0b04a", shadow: "#0a0604" },
  oakWood:  { floor: "#4a331e", floorDark: "#2e1f12", floorLight: "#6b4a2c", wall: "#241810", wallShadow: "#140c08", accent: "#7a5430", glow: "#d4a04a", shadow: "#080503" },
  stone:    { floor: "#4a443c", floorDark: "#2a2622", floorLight: "#6a6258", wall: "#1c1814", wallShadow: "#0c0a08", accent: "#5e564c", glow: "#e8a04a", shadow: "#000000" },
  marble:   { floor: "#e6dfd0", floorDark: "#b8b0a0", floorLight: "#f5efe0", wall: "#5a4a32", wallShadow: "#3a2e1c", accent: "#c9a24a", glow: "#f0d080", shadow: "#1a1410" },
  crypt:    { floor: "#332e28", floorDark: "#1a1612", floorLight: "#4a443c", wall: "#100c08", wallShadow: "#000000", accent: "#48413a", glow: "#7aa0c4", shadow: "#000000" },
  cobble:   { floor: "#5a5246", floorDark: "#332d24", floorLight: "#7a7060", wall: "#2a2418", wallShadow: "#140e08", accent: "#6a6050", glow: "#d4a04a", shadow: "#0a0604" },
  forest:   { floor: "#3e4a28", floorDark: "#1f2a14", floorLight: "#5a6a3a", wall: "#1a200a", wallShadow: "#0a1002", accent: "#6b7a44", glow: "#d4c878", shadow: "#080a04" },
  swamp:    { floor: "#3a3e2a", floorDark: "#1a1e10", floorLight: "#4e5238", wall: "#0e1208", wallShadow: "#040602", accent: "#5a6a3a", glow: "#7adfa0", shadow: "#000000" },
  snow:     { floor: "#cfd6dc", floorDark: "#8e9aa5", floorLight: "#f0f4f8", wall: "#2c3640", wallShadow: "#101820", accent: "#a6b5c2", glow: "#bfdaff", shadow: "#0a1018" },
  sand:     { floor: "#a98a5a", floorDark: "#7a5e35", floorLight: "#cdb087", wall: "#5a3e1c", wallShadow: "#2e2010", accent: "#b89868", glow: "#f0c878", shadow: "#1a1006" },
} as const;

function detectSub(label: string, prompt: string): Sub {
  const t = `${label} ${prompt}`.toLowerCase();
  if (/tavern|inn|bar|alehouse|pub/.test(t)) return "tavern";
  if (/library|biblio|tomes|scrolls|wizard library/.test(t)) return "library";
  if (/cottage|house|home|dining|kitchen|bedroom|cabin/.test(t)) return "cottage";
  if (/throne|royal|king|queen|dais|court/.test(t)) return "throne";
  if (/shop|store|merchant|magic shop|alchemy shop|herbalist/.test(t)) return "shop";
  if (/crypt|tomb|sarcophag|catacomb|mausoleum|burial/.test(t)) return "crypt";
  if (/corridor|prison|cell|jail|dungeon corridor|hallway/.test(t)) return "corridor";
  if (/tower|wizard tower|spire/.test(t)) return "tower";
  if (/cave|cavern|grotto/.test(t)) return "cave";
  if (/market|stall|bazaar|fair/.test(t)) return "market";
  if (/plaza|square|courtyard|fountain|statue/.test(t)) return "plaza";
  if (/harbor|harbour|dock|pier|wharf|port/.test(t)) return "harbor";
  if (/bridge|river crossing|aqueduct/.test(t)) return "bridge";
  if (/camp|tent|bandit|outlaw|encampment/.test(t)) return "camp";
  if (/forest|wood|grove|trees|jungle|glade/.test(t)) return "forest";
  if (/swamp|marsh|bog|fen|wetland/.test(t)) return "swamp";
  if (/snow|ice|frozen|glacier|tundra|winter/.test(t)) return "snow";
  if (/ruin|temple|shrine|altar|broken|abandoned/.test(t)) return "ruin";
  if (/desert|sand|dune/.test(t)) return "ruin";
  return "exterior";
}

function specFor(sub: Sub): SceneSpec {
  switch (sub) {
    case "tavern":   return { sub, floor: "wood",   palette: P.warmWood, walls: true };
    case "library":  return { sub, floor: "wood",   palette: P.oakWood,  walls: true };
    case "cottage":  return { sub, floor: "wood",   palette: P.warmWood, walls: true };
    case "throne":   return { sub, floor: "stone",  palette: P.marble,   walls: true };
    case "shop":     return { sub, floor: "wood",   palette: P.warmWood, walls: true };
    case "crypt":    return { sub, floor: "stone",  palette: P.crypt,    walls: true };
    case "corridor": return { sub, floor: "stone",  palette: P.stone,    walls: true };
    case "tower":    return { sub, floor: "stone",  palette: P.stone,    walls: true };
    case "cave":     return { sub, floor: "stone",  palette: P.crypt,    walls: false };
    case "market":   return { sub, floor: "cobble", palette: P.cobble,   walls: false };
    case "plaza":    return { sub, floor: "cobble", palette: P.cobble,   walls: false };
    case "harbor":   return { sub, floor: "cobble", palette: P.cobble,   walls: false };
    case "bridge":   return { sub, floor: "stone",  palette: P.cobble,   walls: false };
    case "camp":     return { sub, floor: "dirt",   palette: P.forest,   walls: false };
    case "forest":   return { sub, floor: "grass",  palette: P.forest,   walls: false };
    case "swamp":    return { sub, floor: "swamp",  palette: P.swamp,    walls: false };
    case "snow":     return { sub, floor: "snow",   palette: P.snow,     walls: false };
    case "ruin":     return { sub, floor: "stone",  palette: P.cobble,   walls: false };
    case "exterior": return { sub, floor: "dirt",   palette: P.cobble,   walls: false };
  }
}

function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const W = 1000;
const H = 600;

function FloorPattern({ id, floor, p }: { id: string; floor: Floor; p: Palette }) {
  switch (floor) {
    case "wood":
      // Long planks with subtle knots and shadow gaps between
      return (
        <pattern id={id} width="180" height="60" patternUnits="userSpaceOnUse">
          <rect width="180" height="60" fill={p.floor} />
          <rect width="180" height="60" fill={p.floorLight} opacity="0.18" />
          {/* horizontal plank seams */}
          <rect width="180" height="2" y="0" fill={p.shadow} opacity="0.65" />
          <rect width="180" height="2" y="30" fill={p.shadow} opacity="0.50" />
          {/* random vertical end-cuts */}
          <rect width="2" height="30" x="40" y="0" fill={p.shadow} opacity="0.45" />
          <rect width="2" height="30" x="120" y="0" fill={p.shadow} opacity="0.45" />
          <rect width="2" height="30" x="80" y="30" fill={p.shadow} opacity="0.45" />
          <rect width="2" height="30" x="150" y="30" fill={p.shadow} opacity="0.45" />
          {/* knots */}
          <ellipse cx="22" cy="14" rx="4" ry="2" fill={p.floorDark} opacity="0.55" />
          <ellipse cx="100" cy="44" rx="3" ry="1.5" fill={p.floorDark} opacity="0.55" />
          <ellipse cx="160" cy="18" rx="3.5" ry="1.6" fill={p.floorDark} opacity="0.55" />
          {/* grain streaks */}
          <path d="M0 8 L180 9" stroke={p.floorDark} strokeWidth="0.6" opacity="0.35" />
          <path d="M0 22 L180 21" stroke={p.floorDark} strokeWidth="0.4" opacity="0.30" />
          <path d="M0 38 L180 39" stroke={p.floorDark} strokeWidth="0.5" opacity="0.32" />
          <path d="M0 52 L180 51" stroke={p.floorDark} strokeWidth="0.4" opacity="0.28" />
        </pattern>
      );
    case "stone":
      return (
        <pattern id={id} width="120" height="80" patternUnits="userSpaceOnUse">
          <rect width="120" height="80" fill={p.floor} />
          {/* irregular ashlar blocks */}
          <path d="M0 0 L60 0 L60 26 L120 26 L120 54 L72 54 L72 80 L0 80 Z M60 26 L120 26 M0 54 L72 54 M30 0 L30 26 M90 26 L90 54 M36 54 L36 80"
                stroke={p.shadow} strokeWidth="1.5" fill="none" opacity="0.55" />
          {/* darker block fills */}
          <rect x="60" y="0" width="60" height="26" fill={p.floorDark} opacity="0.30" />
          <rect x="0" y="54" width="36" height="26" fill={p.floorLight} opacity="0.18" />
          <rect x="36" y="54" width="36" height="26" fill={p.floorDark} opacity="0.22" />
          {/* speckle noise */}
          <circle cx="18" cy="14" r="1.2" fill={p.floorDark} opacity="0.5" />
          <circle cx="48" cy="40" r="0.9" fill={p.floorDark} opacity="0.45" />
          <circle cx="84" cy="14" r="1" fill={p.floorLight} opacity="0.55" />
          <circle cx="100" cy="64" r="1" fill={p.floorDark} opacity="0.55" />
        </pattern>
      );
    case "cobble":
      return (
        <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill={p.floorDark} />
          {/* round-ish cobbles via overlapping circles */}
          {[
            [12, 14, 11], [34, 12, 10], [56, 16, 12], [72, 30, 9],
            [14, 36, 12], [38, 38, 11], [58, 42, 10], [72, 54, 11],
            [12, 60, 10], [34, 60, 12], [54, 66, 11], [72, 76, 9],
          ].map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={p.floor} />
              <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.55} fill={p.floorLight} opacity="0.35" />
            </g>
          ))}
        </pattern>
      );
    case "grass":
      return (
        <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill={p.floor} />
          {/* darker grass clumps */}
          <ellipse cx="20" cy="22" rx="9" ry="6" fill={p.floorDark} opacity="0.35" />
          <ellipse cx="58" cy="18" rx="7" ry="5" fill={p.floorDark} opacity="0.30" />
          <ellipse cx="14" cy="58" rx="8" ry="5" fill={p.floorDark} opacity="0.32" />
          <ellipse cx="60" cy="56" rx="10" ry="6" fill={p.floorDark} opacity="0.40" />
          <ellipse cx="40" cy="40" rx="6" ry="4" fill={p.floorLight} opacity="0.30" />
          {/* tiny grass blades */}
          {Array.from({ length: 18 }).map((_, i) => {
            const x = (i * 17) % 80;
            const y = (i * 23) % 80;
            return <line key={i} x1={x} y1={y} x2={x + 1} y2={y - 3} stroke={p.floorLight} strokeWidth="0.7" opacity="0.55" />;
          })}
        </pattern>
      );
    case "dirt":
      return (
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill={p.floor} />
          <ellipse cx="14" cy="20" rx="5" ry="3" fill={p.floorLight} opacity="0.30" />
          <ellipse cx="44" cy="36" rx="6" ry="3" fill={p.floorDark} opacity="0.40" />
          <ellipse cx="22" cy="50" rx="4" ry="2" fill={p.floorDark} opacity="0.35" />
          {Array.from({ length: 14 }).map((_, i) => {
            const x = (i * 13) % 64;
            const y = (i * 19) % 64;
            return <circle key={i} cx={x} cy={y} r={0.8} fill={p.floorDark} opacity="0.55" />;
          })}
        </pattern>
      );
    case "snow":
      return (
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill={p.floor} />
          <ellipse cx="20" cy="22" rx="14" ry="6" fill={p.floorLight} opacity="0.55" />
          <ellipse cx="48" cy="46" rx="12" ry="5" fill={p.floorLight} opacity="0.45" />
          <ellipse cx="14" cy="50" rx="10" ry="4" fill={p.floorDark} opacity="0.18" />
          {Array.from({ length: 16 }).map((_, i) => {
            const x = (i * 11) % 64;
            const y = (i * 17) % 64;
            return <circle key={i} cx={x} cy={y} r={0.7} fill={p.floorLight} opacity="0.65" />;
          })}
        </pattern>
      );
    case "swamp":
      return (
        <pattern id={id} width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill={p.floor} />
          <ellipse cx="30" cy="28" rx="22" ry="14" fill={p.floorDark} opacity="0.55" />
          <ellipse cx="74" cy="60" rx="26" ry="16" fill={p.floorDark} opacity="0.50" />
          <ellipse cx="20" cy="78" rx="14" ry="9" fill={p.glow} opacity="0.10" />
          <ellipse cx="64" cy="22" rx="6" ry="3" fill={p.floorLight} opacity="0.30" />
        </pattern>
      );
    case "sand":
      return (
        <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill={p.floor} />
          <ellipse cx="20" cy="24" rx="20" ry="3" fill={p.floorLight} opacity="0.45" />
          <ellipse cx="58" cy="50" rx="22" ry="3" fill={p.floorLight} opacity="0.40" />
          <ellipse cx="30" cy="68" rx="18" ry="3" fill={p.floorDark} opacity="0.35" />
        </pattern>
      );
  }
}

function Walls({ p }: { p: Palette }) {
  // Stone-like outer wall with hatching
  return (
    <g>
      <rect x="32" y="32" width={W - 64} height={H - 64} fill="none" stroke={p.wallShadow} strokeWidth="22" />
      <rect x="32" y="32" width={W - 64} height={H - 64} fill="none" stroke={p.wall} strokeWidth="14" />
      {/* inner highlight edge */}
      <rect x="44" y="44" width={W - 88} height={H - 88} fill="none" stroke={p.accent} strokeWidth="1" opacity="0.45" />
    </g>
  );
}

function Table({ x, y, w, h, p, round = false }: { x: number; y: number; w: number; h: number; p: Palette; round?: boolean }) {
  const shadow = (
    <ellipse cx={x} cy={y + h * 0.55} rx={w * 0.55} ry={h * 0.4} fill="#000" opacity="0.45" />
  );
  if (round) {
    const r = Math.min(w, h) / 2;
    return (
      <g>
        {shadow}
        <circle cx={x} cy={y} r={r} fill={p.accent} />
        <circle cx={x} cy={y} r={r} fill="none" stroke={p.shadow} strokeWidth="2" opacity="0.7" />
        <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.5} fill={p.glow} opacity="0.15" />
      </g>
    );
  }
  return (
    <g>
      {shadow}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={p.accent} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="none" stroke={p.shadow} strokeWidth="2" opacity="0.7" />
      {/* plank lines on tabletop */}
      <line x1={x - w / 2} y1={y - h / 6} x2={x + w / 2} y2={y - h / 6} stroke={p.shadow} strokeWidth="0.8" opacity="0.45" />
      <line x1={x - w / 2} y1={y + h / 6} x2={x + w / 2} y2={y + h / 6} stroke={p.shadow} strokeWidth="0.8" opacity="0.45" />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h * 0.25} fill={p.glow} opacity="0.10" />
    </g>
  );
}

function Chair({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <circle cx={x} cy={y + 2} r={9} fill="#000" opacity="0.4" />
      <rect x={x - 7} y={y - 7} width={14} height={14} rx={2} fill={p.accent} stroke={p.shadow} strokeWidth="1" />
    </g>
  );
}

function Bed({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <rect x={x - 28} y={y - 18} width={56} height={36} fill={p.shadow} opacity="0.5" filter="url(#blur)" />
      <rect x={x - 26} y={y - 16} width={52} height={32} rx={2} fill="#7a3a2a" stroke={p.shadow} strokeWidth="1.5" />
      <rect x={x - 24} y={y - 14} width={48} height={12} rx={1} fill="#e8d8b8" stroke={p.shadow} strokeWidth="0.8" />
      <rect x={x - 24} y={y - 14} width={20} height={10} rx={1} fill="#fff" opacity="0.6" />
    </g>
  );
}

function Fireplace({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <rect x={x - 30} y={y - 22} width={60} height={44} fill={p.wall} stroke={p.shadow} strokeWidth="2" />
      <rect x={x - 22} y={y - 14} width={44} height={28} fill="#1a0a04" />
      {/* flames */}
      <ellipse cx={x} cy={y + 4} rx={16} ry={9} fill={p.glow} opacity="0.95" filter="url(#glow)" />
      <ellipse cx={x} cy={y + 6} rx={10} ry={5} fill="#ffe080" opacity="0.95" />
      <ellipse cx={x - 6} cy={y + 8} rx={4} ry={2} fill="#fff" opacity="0.85" />
      <ellipse cx={x + 6} cy={y + 8} rx={3} ry={1.5} fill="#fff" opacity="0.7" />
    </g>
  );
}

function Bookshelf({ x, y, w, h, p }: { x: number; y: number; w: number; h: number; p: Palette }) {
  const cols = Math.max(3, Math.floor(w / 14));
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={p.wall} stroke={p.shadow} strokeWidth="1.5" />
      <rect x={x - w / 2 + 2} y={y - h / 2 + 2} width={w - 4} height={h - 4} fill={p.floorDark} />
      {Array.from({ length: cols }).map((_, i) => {
        const bx = x - w / 2 + 4 + i * ((w - 8) / cols);
        const colors = ["#4a2218", "#22343a", "#3a2814", "#2a3818", "#5a3818", "#3a2238"];
        const color = colors[(i * 7) % colors.length];
        const bh = h * (0.55 + ((i * 13) % 30) / 100);
        return <rect key={i} x={bx} y={y - h / 2 + (h - bh) - 2} width={(w - 8) / cols - 1} height={bh} fill={color} stroke="#000" strokeWidth="0.4" />;
      })}
      {/* shelf separators */}
      <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={p.shadow} strokeWidth="1.5" />
    </g>
  );
}

function Bar({ x, y, w, p }: { x: number; y: number; w: number; p: Palette }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 14} width={w} height={28} fill="#000" opacity="0.4" />
      <rect x={x - w / 2} y={y - 14} width={w} height={28} fill={p.accent} stroke={p.shadow} strokeWidth="2" />
      <rect x={x - w / 2 + 2} y={y - 12} width={w - 4} height={6} fill={p.glow} opacity="0.20" />
      {/* barrels behind */}
      <circle cx={x - w / 2 + 12} cy={y - 24} r={9} fill="#5a3018" stroke={p.shadow} strokeWidth="1" />
      <circle cx={x + w / 2 - 12} cy={y - 24} r={9} fill="#5a3018" stroke={p.shadow} strokeWidth="1" />
    </g>
  );
}

function Sarcophagus({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <rect x={x - 26} y={y - 14} width={52} height={28} fill="#000" opacity="0.45" />
      <rect x={x - 24} y={y - 12} width={48} height={24} rx={3} fill={p.accent} stroke={p.shadow} strokeWidth="2" />
      <ellipse cx={x} cy={y - 4} rx={18} ry={6} fill={p.floorLight} opacity="0.25" />
      {/* cross/symbol */}
      <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={p.shadow} strokeWidth="2.5" opacity="0.7" />
      <line x1={x - 5} y1={y - 1} x2={x + 5} y2={y - 1} stroke={p.shadow} strokeWidth="2.5" opacity="0.7" />
    </g>
  );
}

function Column({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <circle cx={x + 2} cy={y + 3} r={16} fill="#000" opacity="0.45" />
      <circle cx={x} cy={y} r={15} fill={p.accent} stroke={p.shadow} strokeWidth="1.5" />
      <circle cx={x - 4} cy={y - 4} r={9} fill={p.floorLight} opacity="0.45" />
    </g>
  );
}

function Tree({ x, y, scale, p }: { x: number; y: number; scale: number; p: Palette }) {
  const r = 28 * scale;
  return (
    <g>
      <ellipse cx={x + r * 0.2} cy={y + r * 0.4} rx={r * 1.05} ry={r * 0.7} fill="#000" opacity="0.55" />
      <circle cx={x} cy={y} r={r} fill={p.floorDark} />
      <circle cx={x - r * 0.2} cy={y - r * 0.2} r={r * 0.85} fill={p.accent} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.55} fill={p.floorLight} />
      <circle cx={x - r * 0.45} cy={y - r * 0.45} r={r * 0.25} fill={p.glow} opacity="0.55" />
    </g>
  );
}

function Bush({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <ellipse cx={x + 2} cy={y + 4} rx={16} ry={8} fill="#000" opacity="0.4" />
      <circle cx={x - 6} cy={y - 2} r={9} fill={p.floorDark} />
      <circle cx={x + 4} cy={y - 1} r={10} fill={p.accent} />
      <circle cx={x} cy={y - 6} r={7} fill={p.floorLight} />
    </g>
  );
}

function Rock({ x, y, scale, p }: { x: number; y: number; scale: number; p: Palette }) {
  const s = 14 * scale;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={s * 0.15} cy={s * 0.35} rx={s} ry={s * 0.5} fill="#000" opacity="0.45" />
      <path d={`M${-s} 0 L${-s * 0.5} ${-s * 0.7} L${s * 0.4} ${-s * 0.55} L${s} ${-s * 0.1} L${s * 0.6} ${s * 0.4} L${-s * 0.4} ${s * 0.45} Z`}
            fill={p.accent} stroke={p.shadow} strokeWidth="1.5" />
      <path d={`M${-s * 0.6} ${-s * 0.4} L${s * 0.1} ${-s * 0.5} L${s * 0.4} ${-s * 0.1} L${-s * 0.2} ${s * 0.05} Z`}
            fill={p.floorLight} opacity="0.55" />
    </g>
  );
}

function Pool({ x, y, rx, ry, p }: { x: number; y: number; rx: number; ry: number; p: Palette }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx + 4} ry={ry + 4} fill={p.shadow} opacity="0.7" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1a4858" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#3aa0c0" opacity="0.55" />
      <ellipse cx={x - rx * 0.3} cy={y - ry * 0.3} rx={rx * 0.55} ry={ry * 0.4} fill="#a8e0f0" opacity="0.4" />
    </g>
  );
}

function Fountain({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <circle cx={x} cy={y + 3} r={42} fill="#000" opacity="0.5" />
      <circle cx={x} cy={y} r={40} fill={p.accent} stroke={p.shadow} strokeWidth="3" />
      <circle cx={x} cy={y} r={32} fill="#1a4858" />
      <circle cx={x} cy={y} r={32} fill="#3aa0c0" opacity="0.55" />
      <circle cx={x} cy={y} r={10} fill={p.accent} stroke={p.shadow} strokeWidth="2" />
      <circle cx={x - 3} cy={y - 3} r={5} fill={p.floorLight} opacity="0.6" />
      <circle cx={x - 14} cy={y - 10} r={6} fill="#fff" opacity="0.35" />
      <circle cx={x + 12} cy={y - 6} r={4} fill="#fff" opacity="0.30" />
    </g>
  );
}

function MarketStall({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 32} y={y - 18} width={64} height={36} fill="#000" opacity="0.4" />
      {/* awning */}
      <path d={`M${x - 36} ${y - 22} Q${x} ${y - 32} ${x + 36} ${y - 22} L${x + 36} ${y - 16} L${x - 36} ${y - 16} Z`}
            fill="#a44030" stroke="#3a1408" strokeWidth="1.5" />
      {/* stripes */}
      <path d={`M${x - 24} ${y - 24} Q${x - 24} ${y - 26} ${x - 22} ${y - 17}`} stroke="#e8d8b8" strokeWidth="2" fill="none" />
      <path d={`M${x - 8} ${y - 28} Q${x - 8} ${y - 30} ${x - 6} ${y - 17}`} stroke="#e8d8b8" strokeWidth="2" fill="none" />
      <path d={`M${x + 8} ${y - 28} Q${x + 8} ${y - 30} ${x + 6} ${y - 17}`} stroke="#e8d8b8" strokeWidth="2" fill="none" />
      <path d={`M${x + 24} ${y - 24} Q${x + 24} ${y - 26} ${x + 22} ${y - 17}`} stroke="#e8d8b8" strokeWidth="2" fill="none" />
      {/* counter */}
      <rect x={x - 30} y={y - 8} width={60} height={20} fill="#5a3018" stroke="#1a0804" strokeWidth="1.5" />
      {/* goods */}
      <circle cx={x - 18} cy={y - 2} r={4} fill="#c84028" />
      <circle cx={x - 8} cy={y - 2} r={4} fill="#c08030" />
      <circle cx={x + 4} cy={y - 2} r={4} fill="#a04020" />
      <circle cx={x + 16} cy={y - 2} r={4} fill="#8030c0" />
    </g>
  );
}

function Tent({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 4} cy={y + 22} rx={32} ry={6} fill="#000" opacity="0.5" />
      <path d={`M${x - 30} ${y + 18} L${x} ${y - 22} L${x + 30} ${y + 18} Z`} fill="#6b5a3a" stroke="#2a1d10" strokeWidth="2" />
      <path d={`M${x - 30} ${y + 18} L${x} ${y - 22} L${x} ${y + 18} Z`} fill="#5a4a2c" stroke="#2a1d10" strokeWidth="1.5" />
      <path d={`M${x} ${y - 22} L${x} ${y + 18}`} stroke="#1a0e04" strokeWidth="1.5" />
      <path d={`M${x - 6} ${y + 6} L${x + 6} ${y + 6} L${x + 6} ${y + 18} L${x - 6} ${y + 18} Z`} fill="#0a0604" />
    </g>
  );
}

function Campfire({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y + 3} r={22} fill="#000" opacity="0.5" />
      <circle cx={x} cy={y} r={18} fill="#3a1808" />
      {/* logs */}
      <rect x={x - 16} y={y - 3} width={32} height={6} rx={2} fill="#5a3018" transform={`rotate(20 ${x} ${y})`} />
      <rect x={x - 16} y={y - 3} width={32} height={6} rx={2} fill="#5a3018" transform={`rotate(-20 ${x} ${y})`} />
      {/* flames */}
      <ellipse cx={x} cy={y - 4} rx={11} ry={14} fill="#e8702a" opacity="0.95" filter="url(#glow)" />
      <ellipse cx={x} cy={y - 8} rx={6} ry={10} fill="#ffd060" opacity="0.95" />
      <ellipse cx={x} cy={y - 12} rx={3} ry={5} fill="#fff" opacity="0.85" />
    </g>
  );
}

function Barrel({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x + 1} cy={y + 2} r={11} fill="#000" opacity="0.45" />
      <circle cx={x} cy={y} r={10} fill="#5a3018" stroke="#1a0804" strokeWidth="1.5" />
      <circle cx={x} cy={y} r={10} fill="none" stroke="#3a1d08" strokeWidth="1.5" opacity="0.6" />
      <circle cx={x - 3} cy={y - 3} r={5} fill="#7a4a2a" opacity="0.55" />
    </g>
  );
}

function Statue({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <ellipse cx={x + 2} cy={y + 8} rx={20} ry={5} fill="#000" opacity="0.5" />
      <rect x={x - 18} y={y - 4} width={36} height={12} fill={p.accent} stroke={p.shadow} strokeWidth="1.5" />
      <circle cx={x} cy={y - 14} r={10} fill={p.floorLight} stroke={p.shadow} strokeWidth="1.5" />
      <rect x={x - 6} y={y - 6} width={12} height={4} fill={p.floorDark} />
    </g>
  );
}

function Reed({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x - 2} y1={y + 8} x2={x - 4} y2={y - 6} stroke="#3a4a18" strokeWidth="1.2" />
      <line x1={x} y1={y + 8} x2={x} y2={y - 10} stroke="#3a4a18" strokeWidth="1.4" />
      <line x1={x + 3} y1={y + 8} x2={x + 5} y2={y - 5} stroke="#3a4a18" strokeWidth="1.1" />
      <ellipse cx={x - 4} cy={y - 7} rx={1} ry={2} fill="#5a4a18" />
      <ellipse cx={x} cy={y - 11} rx={1.2} ry={2.4} fill="#5a4a18" />
      <ellipse cx={x + 5} cy={y - 6} rx={1} ry={2} fill="#5a4a18" />
    </g>
  );
}

function Mushroom({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={5} ry={2} fill="#000" opacity="0.4" />
      <rect x={x - 1.5} y={y - 4} width={3} height={6} fill="#e8d8b8" />
      <ellipse cx={x} cy={y - 5} rx={6} ry={3} fill="#a83020" />
      <circle cx={x - 2} cy={y - 6} r={1} fill="#fff" opacity="0.85" />
      <circle cx={x + 2} cy={y - 5} r={0.8} fill="#fff" opacity="0.85" />
    </g>
  );
}

function Crate({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 12} y={y - 10} width={24} height={20} fill="#000" opacity="0.4" />
      <rect x={x - 11} y={y - 9} width={22} height={18} fill="#7a5430" stroke="#2a1808" strokeWidth="1.5" />
      <line x1={x - 11} y1={y - 9} x2={x + 11} y2={y + 9} stroke="#2a1808" strokeWidth="1.2" />
      <line x1={x + 11} y1={y - 9} x2={x - 11} y2={y + 9} stroke="#2a1808" strokeWidth="1.2" />
    </g>
  );
}

function TorchSconce({ x, y, p }: { x: number; y: number; p: Palette }) {
  return (
    <g>
      <circle cx={x} cy={y} r={26} fill={p.glow} opacity="0.18" filter="url(#glow)" />
      <circle cx={x} cy={y} r={14} fill={p.glow} opacity="0.35" filter="url(#glow)" />
      <circle cx={x} cy={y} r={5} fill="#ffd060" />
      <circle cx={x} cy={y} r={2} fill="#fff" />
    </g>
  );
}

interface Layout {
  features: ReactNode;
  walls?: ReactNode;
}

function buildLayout(spec: SceneSpec, seed: number): Layout {
  const r = rng(seed);
  const p = spec.palette;
  const items: ReactNode[] = [];

  const cx = W / 2;
  const cy = H / 2;

  switch (spec.sub) {
    case "tavern": {
      // fireplace top
      items.push(<Fireplace key="fp" x={cx} y={90} p={p} />);
      // bar along right
      items.push(<Bar key="bar" x={W - 130} y={cy} w={140} p={p} />);
      // tables scattered with chairs
      const positions: Array<[number, number, boolean]> = [
        [240, 200, false], [420, 220, true], [240, 380, true], [420, 410, false], [600, 320, false],
      ];
      positions.forEach(([x, y, round], i) => {
        items.push(<Table key={`t${i}`} x={x} y={y} w={70} h={50} p={p} round={round} />);
        items.push(<Chair key={`c${i}a`} x={x - 50} y={y} p={p} />);
        items.push(<Chair key={`c${i}b`} x={x + 50} y={y} p={p} />);
        items.push(<Chair key={`c${i}c`} x={x} y={y - 38} p={p} />);
        items.push(<Chair key={`c${i}d`} x={x} y={y + 38} p={p} />);
      });
      // torch sconces
      items.push(<TorchSconce key="ts1" x={120} y={140} p={p} />);
      items.push(<TorchSconce key="ts2" x={120} y={H - 140} p={p} />);
      items.push(<TorchSconce key="ts3" x={W - 130} y={H - 140} p={p} />);
      break;
    }
    case "library": {
      // bookshelves along top and bottom walls
      for (let i = 0; i < 5; i++) {
        items.push(<Bookshelf key={`bsT${i}`} x={120 + i * 180} y={90} w={140} h={36} p={p} />);
        items.push(<Bookshelf key={`bsB${i}`} x={120 + i * 180} y={H - 90} w={140} h={36} p={p} />);
      }
      // central reading tables
      items.push(<Table key="tA" x={cx - 180} y={cy} w={120} h={70} p={p} />);
      items.push(<Table key="tB" x={cx + 180} y={cy} w={120} h={70} p={p} />);
      items.push(<Chair key="cA1" x={cx - 220} y={cy - 50} p={p} />);
      items.push(<Chair key="cA2" x={cx - 140} y={cy - 50} p={p} />);
      items.push(<Chair key="cA3" x={cx - 220} y={cy + 50} p={p} />);
      items.push(<Chair key="cA4" x={cx - 140} y={cy + 50} p={p} />);
      items.push(<Chair key="cB1" x={cx + 220} y={cy - 50} p={p} />);
      items.push(<Chair key="cB2" x={cx + 140} y={cy - 50} p={p} />);
      // central globe / fountain stand-in
      items.push(<Fountain key="orb" x={cx} y={cy} p={p} />);
      // sconces
      items.push(<TorchSconce key="ts1" x={120} y={cy} p={p} />);
      items.push(<TorchSconce key="ts2" x={W - 120} y={cy} p={p} />);
      break;
    }
    case "cottage": {
      items.push(<Fireplace key="fp" x={120} y={120} p={p} />);
      items.push(<Bed key="bed" x={W - 130} y={140} p={p} />);
      items.push(<Table key="t" x={cx} y={cy + 30} w={120} h={70} p={p} />);
      items.push(<Chair key="c1" x={cx - 80} y={cy + 30} p={p} />);
      items.push(<Chair key="c2" x={cx + 80} y={cy + 30} p={p} />);
      items.push(<Chair key="c3" x={cx} y={cy - 20} p={p} />);
      items.push(<Chair key="c4" x={cx} y={cy + 80} p={p} />);
      items.push(<Barrel key="b1" x={W - 110} y={H - 110} />);
      items.push(<Barrel key="b2" x={W - 80} y={H - 130} />);
      items.push(<Crate key="cr1" x={120} y={H - 120} />);
      break;
    }
    case "throne": {
      // dais at top
      items.push(
        <g key="dais">
          <rect x={cx - 160} y={70} width={320} height={130} fill="#000" opacity="0.45" />
          <rect x={cx - 160} y={70} width={320} height={130} fill={p.accent} stroke={p.shadow} strokeWidth="2" />
          <rect x={cx - 140} y={84} width={280} height={102} fill="none" stroke={p.glow} strokeWidth="1" opacity="0.55" />
        </g>
      );
      // throne
      items.push(
        <g key="throne">
          <rect x={cx - 36} y={94} width={72} height={92} fill={p.wall} stroke={p.shadow} strokeWidth="2" />
          <rect x={cx - 28} y={104} width={56} height={70} fill="#7a1a18" />
          <rect x={cx - 40} y={84} width={80} height={14} fill={p.glow} opacity="0.7" />
        </g>
      );
      // red carpet
      items.push(<rect key="carpet" x={cx - 60} y={200} width={120} height={H - 240} fill="#7a1a18" stroke="#3a0a08" strokeWidth="2" />);
      items.push(<rect key="carpet2" x={cx - 56} y={200} width={112} height={H - 240} fill="#9a3028" opacity="0.6" />);
      // columns
      [180, 380, 580, W - 180].forEach((x, i) => {
        items.push(<Column key={`col${i}`} x={x} y={300} p={p} />);
        items.push(<Column key={`col2${i}`} x={x} y={H - 120} p={p} />);
      });
      break;
    }
    case "shop": {
      items.push(<Bar key="counter" x={cx} y={cy + 80} w={240} p={p} />);
      // shelves on walls
      items.push(<Bookshelf key="s1" x={120} y={100} w={160} h={36} p={p} />);
      items.push(<Bookshelf key="s2" x={W - 120} y={100} w={160} h={36} p={p} />);
      items.push(<Bookshelf key="s3" x={120} y={cy} w={36} h={160} p={p} />);
      items.push(<Bookshelf key="s4" x={W - 120} y={cy} w={36} h={160} p={p} />);
      // hanging potions / barrels
      items.push(<Barrel key="b1" x={cx - 120} y={cy + 130} />);
      items.push(<Barrel key="b2" x={cx + 120} y={cy + 130} />);
      items.push(<Crate key="cr1" x={cx - 80} y={cy - 30} />);
      items.push(<Crate key="cr2" x={cx + 80} y={cy - 30} />);
      items.push(<TorchSconce key="ts1" x={120} y={H - 100} p={p} />);
      items.push(<TorchSconce key="ts2" x={W - 120} y={H - 100} p={p} />);
      break;
    }
    case "crypt": {
      // sarcophagi in two rows
      for (let i = 0; i < 4; i++) {
        items.push(<Sarcophagus key={`sL${i}`} x={140 + i * 170} y={150} p={p} />);
        items.push(<Sarcophagus key={`sR${i}`} x={140 + i * 170} y={H - 150} p={p} />);
      }
      // central altar
      items.push(
        <g key="altar">
          <rect x={cx - 50} y={cy - 26} width={100} height={52} fill="#000" opacity="0.5" />
          <rect x={cx - 48} y={cy - 24} width={96} height={48} fill={p.accent} stroke={p.shadow} strokeWidth="2" />
          <rect x={cx - 38} y={cy - 18} width={76} height={36} fill={p.floorDark} />
          <circle cx={cx} cy={cy} r={10} fill={p.glow} opacity="0.5" filter="url(#glow)" />
        </g>
      );
      // columns at corners
      [180, W - 180].forEach((x, i) => {
        items.push(<Column key={`c1${i}`} x={x} y={cy} p={p} />);
      });
      // torch sconces
      items.push(<TorchSconce key="ts1" x={100} y={100} p={p} />);
      items.push(<TorchSconce key="ts2" x={W - 100} y={100} p={p} />);
      items.push(<TorchSconce key="ts3" x={100} y={H - 100} p={p} />);
      items.push(<TorchSconce key="ts4" x={W - 100} y={H - 100} p={p} />);
      break;
    }
    case "corridor": {
      // central long corridor framed by cells (small rooms)
      for (let i = 0; i < 4; i++) {
        const x = 130 + i * 200;
        items.push(
          <g key={`cell${i}`}>
            <rect x={x - 50} y={90} width={100} height={70} fill={p.wall} stroke={p.shadow} strokeWidth="3" />
            <rect x={x - 44} y={96} width={88} height={58} fill={p.floorDark} />
            {/* bars */}
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={k} x1={x - 44 + k * 22} y1={154} x2={x - 44 + k * 22} y2={170} stroke={p.shadow} strokeWidth="2" />
            ))}
            {/* mirror cell at bottom */}
            <rect x={x - 50} y={H - 160} width={100} height={70} fill={p.wall} stroke={p.shadow} strokeWidth="3" />
            <rect x={x - 44} y={H - 154} width={88} height={58} fill={p.floorDark} />
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={k} x1={x - 44 + k * 22} y1={H - 170} x2={x - 44 + k * 22} y2={H - 154} stroke={p.shadow} strokeWidth="2" />
            ))}
          </g>
        );
      }
      // drainage line in corridor
      items.push(<rect key="drain" x={60} y={cy - 4} width={W - 120} height={8} fill={p.shadow} opacity="0.55" />);
      items.push(<TorchSconce key="ts1" x={140} y={cy} p={p} />);
      items.push(<TorchSconce key="ts2" x={cx} y={cy} p={p} />);
      items.push(<TorchSconce key="ts3" x={W - 140} y={cy} p={p} />);
      break;
    }
    case "tower": {
      // big magical circle in center
      items.push(
        <g key="circle">
          <circle cx={cx} cy={cy} r={180} fill="none" stroke={p.glow} strokeWidth="3" opacity="0.5" />
          <circle cx={cx} cy={cy} r={150} fill="none" stroke={p.glow} strokeWidth="2" opacity="0.45" />
          <circle cx={cx} cy={cy} r={120} fill="none" stroke={p.glow} strokeWidth="1.5" opacity="0.4" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line key={i}
                x1={cx + Math.cos(a) * 120} y1={cy + Math.sin(a) * 120}
                x2={cx + Math.cos(a) * 180} y2={cy + Math.sin(a) * 180}
                stroke={p.glow} strokeWidth="2" opacity="0.5" />
            );
          })}
          <circle cx={cx} cy={cy} r={30} fill={p.glow} opacity="0.45" filter="url(#glow)" />
        </g>
      );
      items.push(<Bookshelf key="bs1" x={140} y={120} w={160} h={36} p={p} />);
      items.push(<Bookshelf key="bs2" x={W - 140} y={120} w={160} h={36} p={p} />);
      items.push(<Table key="alc" x={140} y={H - 130} w={120} h={60} p={p} />);
      items.push(<Barrel key="b" x={W - 140} y={H - 130} />);
      items.push(<TorchSconce key="ts1" x={120} y={cy} p={p} />);
      items.push(<TorchSconce key="ts2" x={W - 120} y={cy} p={p} />);
      break;
    }
    case "cave": {
      // organic walls drawn as dark blob border
      const wallPath = `M${100 + r() * 30} 90 Q${250} ${50 + r() * 30} ${cx} ${80 + r() * 20} Q${750} ${60 + r() * 30} ${W - 100} ${110 + r() * 30} Q${W - 50} ${cy} ${W - 110} ${H - 100} Q${750} ${H - 60} ${cx} ${H - 90} Q${250} ${H - 60} ${100} ${H - 110} Q${50} ${cy} ${100 + r() * 30} 90 Z`;
      items.push(
        <g key="walls">
          <path d={`M0 0 L${W} 0 L${W} ${H} L0 ${H} Z ${wallPath}`} fillRule="evenodd" fill={p.wall} />
          <path d={wallPath} fill="none" stroke={p.wallShadow} strokeWidth="6" opacity="0.7" />
        </g>
      );
      // rocks scattered
      for (let i = 0; i < 8; i++) {
        items.push(<Rock key={`rk${i}`} x={150 + r() * 700} y={130 + r() * 340} scale={0.7 + r() * 0.8} p={p} />);
      }
      // pool
      items.push(<Pool key="pool" x={cx + 120} y={cy + 60} rx={70} ry={40} p={p} />);
      // mushrooms
      for (let i = 0; i < 6; i++) {
        items.push(<Mushroom key={`m${i}`} x={150 + r() * 700} y={150 + r() * 320} />);
      }
      items.push(<TorchSconce key="ts1" x={140} y={140} p={p} />);
      items.push(<TorchSconce key="ts2" x={W - 140} y={H - 140} p={p} />);
      break;
    }
    case "market": {
      // paths
      items.push(<rect key="pV" x={cx - 50} y={0} width={100} height={H} fill={p.floorLight} opacity="0.18" />);
      items.push(<rect key="pH" x={0} y={cy - 50} width={W} height={100} fill={p.floorLight} opacity="0.18" />);
      // stalls
      items.push(<MarketStall key="ms1" x={180} y={170} />);
      items.push(<MarketStall key="ms2" x={W - 180} y={170} />);
      items.push(<MarketStall key="ms3" x={180} y={H - 170} />);
      items.push(<MarketStall key="ms4" x={W - 180} y={H - 170} />);
      items.push(<MarketStall key="ms5" x={cx} y={120} />);
      items.push(<MarketStall key="ms6" x={cx} y={H - 120} />);
      // central fountain
      items.push(<Fountain key="fnt" x={cx} y={cy} p={p} />);
      // crates and barrels
      items.push(<Barrel key="b1" x={140} y={cy} />);
      items.push(<Barrel key="b2" x={W - 140} y={cy} />);
      items.push(<Crate key="cr1" x={cx - 60} y={cy - 110} />);
      break;
    }
    case "plaza": {
      // statue at center
      items.push(<Statue key="st" x={cx} y={cy} p={p} />);
      items.push(<circle key="ring1" cx={cx} cy={cy} r={120} fill="none" stroke={p.shadow} strokeWidth="2" opacity="0.5" />);
      items.push(<circle key="ring2" cx={cx} cy={cy} r={80} fill="none" stroke={p.shadow} strokeWidth="1.5" opacity="0.4" />);
      // surrounding building roofs (dark hint)
      [120, W - 120].forEach((x, i) => {
        items.push(<rect key={`bldL${i}`} x={x - 50} y={70} width={100} height={70} fill={p.wall} stroke={p.shadow} strokeWidth="2" opacity="0.85" />);
        items.push(<rect key={`bldB${i}`} x={x - 50} y={H - 140} width={100} height={70} fill={p.wall} stroke={p.shadow} strokeWidth="2" opacity="0.85" />);
      });
      items.push(<TorchSconce key="ts1" x={cx - 200} y={cy} p={p} />);
      items.push(<TorchSconce key="ts2" x={cx + 200} y={cy} p={p} />);
      items.push(<Tree key="t1" x={220} y={H - 220} scale={0.9} p={P.forest} />);
      items.push(<Tree key="t2" x={W - 220} y={H - 220} scale={0.9} p={P.forest} />);
      break;
    }
    case "harbor": {
      // water on top half
      items.push(<rect key="water" x={0} y={0} width={W} height={cy - 30} fill="#1a3848" />);
      items.push(<rect key="water2" x={0} y={0} width={W} height={cy - 30} fill="#3a7088" opacity="0.55" />);
      // wave highlights
      for (let i = 0; i < 6; i++) {
        const y = 40 + i * 35;
        items.push(<path key={`w${i}`} d={`M0 ${y} Q${cx} ${y - 8} ${W} ${y}`} stroke="#a8d8e8" strokeWidth="1.2" fill="none" opacity="0.4" />);
      }
      // dock planks
      items.push(<rect key="dock" x={cx - 60} y={cy - 30} width={120} height={H - cy + 30} fill="#5a3a1f" stroke="#1a0e04" strokeWidth="2" />);
      for (let i = 0; i < 8; i++) {
        items.push(<line key={`pl${i}`} x1={cx - 60} y1={cy - 30 + i * 50} x2={cx + 60} y2={cy - 30 + i * 50} stroke="#1a0e04" strokeWidth="1" opacity="0.7" />);
      }
      // boat silhouettes
      items.push(<ellipse key="boat1" cx={200} cy={150} rx={70} ry={20} fill="#2a1808" stroke="#1a0804" strokeWidth="1.5" />);
      items.push(<ellipse key="boat2" cx={W - 200} cy={170} rx={60} ry={18} fill="#2a1808" stroke="#1a0804" strokeWidth="1.5" />);
      // crates / barrels on dock
      items.push(<Crate key="cr1" x={cx - 30} y={H - 100} />);
      items.push(<Crate key="cr2" x={cx + 30} y={H - 130} />);
      items.push(<Barrel key="b1" x={cx + 30} y={H - 80} />);
      break;
    }
    case "bridge": {
      // river across
      items.push(<rect key="river" x={0} y={cy - 90} width={W} height={180} fill="#1a3848" />);
      items.push(<rect key="river2" x={0} y={cy - 90} width={W} height={180} fill="#3a7088" opacity="0.55" />);
      for (let i = 0; i < 4; i++) {
        items.push(<path key={`w${i}`} d={`M0 ${cy - 60 + i * 30} Q${cx} ${cy - 70 + i * 30} ${W} ${cy - 60 + i * 30}`} stroke="#a8d8e8" strokeWidth="1" fill="none" opacity="0.35" />);
      }
      // bridge
      items.push(<rect key="bridge" x={cx - 110} y={cy - 50} width={220} height={100} fill={p.floor} stroke={p.shadow} strokeWidth="3" />);
      items.push(<rect key="bridgeT" x={cx - 110} y={cy - 50} width={220} height={20} fill={p.floorLight} opacity="0.4" />);
      // arch shadow under
      items.push(<ellipse key="arch" cx={cx} cy={cy + 40} rx={100} ry={20} fill="#000" opacity="0.55" />);
      // statues on each end
      items.push(<Statue key="s1" x={cx - 90} y={cy - 60} p={p} />);
      items.push(<Statue key="s2" x={cx + 90} y={cy - 60} p={p} />);
      // reeds
      for (let i = 0; i < 4; i++) {
        items.push(<Reed key={`rd${i}`} x={80 + i * 60} y={cy + 100} />);
        items.push(<Reed key={`rdR${i}`} x={W - 80 - i * 60} y={cy - 100} />);
      }
      break;
    }
    case "camp": {
      items.push(<Campfire key="cf" x={cx} y={cy} />);
      items.push(<Tent key="t1" x={cx - 200} y={cy - 70} />);
      items.push(<Tent key="t2" x={cx + 200} y={cy - 70} />);
      items.push(<Tent key="t3" x={cx} y={cy + 140} />);
      items.push(<Crate key="cr1" x={cx - 80} y={cy + 80} />);
      items.push(<Barrel key="b1" x={cx + 80} y={cy + 80} />);
      // logs around fire
      [-1, 1].forEach((s, i) => {
        items.push(<rect key={`lg${i}`} x={cx + s * 50 - 18} y={cy - 6} width={36} height={6} rx={2} fill="#5a3018" />);
      });
      // surrounding trees
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = cx + Math.cos(a) * 380;
        const y = cy + Math.sin(a) * 230;
        if (x > 60 && x < W - 60 && y > 60 && y < H - 60) {
          items.push(<Tree key={`tr${i}`} x={x} y={y} scale={0.9 + r() * 0.4} p={P.forest} />);
        }
      }
      break;
    }
    case "forest": {
      // dirt path winding through
      items.push(<path key="path" d={`M-20 ${H * 0.7} Q${cx * 0.5} ${H * 0.4} ${cx} ${H * 0.55} T${W + 20} ${H * 0.45}`} stroke={P.cobble.floor} strokeWidth="60" fill="none" opacity="0.7" />);
      items.push(<path key="path2" d={`M-20 ${H * 0.7} Q${cx * 0.5} ${H * 0.4} ${cx} ${H * 0.55} T${W + 20} ${H * 0.45}`} stroke={P.cobble.floorDark} strokeWidth="60" fill="none" opacity="0.3" strokeDasharray="8 12" />);
      // bushes
      for (let i = 0; i < 10; i++) {
        items.push(<Bush key={`bs${i}`} x={60 + r() * (W - 120)} y={60 + r() * (H - 120)} p={p} />);
      }
      // trees
      for (let i = 0; i < 14; i++) {
        items.push(<Tree key={`tr${i}`} x={40 + r() * (W - 80)} y={40 + r() * (H - 80)} scale={0.7 + r() * 0.6} p={p} />);
      }
      // rocks
      for (let i = 0; i < 4; i++) {
        items.push(<Rock key={`rk${i}`} x={120 + r() * 760} y={120 + r() * 360} scale={0.6 + r() * 0.6} p={p} />);
      }
      // mushrooms
      for (let i = 0; i < 6; i++) {
        items.push(<Mushroom key={`m${i}`} x={80 + r() * 840} y={80 + r() * 440} />);
      }
      break;
    }
    case "swamp": {
      // dark pools
      items.push(<Pool key="p1" x={200} y={170} rx={90} ry={50} p={p} />);
      items.push(<Pool key="p2" x={W - 220} y={H - 180} rx={120} ry={60} p={p} />);
      items.push(<Pool key="p3" x={cx + 100} y={170} rx={70} ry={36} p={p} />);
      // dead trees (no canopy color)
      for (let i = 0; i < 8; i++) {
        const x = 80 + r() * (W - 160);
        const y = 80 + r() * (H - 160);
        items.push(
          <g key={`dt${i}`}>
            <ellipse cx={x + 2} cy={y + 6} rx={10} ry={3} fill="#000" opacity="0.5" />
            <line x1={x} y1={y} x2={x - 14} y2={y - 30} stroke="#1a1408" strokeWidth="3" />
            <line x1={x} y1={y} x2={x + 12} y2={y - 28} stroke="#1a1408" strokeWidth="2.5" />
            <line x1={x - 5} y1={y - 14} x2={x - 18} y2={y - 22} stroke="#1a1408" strokeWidth="2" />
            <circle cx={x} cy={y + 4} r={6} fill="#1a1408" />
          </g>
        );
      }
      // reeds clusters
      for (let i = 0; i < 8; i++) {
        items.push(<Reed key={`rd${i}`} x={60 + r() * (W - 120)} y={60 + r() * (H - 120)} />);
      }
      // will-o-wisps (glow dots)
      [[300, 380], [600, 200], [800, 420]].forEach(([x, y], i) => {
        items.push(
          <g key={`wow${i}`}>
            <circle cx={x} cy={y} r={20} fill={p.glow} opacity="0.4" filter="url(#glow)" />
            <circle cx={x} cy={y} r={8} fill={p.glow} opacity="0.85" />
            <circle cx={x} cy={y} r={3} fill="#fff" />
          </g>
        );
      });
      break;
    }
    case "snow": {
      // pine trees with snow
      for (let i = 0; i < 12; i++) {
        const x = 60 + r() * (W - 120);
        const y = 60 + r() * (H - 120);
        const sc = 0.8 + r() * 0.5;
        items.push(
          <g key={`pn${i}`}>
            <ellipse cx={x + 3} cy={y + 24 * sc} rx={20 * sc} ry={6 * sc} fill="#000" opacity="0.45" />
            <path d={`M${x - 22 * sc} ${y + 18 * sc} L${x} ${y - 24 * sc} L${x + 22 * sc} ${y + 18 * sc} Z`} fill="#1f3a1c" stroke="#0a1a0a" strokeWidth="1" />
            <path d={`M${x - 18 * sc} ${y + 8 * sc} L${x} ${y - 18 * sc} L${x + 18 * sc} ${y + 8 * sc} Z`} fill="#284628" />
            <path d={`M${x - 12 * sc} ${y - 4 * sc} L${x} ${y - 28 * sc} L${x + 12 * sc} ${y - 4 * sc} Z`} fill="#365a36" />
            {/* snow caps */}
            <ellipse cx={x} cy={y - 22 * sc} rx={5 * sc} ry={2 * sc} fill="#fff" opacity="0.85" />
            <ellipse cx={x} cy={y - 4 * sc} rx={9 * sc} ry={2.5 * sc} fill="#fff" opacity="0.6" />
            <ellipse cx={x} cy={y + 14 * sc} rx={13 * sc} ry={3 * sc} fill="#fff" opacity="0.45" />
          </g>
        );
      }
      // rocks with snow
      for (let i = 0; i < 5; i++) {
        items.push(<Rock key={`rk${i}`} x={120 + r() * 760} y={120 + r() * 360} scale={0.7 + r() * 0.6} p={P.stone} />);
      }
      // animal tracks
      const trackY = cy + 60;
      for (let i = 0; i < 18; i++) {
        const tx = 60 + i * 50;
        const ty = trackY + Math.sin(i * 0.6) * 18;
        items.push(<ellipse key={`tk${i}`} cx={tx} cy={ty} rx={3} ry={5} fill="#5a6a76" opacity="0.55" />);
      }
      break;
    }
    case "ruin": {
      // broken column ring
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = cx + Math.cos(a) * 220;
        const y = cy + Math.sin(a) * 140;
        items.push(<Column key={`c${i}`} x={x} y={y} p={p} />);
        // broken column shadow rectangle
        items.push(<rect key={`br${i}`} x={x - 18} y={y + 14} width={36} height={10} fill={p.shadow} opacity="0.5" />);
      }
      // central altar
      items.push(
        <g key="altar">
          <rect x={cx - 50} y={cy - 24} width={100} height={48} fill="#000" opacity="0.5" />
          <rect x={cx - 48} y={cy - 22} width={96} height={44} fill={p.accent} stroke={p.shadow} strokeWidth="2" />
          <circle cx={cx} cy={cy} r={10} fill={p.glow} opacity="0.45" filter="url(#glow)" />
        </g>
      );
      // overgrowth (bushes/vines)
      for (let i = 0; i < 8; i++) {
        items.push(<Bush key={`bs${i}`} x={80 + r() * (W - 160)} y={80 + r() * (H - 160)} p={P.forest} />);
      }
      // rocks
      for (let i = 0; i < 6; i++) {
        items.push(<Rock key={`rk${i}`} x={80 + r() * (W - 160)} y={80 + r() * (H - 160)} scale={0.6 + r() * 0.5} p={p} />);
      }
      break;
    }
    case "exterior":
    default: {
      // generic outdoor
      for (let i = 0; i < 8; i++) {
        items.push(<Bush key={`bs${i}`} x={60 + r() * (W - 120)} y={60 + r() * (H - 120)} p={P.forest} />);
      }
      for (let i = 0; i < 6; i++) {
        items.push(<Tree key={`tr${i}`} x={60 + r() * (W - 120)} y={60 + r() * (H - 120)} scale={0.7 + r() * 0.5} p={P.forest} />);
      }
      for (let i = 0; i < 4; i++) {
        items.push(<Rock key={`rk${i}`} x={120 + r() * 760} y={120 + r() * 360} scale={0.6 + r() * 0.5} p={p} />);
      }
      break;
    }
  }

  return {
    features: <>{items}</>,
    walls: spec.walls ? <Walls p={p} /> : undefined,
  };
}

export default function ProceduralBattlemap({ label, prompt, seed }: Props) {
  const sub = detectSub(label, prompt);
  const spec = specFor(sub);
  const layout = buildLayout(spec, seed);
  const p = spec.palette;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-label={`Carte procédurale: ${label}`}
    >
      <defs>
        <FloorPattern id="floor" floor={spec.floor} p={p} />
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <radialGradient id="vignette" cx="50%" cy="55%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.65" />
        </radialGradient>
        <radialGradient id="warmth" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.18" />
          <stop offset="70%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base floor */}
      <rect width={W} height={H} fill={p.floorDark} />
      <rect width={W} height={H} fill="url(#floor)" />

      {/* Warm ambient glow */}
      <rect width={W} height={H} fill="url(#warmth)" />

      {/* Walls */}
      {layout.walls}

      {/* Features */}
      {layout.features}

      {/* Vignette darkness at edges */}
      <rect width={W} height={H} fill="url(#vignette)" />
    </svg>
  );
}
