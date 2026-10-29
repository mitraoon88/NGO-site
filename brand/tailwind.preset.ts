// Imported by apps/web/tailwind.config.ts (build-time only).
// Typed loosely so this file also resolves in projects without tailwind types.
type Config = Record<string, unknown>;

/**
 * A2 Foundation — Tailwind preset
 * ----------------------------------------------------------------------------
 * Drop this into `presets: [require("./brand/tailwind.preset")]` so the whole
 * site is driven by the same tokens as `brand/tokens.css`.
 *
 * Everything here was measured off the client's mockup. If a designer changes
 * a value, it changes HERE — components never hard-code a hex or a size.
 */
const preset = {
  theme: {
    extend: {
      /* A rem breakpoint, used only by the header.
       *
       * Every other breakpoint in this build is px, which is right: they describe
       * the *viewport*. The header is the exception, because what decides whether
       * six nav links plus a Donate button fit is not the viewport width — it is
       * the width of the text. At the 200% text size WCAG 1.4.4 requires, a 1280px
       * viewport still reads as "desktop" to a px breakpoint while the nav needs
       * half again the room it had; the Donate button and the language switch were
       * pushed off the right edge with no way to reach them.
       *
       * Expressing the desktop nav in rem makes the breakpoint scale with the
       * user's text setting: at 32px root, 64rem is 2048px, so a 1280px viewport
       * falls back to the compact header and the menu button instead. */
      screens: {
        "hdr-lg": "64rem",
      },
      colors: {
        cream: {
          DEFAULT: "#FBF7F0",
          deep: "#F6EFE3",
          white: "#FFFFFF",
        },
        sand: {
          DEFAULT: "#E8DBC4",
          soft: "#F1E7D6",
        },
        ink: {
          DEFAULT: "#1C1C1A",
          soft: "#3A3A38",
          muted: "#6B6B66",
        },
        forest: {
          DEFAULT: "#11231B",
          deep: "#0E231D",
        },
        // `rust` = the action colour. `rust.text` exists because the mockup's
        // lighter terracotta fails AA at 12px (2.95:1) — split into two roles.
        rust: {
          DEFAULT: "#AB3D24",
          hover: "#96331D",
          active: "#822B18",
          text: "#B23A26",
          // Solid tints only. A translucent wash picks up whatever sits behind it,
          // which is how a "safe" 5.58:1 label becomes 3.11:1 on a card.
          wash: "#FBEFEC",   // rust-text on this = 5.29:1
          washDeep: "#F7E3DD",
        },
        // Phase 2 ornament inks — decoration, sampled from the mockup's
        // pen-and-ink illustration, foliage and rubber stamp. Declared here (in
        // `colors`) so `text-*`, `bg-*` and `border-*` all resolve.
        ochre: {
          DEFAULT: "#8A6A52",
          soft: "#B49B80",
        },
        foliage: {
          DEFAULT: "#C8B090",
          deep: "#A8895F",
        },
        gold: {
          DEFAULT: "#C9A961", // icons/rules ON FOREST only (7.29:1)
          deep: "#A9853F",    // icons on cream — decorative, never text
        },
        peach: "#E9A184",
      },

      fontFamily: {
        display: ['"Newsreader"', '"Source Serif 4"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        script: ['"Parisienne"', '"Alex Brush"', "cursive"],
      },

      // Complete type scale — 15 steps, no component may hard-code a size.
      // [size, { lineHeight, letterSpacing }]
      fontSize: {
        hero: ["clamp(3rem, 6.2vw, 5.5rem)", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
        h2: ["clamp(2.25rem, 4.2vw, 3.625rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        "h2-sm": ["clamp(1.9rem, 3.4vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        h3: ["clamp(1.35rem, 2vw, 1.5rem)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "h4": ["1.0625rem", { lineHeight: "1.35", letterSpacing: "-0.005em" }],
        stat: ["clamp(2.25rem, 3.6vw, 3.125rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        lead: ["clamp(1rem, 1.15vw, 1.125rem)", { lineHeight: "1.7" }],
        body: ["1rem", { lineHeight: "1.7" }],
        "body-sm": ["0.9375rem", { lineHeight: "1.65" }],
        ui: ["0.875rem", { lineHeight: "1.55" }],
        // Script voice (Parisienne). One size per line of the hero flourish —
        // the mockup grows the accent line-by-line, so the growth is a token,
        // not an arbitrary value in the component.
        script: ["clamp(1.6rem, 2.8vw, 2.4rem)", { lineHeight: "0.94" }],
        "script-sm": ["clamp(1.5rem, 2.6vw, 2.25rem)", { lineHeight: "0.94" }],
        "script-xs": ["clamp(1.4rem, 2.4vw, 2.1rem)", { lineHeight: "0.94" }],
        note: ["0.8125rem", { lineHeight: "1.55" }],
        eyebrow: ["0.75rem", { lineHeight: "1", letterSpacing: "0.18em" }],
        label: ["0.75rem", { lineHeight: "1.4" }],
        micro: ["0.6875rem", { lineHeight: "1.45" }],
        nano: ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.12em" }],
        // brand lockup sizes (logo geometry, not body copy)
        "logo-mark": ["38px", { lineHeight: "0.82", letterSpacing: "-0.03em" }],
        "logo-mark-sm": ["26px", { lineHeight: "0.82", letterSpacing: "-0.03em" }],
        "logo-word": ["11px", { lineHeight: "1", letterSpacing: "0.26em" }],
        "logo-word-sm": ["8px", { lineHeight: "1", letterSpacing: "0.24em" }],
        "logo-tag": ["7.5px", { lineHeight: "1", letterSpacing: "0.24em" }],
      },

      maxWidth: {
        page: "1280px", // mockup container: 88.6% of viewport
        copy: "640px",  // section heading block
        "copy-sm": "560px",
        measure: "52ch", // body copy measure
      },

      spacing: {
        gutter: "clamp(1.25rem, 5vw, 5rem)",
        section: "clamp(3.5rem, 6vw, 6rem)",
        "section-tight": "clamp(2.5rem, 4vw, 4rem)",
        header: "104px",
      },

      borderRadius: {
        btn: "3px",
        card: "4px",
        photo: "3px",
      },

      boxShadow: {
        card: "0 1px 2px rgba(28,28,26,0.05)",
        script: "0 1px 6px rgba(14,35,29,0.45)",
        menu: "0 18px 44px -18px rgba(14,35,29,0.45)",
      },

      borderColor: {
        hair: "rgba(28,28,26,0.10)",
        // `borderColor.DEFAULT` — Tailwind's preflight otherwise hands every
        // un-coloured border the framework default gray-200, a colour that does
        // not exist in this brand. One line here keeps stray greys out of the
        // whole site; the value is the same hairline as `hair` above.
        DEFAULT: "rgba(28,28,26,0.10)",
      },

      transitionTimingFunction: {
        a2: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      keyframes: {
        "a2-rise": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "none" },
        },
        "a2-kenburns": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.04)" },
        },
        "a2-stamp": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "a2-rise": "a2-rise 600ms cubic-bezier(0.22,1,0.36,1) both",
        "a2-kenburns": "a2-kenburns 1.2s cubic-bezier(0.22,1,0.36,1) both",
        "a2-stamp": "a2-stamp 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default preset;
