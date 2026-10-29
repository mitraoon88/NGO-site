/**
 * Review boards — captures the ornament sheet at real size for the client review,
 * and refreshes the Phase 1 boards. Uses reduced-motion so a band captured
 * mid-page is never blank because of an un-triggered entrance animation.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const OUT = join(ROOT, "reference");
mkdirSync(join(OUT, "phase2"), { recursive: true });

const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const errs = [];

async function open(path, w, h = 1000) {
  const p = await b.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 100)));
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  return p;
}

/**
 * Scroll the whole document once before capturing.
 *
 * Playwright's `fullPage` screenshot stitches without waiting for
 * `loading="lazy"` images to decode, so a band that has never entered the
 * viewport renders as an empty box — which is exactly what happened on the
 * first mobile board: Stories, News and Get Involved all photographed blank
 * while the live page was fine. Walking the page first primes every image.
 */
async function prime(p) {
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await p.evaluate((v) => window.scrollTo(0, v), y);
    await p.waitForTimeout(120);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(900);
}

// ── Phase 2 boards ───────────────────────────────────────────────────────────
{
  const p = await open("/ornaments", 1440);
  const hero = await p.locator("section").first().boundingBox();
  await p.evaluate((y) => window.scrollTo(0, y - 80), hero.y);
  await p.waitForTimeout(300);
  await p.screenshot({
    path: join(OUT, "phase2/01-hero-in-composition.png"),
    clip: { x: 0, y: 80, width: 1440, height: 900 },
  });
  await p.evaluate((y) => window.scrollTo(0, y), hero.y + hero.height - 460);
  await p.waitForTimeout(300);
  await p.screenshot({
    path: join(OUT, "phase2/02-tear-and-mark.png"),
    clip: { x: 0, y: 200, width: 1440, height: 460 },
  });
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (const [i, y] of [
    ["03-tear-specimens", 1000],
    ["04-odisha-vignette", 1500],
    ["05-foliage", 2400],
    ["06-stamp", 3100],
    ["07-script", 3800],
  ]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(280);
    await p.screenshot({
      path: join(OUT, "phase2", `${i}.png`),
      clip: { x: 0, y: 100, width: 1440, height: 820 },
    });
  }
  await p.screenshot({ path: join(OUT, "phase2/full-1440.png"), fullPage: true });
  await p.close();
}
{
  const p = await open("/ornaments", 390, 1200);
  await p.screenshot({ path: join(OUT, "phase2/08-mobile-390.png"), fullPage: true });
  await p.close();
}
{
  const p = await open("/ornaments", 768, 1000);
  const hero = await p.locator("section").first().boundingBox();
  await p.evaluate((y) => window.scrollTo(0, y), hero.y + hero.height - 380);
  await p.waitForTimeout(300);
  await p.screenshot({
    path: join(OUT, "phase2/09-tablet-768-tear.png"),
    clip: { x: 0, y: 150, width: 768, height: 360 },
  });
  await p.close();
}

// ── Phase 3 boards: the homepage, band by band ───────────────────────────────
{
  mkdirSync(join(OUT, "phase3"), { recursive: true });
  const p = await open("/", 1440);
  await prime(p);
  const BANDS = [
    ["01-header-hero", 'section[aria-labelledby="hero-title"]'],
    ["02-values-purpose", 'section[aria-labelledby="purpose-title"]'],
    ["03-focus", 'section[aria-labelledby="focus-title"]'],
    ["04-impact", 'section[aria-labelledby="impact-title"]'],
    ["05-stories", 'section[aria-labelledby="stories-title"]'],
    ["06-involved", 'section[aria-labelledby="involved-title"]'],
    ["07-partners-news", 'section[aria-labelledby="partners-title"]'],
    ["08-footer", "body > footer"],
  ];
  for (const [name, sel] of BANDS) {
    const el = p.locator(sel).first();
    const box = await el.boundingBox();
    if (!box) { errs.push(`band missing: ${sel}`); continue; }
    await p.screenshot({
      path: join(OUT, `phase3/${name}.png`),
      clip: { x: 0, y: Math.max(0, box.y - 8), width: 1440, height: Math.min(1400, box.height + 16) },
      fullPage: true,
    });
  }

  // the full page at the design width, for the side-by-side against the mockup
  await p.screenshot({ path: join(OUT, "phase3/full-1440.png"), fullPage: true });

  // the breakpoints the design has to hold
  for (const [w, h, tag] of [[390, 844, "mobile-390"], [768, 1024, "tablet-768"]]) {
    const q = await open("/", w, h);
    await prime(q);
    await q.screenshot({ path: join(OUT, `phase3/reflow-${tag}.png`), fullPage: true });
    await q.close();
  }
  await p.close();
}

// ── Phase 1 boards (regression capture) ──────────────────────────────────────
{
  const p = await open("/kitchen-sink", 1440);
  const h = await p.evaluate(() => document.body.scrollHeight);
  const bands = [
    ["01-colour-type", 0, 1500],
    ["02-buttons-eyebrow-headings", 1500, 1600],
    ["03-cards", 3100, 1600],
    ["04-inputs-icons", 4700, 1600],
    ["05-logo-motion-spacing", 6300, 1600],
  ];
  for (const [n, y, hh] of bands) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(OUT, "phase1", `${n}.png`), clip: { x: 0, y: 0, width: 1440, height: hh } });
  }
  await p.close();
}
{
  const p = await open("/kitchen-sink", 390, 1400);
  await p.screenshot({ path: join(OUT, "phase1/06-mobile.png") });
  await p.close();
}

console.log("boards written · ERRORS:", JSON.stringify(errs));
await b.close();
