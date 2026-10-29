# Phase 1 — validation report & sign-off

**Date:** 27 October 2026
**Build:** `apps/web` @ Next.js 14.2.35 · Tailwind 3.4.13
**Surfaces audited:** `/` (landing) and `/kitchen-sink` (component sheet)
**Verdict:** ✅ **PHASE 1 APPROVED** — 28 pass, 1 documented warning, **0 failures**

---

## 1. What was validated, and how

The gate is a script, not an opinion. `/.tmp-shots/validate.mjs` (kept outside the app so it
never ships) drives a real Chromium against the running production build and writes machine
readable evidence to [`validation/report.json`](report.json).

| Family | What it does | Tool |
|---|---|---|
| **Automated a11y** | Full WCAG 2.2 A/AA + best-practice rule sweep on both pages | `@axe-core/playwright` 4.10.0 |
| **Contrast, computed** | Walks every element that paints its own glyphs, resolves the *effective* background through the ancestor stack (blending alpha layers), and compares the real ratio against the real threshold for that size/weight | own calculator in the harness |
| **Structure** | one `<h1>` per page, `<main>` landmark, heading order, `alt` coverage, `lang` | DOM assertions |
| **Keyboard** | first 12 tab stops, focus-ring visibility measured from computed outline/box-shadow | live `Tab` presses |
| **Targets** | every non-inline control measured against the 44 × 44 CSS-px target | WCAG 2.5.8 |
| **Responsive** | horizontal-overflow scan with offender attribution at 360 / 390 / 768 / 1024 / 1440 / 1920 | viewport sweep |
| **Zoom** | 200 % root text size — reflows, no horizontal scroll | WCAG 1.4.4 |
| **Motion** | `prefers-reduced-motion: reduce` → every duration collapses, `Reveal` content visible without scrolling | emulation |
| **Fonts** | computed `font-family` on body and display — catches silent fallback to Times New Roman | computed style |
| **Console / network** | zero errors, zero failed requests on both pages | event listeners |

### Reproduce it

```bash
cd apps/web
npm run validate          # check:tokens → tsc → next lint → next build
# restart the server afterwards (next start does not pick up a new build)
pkill -9 -f next-server && npx next start -H 0.0.0.0 -p 3100 &
cd /home/user/.tmp-shots && node validate.mjs
```

> **Operational trap, now documented:** `next start` keeps serving the *previous* build. Skip
> the restart and the CSS 404s, the fonts fall back to Times New Roman, and the harness reports
> failures that do not exist in the code.

---

## 2. Result

```
PASS 28   WARN 1   FAIL 0
```

| Page | axe (WCAG 2.2 AA) | Contrast pairs | h1 | main | alt | Focus rings | Targets | Console | Network |
|---|---|---|---|---|---|---|---|---|---|
| `/kitchen-sink` | **0 violations** | 252 / 252 pass | 1 | ✔ | ✔ | 12 / 12 | 1 × 40px (see W1) | 0 | 0 |
| `/` | **0 violations** | 7 / 7 pass | 1 | ✔ | ✔ | 8 / 8 | all ≥ 44px | 0 | 0 |

| Site check | 360 | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| Horizontal overflow | none | none | none | none | none | none |
| Offending elements | 0 | 0 | 0 | 0 | 0 | 0 |

- **Reduced motion:** 0 elements retain a transition/animation duration; `Reveal` renders its
  content immediately (no blank hero for users who ask for less motion).
- **200 % text:** document width = client width at 1440 → clean reflow, no horizontal scroll.
- **Fonts:** Inter on body, Newsreader on display, both delivered by `next/font` (self-hosted).

### W1 — one control at 40 px (accepted, not a defect)

The `sm` button size is **40 px tall by design** — it is the mockup's inline utility size
(`buttonClass("rust","sm")`, e.g. inside dense editorial rows). WCAG 2.5.8 (AA) requires
24 × 24 px, which it passes comfortably; the 44 px bar is the AAA (2.5.5) target and applies
to primary actions, all of which are 48–52 px. **Decision: keep 40 px, document it, and never
use `sm` for a primary call to action.** This is the only warning in the report.

### Visual evidence (refreshed from the passing build)

- `reference/phase1/01…06` — six review boards (colour/type, buttons + headings, cards, inputs +
  icons, logo/motion/spacing, mobile at 390).
- `reference/phase1/full-kitchen-1440.png` — the whole sheet, 2880 × 14866 @2×.
- `reference/phase1/full-landing-1440.png` — the review landing page.

---

## 3. Defects found by the gate, and their root causes

The value of a gate is the bugs it catches. These four were real, and two of them were
invisible in the browser until the numbers were computed.

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| **1** | Rust buttons rendered **ink labels on rust** (2.78:1); "Watch Our Story" was ink on forest (1.04:1) | `tailwind-merge` did not know the custom `fontSize` steps, so it classified `text-h3` as a *colour* and silently deleted `text-white` from the same class string | `lib/cn.ts` now **derives** every merge class group from `brand/tailwind.preset.ts` (`keys("fontSize")`, …). Adding a token can never desynchronise the merger again. Guarded by a parity test. |
| **2** | Accessible labels over photography measured 3.11:1 instead of the predicted 5.58:1 | `rust.wash` was a **translucent** `rgba(171,61,36,0.08)`, so it composited with whatever sat behind it | Replaced with solid tints: `rust.wash #FBEFEC` (5.29:1) and `rust.washDeep #F7E3DD`. Rule adopted: **no translucent colour tokens** — a wash must be a solid colour. |
| **3** | Eyebrow numerals failed by a hair (4.78:1 at 12 px) | `opacity-90` on an otherwise-passing rust numeral | Removed the opacity — the numeral is part of the label, not decoration. |
| **4** | On-dark `Tag` / `Badge` variants sat at 1.86:1–2.75:1 | The variants existed only in the component sheet; light accents (peach, gold-deep) were being asked to carry category text | **Variant removed, not patched.** `Tag` has one colour (`rust-text`); `Badge` lost its `forest` tone and its invented `sand-soft` token. Fewer states, all of them auditable. |
| **5** | Logo tagline failed AA (2.75:1 on forest) | 7.5 px type carrying meaningful colour | Treated honestly as **ornament**: `aria-hidden`, brand accent (`rust` / `gold`), WCAG 1.4.3 decorative exemption documented in the component. No pretend label colour. |

### Harness bugs fixed at the same time (so future reports can be trusted)

- It was measuring **visually-hidden** `sr-only` text as if it were painted on the dark band
  behind it → phantom 1.04:1 failures. Now skipped (axe already skips it).
- It was measuring **wrapper** elements that inherit a colour and contain a coloured child →
  phantom 1:1 "Stronger Communities". Now only elements with their **own** text nodes are measured.

---

## 4. Token discipline — now enforced by machine, not by care

`apps/web/scripts/check-tokens.mjs`, wired in as `npm run check:tokens` and as the first step of
`npm run validate`:

```
── token ↔ merge parity ────────────────────────────────
  fontSize       20 token(s): hero, h2, h2-sm, h3, h4, stat, lead, body …
  borderRadius   3 token(s): btn, card, photo
  maxWidth       4 token(s): page, copy, copy-sm, measure
  boxShadow      2 token(s): card, menu
  files audited     12
✓ 0 violations (17 notes)
```

It fails the build on: a hard-coded hex/rgba anywhere in `components/`, an arbitrary font size
(`text-[…]`), a `text-* / max-w-* / rounded-*` class that is neither core nor a registered token,
and — most importantly — a preset that has drifted out of sync with the tailwind-merge config.

**Current measured state: 0 hard-coded colours, 0 arbitrary sizes, 20 registered type steps,
all components on tokens.** The sheet's own type specimen table renders all 20 steps so drift is
visible at a glance.

---

## 5. What Phase 1 deliberately does *not* include

Honest scoping, so the next phase is not mistaken for scope creep:

1. **Photography** — every image is a labelled placeholder at the correct aspect ratio and crop.
   The mockup's 4 photos are licensed stock; Phase 2 decides sourcing.
2. **Ornament system** — torn-paper edge, Odisha line-art, foliage, stamp, script accent. These
   are decoration built *on* the tokens, so they belong to Phase 2 by design.
3. **Real sections** — `/` is a landing page for the review, not the homepage. The 11-band
   section stack is Phase 3–5 work.
4. **Client assets** — partner logos are trademarks and are placeholders; the wordmark is type +
   inline SVG until the client supplies their lockup.

---

## 6. Sign-off checklist for the client

| # | Question | Status |
|---|---|---|
| 1 | Palette matches the mockup exactly (cream `#FBF7F0`, forest `#11231B`, rust `#AB3D24`, gold `#C9A961`) | ✅ nothing warmed or resaturated |
| 2 | Three type voices correct — Newsreader / Inter / Parisienne | ✅ self-hosted, no external font request |
| 3 | Component set sufficient for the 11-band homepage | ✅ 13 primitives + 26 icons named and demonstrated |
| 4 | Any objection to the two accessibility corrections (split rust token, solid rust wash)? | ⏳ needs client acknowledgement |
| 5 | Photography sourcing + partner logo permission | ⏳ Phase 2 decision |
| 6 | Approve **Phase 2 — ornament & art system** | ⏳ awaiting go-ahead |

**Phase 1 is approved from the engineering side. The next step is Phase 2.**
