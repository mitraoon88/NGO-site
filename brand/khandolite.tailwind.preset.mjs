/**
 * KHANDOLITE TAILWIND PRESET
 * ==========================
 * Drop-in replacement for `brand/tailwind.preset.ts`. Imports the same token
 * module the CSS and the WordPress theme.json are generated from, so there is
 * exactly one place a colour is defined.
 *
 * MIGRATION NOTE FOR THE DEVELOPER
 * --------------------------------
 * The current A2 front-end uses names measured from the client mockup:
 *   rust → terracotta.DEFAULT      gold    → marigold       (dark surfaces only)
 *   forest → charcoal              cream   → cream          (value changes)
 *   ink   → charcoal               sand    → line-sand
 *
 * `scripts/check-tokens.mjs` fails the build on any surviving `text-rust`,
 * `bg-forest`, `text-gold` etc., so the migration cannot be done halfway.
 * See docs/14-ui-development-instructions.md Part 3 for the complete name map
 * and the four contrast rules that follow from it.
 */
import { color, fontSize, layout, motion } from "./khandolite.tokens.mjs";

/** Flatten `{ terracotta: { DEFAULT, hover } }` into Tailwind's expectations. */
function flatten(group) {
  const out = {};
  for (const [name, value] of Object.entries(group)) {
    if (typeof value === "string") {
      out[name] = value;
      continue;
    }
    for (const [step, hex] of Object.entries(value)) {
      out[step === "DEFAULT" ? name : `${name}-${step}`] = hex;
    }
  }
  return out;
}

const preset = {
  theme: {
    extend: {
      colors: flatten(color),

      fontFamily: {
        display: "var(--a2-font-display)",
        sans: "var(--a2-font-sans)",
        "odia-serif": "var(--a2-font-odia-serif)",
        "odia-sans": "var(--a2-font-odia-sans)",
      },

      fontSize,

      maxWidth: layout.maxWidth,
      borderRadius: layout.radius,
      gap: { gutter: layout.gutter },

      transitionDuration: {
        hover: motion.hover.duration,
        reveal: motion.reveal.duration,
        countup: motion.countUp.duration,
      },
      transitionTimingFunction: {
        a2: motion.reveal.easing,
        "a2-hover": motion.hover.easing,
      },

      keyframes: {
        "a2-rise": {
          from: { opacity: "0", transform: `translateY(${motion.reveal.distance})` },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "a2-kenburns": {
          from: { transform: "scale(1)" },
          to: { transform: `scale(${motion.kenBurns.scale})` },
        },
      },
      animation: {
        "a2-rise": `a2-rise ${motion.reveal.duration} ${motion.reveal.easing} both`,
        "a2-kenburns": `a2-kenburns ${motion.kenBurns.duration} ${motion.reveal.easing} both`,
      },

      /**
       * A rem breakpoint used only by the header.
       *
       * Every other breakpoint describes the *viewport*, which is correctly a
       * px question. The header is different: whether six nav links plus a
       * Contribute button fit depends on the width of the TEXT. At the 200%
       * text size WCAG 1.4.4 requires, a 1280px viewport still reads as
       * "desktop" to a px breakpoint while the nav needs half again the room.
       * (Carried over from the A2 build, where this pushed the Contribute
       * button and the whole language switch off-screen.)
       */
      screens: {
        "hdr-lg": "64rem",
      },
    },
  },
  plugins: [],
};

export default preset;
