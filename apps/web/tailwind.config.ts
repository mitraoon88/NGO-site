import type { Config } from "tailwindcss";
import preset from "../../brand/tailwind.preset";

const config: Config = {
  // The preset is framework-agnostic (no tailwind type import) so it also works
  // in a plain PostCSS project; cast once, here.
  presets: [preset as unknown as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /* next/font exposes hashed family names through CSS variables, so the
         utilities must point at the variables — not at the literal names in
         the preset, which only exist on a machine that has the font installed. */
      fontFamily: {
        display: "var(--a2-font-display)",
        sans: "var(--a2-font-sans)",
        script: "var(--a2-font-script)",
      },
      // Extra steps the components need that aren't core brand tokens.
      opacity: {
        3: "0.03",
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        16: "0.16",
        18: "0.18",
        22: "0.22",
        35: "0.35",
        45: "0.45",
        55: "0.55",
        65: "0.65",
        72: "0.72",
        78: "0.78",
        82: "0.82",
        85: "0.85",
        88: "0.88",
      },
    },
  },
  plugins: [],
};

export default config;
