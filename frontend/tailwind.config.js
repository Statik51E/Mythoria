/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
        parchment: { DEFAULT: "#efe7d3", 2: "#d9cfb5" },
        gold: { 500: "#c9a24a", 400: "#d9b968", 300: "#e8d08a" },
        ember: "#c85a3a",
        moss: "#6d8a5a",
        arcane: "#7a6bc8",
        blood: "#8a1f1f",
      },
      borderColor: {
        hairline: "rgba(232,208,138,.18)",
        "hairline-strong": "rgba(232,208,138,.34)",
        rule: "rgba(255,255,255,.06)",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Times New Roman"', "serif"],
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,.03), 0 12px 40px rgba(0,0,0,.55)",
        glow:  "0 0 0 1px rgba(232,208,138,.25), 0 0 24px rgba(201,162,74,.15)",
      },
      transitionTimingFunction: {
        mythoria: "cubic-bezier(.2,.6,.2,1)",
      },
      letterSpacing: {
        label: "0.2em",
        eyebrow: "0.22em",
      },
    },
  },
  plugins: [],
};
