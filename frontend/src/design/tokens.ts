// Noble Nightfall — source of truth for Mythoria design tokens.
// Mirrored in tailwind.config.js and index.css (:root vars).

export const color = {
  ink: {
    900: "#0b0d10",
    800: "#13161b",
    750: "#181b21",
    700: "#1e222a",
    600: "#2a2f39",
    500: "#3a414d",
    400: "#5a6270",
    300: "#8a909b",
    200: "#b8bcc3",
    100: "#e6e3db",
  },
  parchment: "#efe7d3",
  parchment2: "#d9cfb5",
  gold: { 500: "#c9a24a", 400: "#d9b968", 300: "#e8d08a" },
  ember: "#c85a3a",
  moss: "#6d8a5a",
  arcane: "#7a6bc8",
  blood: "#8a1f1f",
  hairline: "rgba(232,208,138,.18)",
  hairlineStrong: "rgba(232,208,138,.34)",
  rule: "rgba(255,255,255,.06)",
} as const;

export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80 } as const;
export const radius = { xs: 2, sm: 3, md: 5, lg: 8, pill: 999 } as const;

export const shadow = {
  panel: "0 1px 0 rgba(255,255,255,.03), 0 12px 40px rgba(0,0,0,.55)",
  glow:  "0 0 0 1px rgba(232,208,138,.25), 0 0 24px rgba(201,162,74,.15)",
  inset: "inset 0 1px 0 rgba(255,255,255,.04)",
} as const;

export const motion = {
  fast:      "140ms cubic-bezier(.2,.6,.2,1)",
  base:      "220ms cubic-bezier(.2,.6,.2,1)",
  narrative: "320ms cubic-bezier(.2,.6,.2,1)",
} as const;

export const font = {
  serif: '"Cormorant Garamond", "Times New Roman", serif',
  sans:  '"Inter", system-ui, sans-serif',
  mono:  '"JetBrains Mono", ui-monospace, monospace',
} as const;
