/**
 * CONTRAST AUDIT — proves every pair in brand/khandolite.tokens.mjs.
 *
 * Reads the token file, recomputes each ratio with the WCAG 2.1 formula, and
 * fails if:
 *   • a documented ratio is wrong by more than 0.05
 *   • a documented pair does not meet its own stated minimum
 *   • a forbidden pair is actually legal (a stale rule is worse than no rule)
 *
 * Run: node validation/contrast-audit.mjs
 */
import { color, contrast, forbidden } from "../brand/khandolite.tokens.mjs";

const hex = (token) => {
  const [group, key = "DEFAULT"] = token.split(".");
  const v = color[group]?.[key];
  if (!v) throw new Error(`unknown token: ${token}`);
  return v;
};

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let pass = 0;
const fails = [];

console.log("\n  PAIR                                  DOC   CALC   MIN  ");
console.log("  " + "─".repeat(58));

for (const row of contrast) {
  const fg = hex(row.fg);
  const bg = hex(row.bg);
  const calc = ratio(fg, bg);
  const drift = Math.abs(calc - row.ratio);
  const meets = calc >= row.min;
  const ok = drift <= 0.05 && (meets || row.exempt);
  if (ok) pass++;
  else fails.push(`${row.fg} on ${row.bg}: documented ${row.ratio}, computed ${calc.toFixed(2)}, needs ${row.min}`);

  const mark = row.exempt ? "exempt" : meets ? "ok" : "FAIL";
  console.log(
    `  ${(row.fg + " on " + row.bg).slice(0, 36).padEnd(36)} ${String(row.ratio).padStart(4)}  ${calc.toFixed(2).padStart(5)}  ${String(row.min).padStart(3)}  ${mark}${drift > 0.05 ? "  ← DOCUMENTED RATIO STALE" : ""}`
  );
}

console.log("\n  FORBIDDEN PAIRS (must genuinely fail)");
console.log("  " + "─".repeat(58));
for (const row of forbidden) {
  const calc = ratio(hex(row.fg), hex(row.bg));
  const stillBad = calc < 4.5;
  if (stillBad) pass++;
  else fails.push(`forbidden pair ${row.fg} on ${row.bg} now passes at ${calc.toFixed(2)} — the rule is stale, update it`);
  console.log(`  ${(row.fg + " on " + row.bg).slice(0, 36).padEnd(36)} ${calc.toFixed(2).padStart(6)}  ${stillBad ? "still correctly forbidden" : "NO LONGER FORBIDDEN"}`);
}

console.log("\n" + "═".repeat(62));
const total = contrast.length + forbidden.length;
console.log(`  CONTRAST AUDIT: ${pass}/${total} pairs verified`);
if (fails.length) {
  console.log("\n  FAILURES");
  fails.forEach((f) => console.log("   ✗ " + f));
  process.exit(1);
}
console.log("  All documented ratios reproduce; all forbidden pairs still fail.\n");
