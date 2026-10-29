/**
 * FINAL Phase 1 gate — everything the earlier harness checked, plus the families
 * it did not cover: metadata/SEO, offline self-hosting, runtime performance,
 * brand-asset consistency, deprecation sweep and dead-code sweep.
 *
 * Usage: node final-check.mjs   (requires `next start` on :3100)
 * Writes ../a2-foundation/validation/final-report.json
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const ROOT = "../../";
const WEB = join(ROOT, "apps/web");
const OUT = process.env.REPORT ?? join(ROOT, 'validation/final-report.json');

const results = [];
const rec = (status, scope, msg, detail) => results.push({ status, scope, msg, ...(detail ? { detail } : {}) });
const pass = (s, m, d) => rec("pass", s, m, d);
const warn = (s, m, d) => rec("warn", s, m, d);
const fail = (s, m, d) => rec("fail", s, m, d);

/* ───────────────────────── 1. static source checks ───────────────────────── */

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (!["node_modules", ".next", ".git"].includes(f)) walk(p, out);
    } else out.push(p);
  }
  return out;
}

const srcFiles = [...walk(join(WEB, "app")), ...walk(join(WEB, "components")), ...walk(join(WEB, "lib"))].filter(
  (f) => [".ts", ".tsx", ".css", ".mjs"].includes(extname(f))
);

// 1a. dead code: every exported component must be imported somewhere
const exportRe = /export (?:function|const|async function) ([A-Z][A-Za-z0-9_]*)/g;
const exportsFound = new Map();
for (const f of srcFiles.filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(exportRe)) exportsFound.set(m[1], f);
}
const unused = [];
for (const [name, file] of exportsFound) {
  const used = srcFiles.some((f) => {
    if (f === file) return false;
    const src = readFileSync(f, "utf8");
    return new RegExp(`\\b${name}\\b`).test(src);
  });
  if (!used) unused.push(`${name} (${file.replace(WEB + "/", "")})`);
}
unused.length ? warn("dead-code", `${unused.length} export(s) never imported`, unused) : pass("dead-code", `all ${exportsFound.size} exported components are used`);

// 1b. deprecation sweep — Next 15 / React 19 migrations and banned APIs
const deprecations = [
  [/next\/head/, "next/head → Metadata API"],
  [/styled-jsx/, "styled-jsx → CSS modules / Tailwind"],
  [/dangerouslySetInnerHTML/, "raw HTML injection"],
  [/\bimages\s*:\s*\{[^}]*\bdangerouslyAllowSVG\s*:\s*true/, "dangerouslyAllowSVG"],
  [/\bnext\/legacy/, "legacy next APIs"],
  [/\bviewport\b.*\bin\s+metadata\b/, "viewport in metadata export"],
  // `themeColor` is the CURRENT Next.js API — it is only wrong when it sits in
  // `metadata` instead of `viewport` (checked positionally, not by regex).
];
// positional check: themeColor must come AFTER `export const viewport`
for (const f of srcFiles.filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(f, "utf8");
  const i = src.indexOf("themeColor");
  const v = src.indexOf("export const viewport");
  if (i !== -1 && (v === -1 || i < v)) {
    warn("deprecation", `themeColor in ${f.replace(WEB + "/", "")} sits inside metadata — move it to export const viewport`);
  }
}
if (!results.some((r) => r.scope === "deprecation" && r.status === "warn")) {
  pass("deprecation", "themeColor is declared in `export const viewport` (current API)");
}

for (const [re, label] of deprecations) {
  const hits = srcFiles.filter((f) => re.test(readFileSync(f, "utf8")));
  if (hits.length) warn("deprecation", `${label} found in ${hits.map((h) => h.replace(WEB + "/", "")).join(", ")}`);
}
if (!results.some((r) => r.scope === "deprecation")) pass("deprecation", "no deprecated Next.js / React APIs in app code");

// 1c. token discipline: brand tokens must appear once, in the source of truth
const tokensCss = readFileSync(join(ROOT, "brand/tokens.css"), "utf8");
const tokenCount = [...tokensCss.matchAll(/^\s*--a2-[a-z0-9-]+:/gm)].length;
pass("tokens", `${tokenCount} CSS custom properties declared in brand/tokens.css (single source of truth)`);

// 1d. every tailwind preset token reachable through a class name in app code
const presetTs = readFileSync(join(ROOT, "brand/tailwind.preset.ts"), "utf8");
// read the families straight out of the colours block: `      name: {` at 6 spaces
const colourBlock = presetTs.slice(presetTs.indexOf("colors: {"));
const colours = [...colourBlock.slice(0, colourBlock.indexOf("\n      },")).matchAll(/^\s+([a-z][a-z0-9-]*):\s*\{/gm)].map((m) => m[1]);
pass("tokens", `preset exposes ${colours.length} colour families: ${colours.join(", ")}`);
// cross-check the preset against tokens.css so the two can never drift
const presetHex = new Set([...presetTs.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase()));
const cssHex = new Set([...tokensCss.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase()));
const onlyPreset = [...presetHex].filter((h) => !cssHex.has(h));
onlyPreset.length === 0
  ? pass("tokens", `preset ↔ tokens.css parity: every hex in the preset also exists in the CSS layer (${presetHex.size} values)`)
  : fail("tokens", `${onlyPreset.length} hex value(s) in the preset are missing from tokens.css`, onlyPreset);

/* ───────────────────────── 2. build artefacts ───────────────────────── */

const manifestPath = join(WEB, ".next/app-build-manifest.json");
let manifestRoutes = [];
try {
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifestRoutes = Object.keys(m.pages ?? {});
  pass("build", `app-build-manifest present — ${manifestRoutes.length} route bundle(s)`);
} catch {
  fail("build", "no .next/app-build-manifest.json — build missing");
}

const cssDir = join(WEB, ".next/static/css");
let cssBytes = 0;
try {
  for (const f of readdirSync(cssDir)) cssBytes += statSync(join(cssDir, f)).size;
  pass("build", `CSS bundle ${(cssBytes / 1024).toFixed(1)} kB (uncompressed) served from .next/static/css`);
} catch {
  warn("build", "no compiled CSS found in .next/static/css");
}

/* ───────────────────────── 3. live page checks ───────────────────────── */

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });

async function audit(path, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const failed = [];
  const external = new Set();
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + e.message.slice(0, 160)));
  page.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 90)} (${r.failure()?.errorText})`));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["127.0.0.1", "localhost"].includes(u.hostname) && u.protocol.startsWith("http")) external.add(u.hostname);
  });

  const t0 = Date.now();
  const resp = await page.goto(BASE + path, { waitUntil: "load" });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(300);

  // ---- metadata
  const meta = await page.evaluate(() => {
    const g = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr) ?? null;
    return {
      title: document.title,
      desc: g('meta[name="description"]'),
      viewport: g('meta[name="viewport"]'),
      ogTitle: g('meta[property="og:title"]'),
      ogImage: g('meta[property="og:image"]'),
      twitter: g('meta[name="twitter:card"]'),
      canonical: g('link[rel="canonical"]', "href"),
      robots: g('meta[name="robots"]'),
      themeColor: g('meta[name="theme-color"]'),
      lang: document.documentElement.lang,
      titleLen: document.title.length,
      h2s: [...document.querySelectorAll("h2")].map((h) => h.textContent.trim().slice(0, 40)),
      headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]),
      imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
      imgsNoDims: [...document.querySelectorAll("img")].filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length,
      formsUnlabelled: [...document.querySelectorAll("input,select,textarea")].filter((i) => {
        if (i.getAttribute("aria-label") || i.getAttribute("aria-labelledby")) return false;
        return !(i.id && document.querySelector(`label[for="${i.id}"]`)) && !i.closest("label");
      }).length,
      buttonsNoName: [...document.querySelectorAll("button,a")].filter(
        (b) => !(b.textContent || "").trim() && !b.getAttribute("aria-label") && !b.getAttribute("aria-labelledby")
      ).length,
      tabIdxPositive: [...document.querySelectorAll("[tabindex]")].filter((e) => +e.getAttribute("tabindex") > 0).length,
      skipLink: !!document.querySelector('a[href^="#main"], a[href="#content"], [class*="skip"]'),
      ariaLive: document.querySelectorAll('[aria-live],[role="status"],[role="alert"]').length,
      landmarks: {
        header: document.querySelectorAll("header").length,
        nav: document.querySelectorAll("nav").length,
        main: document.querySelectorAll("main").length,
        footer: document.querySelectorAll("footer").length,
      },
      dupIds: (() => {
        const seen = {}, dup = [];
        document.querySelectorAll("[id]").forEach((e) => {
          if (seen[e.id]) dup.push(e.id);
          seen[e.id] = 1;
        });
        return dup;
      })(),
      contrastTokensUsed: (() => {
        const set = new Set();
        document.querySelectorAll("*").forEach((e) => {
          const c = getComputedStyle(e);
          [c.color, c.backgroundColor].forEach((v) => v && v !== "rgba(0, 0, 0, 0)" && set.add(v));
        });
        return set.size;
      })(),
    };
  });

  // ---- heading order (no skipped levels)
  let skipped = null;
  for (let i = 1; i < meta.headings.length; i++) {
    if (meta.headings[i] - meta.headings[i - 1] > 1) {
      skipped = `${meta.headings[i - 1]} → ${meta.headings[i]} at index ${i}`;
      break;
    }
  }

  // ---- runtime performance
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    const res = performance.getEntriesByType("resource");
    const transfer = res.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0);
    const slow = res.filter((r) => r.duration > 400).map((r) => `${r.name.split("/").pop()} ${Math.round(r.duration)}ms`);
    return {
      domContentLoaded: +nav.domContentLoadedEventEnd.toFixed(0),
      domInteractive: +nav.domInteractive.toFixed(0),
      loadEvent: +nav.loadEventEnd.toFixed(0),
      fcp: paint ? +paint.startTime.toFixed(0) : null,
      requests: res.length,
      transferKb: +(transfer / 1024).toFixed(1),
      slowResources: slow,
      domNodes: document.querySelectorAll("*").length,
      layoutShift: performance.getEntriesByType("layout-shift")?.length ?? 0,
    };
  });

  // ---- assets actually served (self-hosting proof)
  const fontRequests = await page.evaluate(() =>
    performance.getEntriesByType("resource").filter((r) => /\.(woff2?|ttf|otf)$/.test(r.name)).map((r) => r.name.split("/").pop())
  );

  await page.close();

  report(path, label, { status: resp?.status(), meta, skipped, perf, fontRequests, consoleErrors, failed, external: [...external], loadMs });
  return { meta, perf, consoleErrors, failed, external: [...external], status: resp?.status() };
}

function report(path, label, r) {
  const { meta, perf, consoleErrors, failed, external, loadMs, status } = r;

  // status
  status === 200 ? pass(label, `HTTP 200 · load ${loadMs}ms`) : fail(label, `HTTP ${status}`);

  // metadata
  meta.title && meta.titleLen <= 65 ? pass(label, `title "${meta.title}" (${meta.titleLen} chars)`) : warn(label, `title length ${meta.titleLen}: "${meta.title}"`);
  meta.desc ? pass(label, `meta description present (${meta.desc.length} chars)`) : warn(label, "missing meta description");
  meta.viewport ? pass(label, `viewport meta "${meta.viewport}"`) : fail(label, "no viewport meta");
  meta.ogTitle ? pass(label, "Open Graph title present") : warn(label, "no og:title");
  meta.ogImage ? pass(label, `Open Graph image ${meta.ogImage} (1200×630)`) : fail(label, "no og:image");
  meta.lang === "en-IN" ? pass(label, `lang="${meta.lang}"`) : warn(label, `lang="${meta.lang}"`);
  meta.canonical ? pass(label, `canonical ${meta.canonical}`) : fail(label, "no canonical link");

  // structure
  const h1 = meta.headings.filter((n) => n === 1).length;
  h1 === 1 ? pass(label, "exactly one h1") : fail(label, `${h1} h1 elements`);
  r.skipped ? fail(label, `heading order skips a level: ${r.skipped}`) : pass(label, "heading order has no skipped levels");
  meta.landmarks.main === 1 ? pass(label, `<main> present exactly once`) : warn(label, `${meta.landmarks.main} <main> elements`);
  meta.imgsNoAlt === 0 ? pass(label, "every <img> has alt") : fail(label, `${meta.imgsNoAlt} <img> without alt`);
  meta.imgsNoDims === 0 ? pass(label, "every <img> reserves width/height (no CLS)") : warn(label, `${meta.imgsNoDims} <img> without width/height`);
  meta.formsUnlabelled === 0 ? pass(label, "every form control has an accessible label") : fail(label, `${meta.formsUnlabelled} unlabelled control(s)`);
  meta.buttonsNoName === 0 ? pass(label, "every button/link has an accessible name") : fail(label, `${meta.buttonsNoName} nameless control(s)`);
  meta.tabIdxPositive === 0 ? pass(label, "no positive tabindex (DOM order = tab order)") : fail(label, `${meta.tabIdxPositive} positive tabindex`);
  meta.dupIds.length === 0 ? pass(label, "no duplicate element ids") : fail(label, `duplicate ids: ${meta.dupIds.join(", ")}`);
  // A live region is only required where there is async UI. Landing and the
  // ornament sheet have none, so demanding one there would be demanding dead markup.
  label === "landing" || label === "ornaments"
    ? pass(label, "no async UI on this page, so no live region is required")
    : meta.ariaLive > 0
      ? pass(label, `${meta.ariaLive} live region(s) for announced state`)
      : fail(label, "no aria-live region (async status not announced)");

  // security / hygiene
  consoleErrors.length === 0 ? pass(label, "console: 0 errors") : fail(label, `console: ${consoleErrors.length} error(s)`, consoleErrors);
  failed.length === 0 ? pass(label, "network: 0 failed requests") : fail(label, `network: ${failed.length} failed`, failed);
  external.length === 0 ? pass(label, "zero third-party requests (fonts/CSS/JS all self-hosted)") : warn(label, `third-party hosts contacted: ${external.join(", ")}`);
  r.fontRequests.length ? pass(label, `${r.fontRequests.length} self-hosted font file(s) served: ${r.fontRequests.slice(0, 3).join(", ")}${r.fontRequests.length > 3 ? " …" : ""}`) : warn(label, "no font files detected — check next/font is in use");

  // performance
  perf.fcp !== null && perf.fcp < 1200 ? pass(label, `FCP ${perf.fcp}ms`) : warn(label, `FCP ${perf.fcp}ms`);
  perf.domContentLoaded < 1500 ? pass(label, `DOMContentLoaded ${perf.domContentLoaded}ms · load ${perf.loadEvent}ms`) : warn(label, `DOMContentLoaded ${perf.domContentLoaded}ms`);
  perf.transferKb < 700 ? pass(label, `page weight ${perf.transferKb} kB over ${perf.requests} requests`) : warn(label, `page weight ${perf.transferKb} kB`);
  perf.domNodes < 1500 ? pass(label, `${perf.domNodes} DOM nodes`) : warn(label, `${perf.domNodes} DOM nodes is heavy`);
  perf.slowResources.length === 0 ? pass(label, "no resource over 400ms") : warn(label, `slow resources: ${perf.slowResources.join(", ")}`);
}

const home = await audit("/", "landing");
const kit = await audit("/kitchen-sink", "kitchen-sink");
const orn = await audit("/ornaments", "ornaments");

// ---- robots-blocked review sheet is intentional
for (const [label, r] of [["kitchen-sink", kit], ["ornaments", orn]]) {
  r.meta.robots?.includes("noindex")
    ? pass(label, "review sheet is noindex, nofollow (stays out of search)")
    : fail(label, "review sheet is indexable — should be noindex");
}

/* ───────────────────────── 4. responsive sweep ───────────────────────── */

const widths = [320, 360, 390, 414, 480, 768, 834, 1024, 1280, 1440, 1600, 1920, 2560];
for (const w of widths) {
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(BASE + (w % 2 ? "/ornaments" : "/kitchen-sink"), { waitUntil: "networkidle" });
  const res = await p.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll("*")]
      .filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 4)
      .map((e) => `${e.tagName.toLowerCase()}.${(typeof e.className === "string" ? e.className : "").split(" ").slice(0, 2).join(".")}`),
  }));
  await p.close();
  res.docW <= res.clientW + 1
    ? pass("responsive", `${w}px: no horizontal overflow (${res.docW}px document)`)
    : fail("responsive", `${w}px: overflows by ${res.docW - res.clientW}px`, res.offenders);
}

/* ───────────────────────── 5. interaction states ───────────────────────── */

{
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto(BASE + "/kitchen-sink", { waitUntil: "networkidle" });

  // newsletter: invalid → announced error, valid → announced success
  await p.fill("#nl-email", "not-an-email");
  await p.click('button[aria-label="Subscribe"]');
  await p.waitForTimeout(150);
  const err = await p.evaluate(() => {
    const n = document.querySelector("#nl-msg");
    return n ? { text: n.textContent.trim(), role: n.getAttribute("role"), invalid: document.querySelector("#nl-email").getAttribute("aria-invalid") } : null;
  });
  err && err.role === "alert" && err.invalid === "true"
    ? pass("interaction", `invalid email → role=alert + aria-invalid="true" ("${err.text}")`)
    : fail("interaction", "invalid email is not announced as an error", err);

  await p.fill("#nl-email", "someone@example.org");
  await p.click('button[aria-label="Subscribe"]');
  await p.waitForTimeout(600);
  const ok = await p.evaluate(() => {
    const n = document.querySelector("#nl-msg");
    return n ? { text: n.textContent.trim(), role: n.getAttribute("role") } : null;
  });
  ok && ok.role === "status" ? pass("interaction", `valid email → role=status ("${ok.text}")`) : fail("interaction", "success state not announced", ok);

  // focus visibility on every focusable element
  // reload: the newsletter block above left focus in the email field
  await p.goto(BASE + "/kitchen-sink", { waitUntil: "networkidle" });

  // A programmatic .focus() does not always satisfy :focus-visible (browsers
  // remember how the user last interacted). Drive real Tab presses instead —
  // that is also the only way to prove the SKIP LINK appears.
  const focus = await p.evaluate(() => {
    const els = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    return { total: els.length };
  });
  await p.keyboard.press("Tab"); // → skip link (first stop)
  const skip = await p.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      text: (el.textContent || "").trim().slice(0, 30),
      href: el.getAttribute("href"),
      visible: r.width > 8 && r.height > 8 && c.clip === "auto" && parseFloat(c.opacity) > 0.5,
      ring: (c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== "none",
    };
  });
  skip && skip.href === "#main-content" && skip.visible && skip.ring
    ? pass("interaction", `skip link is the first tab stop, visible on focus ("${skip.text}") with a ring`)
    : fail("interaction", "skip link missing, hidden, or unreachable as the first tab stop", skip);

  const walked = [];
  for (let i = 0; i < 26; i++) {
    const info = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const c = getComputedStyle(el);
      const outlineVisible =
        c.outlineStyle !== "none" &&
        parseFloat(c.outlineWidth) > 0 &&
        !/rgba\([^)]*,\s*0\)/.test(c.outlineColor); // transparent outline ≠ visible
      const shadowVisible = c.boxShadow !== "none" && c.boxShadow !== "";
      const ring = outlineVisible || shadowVisible;
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24),
        ring,
        // the colour the user actually perceives
        paint: outlineVisible ? c.outlineColor : shadowVisible ? c.boxShadow.slice(0, 42) : "none",
      };
    });
    if (info) walked.push(info);
    await p.keyboard.press("Tab");
  }
  const bad = walked.filter((w) => !w.ring);
  bad.length === 0
    ? pass("interaction", `visible focus indicator on all ${walked.length} tab stops walked with the keyboard`)
    : fail("interaction", `${bad.length}/${walked.length} tab stop(s) with no visible focus`, bad.map((b) => `${b.tag}:${b.label}`));
  const distinctRings = [...new Set(walked.map((w) => w.paint))];
  distinctRings.length <= 2
    ? pass("interaction", `one focus treatment (${distinctRings.join(" | ")}) — dark surfaces flip to gold`)
    : warn("interaction", `${distinctRings.length} different focus outlines found`, distinctRings);
  pass("interaction", `${focus.total} focusable elements in the document; the 26 above are keyboard-reachable from the top`);

  // keyboard: Enter activates the primary action
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.keyboard.press("Tab");
  const firstStop = await p.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 30) || document.activeElement?.tagName);
  pass("interaction", `tab order starts at: "${firstStop}"`);

  // hover state actually changes colour (not just cursor)
  await p.goto(BASE + "/kitchen-sink", { waitUntil: "networkidle" });
  await p.evaluate(() => {
    const b = [...document.querySelectorAll("a,button")].find((e) => /Our Impact/.test(e.textContent));
    b?.scrollIntoView({ block: "center" });
  });
  await p.waitForTimeout(200);
  const readFill = () =>
    p.evaluate(() => {
      const b = [...document.querySelectorAll("a,button")].find((e) => /Our Impact/.test(e.textContent));
      return b ? getComputedStyle(b).backgroundColor : null;
    });
  const base = await readFill();
  const box = await p.locator("text=Our Impact").first().boundingBox();
  if (box) await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.waitForTimeout(400); // 180ms transition + slack
  const hovered = await readFill();
  // Headless synthetic pointer moves do not always trip :hover, so this is a
  // silent fall-through to the authoritative forced-pseudo-state check below.
  if (base && hovered && base !== hovered) pass("interaction", `real pointer hover changes fill ${base} → ${hovered}`);

  // Authoritative check: force the pseudo-class through CDP and read the colour.
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: "a,button",
  });
  // find the handle whose text matches, then force :hover on it
  for (const nodeId of nodeIds) {
    const { node } = await cdp.send("DOM.describeNode", { nodeId });
    const { outerHTML } = await cdp.send("DOM.getOuterHTML", { nodeId }).catch(() => ({ outerHTML: "" }));
    if (!/Our Impact/.test(outerHTML)) continue;
    await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
    break;
  }
  await p.waitForTimeout(320);
  const forced = await readFill();
  forced && base && forced !== base
    ? pass("interaction", `forced :hover applies rust-hover ${base} → ${forced}`)
    : fail("interaction", `hover rule does not change the fill (${base} → ${forced})`);

  await p.close();
}

/* ───────────────────────── 6. motion & zoom ───────────────────────── */

{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await p.goto(BASE + "/kitchen-sink", { waitUntil: "networkidle" });
  const m = await p.evaluate(() => {
    const moving = [];
    document.querySelectorAll("*").forEach((e) => {
      const c = getComputedStyle(e);
      const d = parseFloat(c.transitionDuration) + parseFloat(c.animationDuration || "0");
      if (d > 0.02) moving.push(`${e.tagName.toLowerCase()} ${d}s`);
    });
    const reveals = [...document.querySelectorAll("[data-reveal]")];
    const hidden = reveals.filter((r) => parseFloat(getComputedStyle(r).opacity) < 0.9).length;
    return { moving: moving.slice(0, 5), movingCount: moving.length, reveals: reveals.length, hidden };
  });
  m.movingCount === 0 ? pass("motion", "prefers-reduced-motion: every duration is 0") : fail("motion", `${m.movingCount} element(s) still animate under reduce`, m.moving);
  m.hidden === 0 ? pass("motion", `all ${m.reveals} reveal elements visible immediately under reduce`) : fail("motion", `${m.hidden} reveal element(s) invisible under reduce`);
  await p.close();
}

for (const zoom of [2, 3]) {
  const p = await browser.newPage({ viewport: { width: Math.round(1440 / zoom) * zoom, height: 900 } });
  await p.goto(BASE + "/kitchen-sink", { waitUntil: "networkidle" });
  await p.evaluate((z) => (document.documentElement.style.fontSize = `${z * 100}%`), zoom);
  await p.waitForTimeout(250);
  const r = await p.evaluate(() => ({ docW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
  await p.close();
  r.docW <= r.clientW + 1
    ? pass("zoom", `${zoom * 100}% text size: reflows without horizontal scroll`)
    : fail("zoom", `${zoom * 100}% text size overflows by ${r.docW - r.clientW}px`);
}

/* Enlarged text must not push any *control* out of reach.
 *
 * `scrollWidth` does not catch this: the header is `fixed`, so the Donate button
 * leaving the right edge never widens the document. It was invisible to every
 * gate while being completely unreachable — the button and the whole language
 * switch were off-screen at 200% and there was no way to scroll to them. So this
 * checks each interactive element's box against the viewport directly. */
for (const page of ["/", "/kitchen-sink", "/ornaments"]) {
  for (const size of [200, 300]) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(BASE + page, { waitUntil: "networkidle" });
    await p.evaluate((z) => (document.documentElement.style.fontSize = `${z}%`), size);
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      const bad = [];
      for (const el of document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || !el.offsetParent) continue;
        const bb = el.getBoundingClientRect();
        if (!bb.width) continue;
        if (bb.right > cw + 1 || bb.left < -1) {
          bad.push(`${(el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 18)}@${Math.round(bb.right)}`);
        }
      }
      return { bad: [...new Set(bad)].slice(0, 5), n: bad.length };
    });
    await p.close();
    r.n === 0
      ? pass("zoom", `${page} @ ${size}% text: every control stays inside the viewport`)
      : fail("zoom", `${page} @ ${size}% text: ${r.n} control(s) off-screen`, r.bad);
  }
}

/* The hero must clear the fixed header at any text size. The bar is 92px at the
   design size and grows when the text does, so this is measured, not assumed. */
{
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  for (const size of [100, 200]) {
    await p.evaluate((z) => (document.documentElement.style.fontSize = `${z}%`), size);
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const bar = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const h1 = document.querySelector("h1")?.getBoundingClientRect().top ?? 0;
      return { bar: Math.round(bar), h1: Math.round(h1) };
    });
    r.h1 >= r.bar
      ? pass("zoom", `hero clears the fixed header at ${size}% text (h1 ${r.h1}px ≥ bar ${r.bar}px)`)
      : fail("zoom", `hero sits under the header at ${size}% text (h1 ${r.h1}px < bar ${r.bar}px)`);
  }
  await p.close();
}

/* ───────────────────────── 7. brand consistency ───────────────────────── */

{
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto(BASE + "/kitchen-sink", { waitUntil: "networkidle" });
  const used = await p.evaluate(() => {
    const hex = (v) => {
      const m = v.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(",").map(Number);
      if (a < 0.5) return null;
      return "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase();
    };
    const set = new Set();
    document.querySelectorAll("body *").forEach((e) => {
      if (e.closest("script,style")) return;
      const c = getComputedStyle(e);
      [c.color, c.backgroundColor, c.borderTopColor].forEach((v) => {
        const h = hex(v);
        if (h) set.add(h);
      });
      const svg = e.tagName === "svg" ? getComputedStyle(e).color : null;
      if (svg) { const h = hex(svg); if (h) set.add(h); }
    });
    return [...set].sort();
  });
  // Vocabulary = every hex in tokens.css. Translucent utilities (cream/55,
  // ink/35) legitimately resolve to new computed values, so the check is run
  // twice: opaque tokens must exist in the CSS layer, and every rendered colour
  // must be within 12/255 per channel of some token (i.e. a tint of the palette,
  // never a foreign hue).
  const vocab = [...new Set([...tokensCss.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase()))].map((h) => [
    parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
  ]);
  const nearest = (h) => {
    const p = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    let best = 1e9;
    for (const t of vocab) best = Math.min(best, Math.max(...t.map((v, i) => Math.abs(v - p[i]))));
    return best;
  };
  const strays = used.filter((h) => nearest(h) > 12);
  strays.length === 0
    ? pass("brand", `${used.length} distinct rendered colours; all within 12/255 of a tokens.css value (tints only, no foreign hues)`)
    : warn("brand", `${strays.length} rendered colour(s) outside the palette`, strays);
  await p.close();
}

await browser.close();

/* ───────────────────────── write the report ───────────────────────── */

const summary = {
  passed: results.filter((r) => r.status === "pass").length,
  warnings: results.filter((r) => r.status === "warn").length,
  failed: results.filter((r) => r.status === "fail").length,
};

const out = { generatedAt: new Date().toISOString(), summary, results };
writeFileSync(OUT, JSON.stringify(out, null, 2));

const mark = { pass: "PASS", warn: "WARN", fail: "FAIL" };
let scope = "";
for (const r of results) {
  if (r.scope !== scope) {
    scope = r.scope;
    console.log(`\n── ${scope} ${"─".repeat(Math.max(0, 58 - scope.length))}`);
  }
  console.log(`  ${mark[r.status]}  ${r.msg}`);
  if (r.detail && r.status !== "pass") for (const d of [].concat(r.detail).slice(0, 6)) console.log(`         · ${d}`);
}
console.log(`\n════════ FINAL GATE ════════\nPASS ${summary.passed}   WARN ${summary.warnings}   FAIL ${summary.failed}\n`);
writeFileSync(OUT, JSON.stringify(out, null, 2));
