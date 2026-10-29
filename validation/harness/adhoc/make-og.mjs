import { chromium } from "playwright";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MEDIA = "../..//apps/web/.next/static/media";
// identify the three faces by inlining every candidate and letting the browser pick:
// simpler and deterministic — next/font emits one file per weight+style per family.
const files = readdirSync(MEDIA).filter((f) => f.endsWith(".woff2"));
const data = (f) => "data:font/woff2;base64," + readFileSync(join(MEDIA, f)).toString("base64");

// Probe the real families off the running site so the OG card uses the same faces.
const b = await chromium.launch();
const p0 = await b.newPage();
await p0.goto("http://127.0.0.1:3100/", { waitUntil: "networkidle" });
const urls = await p0.evaluate(() =>
  performance.getEntriesByType("resource").filter((r) => /\.woff2$/.test(r.name)).map((r) => new URL(r.name).pathname.split("/").pop())
);
await p0.close();

const pick = (name) => join(MEDIA, urls.find((u) => u === name) || files[0]);
// map served files to families via the CSS @font-face src order is unreliable;
// instead inline all served files and let font-family matching resolve them.
let css = "";
for (const u of urls) {
  const fam = u.includes("-s.") ? null : null; // resolved below by declaration order
}
// Use the browser to tell us which file serves which family/weight.
const probe = await b.newPage();
await probe.goto("http://127.0.0.1:3100/", { waitUntil: "networkidle" });
const mapping = await probe.evaluate(async () => {
  const out = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.constructor.name === "CSSFontFaceRule") {
        out.push({ family: r.style.fontFamily, weight: r.style.fontWeight, style: r.style.fontStyle, src: r.style.src });
      }
    }
  }
  return out;
});
await probe.close();
await b.close();

const findSrc = (family, weight) => {
  const hit = mapping.find((m) => m.family.includes(family) && String(m.weight).includes(weight));
  if (!hit) return null;
  const m = hit.src.match(/\/([^/"]+\.woff2)/);
  return m ? m[1] : null;
};

const disp = findSrc("Newsreader", 400) || urls[0];
const sans = findSrc("Inter", 400) || urls[1];
const sans6 = findSrc("Inter", 600) || sans;
console.log({ disp, sans, sans6, faces: mapping.length });

// italic face: Newsreader with an italic style
const italicHit = mapping.find((m) => m.family.includes("Newsreader") && /italic/.test(m.style || "") || (m.family.includes("Newsreader") && /italic/.test(m.src || "")));
const dispItalic = italicHit ? (italicHit.src.match(/\/([^/"]+\.woff2)/)?.[1] ?? disp) : disp;

let html = readFileSync("/home/user/.tmp-shots/og/og.html", "utf8")
  .replace("__DISPLAY_IT__", data(dispItalic))
  .replace("__DISPLAY__", data(disp))
  .replace("__SANS__", data(sans))
  .replace("__SANS600__", data(sans6));
writeFileSync("/home/user/.tmp-shots/og/og-inline.html", html);

const b2 = await chromium.launch();
const page = await b2.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto("file:///home/user/.tmp-shots/og/og-inline.html", { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
await page.screenshot({ path: "../..//apps/web/public/og.png" });
await b2.close();
console.log("wrote public/og.png");
