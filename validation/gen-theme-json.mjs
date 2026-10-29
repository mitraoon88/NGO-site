/**
 * Generates a2-ekamra/theme.json FROM brand/khandolite.tokens.mjs.
 *
 * Blueprint §11.1: "Custom block theme a2-ekamra with theme.json encoding every
 * design token." Hand-writing theme.json guarantees it drifts from the
 * front-end. Generating it from the same module the CSS and Tailwind preset use
 * means there is one source of truth for the whole platform.
 *
 * Run: node validation/gen-theme-json.mjs
 */
import { writeFileSync } from "node:fs";
import { color, fontSize, layout } from "../brand/khandolite.tokens.mjs";

const slug = (s) => s.replace(/\./g, "-").toLowerCase();

/** theme.json wants CSS-ish values; strip the Tailwind tuple form. */
const sizeOf = (v) => (Array.isArray(v) ? v[0] : v);

const palette = Object.entries(color).flatMap(([group, value]) =>
  typeof value === "string"
    ? [{ slug: slug(group), name: group, color: value }]
    : Object.entries(value)
        .filter(([k]) => k !== "DEFAULT")
        .map(([step, hex]) => ({ slug: slug(`${group}-${step}`), name: `${group} ${step}`, color: hex }))
        .concat([{ slug: slug(group), name: group, color: value.DEFAULT }])
);

const themeJson = {
  $schema: "https://schemas.wp.org/trunk/theme.json",
  version: 2,
  settings: {
    appearanceTools: true,
    useRootPaddingAwareAlignments: true,
    layout: { contentSize: layout.maxWidth.copy, wideSize: layout.maxWidth.page },
    color: {
      custom: false,
      customGradient: false,
      customDuotone: false,
      defaultPalette: false,
      defaultGradients: false,
      palette,
    },
    typography: {
      customFontSize: false,
      fluid: true,
      fontFamilies: [
        { slug: "display", name: "Khandolite Display (Playfair)", fontFamily: '"Playfair Display", "Lora", Georgia, serif' },
        { slug: "sans", name: "Khandolite Sans (Plus Jakarta)", fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' },
        { slug: "odia-serif", name: "Odia Serif (Noto Serif Oriya)", fontFamily: '"Noto Serif Oriya", serif' },
        { slug: "odia-sans", name: "Odia Sans (Noto Sans Oriya)", fontFamily: '"Noto Sans Oriya", sans-serif' },
      ],
      fontSizes: Object.entries(fontSize).map(([name, v]) => ({
        slug: name,
        name,
        size: sizeOf(v),
        fluid: false,
      })),
    },
    spacing: {
      units: ["px", "rem", "%", "vw"],
      spacingSizes: [
        { slug: "20", name: "1", size: "8px" },
        { slug: "30", name: "2", size: "16px" },
        { slug: "40", name: "3", size: "24px" },
        { slug: "50", name: "4", size: layout.sectionPadding.base },
        { slug: "60", name: "5", size: layout.sectionPadding.md },
        { slug: "70", name: "6", size: layout.sectionPadding.lg },
      ],
    },
    custom: {
      // Anything theme.json cannot express, exposed as CSS vars the theme reads.
      khandolite: {
        "section-padding": layout.sectionPadding,
        "radius-btn": layout.radius.btn,
        "radius-card": layout.radius.card,
        "focus-ring": { width: "2px", offset: "2px", color: "var(--wp--preset--color--terracotta)" },
        "term-charter": "enforced in a2-core, see inc/terms.php",
      },
    },
  },
  styles: {
    color: { background: "var(--wp--preset--color--cream)", text: "var(--wp--preset--color--charcoal)" },
    typography: {
      fontFamily: "var(--wp--preset--font-family--sans)",
      fontSize: "var(--wp--preset--font-size--body)",
      lineHeight: "1.7",
    },
    spacing: { blockGap: "var(--wp--preset--spacing--40)" },
    elements: {
      heading: {
        typography: {
          fontFamily: "var(--wp--preset--font-family--display)",
          fontWeight: "400",
          letterSpacing: "0.04em",
          lineHeight: "1.08",
        },
        color: { text: "var(--wp--preset--color--charcoal)" },
      },
      h1: { typography: { fontSize: "var(--wp--preset--font-size--display-xl)" } },
      h2: { typography: { fontSize: "var(--wp--preset--font-size--display-lg)" } },
      h3: { typography: { fontSize: "var(--wp--preset--font-size--display-md)" } },
      link: { color: { text: "var(--wp--preset--color--terracotta-deep)" } },
      button: {
        color: { background: "var(--wp--preset--color--terracotta)", text: "var(--wp--preset--color--cream)" },
        border: { radius: "3px" },
        typography: { fontSize: "var(--wp--preset--font-size--ui)", fontWeight: "600" },
      },
    },
  },
};

writeFileSync(new URL("../a2-ekamra/theme.json", import.meta.url), JSON.stringify(themeJson, null, 2) + "\n");
console.log(`  theme.json written · ${palette.length} colours · ${Object.keys(fontSize).length} type sizes`);
console.log(`  palette: ${palette.map((p) => p.slug).join(", ")}`);
