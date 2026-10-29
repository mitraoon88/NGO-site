# Phase 3 — the homepage section stack

**Status: complete, gates green, awaiting client sign-off.**
All eleven bands of the mockup are built at `/`, in the mockup's order and polarity.

| Gate | Result |
|---|---|
| `npm run validate` (tokens → tsc → lint → build) | **0 token violations · 0 lint · 22/22 pages** |
| `npm run a11y` | **PASS 40 · WARN 0 · FAIL 0** (landing clean; axe 0, contrast 0, 44px 0, focus ring 0) |
| `npm run ux` | **19/19** UI/UX audit (layout, type, reading, interaction, media, copy, responsive) |
| `npm run final` | **PASS 123 · WARN 1 · FAIL 0** |
| `npm run fidelity` | **17 match · 0 drift** |
| `npm run screens` | boards in `reference/phase3/`, 0 console errors |
| independent re-verification | **11/11** (see §*Final verification*) |
| approval record | **`reference/phase3/approval/index.html`** — one self-contained file with every board embedded |

The single warning is carried forward and benign: `IconArrowUpRight` in the icon set is
never imported. It stays — the icon inventory was agreed in Phase 1 and Phase 4/5 pages
will use it; deleting it would only mean re-adding it.

---

## What was built

```
content/home.ts                     every string on the page, one file (Phase 6 swaps it for the REST API)
components/sections/site-header.tsx  fixed cream bar, desktop nav + mobile disclosure sheet
components/sections/hero.tsx         photo, scrim, H1, CTAs, script accent, torn sheet + vignette
components/sections/values-bar.tsx   four principles on the paper edge
components/sections/purpose.tsx      text + three-print collage + stamp + quote
components/sections/focus-areas.tsx  four linked cards
components/sections/impact.tsx       forest act: statement, stats, testimonial
components/sections/stories.tsx      editorial three-up with a working carousel
components/sections/get-involved.tsx cream action cards on a photograph
components/sections/partners.tsx     neutral name plates (see below)
components/sections/news.tsx         compact three-up with <time> datetimes
components/sections/site-footer.tsx  five zones + legal bar
components/sections/newsletter-form.tsx  validating form with announced states
components/ui/icon-ornament.tsx      the 16-name icon registry the sections share
components/ui/value-item.tsx         glyph + caps label + note
app/[...slug]/page.tsx + route-list.ts   interim shells for every linked destination
```

`app/page.tsx` composes them; only three things are client components (header, carousel,
newsletter). Everything else — including all eleven bands' typography — is server HTML.

---

## The five decisions this phase turned on

### 1. The header is a solid cream bar, not a transparent overlay

Two wrong answers were tried first, and both are instructive:

- **`sticky` + transparent** put the bar in normal flow at scroll 0, so the cream nav sat on
  the cream page: **1.02:1**. Invisible until you scrolled.
- **`fixed` + transparent** fixed that, then put the client's rust-on-cream logo lockup on a
  dark photograph: **1.9:1**. Also invisible.

The mockup settles it — its bar is a solid paper strip with the photograph starting beneath
it. Cream, `fixed`, and **no scroll listener at all**: once the colour is constant there is
nothing for one to do. The hero reserves the bar's height with `pt`.

### 2. The tear was wrong three times before it was right

This is the phase's real engineering story, because each failure passed a different check:

| Attempt | What it looked like | Why it passed |
|---|---|---|
| Fill **down** from the box top, ramp from 50% | A level band with a dark strip above it | It was correct *when the parent's background matched* — the fill direction only becomes visible inside its own box |
| Knee at 13%, climb across 60% of the width | A diagonal across the whole hero | The wedge is a real feature; the measurements behind it were contaminated by burnt-in mockup text |
| Per-tooth noise amplitude 6.5 units | A saw blade | The depth metric matched; the *shape* did not |

What fixed it was measuring the mockup properly — per column, the first of ten consecutive
cream rows — which gives:

```
x  0% → y 398    x 40% → y 401    x 70% → y 370
x 20% → y 407    x 50% → y 394    x 85% → y 337
x 30% → y 404    x 62% → y 400    x 95% → y 323
```

So: **level for the left 62%, then a 77px climb into the top-right corner.** And the shape
that reads as paper needs two scales — a slow wander (most of the movement) plus 1–2px fibre
nicks (almost none). At `nick = 0.55 · amplitude` it is a saw; at `0.10` it is a tear.

Two structural consequences worth keeping:

- **The band must be as tall as the drawing**, 228px — a 212px illustration in a 216px band
  clips the temple spire. The sheet climbs 137px inside it.
- **The band must have no background of its own.** The tear paints the sheet *up* from the
  deckle; a background on the box fills the area *above* the deckle and hides the photograph,
  which is exactly what made the wedge invisible for one build.

### 3. The mockup's 96px section padding was nearly double

`lg:py-24` on every band came from multiplying the mockup's *largest* gap by the 1.78 scale
factor. The real figure — 42–50px of air above and below content at 1440 — is ≈64px. That one
number was responsible for the page running 5.2k instead of ~4.4k pixels.

### 4. Partners are name plates, not logos

The mockup shows Tata Trusts, HCL Foundation, Infosys, Reliance Foundation, Bharti, USAID and
UNDP. An organisation may only display a partner's mark with that partner's written permission,
and every mark has a current official form that must be used unmodified. Dropping the mockup's
approximations in would be a trademark problem *and* a factual claim about relationships the
client has not confirmed. The strip renders neutral text plates at the same rhythm and weight,
with a visible note saying so. Swapping in approved SVGs is a content change, not a layout one.

### 5. Interim route shells instead of five 404s

Every link on the homepage points somewhere real. Next prefetches every `<Link>` in view, so
without those routes five 404s land in the network log on first paint — a failed gate and a
real error a user can hit. `app/[...slug]` renders an honest, accessible "this page arrives in
Phase 5" page, `noindex`, with `dynamicParams = false` so typos still 404 properly.
**Phase 5 deletes `route-list.ts` and its folder.**

---

## Fidelity harness changes (important for Phase 4)

Three things about `validation/harness/fidelity.mjs` changed, and they matter because the
reference numbers inherited from Phase 2 were partly wrong:

1. **It measures `/`, not `/ornaments`.** The gate should score the page that ships.
2. **The band's rise was never level.** Phase 2 recorded "level band 30/40", derived from a
   contaminated profile. The measured rise is 9.39% of the page width, and the build now
   measures 9.3%. Anything in `docs/08` that says "level / 8.7% / 150-canvas" is superseded.
3. **The pixel window was ±70px around a 34px strip.** Phase 3's band is 228px with the sheet
   reaching its top-right corner, so a padded window scanned the hero's photograph as paper
   and reported a rise of **0** — a false drift. The window is now the band's own box.

Added rows: **band order** and **band polarity** (paper/dark), plus a reported-not-gated page
height. The order is the page's argument — hero → values → purpose → focus → impact → stories →
involved → partners → news → footer — and the dark acts are hero / impact / involved / footer.

Also fixed: `"footer"` alone matched the *blockquote's* attribution `<footer>` 1400px up the
page. It is now `body > footer`.

---

## What is deliberately not done

| Item | Owner |
|---|---|
| Real photography — all 10 band images are generated placeholders, **no faces** | Client |
| Partner logos (permission + current official SVGs) | Client |
| Newsletter submit — validates and announces, but has no backend | Phase 6 |
| `/about`, `/our-work`, … — real page bodies | Phase 5 |
| Odia translation — the switch shows ଓଡ଼ିଆ in real Noto Sans Oriya type but is not wired | Phase 7 |
| Stamp size: the build uses 96px where the reference measures 187px | revisit with the real Purpose photo |

---

## Review artifacts

`reference/phase3/` — `01-header-hero` … `08-footer` (band-by-band at 1440, 2×), `full-1440.png`,
`reflow-mobile-390.png`, `reflow-tablet-768.png`.

Compare against `uploads/A2 Foundation Nonprofit Homepage Mockup.png` at 1440.

One capture note: Playwright's `fullPage` stitches without waiting for `loading="lazy"` images,
so `screens.mjs` now scrolls the page once before capturing. Without that the mobile board
photographed Stories, News and Get Involved as empty boxes while the live page was fine.


---

## Final verification (independent)

The sign-off script checks the build against its own harness. That is necessary but not
sufficient — a harness shares the author's blind spots. So the phase was also verified with a
separate suite (`~/.tmp-shots/verify.mjs`, `reflow.mjs`) written to ask the same questions a
different way: raw geometry rather than the harness's helpers, computed colours recomputed
from scratch, and controls checked one by one.

**Result: 11/11 independent checks, plus the project suite at 39/0/0 · 123/1/0 · 17/0.**

It found four real defects that every existing gate had missed. All are fixed.

### 1. The image optimizer hung for 15+ seconds

`next start` logs `⚠ the optional 'sharp' package is strongly recommended`. Without it Next
falls back to a JS resizer, and one specific request —
`/_next/image?url=/images/hero-placeholder.jpg&w=1080&q=75` — **never completed**. `load` never
fired at 834px, so the page was unusable at that width in a real browser, and my probe sat on a
45-second timeout. Installing `sharp` fixed it and is now a dependency.

This one is worth generalising: it was invisible to axe, to the fidelity gate (which screenshots
after its own waits) and to the reduced-motion and contrast checks, because none of them
assert that the document finishes loading. **The gate that would have caught it is a plain
`page.goto(..., waitUntil: "load")`, and `final-gate.mjs` now runs `networkidle` navigations
that do raise it.**

### 2. The header pushed its own controls off-screen at 200% text

At 200% text size the Donate button and — worse — the entire language switch sat past the right
edge of a `fixed` header with no way to scroll to them. `scrollWidth` never noticed, because a
fixed element leaving the viewport does not widen the document.

The root cause: the desktop layout keyed off the *viewport* (`lg:`), but the thing that decides
whether six links plus a button fit is the *width of the text*. Fixes, in order:

- a `hdr-lg` **rem** breakpoint in the preset — good practice, but it cannot react to a
  page-level font-size change (CSS resolves `rem` in media queries against the *initial* font
  size, not the root element's), so it did not solve the case alone;
- the bar measured itself into `--a2-header-h` with a `ResizeObserver`, and the hero now clears
  the header by that value instead of a hard-coded `92px` (at 200% the bar is 280px and the
  headline used to sit underneath it);
- the header now decides **by measuring whether the nav fits**, not by viewport width: a hidden,
  `aria-hidden` clone of the list reports the nav's natural width, and below that threshold the
  compact header plus the menu button take over. This also future-proofs the Odia translation,
  whose labels are longer than the English placeholders.

The first attempt at that measurement oscillated — measure the live nav, hide it, it measures 0,
show it again — which Playwright surfaced as the menu button being "not stable". A control that
never stops moving is not clickable for a human either; the clone is measured instead.

### 3. The footer overflowed at enlarged text

`lg:grid-cols-[1.5fr_1fr_1fr_1.4fr]` sizes columns by the viewport, so at 200% and 300% text the
Focus Area links and the whole newsletter field spilled past the footer's right edge. Replaced
with `repeat(auto-fit, minmax(12rem, 1fr))` so the columns size to their content and reflow.

### 4. The partners row could not wrap

The left block was `shrink-0` with a `26rem` cap — at 300% that asks for 1248px and shoved every
partner name and the "and more" link off the right edge. The row now wraps.

### Two new gates, so none of this can come back

`final-gate.mjs` gained, on all three routes at 200% and 300% text:

- **every control stays inside the viewport** — checks each `a[href]`, `button`, `input`,
  `select`, `textarea` and `[tabindex]` box directly against `clientWidth`. This is the gate that
  catches a `fixed` header losing its controls, which `scrollWidth` cannot.
- **the hero clears the fixed header** — measured, at 100% and 200%.

Both failed on their first run against the then-current build, which is the point.

### What the independent suite deliberately does *not* flag

Three "failures" in the first run were the probe's fault, not the page's, and are worth
recording because each looks like a defect:

- **Ornaments crossing the viewport edge.** The foliage, the tear and the illustration are drawn
  past the edge on purpose — that is the mockup — and sit inside `overflow-hidden` parents. The
  test only counts *unclipped* overflow.
- **Art at 0.4 opacity under reduced motion.** That is the ornament's colour, not a fade. Only
  content is required to stay visible.
- **`pointer-events: auto` on an `aria-hidden` node.** An icon inside a card legitimately
  inherits the card's pointer events. The rule enforced is the one that matters: every ornament
  is either `aria-hidden` (including by inheritance) or named, never both, and never focusable —
  **66 svgs = 25 ornaments + 41 control icons, zero issues.**


---

## UI/UX validation round

Correctness and craft are different questions. The gates above answer "is it right"; `ux-audit.mjs`
answers "is it good" — nineteen geometric and computed checks that a design review would make:

| Group | What it holds the build to |
|---|---|
| Layout | one shared gutter and container width; a closed set of section paddings |
| Type | body/UI sizes come only from tokens; the display ramp stays fluid; two families |
| Style | near-square corners; hairlines instead of shadows (one shadow in the whole page) |
| Reading | no paragraph past 90 characters per line; line height ≥ 1.35 |
| Interaction | every control ≥ 44×44; **every tab stop has a visible focus ring** |
| Media | alt text present, images load, dimensions set, alt under 125 characters |
| Copy | no placeholder text; no double spaces; typographic quotes only |
| Responsive | at 390 / 768 / 1440 the type scales and nothing collides |

### The defect this round found

**Twelve tab stops had no visible focus indicator** — the four focus cards, the three story
cards, the three news cards, the three Get Involved rows and the newsletter input.

Five components carried Tailwind's `focus-visible:outline-none`. That utility does not remove the
outline; it compiles to `outline: 2px solid transparent`. So:

- axe passed, because the elements are focusable and reachable;
- the existing `outline-style !== "none"` check passed, because the style still reports `solid`;
- the ring was **invisible**, on the controls a keyboard user reaches fifth through thirtieth.

The fix is structural, not a patch per component: the system's one focus rule is now repeated in
an **unlayered** block so it wins over any utility class, and the eleven-band audit walks the real
tab order reading the **outline colour's alpha** — the only measurement that distinguishes a ring
from an invisible ring. A `focus-ring` check was added to `a11y-audit.mjs` (55 stops, all visible).

### A note on how the audit itself was wrong first

The first run of `ux-audit.mjs` reported 8 failures. **Six were the probe's fault**, and each is
worth recording so the next person does not chase them:

- *"every container shares the same gutters"* — a responsive duplicate container collapses to
  0×0; it must be filtered by width, not counted.
- *"17px is a stray type size"* — 17px is the `h4` token (`1.0625rem`); the check's token list was
  incomplete.
- *"body text is 11px"* — it was taking the *widest* paragraph (an 11px footnote). Body copy is
  the **modal** paragraph size: 13px.
- *"the skip link is 1×1 and ଓଡ଼ିଆ is 31px wide"* — the skip link is visually hidden until
  focused, and the language option is a 44px-tall text span.
- *"Previous stories has no focus ring"* — it is `disabled`, so it is correctly not a tab stop.
- *"9 overlapping elements at every width"* — they were the duplicate logo lockups inside
  `aria-hidden` subtrees.

Two of the eight were real. The lesson is the same one this phase keeps teaching: **a failing
check is a hypothesis, not a verdict** — measure the element before blaming the page.

### Approval artefacts

`reference/phase3/approval/`

| File | What it is |
|---|---|
| `index.html` | the approval document — every board embedded as a data URI, opens offline |
| `00-contact-sheet.png` | the page at 390 / 768 / 1280 / 1440 side by side |
| `full-*.png` · `fold-*.png` | full page and above-the-fold at each width |
| `band-01 … band-10.png` | section-by-section, 1440px |
| `state-focus-ring.png` · `state-mobile-menu.png` · `state-form-error.png` | interaction states |

Page heights: 7,733px at 390 · 5,833 at 768 · 4,321 at 1280 · 4,381 at 1440.
