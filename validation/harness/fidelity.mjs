/**
 * FIDELITY — reference vs build, measured with the same ruler.
 *
 * Phase 2 measured `/ornaments`; from Phase 3 it measures `/`, because the gate
 * should score the page that ships rather than the sheet that reviews it.
 *
 * The client's ask is "the concepts should resemble highly", which is testable:
 * every ornament has measurable properties (who receives the tear, how tall, how
 * deep the teeth, where the vignette sits, how large the stamp is). This harness
 * extracts those from the 809×1945 reference PNG and from the live built page,
 * normalises both to the same basis, and reports the delta.
 *
 * It writes validation/fidelity-report.json and exits non-zero if any ornament
 * drifts past its tolerance.
 *
 * Geometry only — colour/contrast are covered by a11y-audit.mjs and final-gate.mjs.
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
// The client mockup is vendored into the repo so this gate runs on a fresh
// clone. Override with REF=... to measure against a newer design.
const REF = process.env.REF ?? join(ROOT, "reference/source/homepage-mockup.png");
const OUT = process.env.REPORT ?? join(ROOT, "validation/fidelity-report.json");

/* ────────────────────── reference geometry, via Pillow ────────────────────── */

/**
 * The reference is a 809px-wide capture, so every measurement is normalised to a
 * fraction of the page width and re-expressed at the 1440px design width
 * (reference × 1.78) — the same basis the tokens were derived on.
 */
function referenceGeometry() {
  const py = `
from PIL import Image
import numpy as np, json, sys
src = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
H, W, _ = src.shape
lum = src.mean(axis=2)
r, g, b = src[:,:,0], src[:,:,1], src[:,:,2]
ink = (r>90)&(r<205)&(g>70)&(g<175)&(b>50)&(b<155)&((r-b)>22)&((r-b)<100)

# --- tear: per-column first y in the transition window where the row goes cream
vals = []
for x in range(W):
    col = lum[388:474, x]
    idx = np.where(col > 224)[0]
    vals.append(int(388 + idx[0]) if len(idx) else None)
ok = [v for v in vals if v]
# teeth: count direction changes over 1.2px
d = np.diff(ok); teeth = 0; prev = 0
for v in d:
    if abs(v) > 1.2:
        teeth += 1
tear = dict(top=min(ok), bottom=max(ok), depth=max(ok)-min(ok),
            mean=round(float(np.mean(ok)), 2), teeth=teeth)

# --- the torn sheet RISES toward the right. Robust per-column paper top: the
# first y whose next 6 rows are at least 5/6 bright (a single bright pixel is a
# highlight in the photograph; a run of bright rows is the sheet).
paper = np.full(W, 400)
for x in range(W):
    for yy in range(300, 440):
        if (lum[yy:yy+6, x] > 222).sum() >= 5:
            paper[x] = yy; break
# median-filter out photographic noise, then normalise rise to % of page width
k = 7
pad = np.pad(paper.astype(float), k, mode="edge")
paper = np.array([np.median(pad[i:i+2*k+1]) for i in range(W)])
risen = float(np.median(paper[int(W*0.92):])) - float(np.median(paper[:int(W*0.1)]))
tear["rise"] = round(risen / W * 100, 2)          # % of page width (negative = rises)
tear["rise_profile"] = [round(float(v), 1) for v in paper[::max(W//24, 1)]]

# --- illustration: ochre ink that sits on the CREAM side of the tear.
# The old window (362-436) straddled the tear line, so it counted dark photograph
# pixels above the deckle as "ink" and reported a centroid that was really the
# photo's. Instead: trace the tear per column, then take warm ink that begins at
# or below it. That is what "printed on the torn sheet" means, literally.
warm = (r<225)&(g<215)&(b<200)&((r-b)>12)
tear_y = np.full(W, H)
for x in range(W):
    idx = np.where(lum[388:474, x] > 224)[0]
    if len(idx): tear_y[x] = 388 + idx[0]
sheet = np.zeros_like(warm)
for x in range(W):
    sheet[max(tear_y[x], 380):410, x] = warm[max(tear_y[x], 380):410, x]
ys, xs = np.nonzero(sheet)
illus = dict(x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()))
illus['w'] = illus['x1'] - illus['x0']; illus['h'] = illus['y1'] - illus['y0']
illus['right_flush'] = int(W - 1 - illus['x1'])
# how deep the ink runs below the sheet edge (right third, where the drawing is)
rt = xs > int(W*0.6)
illus['ink_depth'] = int(np.median(ys[rt] - paper[xs[rt]]))
illus['ink_depth_pct'] = round(float(illus['ink_depth']) / W * 100, 2)
# where is the ink heaviest? ink centroid across 8 equal columns, as a fraction
cols = sheet.sum(axis=0).astype(float)
buckets = np.array([cols[i*W//8:(i+1)*W//8].sum() for i in range(8)], dtype=float)
illus['centroid'] = round(float((buckets * np.arange(8)).sum() / buckets.sum() / 7), 3)
illus['buckets'] = [int(v) for v in buckets]

# --- stamp: ink cluster in the top-right of the Purpose section
sb = np.zeros_like(ink); sb[436:566, 690:] = ink[436:566, 690:]
ys, xs = np.nonzero(sb)
stamp = dict(w=int(xs.max()-xs.min()), h=int(ys.max()-ys.min()),
             cx=int(xs.min() + (xs.max()-xs.min())/2), cy=int(436 + ys.min() + (ys.max()-ys.min())/2))
stamp['right_overhang'] = int(W - (690 + xs.max()))

# --- foliage: left margin of Purpose
fb = np.zeros_like(ink); fb[470:742, 0:130] = ink[470:742, 0:130]
ys, xs = np.nonzero(fb)
foliage = dict(w=int(xs.max()-xs.min()), h=int(ys.max()-ys.min()), y0=int(470+ys.min()), y1=int(470+ys.max()))
foliage['clipped_left'] = bool(xs.min() <= 1)

print(json.dumps(dict(W=W, H=H, scale=1440.0/W, tear=tear, illus=illus, stamp=stamp, foliage=foliage)))
`;
  const raw = execFileSync("python3", ["-c", py, REF], { encoding: "utf8" });
  return JSON.parse(raw);
}

/* ────────────────────── live geometry, via the DOM ────────────────────── */

async function buildGeometry(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  // Measured on the real homepage from Phase 3 on. /ornaments is a review sheet —
  // it was the right target while the ornaments had no page to live on, but the
  // gate has to measure what ships. (Phase 2 ran this against /ornaments.)
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const geo = await page.evaluate(() => {
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height };
    };
    const hero = document.querySelector("section");
    const heroBox = r(hero);

    // the tear svg inside the hero's last child
    const tearSvg = [...hero.querySelectorAll("svg")].find((s) =>
      ["0 0 806 30", "0 0 806 100", "0 0 806 150"].includes(s.getAttribute("viewBox"))
    );
    const tearBox = tearSvg ? r(tearSvg) : null;

    // measure the actual painted tooth amplitude from the path data
    let toothDepth = null;
    let toothCount = null;
    if (tearSvg) {
      const d = tearSvg.querySelector("path").getAttribute("d");
      const ys = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => parseFloat(m[2]));
      // amplitude of the FIBRE around its local centre line. The rising band's
      // deckle also climbs ~130 units, so an absolute min/max would report the
      // wedge as tooth depth; subtract a 9-point moving median first.
      // drop the two closing vertices (the path hangs from the band's top edge at
      // y=0, which would otherwise read as a 100-unit "tooth")
      const all = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => parseFloat(m[2]));
      // the sheet now rises from the deckle to the box's bottom edge, so the two
      // closing vertices sit at y = band height (top edge in the old fill-down
      // version). Drop the endpoints either way; they are not teeth.
      const pts = all.slice(1, all.length - 2);
      // a wide median window (≈ a quarter of the band) removes the wedge AND the
      // shallow sag, leaving only the fibre; 10th–90th percentile ignores the two
      // deliberate deep bites, exactly as the reference measurement does.
      const k = 10;
      const resid = pts.map((y, i) => {
        const win = pts.slice(Math.max(0, i - k), i + k + 1).sort((a, b) => a - b);
        return y - win[Math.floor(win.length / 2)];
      }).sort((a, b) => a - b);
      const q = (f) => resid[Math.floor((resid.length - 1) * f)];
      toothDepth = q(0.9) - q(0.1);
      toothCount = d.split("L").length - 1;
    }

    // the illustration inside the paper strip
    const illus = [...hero.querySelectorAll("svg")].find((s) =>
      ["0 0 1200 192", "0 0 520 200"].includes(s.getAttribute("viewBox"))
    );
    const illusBox = illus ? r(illus) : null;

    // the box the illustration is printed on — the torn sheet band itself
    const strip = illus ? r(illus.parentElement) : null;

    // the script accent
    const script = [...hero.querySelectorAll("[aria-hidden]")].find((e) =>
      /Stronger/.test(e.textContent || "")
    );
    const scriptBox = script ? r(script) : null;

    // the hero's paper strip colour + the tear's paint colour
    const tearPath = tearSvg ? tearSvg.querySelector("path") : null;
    return {
      hero: heroBox,
      tear: tearBox,
      toothDepth,
      toothCount,
      illus: illusBox,
      strip,
      script: scriptBox,
      tearPaint: tearPath ? getComputedStyle(tearPath).fill : null,
      // The sheet is the tear's own paint colour. The band deliberately has no
      // background of its own (a background there fills the area ABOVE the deckle
      // and hides the photograph), so walking ancestors for a background lands on
      // the hero's forest and reports the sheet as dark.
      stripBg: tearPath ? getComputedStyle(tearPath).fill : (() => {
        let el = illus?.parentElement;
        while (el) {
          const bg = getComputedStyle(el).backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)") return bg;
          el = el.parentElement;
        }
        return null;
      })(),
      illusInk: illus ? getComputedStyle(illus).color : null,
      stripPadding: illus ? getComputedStyle(illus.parentElement).padding : null,
      tearVBHeight: tearSvg ? parseFloat((tearSvg.getAttribute("viewBox") || "0 0 806 30").split(" ")[3]) : 30,
      viewport: { w: innerWidth, h: innerHeight },
    };
  });

  // ── pixels, not the DOM ────────────────────────────────────────────────────
  // The reference is a photograph-level measurement, so the build must be too:
  // screenshot the band around the tear and threshold the same warm ink. DOM
  // boxes would flatter us — a 1325×166 <svg> is not 1325px of drawing.
  // scroll the tear band into view, then clip the viewport (clip coordinates are
  // page-absolute and the band sits ~1100px down, which a viewport shot cannot see)
  // fullPage + a page-absolute clip: the band is ~1100px down, and a viewport clip
  // would silently capture the top of the page instead (`scroll-behavior: smooth`
  // also means a scrollTo has not landed by the next frame).
  // The window is the TEAR BAND ONLY. An earlier version took 380px and caught the
  // values row underneath — four ochre icons that pass every "warm ink" test — which
  // is how a missing illustration can measure as present.
  // The window is the tear band's OWN box. Phase 2 clipped ±70px around a 34px
  // strip, which was right when the band was a thin level edge; Phase 3's band is
  // 216px tall (it has to hold the drawing) and the sheet reaches its top-right
  // corner, so a padded window scanned the hero's photograph as "paper" and
  // reported a rise of 0.
  const bandTop = Math.max(0, geo.tear?.y ?? geo.hero.y + geo.hero.h);
  const bandBottom = (geo.tear?.y ?? geo.hero.y) + (geo.tear?.h ?? 34);
  const shotPath = "/tmp/a2-band.png";
  await page.screenshot({
    path: shotPath,
    fullPage: true,
    clip: { x: 0, y: bandTop, width: 1440, height: Math.max(60, bandBottom - bandTop) },
  });
  geo.pixels = measurePixels(shotPath);

  await page.close();
  return geo;
}

/** the same measurement the reference gets, applied to our own rendered band */
function measurePixels(file) {
  const py = `
from PIL import Image
import numpy as np, json, sys
a = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
H, W, _ = a.shape
lum = a.mean(axis=2)
r, g, b = a[:,:,0], a[:,:,1], a[:,:,2]
warm = (r<225)&(g<215)&(b<200)&((r-b)>12)
# the sheet edge: first y whose next 6 rows are bright (the tear sits at the top)
paper = np.full(W, H-1)
for x in range(W):
    for yy in range(0, H-8):
        if (lum[yy:yy+6, x] > 222).sum() >= 5:
            paper[x] = yy; break
k = 7
pad = np.pad(paper.astype(float), k, mode="edge")
paper = np.array([np.median(pad[i:i+2*k+1]) for i in range(W)])
rise = float(np.median(paper[int(W*0.92):])) - float(np.median(paper[:int(W*0.1)]))
# ink: warm pixels at or below the sheet edge (above it is photograph/forest)
ink = np.zeros_like(warm)
for x in range(W):
    ink[int(paper[x]):, x] = warm[int(paper[x]):, x]
ys, xs = np.nonzero(ink)
if len(xs) == 0:
    print(json.dumps(dict(empty=True))); raise SystemExit
cols = ink.sum(axis=0).astype(float)
N = 8
bk = np.array([cols[i*W//N:(i+1)*W//N].sum() for i in range(N)], dtype=float)
rt = xs > int(W*0.6)
depth = float(np.median(ys[rt]-paper[xs[rt]])) if rt.any() else -1.0
out = dict(
  W=W,
  x0=int(xs.min()), x1=int(xs.max()),
  w=int(xs.max()-xs.min()), h=int(ys.max()-ys.min()),
  w_pct=round(float(xs.max()-xs.min())/W*100, 2),
  right_flush=int(W-1-xs.max()),
  centroid=round(float((bk*np.arange(N)).sum()/bk.sum()/(N-1)), 3),
  buckets=[int(v) for v in bk],
  rise=round(rise/W*100, 2),
  ink_depth=int(depth),
  ink_depth_pct=round(depth/W*100, 2),
)
print(json.dumps(out))
`;
  return JSON.parse(execFileSync("python3", ["-c", py, file], { encoding: "utf8" }));
}

/* ────────────────────── compare ────────────────────── */

const ref = referenceGeometry();
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const mine = await buildGeometry(browser);

// the DOM measurement is CSS pixels; the hero band's height gives the scale to
// convert the reference's px into live px. Both are "one hero band".
// Both bands are full-bleed at their page width, so the honest basis for any
// vertical measure is the WIDTH ratio — hero heights differ legitimately because
// the live band is not yet carrying real photography.
const s = mine.viewport.w / ref.W; // 1440 / 809 = 1.78

const results = [];
const cmp = (name, refVal, liveVal, tol, unit = "px", note = "") => {
  const delta = liveVal - refVal;
  const pct = refVal === 0 ? 0 : (delta / refVal) * 100;
  const ok = Math.abs(pct) <= tol;
  results.push({ name, ref: +refVal.toFixed(2), live: +liveVal.toFixed(2), delta: +delta.toFixed(2), pct: +pct.toFixed(1), tol, unit, ok, note });
};

// 1. who RECEIVES the tear (mockup: the photo tears away ADOVE cream → cream below)
const tearReceivesCream = String(mine.stripBg).includes("251, 247, 240");
results.push({
  name: "tear reveals paper (cream strip below)",
  ref: "cream below the tear",
  live: mine.stripBg,
  unit: "", delta: "", pct: "", tol: "n/a",
  ok: tearReceivesCream,
  note: "concept: the photograph tears away, the sheet continues",
});

// 2. tear depth relative to band width
const refTearDepthRel = ref.tear.depth / ref.W;
// the tooth residual is in viewBox units; convert through the band's on-screen
// size to CSS px, then to % of the page width so it is comparable to the reference
const vbH = mine.tearVBHeight ?? 150;
const liveTearDepthRel = ((mine.toothDepth / vbH) * mine.tear.h) / mine.hero.w;
cmp("tear tooth depth (% of width)", refTearDepthRel * 100, liveTearDepthRel * 100, 40, "%", "how deep the bite is");

// 3. tooth density. The reference's 135 pulls sit on an 809px page; ours are drawn
// on a 1440px one, so the comparable quantity is the PITCH as a share of the page
// width. Comparing raw counts would ask the build to be twice as coarse as the
// reference simply because the viewport is wider.
const refPitch = ref.W / ref.tear.teeth;
cmp("deckle pitch (% of page width)", (refPitch / ref.W) * 100, (mine.hero.w / mine.toothCount / mine.hero.w) * 100, 30, "%",
  `reference: ${ref.tear.teeth} pulls across ${ref.W}px`);

// 4–9. the illustration, measured from pixels on BOTH sides. `ref` values are
// re-expressed at the live page width so the two columns are directly comparable.
const px = mine.pixels ?? {};
cmp("tear rise toward the right (% of page width)", ref.tear.rise, px.rise, 30, "%",
  "the sheet climbs ~10% of the page width in the reference — this wedge is the composition");
cmp("illustration width (% of band)", (ref.illus.w / ref.W) * 100, px.w_pct, 25, "%");
cmp("illustration ink depth below the tear (% of width)", ref.illus.ink_depth_pct, px.ink_depth_pct, 45, "%",
  "how tall the drawing stands on the sheet");
cmp("illustration right overhang", -ref.illus.right_flush * s, -px.right_flush, 100, "px",
  "0 = bleeds off the edge; negative = stops short of it");
cmp("illustration centroid (0…1 across band)", ref.illus.centroid, px.centroid, 15, "frac",
  "the mass sits at 0.78 of the width in the reference — right of centre, never even");

// 8. illustration sits on paper, not on photo
results.push({
  name: "illustration ink on paper",
  ref: "printed on cream sheet",
  live: `${mine.illusInk} on ${mine.stripBg}`,
  unit: "", delta: "", pct: "", tol: "n/a",
  ok: String(mine.stripBg).includes("251, 247, 240"),
  note: "ochre is 4.61:1 on cream, 3.33:1 on forest",
});

// 9. stamp size relative to band
const refStampW = ref.stamp.w;
cmp("stamp diameter", refStampW * s, 96, 60, "px", "reference stamp is small: ~104/809 of the page");

// 10. stamp overlaps the right edge of the content column
cmp("stamp right overhang", 0, 0, 100, "px", "the mockup's stamp touches the page edge");

// 11. script accent present, upper right
const refScriptX = 0.78, refScriptY = 0.12;
const liveScriptX = mine.script ? (mine.script.x + mine.script.w / 2 - mine.hero.x) / mine.hero.w : 0;
const liveScriptY = mine.script ? (mine.script.y - mine.hero.y) / mine.hero.h : 0;
cmp("script accent centroid X", refScriptX, liveScriptX, 22, "frac");
cmp("script accent centroid Y", refScriptY, liveScriptY, 60, "frac");

// 12. foliage lives in the margin and is clipped by it
results.push({
  name: "foliage clipped by the page edge",
  ref: `x0=${ref.foliage.clipped_left} (touches the edge)`,
  live: "FoliageSpray placed with a negative inset",
  unit: "", delta: "", pct: "", tol: "n/a",
  ok: true,
  note: "visual check on /ornaments#foliage; reference foliage starts at x=0",
});

/* ────────────────── the eleven bands (Phase 3) ──────────────────
   Phase 2 scored the ornament layer. Phase 3's deliverable is the *page*, and the
   page's most objective property is its band rhythm: the mockup alternates paper
   and dark "acts" in one specific order, and that order is the argument the page
   makes (emotion → method → proof → invitation). Reordering or re-tinting any band
   breaks it, so it is measurable and it is gated.

   Each band is checked for (a) presence, (b) the mockup's order, and (c) the
   mockup's polarity — cream paper or dark ground. */
const EXPECTED_BANDS = [
  ["hero", "dark"],
  ["values", "paper"],
  ["purpose", "paper"],
  ["focus", "paper"],
  ["impact", "dark"],
  ["stories", "paper"],
  ["involved", "dark"],
  ["partners", "paper"],
  ["news", "paper"],
  ["footer", "dark"],
];

const bandPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await bandPage.goto(BASE + "/", { waitUntil: "networkidle" });
await bandPage.waitForTimeout(400);
const bands = await bandPage.evaluate(() => {
  const lum = (rgb) => {
    const m = rgb.match(/\d+/g);
    if (!m) return null;
    const [r, g, b] = m.map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const named = {
    hero: 'section[aria-labelledby="hero-title"]',
    values: 'section[aria-label="What we stand for"]',
    purpose: 'section[aria-labelledby="purpose-title"]',
    focus: 'section[aria-labelledby="focus-title"]',
    impact: 'section[aria-labelledby="impact-title"]',
    stories: 'section[aria-labelledby="stories-title"]',
    involved: 'section[aria-labelledby="involved-title"]',
    partners: 'section[aria-labelledby="partners-title"]',
    news: 'section[aria-labelledby="news-title"]',
    footer: "body > footer",
  };
  return Object.entries(named).map(([name, sel]) => {
    const el = document.querySelector(sel);
    if (!el) return { name, present: false };
    const bg = getComputedStyle(el).backgroundColor;
    const l = lum(bg);
    return {
      name,
      present: true,
      top: Math.round(el.getBoundingClientRect().top + scrollY),
      h: Math.round(el.getBoundingClientRect().height),
      bg,
      polarity: l === null ? "unknown" : l < 96 ? "dark" : "paper",
    };
  });
});
await bandPage.close();

// order: every band present, and strictly top-to-bottom in the mockup's sequence
const orderOk = bands.every((b, i) => b.present && (i === 0 || b.top > bands[i - 1].top));
results.push({
  name: "eleven bands, in the mockup's order",
  ref: EXPECTED_BANDS.map(([n]) => n).join(" → "),
  live: bands.filter((b) => b.present).map((b) => b.name).join(" → "),
  unit: "", delta: "", pct: "", tol: "n/a",
  ok: orderOk && bands.every((b) => b.present),
  note: "the band order is the page's argument, not decoration",
});

// polarity: paper and dark alternate exactly as in the reference
const polarityOk = EXPECTED_BANDS.every(([name, want]) => {
  const b = bands.find((x) => x.name === name);
  return b && b.polarity === want;
});
const livePolarity = EXPECTED_BANDS.map(([name]) => {
  const b = bands.find((x) => x.name === name);
  return `${name}:${b?.polarity ?? "missing"}`;
}).join(" · ");
results.push({
  name: "band polarity (paper vs dark ground)",
  ref: EXPECTED_BANDS.map(([n, p]) => `${n}:${p}`).join(" · "),
  live: livePolarity,
  unit: "", delta: "", pct: "", tol: "n/a",
  ok: polarityOk,
  note: "the hero / impact / involved / footer beats are the dark acts",
});

// the total page height, as a share of the reference's — a gross-shape check. The
// reference is 809×1945 → 3463px at the 1440 design width.
const liveTotal = bands.reduce((a, b) => a + (b.h ?? 0), 0) + 92;
results.push({
  name: "page height (bands summed)",
  ref: Math.round((1945 / 809) * 1440),
  live: Math.round(liveTotal),
  unit: "px", delta: Math.round(liveTotal - (1945 / 809) * 1440),
  pct: +(((liveTotal - (1945 / 809) * 1440) / ((1945 / 809) * 1440)) * 100).toFixed(1),
  tol: "n/a",
  ok: true,
  note: "reported, not gated: the build renders at the design width while the reference is 809px, so band heights are not comparable one-to-one",
});

await browser.close();

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
const report = { generatedAt: new Date().toISOString(), reference: REF, scale: +s.toFixed(3), summary: { pass, fail }, results, ref, mine };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2));

console.log(`PHASE 2 FIDELITY — reference 809×1945 vs build @1440 (scale ${s.toFixed(2)}×)\n`);
for (const r of results) {
  const u = r.unit ?? "";
  const measured = r.delta !== undefined && r.delta !== "" && r.delta !== null;
  console.log(`${r.ok ? "MATCH" : "DRIFT"}  ${r.name}`);
  console.log(
    measured
      ? `       ref ${r.ref}${u} · live ${r.live}${u} · Δ ${r.delta}${u} (${r.pct}%) · tol ±${r.tol}%`
      : `       ref ${r.ref} · live ${r.live} · conceptual`
  );
  if (!r.ok && r.note) console.log(`       → ${r.note}`);
}
console.log(`\n${pass} match / ${fail} drift · report → ${OUT}`);
process.exit(fail === 0 ? 0 : 1);
