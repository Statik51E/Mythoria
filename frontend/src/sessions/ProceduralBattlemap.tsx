interface Props {
  label: string;
  prompt: string;
  seed: number;
}

type Category = "interior" | "exterior" | "dungeon" | "wild";

interface Palette {
  base: string;
  accent: string;
  shadow: string;
  highlight: string;
  pattern: "wood" | "stone" | "grass" | "dirt";
}

const PALETTES: Record<Category, Palette> = {
  interior: { base: "#3a2a1a", accent: "#5a3a22", shadow: "#1a1208", highlight: "#7a5a32", pattern: "wood" },
  exterior: { base: "#4a4030", accent: "#5a5040", shadow: "#2a2418", highlight: "#7a6a4a", pattern: "dirt" },
  dungeon:  { base: "#2a2622", accent: "#3a342e", shadow: "#100c08", highlight: "#5a4e42", pattern: "stone" },
  wild:     { base: "#3a4028", accent: "#4a5634", shadow: "#1a2010", highlight: "#6a7a4a", pattern: "grass" },
};

function categorize(label: string, prompt: string): Category {
  const t = `${label} ${prompt}`.toLowerCase();
  if (/(tavern|house|cottage|library|throne|shop|interior|inn|kitchen|hall|chamber)/.test(t)) return "interior";
  if (/(dungeon|crypt|tomb|tower|cave|cavern|passage|corridor|catacomb|prison)/.test(t)) return "dungeon";
  if (/(forest|swamp|marsh|snow|mountain|ruin|camp|wild|jungle|desert)/.test(t)) return "wild";
  return "exterior";
}

// Tiny seeded RNG so the same seed always renders the same map.
function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

interface Feature {
  kind: "rect" | "circle" | "tree";
  x: number; y: number; w: number; h: number;
  rot: number;
}

function generateFeatures(category: Category, seed: number): Feature[] {
  const r = rng(seed);
  const out: Feature[] = [];
  const counts: Record<Category, { rect: number; circle: number; tree: number }> = {
    interior: { rect: 8, circle: 2, tree: 0 },
    exterior: { rect: 4, circle: 1, tree: 3 },
    dungeon:  { rect: 6, circle: 1, tree: 0 },
    wild:     { rect: 2, circle: 0, tree: 12 },
  };
  const c = counts[category];
  for (let i = 0; i < c.rect; i++) {
    out.push({
      kind: "rect",
      x: 0.1 + r() * 0.8,
      y: 0.1 + r() * 0.7,
      w: 0.04 + r() * 0.08,
      h: 0.03 + r() * 0.06,
      rot: r() * 90 - 45,
    });
  }
  for (let i = 0; i < c.circle; i++) {
    out.push({
      kind: "circle",
      x: 0.2 + r() * 0.6,
      y: 0.2 + r() * 0.6,
      w: 0.04 + r() * 0.05,
      h: 0,
      rot: 0,
    });
  }
  for (let i = 0; i < c.tree; i++) {
    out.push({
      kind: "tree",
      x: 0.05 + r() * 0.9,
      y: 0.05 + r() * 0.9,
      w: 0.025 + r() * 0.035,
      h: 0,
      rot: 0,
    });
  }
  return out;
}

function PatternDef({ id, kind, p }: { id: string; kind: Palette["pattern"]; p: Palette }) {
  switch (kind) {
    case "wood":
      return (
        <pattern id={id} width="64" height="160" patternUnits="userSpaceOnUse">
          <rect width="64" height="160" fill={p.base} />
          <rect width="64" height="2" y="0" fill={p.shadow} opacity="0.55" />
          <rect width="64" height="2" y="80" fill={p.shadow} opacity="0.45" />
          <rect width="2" height="160" x="20" fill={p.shadow} opacity="0.35" />
          <rect width="2" height="160" x="44" fill={p.shadow} opacity="0.35" />
          <rect width="64" height="160" fill="url(#noise)" opacity="0.18" />
        </pattern>
      );
    case "stone":
      return (
        <pattern id={id} width="96" height="96" patternUnits="userSpaceOnUse">
          <rect width="96" height="96" fill={p.base} />
          <path d="M0 32 L48 32 L48 0 M48 32 L96 32 M48 64 L96 64 L96 96 M48 64 L0 64 M48 64 L48 96 M48 32 L48 64" stroke={p.shadow} strokeWidth="2" fill="none" opacity="0.65" />
          <rect width="96" height="96" fill="url(#noise)" opacity="0.22" />
        </pattern>
      );
    case "grass":
      return (
        <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill={p.base} />
          <circle cx="8" cy="12" r="1.5" fill={p.highlight} opacity="0.35" />
          <circle cx="32" cy="20" r="1.2" fill={p.highlight} opacity="0.30" />
          <circle cx="16" cy="36" r="1.4" fill={p.highlight} opacity="0.28" />
          <circle cx="40" cy="40" r="1" fill={p.shadow} opacity="0.40" />
          <rect width="48" height="48" fill="url(#noise)" opacity="0.20" />
        </pattern>
      );
    case "dirt":
      return (
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="56" height="56" fill={p.base} />
          <circle cx="14" cy="18" r="1.6" fill={p.shadow} opacity="0.45" />
          <circle cx="36" cy="32" r="2" fill={p.shadow} opacity="0.40" />
          <circle cx="22" cy="42" r="1.2" fill={p.highlight} opacity="0.30" />
          <rect width="56" height="56" fill="url(#noise)" opacity="0.25" />
        </pattern>
      );
  }
}

export default function ProceduralBattlemap({ label, prompt, seed }: Props) {
  const category = categorize(label, prompt);
  const p = PALETTES[category];
  const features = generateFeatures(category, seed);

  return (
    <svg
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-label={`Carte procédurale: ${label}`}
    >
      <defs>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed={seed % 100} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>
        <pattern id="noise" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" filter="url(#noise)" />
        </pattern>
        <PatternDef id="surface" kind={p.pattern} p={p} />
        <radialGradient id="vignette" cx="50%" cy="55%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Base surface */}
      <rect width="1000" height="600" fill="url(#surface)" />

      {/* Outer wall / border for interiors and dungeons */}
      {(category === "interior" || category === "dungeon") && (
        <rect
          x="40" y="40" width="920" height="520"
          fill="none"
          stroke={p.shadow}
          strokeWidth="14"
          opacity="0.85"
        />
      )}

      {/* Decorative features */}
      {features.map((f, i) => {
        const cx = f.x * 1000;
        const cy = f.y * 600;
        const w = f.w * 1000;
        const h = f.h * 600;
        if (f.kind === "rect") {
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${f.rot})`}>
              <rect
                x={-w / 2} y={-h / 2} width={w} height={h}
                fill={p.accent}
                stroke={p.shadow}
                strokeWidth="2"
                filter="url(#softShadow)"
              />
            </g>
          );
        }
        if (f.kind === "circle") {
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={w / 2} fill={p.shadow} opacity="0.85" />
              <circle cx={cx} cy={cy} r={w / 2 - 6} fill="#a55a1c" opacity="0.7" />
              <circle cx={cx} cy={cy} r={w / 2 - 12} fill="#e89a3a" opacity="0.55" />
            </g>
          );
        }
        // tree
        return (
          <g key={i}>
            <circle cx={cx} cy={cy + 4} r={w * 0.6} fill="#000" opacity="0.35" filter="url(#softShadow)" />
            <circle cx={cx} cy={cy} r={w * 0.55} fill={p.highlight} opacity="0.95" />
            <circle cx={cx - w * 0.25} cy={cy - w * 0.2} r={w * 0.4} fill={p.highlight} opacity="0.85" />
            <circle cx={cx + w * 0.25} cy={cy - w * 0.15} r={w * 0.4} fill={p.highlight} opacity="0.85" />
          </g>
        );
      })}

      {/* Vignette */}
      <rect width="1000" height="600" fill="url(#vignette)" />
    </svg>
  );
}
