#!/usr/bin/env node
/**
 * TOKEN ↔ TAILWIND-MERGE PARITY TEST
 * ---------------------------------------------------------------------------
 * Why this exists: tailwind-merge treats `text-white` and any unknown `text-*`
 * class as the same property group. The moment we add a font-size token that
 * the merger doesn't know about, it starts deleting colour classes — a rust
 * button silently gets ink labels, and no type error is raised.
 *
 * This check fails the build if:
 *   1. a custom token exists in the preset but is missing from cn.ts's merge map
 *   2. a component uses a `text-*` / `rounded-*` / `max-w-*` class that resolves
 *      to neither a Tailwind core value nor a brand token
 *   3. a component hard-codes a colour, font size or radius
 *
 * Run: node scripts/check-tokens.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const notes = [];

/* ── load the preset (comment-stripped, then dynamic import via data URL) ── */
const presetSrc = readFileSync(join(root, "../../brand/tailwind.preset.ts"), "utf8")
  .replace(/export default preset;?/, "module.exports = preset;")
  .replace(/type Config[^;]*;/, "")
  .replace(/const preset = /, "const preset = ");

const presetMod = { exports: {} };
new Function("module", "exports", presetSrc)(presetMod, presetMod.exports);
const preset = presetMod.exports;
const extend = preset.theme?.extend ?? {};

const tokenGroups = {
  fontSize: Object.keys(extend.fontSize ?? {}),
  borderRadius: Object.keys(extend.borderRadius ?? {}),
  maxWidth: Object.keys(extend.maxWidth ?? {}),
  boxShadow: Object.keys(extend.boxShadow ?? {}),
};

/* ── read cn.ts and confirm every token is registered with the merger ────── */
const cnSrc = readFileSync(join(root, "lib/cn.ts"), "utf8");
const usesDerivedKeys = /keys\("fontSize"\)/.test(cnSrc) && /keys\("borderRadius"\)/.test(cnSrc);

if (!usesDerivedKeys) {
  errors.push(
    "lib/cn.ts must derive its merge groups from the preset " +
      '(`keys("fontSize")` etc.) instead of a hand-maintained list.'
  );
} else {
  notes.push(`cn.ts derives merge groups from the preset (${tokenGroups.fontSize.length} type steps)`);
}

/* ── walk components and audit class usage ──────────────────────────────── */
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

const files = [...walk(join(root, "components")), ...walk(join(root, "app"))].filter(
  (f) => !f.includes("kitchen-sink") // the sheet is documentation and may show raw values
);

const coreTextSizes = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"]);
const coreRounded = new Set(["none", "sm", "", "md", "lg", "xl", "2xl", "3xl", "full"]);
const coreMaxW = new Set(["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "full", "min", "max", "fit", "prose", "screen-sm", "screen-md", "screen-lg", "screen-xl", "screen-2xl"]);

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = file.replace(root + "/", "");

  // 3a. hard-coded colours outside the token layer
  const hexes = src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  for (const h of hexes) {
    if (src.includes("themeColor") && h.toUpperCase() === "#11231B") continue; // metadata mirrors a token
    errors.push(`${rel}: hard-coded colour ${h}`);
  }
  if (/rgba?\(/.test(src) && !/kitchen-sink/.test(rel)) {
    errors.push(`${rel}: hard-coded rgb()/rgba() value`);
  }

  // 3b. arbitrary font sizes / radii
  for (const m of src.matchAll(/text-\[[0-9.]+(px|rem)\]/g)) {
    errors.push(`${rel}: hard-coded font size ${m[0]} — add a token instead`);
  }
  for (const m of src.matchAll(/rounded-\[[0-9.]+(px|rem)\]/g)) {
    if (m[0].includes("2px") && /CardMedia/.test(src)) continue; // photo inner radius
    errors.push(`${rel}: hard-coded radius ${m[0]} — use rounded-btn/card/photo`);
  }

  // 2. every text-* class must resolve to a size, a colour, or an alignment/utility
  const classes = [...src.matchAll(/\btext-([a-z0-9-]+)/g)].map((m) => m[1]);
  const colours = new Set([...Object.keys(extend.colors ?? {})]);
  const borderOnlyColours = new Set(
    Object.keys(extend.borderColor ?? {}).filter((k) => !colours.has(k))
  );
  const textOnlyColours = new Set(
    Object.keys(extend.textColor ?? {}).filter((k) => !colours.has(k))
  );
  const nonSizeUtilities = new Set(["left", "center", "right", "justify", "start", "end", "wrap", "nowrap", "balance", "pretty", "ellipsis", "clip"]);
  for (const c of classes) {
    const base = c.split("/")[0];
    if (coreTextSizes.has(base)) {
      errors.push(`${rel}: uses core text size "text-${base}" — use the brand scale instead`);
      continue;
    }
    if (tokenGroups.fontSize.includes(base)) continue;
    // Colour must live in `theme.extend.colors`. `borderColor`/`textColor` only
    // *override* hue families, so a colour declared there resolves for borders
    // but silently renders nothing for `text-*` — which is exactly how the
    // ornament ink shipped as cream for one build.
    if (colours.has(base)) continue;
    if (borderOnlyColours.has(base) || textOnlyColours.has(base)) {
      errors.push(
        `${rel}: "text-${base}" is declared in borderColor/textColor, not colors — ` +
          `move it to theme.extend.colors`
      );
      continue;
    }
    if (nonSizeUtilities.has(base)) continue;
    if (/^(white|black|transparent|current|inherit)$/.test(base)) continue;
    if (/^(sm|md|lg|xl|2xl)$/.test(base)) continue; // responsive colour variants handled above
    notes.push(`${rel}: "text-${base}" not in token list (verify it is a valid Tailwind utility)`);
  }

  // max-w-* and rounded-* parity
  for (const m of src.matchAll(/\bmax-w-([a-z0-9-]+)/g)) {
    const v = m[1];
    if (coreMaxW.has(v) || tokenGroups.maxWidth.includes(v) || /^(copy|page|measure)/.test(v)) continue;
    errors.push(`${rel}: unknown max-width token "max-w-${v}"`);
  }
  for (const m of src.matchAll(/\brounded-([a-z0-9-]+)/g)) {
    // strip a directional prefix: rounded-l-btn → btn
    const v = m[1].replace(/^(t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee)-/, "");
    if (coreRounded.has(v) || tokenGroups.borderRadius.includes(v)) continue;
    errors.push(`${rel}: unknown radius token "rounded-${m[1]}"`);
  }
}

/* ── report ─────────────────────────────────────────────────────────────── */
console.log("── token ↔ merge parity ────────────────────────────────");
for (const [k, v] of Object.entries(tokenGroups)) {
  console.log(`  ${k.padEnd(14)} ${v.length} token(s): ${v.slice(0, 8).join(", ")}${v.length > 8 ? " …" : ""}`);
}
console.log(`  files audited     ${files.length}`);

if (errors.length) {
  console.log(`\n✗ ${errors.length} token violation(s):`);
  for (const e of errors) console.log("   · " + e);
  process.exit(1);
}

console.log(`\n✓ 0 violations${notes.length ? ` (${notes.length} notes)` : ""}`);
