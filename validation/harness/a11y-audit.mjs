/**
 * A2 Foundation — Phase 1 validation harness
 * -------------------------------------------------------------------------
 * Runs against the built site (next start on :3100) and produces
 * validation/report.json + human summary. Checks:
 *   1. axe-core accessibility scan (WCAG 2.0/2.1/2.2 A+AA + best practice)
 *   2. Contrast computed from live styles (not from tokens on faith)
 *   3. Horizontal overflow at 5 widths
 *   4. Keyboard: tab order, focus visibility, skip/landmark presence
 *   5. Motion: prefers-reduced-motion honoured
 *   6. Touch target sizes (>= 44px for primary controls)
 *   7. Fonts actually applied (next/font hashed families)
 *   8. Console/network errors
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.BASE ?? 'http://127.0.0.1:3100';
// OUT is the report FILE; BASE/REPORT overrides let the same harness audit an
// upgrade candidate (e.g. Next 16 on :3200) without touching the canonical run.
const OUT = process.env.REPORT ?? join(ROOT, 'validation/report.json');
fs.mkdirSync(dirname(OUT), { recursive: true });

const report = { generatedAt: new Date().toISOString(), pages: {}, checks: {} };
const fail = [];
const warn = [];
const pass = [];

function record(status, area, detail) {
  (status === 'fail' ? fail : status === 'warn' ? warn : pass).push(`${area} — ${detail}`);
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

/* ───────────────────────── 1 + 2 + 8: per-page audit ───────────────────── */
async function auditPage(path, label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)));
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message.slice(0, 200)));
  page.on('requestfailed', (r) => failedRequests.push(`${r.url().slice(-60)} ${r.failure()?.errorText}`));

  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // ---- axe-core
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();

  const axeViolations = axe.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));

  // ---- contrast measured from computed styles
  const contrast = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((v) => parseFloat(v.trim()));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const blend = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const effectiveBg = (el) => {
      let node = el;
      let acc = null;
      while (node && node !== document.documentElement) {
        const bg = parse(getComputedStyle(node).backgroundColor);
        if (bg && bg.a > 0) {
          acc = acc ? blend(acc, bg) : bg;
          if (bg.a === 1) return acc;
        }
        node = node.parentElement;
      }
      return acc || { r: 255, g: 255, b: 255, a: 1 };
    };
    const ratio = (a, b) => {
      const la = lum(a), lb = lum(b);
      const hi = Math.max(la, lb), lo = Math.min(la, lb);
      return (hi + 0.05) / (lo + 0.05);
    };

    // A visually-hidden node (sr-only: 1px box, clipped) paints no glyphs, so it
    // cannot fail a contrast check — axe skips it too. Skip it here as well,
    // otherwise every sr-only label inside a dark band is reported as 1:1 text.
    const isVisuallyHidden = (el, cs) => {
      if (el.getAttribute('aria-hidden') === 'true') return true;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return true;
      if ((cs.clip && cs.clip !== 'auto') || (cs.clipPath && cs.clipPath !== 'none')) return true;
      if (cs.position === 'absolute' && cs.overflow === 'hidden' && r.width <= 2) return true;
      return false;
    };

    const sel = 'p,h1,h2,h3,h4,span,a,button,label,li,strong,em,code';
    const results = [];
    const seen = new Set();
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent || '').trim();
      if (!text || el.children.length > 2) return;
      // Only measure elements that actually paint glyphs themselves. A wrapper
      // around a coloured child inherits the wrong colour and reports a bogus
      // 1:1, which is how phantom failures get into the report.
      const hasOwnText = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent.trim()
      );
      if (!hasOwnText) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.1) return;
      if (isVisuallyHidden(el, cs)) return;
      const fg = parse(cs.color);
      if (!fg) return;
      const bg = effectiveBg(el);
      const fgOnBg = fg.a < 1 ? blend(fg, bg) : fg;
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      const r = ratio(fgOnBg, bg);
      const key = `${text.slice(0, 24)}|${Math.round(size)}|${cs.color}|${r.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push({
        text: text.slice(0, 42),
        size: +size.toFixed(1),
        weight,
        ratio: +r.toFixed(2),
        need,
        pass: r >= need,
        fg: cs.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      });
    });
    return results;
  });

  const contrastFails = contrast.filter((c) => !c.pass);

  // ---- keyboard: first 12 tab stops, focus ring visibility
  const tabStops = [];
  await page.keyboard.press('Tab');
  for (let i = 0; i < 12; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 34),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        boxShadow: cs.boxShadow !== 'none',
        rect: (() => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
      };
    });
    if (info) tabStops.push(info);
    await page.keyboard.press('Tab');
  }

  // ---- landmarks + headings
  const structure = await page.evaluate(() => ({
    hasMain: !!document.querySelector('main'),
    mains: document.querySelectorAll('main').length,
    h1Count: document.querySelectorAll('h1').length,
    h1Text: document.querySelector('h1')?.textContent?.trim().slice(0, 60) || null,
    headingOrder: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]),
    imagesWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    svgDecorative: [...document.querySelectorAll('svg')].filter((s) => s.getAttribute('aria-hidden') === 'true').length,
    svgTotal: document.querySelectorAll('svg').length,
    lang: document.documentElement.lang,
  }));

  // ---- fonts actually applied
  const fonts = await page.evaluate(() => {
    const body = getComputedStyle(document.body).fontFamily;
    const h = document.querySelector('h1, h2, .font-display');
    return { body, display: h ? getComputedStyle(h).fontFamily : null };
  });

  // ---- touch targets on primary controls
  const smallTargets = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, a[class*="a2-btn"], a[href]').forEach((el) => {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const isInlineLink = el.tagName === 'A' && !el.className.includes('a2-btn') && !el.className.includes('bg-');
      if (isInlineLink) return; // inline text links are exempt (WCAG 2.5.8 exception)
      if (r.height < 44 || r.width < 24) {
        out.push({
          tag: el.tagName.toLowerCase(),
          text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
          w: Math.round(r.width), h: Math.round(r.height),
        });
      }
    });
    return out;
  });

  report.pages[label] = {
    path,
    axeViolations,
    contrastChecked: contrast.length,
    contrastFailures: contrastFails,
    tabStops,
    structure,
    fonts,
    smallTargets,
    consoleErrors,
    failedRequests,
  };

  if (axeViolations.length) record('fail', label, `axe: ${axeViolations.length} rule(s) violated — ${axeViolations.map((v) => v.id).join(', ')}`);
  else record('pass', label, 'axe-core: 0 violations (WCAG 2.2 A/AA + best practice)');

  if (contrastFails.length) record('fail', label, `contrast: ${contrastFails.length} text node(s) below threshold`);
  else record('pass', label, `contrast: all ${contrast.length} unique text/background pairs pass`);

  if (consoleErrors.length) record('fail', label, `console errors: ${consoleErrors.length}`);
  else record('pass', label, 'console: 0 errors');

  if (failedRequests.length) record('fail', label, `failed requests: ${failedRequests.length}`);
  else record('pass', label, 'network: 0 failed requests');

  if (structure.h1Count !== 1) record('warn', label, `h1 count = ${structure.h1Count}`);
  else record('pass', label, 'exactly one h1');

  if (!structure.hasMain) record('fail', label, 'no <main> landmark');
  else record('pass', label, 'main landmark present');

  if (structure.imagesWithoutAlt > 0) record('fail', label, `${structure.imagesWithoutAlt} img without alt`);
  else record('pass', label, 'all images have alt');

  const noRing = tabStops.filter((t) => !t.outline && !t.boxShadow);
  if (noRing.length) record('warn', label, `${noRing.length} tab stop(s) without a visible ring`);
  else record('pass', label, `focus ring visible on all ${tabStops.length} sampled tab stops`);

  if (smallTargets.length) record('warn', label, `${smallTargets.length} control(s) under 44px height`);
  else record('pass', label, 'all primary controls ≥ 44px');

  const bodyOk = /__Inter|Inter/.test(fonts.body);
  const dispOk = fonts.display && /__Newsreader|Newsreader/.test(fonts.display);
  if (bodyOk && dispOk) record('pass', label, 'fonts: Inter + Newsreader applied (next/font)');
  else record('fail', label, `fonts not applied — body:${fonts.body} display:${fonts.display}`);

  await ctx.close();
}

await auditPage('/kitchen-sink', 'kitchen-sink');
await auditPage('/ornaments', 'ornaments');
await auditPage('/', 'landing');

/* ───────────────────────── 3: responsive overflow ──────────────────────── */
const widths = [360, 390, 768, 1024, 1440, 1920];
report.checks.overflow = [];
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/kitchen-sink', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const offenders = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > docW + 1.5 || r.left < -1.5) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 50),
          left: Math.round(r.left), right: Math.round(r.right),
        });
      }
    });
    return {
      docW,
      scrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      offenders: offenders.slice(0, 6),
      offenderCount: offenders.length,
    };
  });
  report.checks.overflow.push({ width: w, ...res });
  if (res.scrollW > res.docW + 1) record('fail', 'overflow', `${w}px: horizontal scroll (scrollWidth ${res.scrollW} > ${res.docW})`);
  else if (res.offenderCount > 0) record('warn', 'overflow', `${w}px: no scroll, but ${res.offenderCount} element(s) extend past the viewport`);
  else record('pass', 'overflow', `${w}px: no horizontal overflow`);
  await ctx.close();
}

/* ───────────────────────── 4/5: reduced motion + zoom ──────────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/kitchen-sink', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const motion = await page.evaluate(() => {
    const sample = document.querySelector('.a2-reveal');
    const cs = sample ? getComputedStyle(sample) : null;
    const visible = sample
      ? parseFloat(cs.opacity) > 0.9 && (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)')
      : null;
    // count anything still animating
    let running = 0;
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);
      const dur = parseFloat(s.transitionDuration) || 0;
      const anim = parseFloat(s.animationDuration) || 0;
      if (dur > 0.05 || anim > 0.05) running++;
    });
    return { revealVisible: visible, elementsWithMotion: running, prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
  });
  report.checks.reducedMotion = motion;
  if (motion.elementsWithMotion > 0) record('warn', 'reduced-motion', `${motion.elementsWithMotion} element(s) still carry a non-zero duration`);
  else record('pass', 'reduced-motion', 'all transition/animation durations collapse to ~0');
  if (motion.revealVisible === false) record('fail', 'reduced-motion', 'reveal content is invisible under reduce');
  else record('pass', 'reduced-motion', 'reveal content is visible immediately under reduce');
  await ctx.close();
}

/* ───────────────────────── 6: 200% zoom (WCAG 1.4.4 proxy) ─────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/kitchen-sink', { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.waitForTimeout(500);
  const zoom = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  report.checks.zoom200 = zoom;
  if (zoom.scrollW > zoom.clientW + 1) record('fail', 'zoom-200%', `horizontal scroll at 200% text size (${zoom.scrollW} > ${zoom.clientW})`);
  else record('pass', 'zoom-200%', 'no horizontal scroll at 200% text size');
  await ctx.close();
}

/* ─────────── focus visibility, walked in real tab order ───────────
 * axe checks that a focusable element *exists* and is reachable; it does not
 * check that focusing it produces a visible change. Neither does `outline-style`
 * alone: Tailwind's `focus-visible:outline-none` compiles to
 * `outline: 2px solid transparent`, so a fully invisible ring still reports
 * `solid` with a non-zero width. Twelve tab stops (the focus cards, story cards,
 * news cards, Get Involved rows and the newsletter input) shipped that way.
 *
 * So this presses Tab and reads the computed outline *colour's alpha* on each
 * stop. That is the check that would have caught it. */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const stops = [];
  let prev = '';
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const a = (cs.outlineColor.match(/[\d.]+/g) || []);
      return {
        label: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 28),
        w: parseFloat(cs.outlineWidth) || 0,
        style: cs.outlineStyle,
        alpha: a.length === 4 ? parseFloat(a[3]) : 1,
        shadow: cs.boxShadow !== 'none',
      };
    });
    if (!r) break;
    if (r.label === prev) break;
    prev = r.label;
    stops.push(r);
  }

  const blind = stops.filter((r) => !((r.w > 0 && r.style !== 'none' && r.alpha > 0.1) || r.shadow));
  report.checks.focusRing = { stops: stops.length, blind: blind.map((r) => r.label) };
  if (stops.length < 10) record('warn', 'focus-ring', `only ${stops.length} tab stops reached`);
  else if (blind.length) record('fail', 'focus-ring', `${blind.length}/${stops.length} tab stops have no visible focus indicator: ${blind.slice(0, 6).map((b) => b.label).join(', ')}`);
  else record('pass', 'focus-ring', `all ${stops.length} tab stops show a visible focus indicator`);
  await ctx.close();
}

report.summary = { passed: pass.length, warnings: warn.length, failed: fail.length };
report.pass = pass; report.warn = warn; report.fail = fail;
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

console.log('\n════════════ VALIDATION SUMMARY ════════════');
console.log(`PASS ${pass.length}   WARN ${warn.length}   FAIL ${fail.length}\n`);
if (fail.length) { console.log('FAILURES'); fail.forEach((f) => console.log('  ✗ ' + f)); }
if (warn.length) { console.log('\nWARNINGS'); warn.forEach((w) => console.log('  ! ' + w)); }
console.log('\n(json written to validation/report.json)');
await browser.close();
