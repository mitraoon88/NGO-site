# A2 Foundation — Build Plan (step by step)

**Stack decision (confirmed with the client's earlier brief):** headless WordPress + Next.js 14
(App Router) + React + Tailwind — the same architecture already scaffolded in
`/home/user/ngo-site-reference`. This build reuses that infrastructure and replaces the design and
content with A2 Foundation's.

**Rule for every phase:** nothing moves forward until the previous phase's fidelity report is
reviewed. That is how we land an exact replica instead of an interpretation.

---

## Phase 0 · Lock the reference  ⟶ *half a day*

| Step | Output |
|---|---|
| 0.1 Cut the mockup into 11 section references at 2–3× (`reference/*.png`) | ✅ done |
| 0.2 Annotated section overlay (`reference/overlay-sections.png`) | ✅ done |
| 0.3 Measured grid overlay (`reference/overlay-grid.png`) | ✅ done |
| 0.4 Extract palette + contrast + type scale into tokens (`brand/`) | ✅ done |
| 0.5 Client sign-off on the 11 open questions in `01-visual-analysis.md` §8 | **needs review** |

---

## Phase 1 · Foundations — tokens, fonts, primitives  ⟶ *1 day*

| Step | Detail |
|---|---|
| 1.1 New Next.js project `a2-foundation-web` from the existing scaffold | keep `lib/wp.ts`, `api/revalidate`, security headers |
| 1.2 Install `brand/tokens.css` + `brand/tailwind.preset.ts` as the only source of colour/size | zero hard-coded hex in components |
| 1.3 Fonts via `next/font`: Newsreader (variable, 400/500), Inter (400/500/600), Parisienne | self-hosted, `display: swap`, subset latin |
| 1.4 Base layer: body, headings, `.a2-eyebrow`, `.a2-btn` × 4, `.a2-card`, `.a2-chip`, focus ring | one focus rule, one button radius |
| 1.5 Icon set as inline SVG components (values 4 · focus 4 · stats 4 · social 4 · search/arrows 2) | 1.5 px strokes, currentColor, 24 px box |
| **Gate** | Storybook-less demo page `/_kitchen-sink` showing every primitive → client review |

---

## Phase 2 · Ornament & art system  ⟶ *2 days* (highest-risk, do it early)

| Step | Detail |
|---|---|
| 2.1 Re-draw the **torn-paper edge** as SVG (irregular tear + 1 px fibre shadow) | `preserveAspectRatio="none"`, height 40 px, 3 seed variants |
| 2.2 Re-draw the **Odisha line-art illustration** (temple, palms, boat, hills) as a single SVG | sand stroke 1.25 px, no fills, ≈12 KB, sits inside the tear |
| 2.3 Three **foliage ornament** SVGs (corner, margin, footer) | 0.55 opacity, sand, `aria-hidden` |
| 2.4 **Circular stamp** with `textPath` on a circle | optional 40 s rotation, disabled on reduced-motion |
| 2.5 **Script accent** component (3 lines, −6° rotate, leaf glyph) | Parisienne 40 px, cream |
| **Gate** | A single static "ornament sheet" PNG + live demo reviewed against the mockup at 100 % |

> If the client owns the original illustration files, swap them in here — the SVGs are slots.

---

## Phase 3 · Hero + header (the make-or-break screens)  ⟶ *2 days*

| Step | Detail |
|---|---|
| 3.1 `Header`: 2-line logo lockup, 6 nav links w/ active underline, search, Donate, EN/ଓଡ଼ିଆ | sticky; transparent-over-hero → solid cream on 40 px scroll; mobile sheet |
| 3.2 `Hero`: full-bleed photo + left scrim (measured gradient stops), eyebrow, 3-line H1 (88 px), lead, 2 CTAs | image `priority`, focal point right; Ken Burns 1→1.04 |
| 3.3 Script accent + leaf, absolutely positioned on the right | hidden < 1024 px (moves under H1, smaller) |
| 3.4 Torn edge + illustration bridging hero → values bar | overlap −24 px so the tear sits *on* the cream |
| 3.5 `ValuesBar`: 4 icon+label+note, sand dividers | wraps to 2×2 at 768, 1-col at 390 |
| **Gate** | Side-by-side 1440 px diff vs mockup §01–03; client sign-off |

---

## Phase 4 · Content sections  ⟶ *3–4 days*

| Step | Detail | Reference |
|---|---|---|
| 4.1 Our Purpose: 45/55 split, H2 with italic rust word, body, CTA, **photo collage** (landscape + portrait + cream card + stamp), bridging quote, foliage | `reference/purpose.png` |
| 4.2 Focus Areas: 4-up seamless cards (photo, gold icon, serif title, copy, arrow chip) | `reference/focus-cards.png` |
| 4.3 Our Impact: forest bleed, botanical art, H2 + body + CTA, **4 gold stat blocks** with count-up, testimonial row, leaf photo bottom-right | `reference/impact.png` |
| 4.4 Stories: head + 2 arrows, 3-up horizontal cards, working carousel (drag + arrows, no autoplay), 3 of N | `reference/stories.png` |
| 4.5 Get Involved: sunset photo, H2 + body, **3 cream action cards** (icon, label, sublabel, arrow) | `reference/involve.png` |
| 4.6 Partners: head + logo strip + "and more →", marquee optional | `reference/partners.png` |
| 4.7 News: 3 compact cards (thumb, date, title, arrow) + View All | `reference/news.png` |
| 4.8 Footer: 5 zones (logo+mission+socials / Quick Links / Our Focus / newsletter / legal bar) + corner foliage | `reference/footer.png` |
| **Gate** | Section-by-section diff report; then one full-page diff at 1440 |

---

## Phase 5 · Responsive + states  ⟶ *2 days*

| Breakpoint | Key changes |
|---|---|
| **1440** | Reference layout (design target) |
| **1024** | Hero H1 → 64 px; purpose collage stacks to 2-up; focus cards 2×2; impact stats 2×2 |
| **768** | Purpose becomes single column (text → collage); stories carousel shows 1.2 cards; get-involved cards go full width under the copy |
| **390** | Header → logo + burger + donate icon; hero H1 44 px, no script accent; all sections 1-col; footer stacks; sticky donate bar |

States to prove in the review: nav hover/active/focus, button hover/active/focus/disabled,
card hover (photo scale + chip fill), carousel arrows disabled, newsletter success + error,
empty state for each card grid, and `prefers-reduced-motion` on all animation.

---

## Phase 6 · WordPress content model  ⟶ *2 days*

Reuse `setu-core` patterns; new post types and fields for this design:

| Post type | Fields the design needs |
|---|---|
| `focus_area` (4 cards) | title, copy (2 lines), icon key, photo, link, order |
| `story` | tag (Education/Livelihoods/Environment), title, copy, portrait, link |
| `news` | date, title, thumb, link |
| `partner` | name, logo (SVG upload), permission-reference (**required to publish**) |
| `stat` | numeral, label, icon key, order (lives touched / communities / projects / years) |
| `page` blocks | hero copy + images, purpose collage (3 images), testimonials, values bar 4 items |

REST: `/setu/v1/focus`, `/stories`, `/news`, `/partners`, `/stats`, `/home` — each returning exactly
the flat shape the components expect (same seam as the reference build, so mock ⇄ live is one env var).

Safeguarding carried over: a `story` with no consent reference cannot publish; partner logos require
a permission reference.

---

## Phase 7 · Fidelity verification & handover  ⟶ *1 day*

| Step | Detail |
|---|---|
| 7.1 Playwright capture at 1440/1024/768/390, full page + 11 section crops | `reference/fidelity/*.png` |
| 7.2 Overlay diff at 50 % opacity vs the mockup scaled to each width | `reference/fidelity/overlay-*.png` |
| 7.3 Measured report: container edge ±4 px, section height ±2 %, heading size ±1 px, colour ΔE < 2 | `reference/fidelity/report.md` |
| 7.4 Lighthouse ≥ 95 / 100 / 100 / 100 mobile; axe-core zero critical | attach JSON |
| 7.5 Handover pack: token doc, component inventory, CMS guide, editor training notes | `docs/` |

---

## Schedule summary

| Phase | Work | Days |
|---|---|---|
| 0 | Lock reference | 0.5 (done) |
| 1 | Foundations & primitives | 1 |
| 2 | Ornament & art system | 2 |
| 3 | Header + hero | 2 |
| 4 | Content sections | 3–4 |
| 5 | Responsive + states | 2 |
| 6 | WordPress model | 2 |
| 7 | Fidelity + handover | 1 |
| | **Total** | **≈ 13–14 working days** |

Assumes: copy and photography available by Phase 3; one review round per phase; the client signs off
the 11 items in `01-visual-analysis.md` §8 before Phase 2 starts.

---

## What I need from the client to start Phase 1

1. **Sign-off on the §8 decisions** (especially the four occlusion fixes and the partner-logo policy).
2. **Font files** if they own the original display serif + script; otherwise confirm Newsreader/Parisienne.
3. **Photography** — either the licensed originals, or approval to generate consent-safe stand-ins for
   the prototype and replace them at Phase 6.
4. **Real figures & copy** for the four stats, three stories, three news items, and partner permissions.
5. **Bilingual confirmation** — does ଓଡ଼ିଆ go live in this release or is the switcher UI-only for now?
