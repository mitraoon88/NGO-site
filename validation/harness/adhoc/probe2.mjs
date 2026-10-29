import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:3100/", { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(1200);
const out = await p.evaluate(() => {
  const tear = [...document.querySelectorAll("svg[viewBox]")].find(s => (s.getAttribute("viewBox") || "").includes("806"));
  if (!tear) return { tear: null };
  const r = tear.getBoundingClientRect();
  const path = tear.querySelector("path");
  const d = path.getAttribute("d");
  // sample the deckle y at a few x positions from the path data
  const pts = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
  const at = f => pts[Math.round((pts.length - 1) * f)];
  const bandEl = tear.closest("div");
  return {
    viewBox: tear.getAttribute("viewBox"),
    rect: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + scrollY) },
    fill: getComputedStyle(path).fill,
    colour: getComputedStyle(tear).color,
    bandBg: getComputedStyle(bandEl).backgroundColor,
    bandRect: (x => ({ h: Math.round(x.height), top: Math.round(x.top + scrollY) }))(bandEl.getBoundingClientRect()),
    pathPts: pts.length,
    y: { left: at(0), mid: at(0.5), right: at(1) },
    first6: pts.slice(0, 6),
  };
});
console.log(JSON.stringify(out, null, 1));
await p.evaluate(() => scrollTo(0, 560));
await p.waitForTimeout(500);
await p.screenshot({ path: "/home/user/.tmp-shots/hero-bottom.png", clip: { x: 0, y: 0, width: 1440, height: 420 } });
await b.close();
