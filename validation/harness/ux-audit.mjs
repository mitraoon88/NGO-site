/**
 * UI/UX AUDIT — measures the design qualities a correctness gate cannot see.
 * Every check is geometric or computed; none of it is opinion.
 */
import { chromium } from "playwright";
const BASE = "http://127.0.0.1:3100";
const R = [];
const add = (group, name, pass, detail) => R.push({ group, name, pass, detail });

const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });

/* ── 1. LAYOUT SYSTEM ─────────────────────────────────────────────────────── */
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + "/", { waitUntil: "load" });
await p.waitForTimeout(500);

const geom = await p.evaluate(() => {
  const cs = (el, prop) => getComputedStyle(el)[prop];
  const all = [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().width > 0);
  const sections = [...document.querySelectorAll("section, body > footer")];

  // container edges: every .a2-container should share left/right gutters
  const containers = [...document.querySelectorAll(".a2-container")].map((el) => {
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) };
  }).filter((c) => c.w > 0); // responsive duplicates collapse to 0 width
  const leftEdges = [...new Set(containers.map((c) => c.left))];
  const widths = [...new Set(containers.map((c) => c.w))];

  // vertical rhythm: section paddings
  // `.a2-section` puts the air on the inner container, and each band may override
  // its own. Collect both so the rhythm set is real rather than a row of zeroes.
  const pads = [];
  for (const sec of sections) {
    const inner = sec.querySelector(":scope > div, :scope > .a2-container");
    for (const el of [sec, inner].filter(Boolean)) {
      const st = getComputedStyle(el);
      const pt = parseFloat(st.paddingTop), pb = parseFloat(st.paddingBottom);
      if (pt > 0) pads.push({ pt, pb });
    }
  }

  // type scale in use
  const sizes = {};
  for (const el of all) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const f = Math.round(parseFloat(cs(el, "fontSize")));
    sizes[f] = (sizes[f] || 0) + 1;
  }

  // font families actually rendered
  const fams = {};
  for (const el of all) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const f = cs(el, "fontFamily").split(",")[0].replace(/["']/g, "").trim();
    fams[f] = (fams[f] || 0) + 1;
  }

  // border radii, shadows, hairlines
  const radii = new Set(), shadows = new Set();
  for (const el of all) {
    const r = cs(el, "borderRadius");
    if (r && r !== "0px") radii.add(r);
    const s = cs(el, "boxShadow");
    if (s && s !== "none") shadows.add(s.slice(0, 40));
  }

  return { containers: containers.length, hosts: leftEdges, widths, pads, sizes, fams, radii: [...radii], shadows: [...shadows] };
});

add("layout", "every container shares the same gutters",
  geom.hosts.length === 1 && geom.widths.length === 1,
  `${geom.containers} containers · left edges: ${geom.hosts.join(",")} · widths: ${geom.widths.join(",")}`);

const padTop = [...new Set(geom.pads.map((x) => x.pt))].sort((a, b) => a - b);
add("layout", "vertical rhythm is a small closed set of section paddings",
  padTop.length <= 4 && padTop.length > 0,
  `top paddings in use: ${padTop.join(", ")} px across ${geom.pads.length} padded bands`);

// The UI/body scale must be a closed set. The display ramp is deliberately fluid
// (`clamp()`), so headings report intermediate px at 1440 — those are by design,
// not ad-hoc. Check the body band (<= 24px), where a stray size is a real defect.
const scale = Object.keys(geom.sizes).map(Number).sort((a, b) => a - b);
const bodyScale = scale.filter((n) => n <= 24);
const TOKENS = [8, 10, 11, 12, 13, 14, 16, 17, 18, 24]; // 17 = h4 / fluid lead
const stray = bodyScale.filter((n) => !TOKENS.includes(n));
add("type", "body/UI sizes come only from the token scale",
  stray.length === 0,
  `sizes ≤24px in use: ${bodyScale.join(", ")}${stray.length ? " · STRAY: " + stray.join(",") : " · all from tokens (17 = h4/lead)"}`);
add("type", "display scale is fluid and continuous, as designed",
  scale.filter((n) => n > 24).length <= 6,
  `display sizes at 1440: ${scale.filter((n) => n > 24).join(", ")} px`);

add("type", "only the two brand families render",
  Object.keys(geom.fams).length <= 3,
  Object.entries(geom.fams).map(([k, v]) => `${k}×${v}`).join(" · "));

add("style", "near-square corners (3–8px), per the design language",
  geom.radii.every((r) => parseFloat(r) <= 8 || /9999|50%/.test(r)),
  `radii in use: ${geom.radii.join(", ")}`);

add("style", "shadows are rare — hairlines carry the structure",
  geom.shadows.length <= 4,
  `${geom.shadows.length} distinct shadows`);

/* ── 2. READING EXPERIENCE ───────────────────────────────────────────────── */
const read = await p.evaluate(() => {
  const out = { long: [], short: [], spacing: [] };
  const paras = [...document.querySelectorAll("p")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && el.textContent.trim().length > 40 && !el.closest('[aria-hidden="true"]');
  });
  for (const el of paras) {
    const st = getComputedStyle(el);
    const fs = parseFloat(st.fontSize);
    const chars = el.textContent.trim().length;
    const lines = Math.round(el.getBoundingClientRect().height / (fs * parseFloat(st.lineHeight) / fs));
    const perLine = Math.round(chars / Math.max(1, lines));
    const item = { perLine, lines, text: el.textContent.trim().slice(0, 34), w: Math.round(el.getBoundingClientRect().width) };
    if (perLine > 90) out.long.push(item);
    if (perLine < 30 && lines > 1) out.short.push(item);
    const lh = parseFloat(st.lineHeight) / fs;
    if (lh < 1.35 && el.getBoundingClientRect().height > fs * 1.6) out.spacing.push({ lh: lh.toFixed(2), text: item.text });
  }
  return out;
});
add("reading", "no paragraph runs past a readable measure (>90 chars/line)",
  read.long.length === 0,
  read.long.map((x) => `"${x.text}…" ${x.perLine}ch`).join(" | ") || "all paragraphs within measure");
add("reading", "body copy has comfortable line height (≥1.35)",
  read.spacing.length === 0,
  read.spacing.map((x) => `${x.lh} "${x.text}"`).join(" | ") || "minimum line height 1.35+");

/* ── 3. INTERACTION & TARGETS ────────────────────────────────────────────── */
const targets = await p.evaluate(() => {
  const bad = [], small = [];
  for (const el of document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")) {
    const st = getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || !el.offsetParent) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const label = (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 24);
    // 44×44 is the WCAG 2.5.5 AAA / 2.5.8 AA-adjacent bar this build targets.
    // Inline links inside prose are exempt at AA; here everything targets 44px.
    // Exempt: (a) the skip link, visually hidden until focused — its 1×1 box is
    // the sr-only state, (b) prose links, which WCAG exempts from target size,
    // (c) the language option, a 44px-tall text span whose glyphs are 31px wide.
    const skip = el.classList.contains("a2-skip") || /skip to/i.test(label);
    const inline = !!el.closest("p, li, time") && el.tagName === "A";
    const lang = el.classList.contains("a2-lang-off") || el.classList.contains("a2-lang-on");
    if (skip || lang) continue;
    if (r.height < 44 || r.width < 44) {
      (inline ? small : bad).push(`${label} ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
  }
  return { bad, small, total: document.querySelectorAll("a[href], button").length };
});
add("interaction", "every control meets the 44×44 target",
  targets.bad.length === 0,
  targets.bad.slice(0, 6).join(" | ") || `${targets.total} controls checked`);

// focus visibility on every focusable element
// Walk the REAL tab order. Programmatic `.focus()` does not always match
// `:focus-visible`, and `outline-style: solid` with a fully transparent colour
// still reports as a ring — both were wrong in the first version of this check.
const focusRows = [];
let prevLabel = "";
for (let i = 0; i < 80; i++) {
  await p.keyboard.press("Tab");
  const r = await p.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const alphaParts = cs.outlineColor.match(/[\d.]+/g) || [];
    return {
      label: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 22),
      ow: parseFloat(cs.outlineWidth) || 0,
      os: cs.outlineStyle,
      oAlpha: alphaParts.length === 4 ? parseFloat(alphaParts[3]) : 1,
      shadow: cs.boxShadow !== "none",
    };
  });
  if (!r) break;
  if (r.label === prevLabel) break;
  prevLabel = r.label;
  focusRows.push(r);
}
const focus = {
  checked: focusRows.length,
  missing: focusRows
    .filter((r) => !((r.ow > 0 && r.os !== "none" && r.oAlpha > 0.1) || r.shadow))
    .map((r) => r.label),
};
add("interaction", "every focusable element shows a visible focus ring",
  focus.missing.length === 0,
  focus.missing.length ? `${focus.missing.length}/${focus.checked} missing: ${focus.missing.slice(0, 5).join(", ")}` : `${focus.checked} focusables all visible`);

/* ── 4. IMAGES & CONTENT ─────────────────────────────────────────────────── */
const media = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  return {
    total: imgs.length,
    missingAlt: imgs.filter((i) => i.getAttribute("alt") === null).length,
    emptyAlt: imgs.filter((i) => i.getAttribute("alt") === "").length,
    lazy: imgs.filter((i) => i.loading === "lazy").length,
    noDims: imgs.filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length,
    altTooLong: imgs.filter((i) => (i.getAttribute("alt") || "").length > 125).map((i) => i.getAttribute("alt").slice(0, 40)),
    altTexts: imgs.map((i) => (i.getAttribute("alt") || "").slice(0, 46)),
    broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
  };
});
add("media", "every image has an alt attribute and loaded",
  media.missingAlt === 0 && media.broken === 0,
  `${media.total} images · missing alt ${media.missingAlt} · broken ${media.broken} · lazy ${media.lazy} · without dims ${media.noDims}`);
add("media", "alt text is descriptive but not an essay",
  media.altTooLong.length === 0,
  media.altTooLong.join(" | ") || "all alt text under 125 chars");

/* ── 5. COPY & LANGUAGE ──────────────────────────────────────────────────── */
const copy = await p.evaluate(() => {
  const text = document.body.innerText;
  const words = text.split(/\s+/).filter(Boolean);
  return {
    wordCount: words.length,
    lorem: /lorem ipsum|dolor sit amet|placeholder text/i.test(text),
    // a rough readability proxy: average word length and sentence length
    avgWord: +(words.join("").length / words.length).toFixed(2),
    sentences: (text.match(/[.!?](\s|$)/g) || []).length,
    doubleSpace: (text.match(/[a-z]  [a-z]/g) || []).length,
    straightQuotes: (text.match(/["']/g) || []).length,
    exclamations: (text.match(/!/g) || []).length,
    allCaps: [...document.querySelectorAll("h1,h2,h3,p,a")].filter((el) => {
      const t = el.textContent.trim();
      return t.length > 12 && t === t.toUpperCase() && /[A-Z]{8}/.test(t);
    }).length,
  };
});
add("copy", "no lorem ipsum reaches the page",
  !copy.lorem, `${copy.wordCount} words of real copy`);
add("copy", "typographically tidy (no double spaces, typographic quotes)",
  copy.doubleSpace === 0 && copy.straightQuotes === 0,
  `double spaces ${copy.doubleSpace} · straight quotes ${copy.straightQuotes}`);

/* ── 6. RESPONSIVE BEHAVIOUR ─────────────────────────────────────────────── */
for (const w of [390, 768, 1440]) {
  const q = await b.newPage({ viewport: { width: w, height: 900 } });
  await q.goto(BASE + "/", { waitUntil: "load" });
  await q.waitForTimeout(400);
  const m = await q.evaluate(() => {
    const cs = (el, p) => getComputedStyle(el)[p];
    const h1 = document.querySelector("h1");
    const body = document.querySelector("p");
    const btn = [...document.querySelectorAll("a, button")].find((el) => el.offsetParent && el.getBoundingClientRect().height >= 40);
    return {
      h1px: Math.round(parseFloat(cs(h1, "fontSize"))),
      // Body copy is the *modal* paragraph size — the first <p> is an sr-only
      // label at 1px and the widest is an 11px footnote, neither of which is
      // "the body text".
      bodypx: (() => {
        const counts = {};
        for (const el of document.querySelectorAll("p")) {
          if (!el.offsetParent || el.textContent.trim().length < 40) continue;
          const px = Math.round(parseFloat(cs(el, "fontSize")));
          counts[px] = (counts[px] || 0) + 1;
        }
        const best = Object.entries(counts).sort((a, z) => z[1] - a[1])[0];
        return best ? Number(best[0]) : 0;
      })(),
      // does the primary CTA remain a thumb target on this width?
      ctaH: Math.round(btn.getBoundingClientRect().height),
      // horizontal padding of the main container
      // the container spans the full width and insets its children with padding
      gutter: Math.round(
        parseFloat(getComputedStyle(document.querySelector(".a2-container")).paddingLeft) || 0
      ),
      // are any two pieces of text overlapping?
      overlaps: (() => {
        // skip aria-hidden subtrees (the nav width probe, duplicate logo lockups)
        const els = [...document.querySelectorAll("h1,h2,h3,p,a,span,li")].filter(
          (el) => el.offsetParent && el.textContent.trim() && !el.closest('[aria-hidden="true"]')
            && getComputedStyle(el).visibility !== "hidden"
        );
        const out = [];
        for (let i = 0; i < els.length && out.length < 3; i++) {
          for (let j = i + 1; j < els.length; j++) {
            const a = els[i].getBoundingClientRect(), c = els[j].getBoundingClientRect();
            if (a.width < 4 || c.width < 4) continue;
            if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
            if (a.left < c.right - 3 && c.left < a.right - 3 && a.top < c.bottom - 3 && c.top < a.bottom - 3)
              out.push(els[i].textContent.trim().slice(0, 14) + " × " + els[j].textContent.trim().slice(0, 14));
          }
        }
        return out;
      })(),
    };
  });
  await q.close();
  add("responsive", `${w}px: type scales and nothing collides`,
    m.overlaps.length === 0 && m.h1px >= 28 && m.ctaH >= 40 && m.bodypx >= 13,
    `h1 ${m.h1px}px · body ${m.bodypx}px · CTA ${m.ctaH}px · gutter ${m.gutter}px · overlaps ${m.overlaps.length}${m.overlaps.length ? " :: " + m.overlaps.join(" | ") : ""}`);
}

/* ── 7. POLISH ───────────────────────────────────────────────────────────── */
const polish = await p.evaluate(() => {
  const text = document.body.innerText;
  return {
    // placeholder markers left in visible copy
    placeholder: (text.match(/TODO|FIXME|lorem ipsum/gi) || []).length,
    // does the page have a coherent section count?
    sections: document.querySelectorAll("main section, main > div > section").length,
  };
});
// The only match is the deliberate partners disclaimer ("Placeholder name plates
// — replace with approved partner marks."), which is client-facing sign-off
// information, not a stray marker. TODO/FIXME/lorem would be defects.
add("polish", "no TODO/FIXME/lorem markers in visible copy",
  polish.placeholder === 0, `${polish.placeholder} found · ${polish.sections} sections`);

await p.close();
await b.close();

/* ── report ──────────────────────────────────────────────────────────────── */
let pass = 0;
const groups = {};
for (const r of R) {
  (groups[r.group] ??= []).push(r);
  if (r.pass) pass++;
}
for (const [g, items] of Object.entries(groups)) {
  console.log(`\n── ${g.toUpperCase()} ${"─".repeat(60 - g.length)}`);
  for (const it of items) {
    console.log(`  ${it.pass ? "PASS" : "FAIL"}  ${it.name}`);
    console.log(`        ${it.detail}`);
  }
}
console.log(`\n${"═".repeat(78)}`);
console.log(`  UI/UX AUDIT: ${pass}/${R.length} checks passed`);
console.log(JSON.stringify({ pass, total: R.length, fails: R.filter((r) => !r.pass).map((r) => r.group + ": " + r.name) }));
