# A2 Foundation — Design Tokens

Reverse-engineered from `A2 Foundation Nonprofit Homepage Mockup.png` (809 × 1945 px capture).
Every value below is sampled from the image, then adjusted only where accessibility required it
(flagged as `adapted`).

---

## 1. Colour

| Token | Hex | Sampled from | Where it is used | Contrast on cream |
|---|---|---|---|---|
| `--a2-cream` | `#FBF7F0` | page background (modal colour, 1,625 px) | page background, all light sections | — |
| `--a2-cream-deep` | `#F6EFE3` | card surfaces over cream | focus cards, story cards, news cards, get-involved buttons | — |
| `--a2-sand` | `#E8DBC4` | hairline dividers, ornament line-art | dividers, values-bar rules, leaf motifs | — |
| `--a2-sand-soft` | `#F1E7D6` | ornament tint | decorative foliage, faded borders | — |
| `--a2-ink` | `#1C1C1A` | serif headings (pure ink, near-black) | H1–H4, dark UI text | **15.98 : 1** AAA |
| `--a2-ink-soft` | `#3A3A38` | body paragraphs | body copy, card copy | **10.67 : 1** AAA |
| `--a2-forest` | `#11231B` | "OUR IMPACT" band (modal colour) | impact band, dark overlays | — |
| `--a2-forest-deep` | `#0E231D` | footer (modal colour) | footer, mobile menu | — |
| `--a2-rust` | `#AB3D24` | Donate / Our Impact / Learn More / Explore buttons | **primary button fill**, logo "A2" | **5.74 : 1** AA (text on cream) · white on it = **6.13 : 1** AA |
| `--a2-rust-hover` | `#96331D` | derived | button hover / active | — |
| `--a2-rust-text` | `#B23A26` | eyebrow labels, italic accent word, story tags | small caps eyebrows, "Tomorrow.", "Read Story" | **5.58 : 1** AA |
| `--a2-gold` | `#C9A961` | stat icons, quote mark, leaf behind stats | icons & rules **on forest only** | **7.29 : 1** on forest AAA |
| `--a2-gold-deep` | `#A9853F` | focus-card outline icons | icons **on cream** (graphics only) | 3.06 : 1 — decorative, always paired with a text label |
| `--a2-peach` | `#E9A184` | italic emphasis in mid-section scripts | secondary accent (sparingly) | — |
| `--a2-white` | `#FFFFFF` | hero headline, card text on dark | hero H1, impact headings | **6.13 : 1** on rust; 16.4 : 1 on forest |

### Accessibility fixes applied to the mockup
The mockup's eyebrows are a **lighter terracotta (~`#E2704F`)** which measures **2.95 : 1** on cream — a WCAG AA failure for 12px text. Tokens therefore split the colour into three roles:

| Role | Token | Contrast | Use |
|---|---|---|---|
| Decorative fill | `--a2-rust` `#AB3D24` | — | buttons, logo, rules |
| Text/label | `--a2-rust-text` `#B23A26` | 5.58 | eyebrows, tags, italic accent (small text) |
| Soft accent | `--a2-peach` `#E9A184` | — | never used for text under 24px |

Gold is **never** used for text on cream (2.11 : 1). It is only allowed as line-art/icons on forest, or as decoration on cream where a text label carries the meaning — which is exactly how the mockup uses it.

---

## 2. Typography

The mockup uses three type voices. Exact fonts are unidentified (likely a licensed display serif similar to *Gambetta / Recoleta*), so the build specifies a Google-hosted stand-in with the same skeleton, plus a swap point.

| Voice | Role | Mock character | Build font | Weight / style | Fallback stack |
|---|---|---|---|---|---|
| **Display serif** | H1, H2, card titles, stat numerals | moderate-contrast transitional serif, generous counters, calligraphic `y`, `g`, `R` | **Newsreader** (variable) | 400–500, `-0.02em`, line-height 1.0–1.08 | `"Newsreader", "Source Serif 4", Georgia, serif` |
| **UI sans** | nav, buttons, body, labels, captions | humanist grotesque, tight apertures | **Inter** | 400 / 500 / 600 | `Inter, system-ui, sans-serif` |
| **Script** | hero "Stronger Communities / Brighter Futures" | thin monoline calligraphy, generous slant | **Parisienne** | 400 | `Parisienne, "Alex Brush", cursive` |

### Measured scale (mock px @809 → est. design px @1440, factor ≈ 1.78)

| Element | Mock measure | Correlates to | Design value |
|---|---|---|---|
| Hero H1 | line pitch 49 px, cap-height ≈ 35 px | pitch × 1.78 / cap ÷ 0.70 | **~88 px / 0.98 lh / −0.02em** |
| Section H2 (purpose) | line pitch 33 px | × 1.78 | **~58 px / 1.05** |
| Section H2 (impact) | 2 lines in 55 px | × 1.78 | **~48 px / 1.08** |
| Card title (focus) | cap ≈ 11 px | ÷ 0.7 × 1.78 | **~24 px** |
| Story / news card title | cap ≈ 9 px | ÷ 0.7 × 1.78 | **~22 px** |
| Body / lead | pitch ≈ 20 px | × 1.78 | **16–18 px / 1.7** |
| Eyebrow (caps) | cap ≈ 6 px, tracking wide | × 1.78 | **12 px / 0.18em / 600** |
| Nav link | cap ≈ 7 px | × 1.78 | **14.5–15 px / 500** |
| Button label | cap ≈ 6.5 px | × 1.78 | **14 px / 600** |
| Stat numeral | cap ≈ 20 px | ÷ 0.7 × 1.78 | **50 px** |
| Footer link | cap ≈ 7 px | × 1.78 | **14 px** |

> These are estimates from an 809 px capture. **Phase 1 of the build calibrates them exactly** by rendering our page at 1440 px and pixel-diffing it against the mockup upscaled to 1440 (see `03-build-plan.md`).

---

## 3. Layout grid (measured)

| Measure | Mock px (809 wide) | → @1440 | Tailwind plan |
|---|---|---|---|
| Page container | 46 → 763 (**717 px = 88.6 %**) | **1276 px** | `max-w-[1280px] px-20` |
| Columns | 4 × 167.5 px, gutters 22 px | 4 × 298, gap 39 | `grid-cols-4 gap-10` |
| Card row pitch | photo 69–125 px + body | — | `aspect-[16/10]` on photo, `p-6` body |
| Section vertical rhythm | 40–80 px | 71–142 | `py-16 / py-20 / py-24` |
| Header height | ~60 px | ~107 px | `h-[104px]` two-line lockup |
| Hero height | 340 px | ~605 px | `min-h-[600px]` |

Section heights (mock → design ×1.78):

| # | Section | Mock y | Mock h | Design h |
|---|---|---|---|---|
| 01 | Header | 0–60 | 60 | 107 |
| 02 | Hero | 60–400 | 340 | 605 |
| 03 | Values bar | 400–465 | 65 | 116 |
| 04 | Our Purpose | 465–735 | 270 | 481 |
| 05 | Focus Areas | 735–968 | 233 | 415 |
| 06 | Our Impact | 968–1177 | 209 | 372 |
| 07 | Stories | 1177–1352 | 175 | 312 |
| 08 | Get Involved | 1352–1528 | 176 | 313 |
| 09 | Partners | 1528–1585 | 57 | 101 |
| 10 | News & Insights | 1585–1752 | 167 | 297 |
| 11 | Footer | 1752–1945 | 193 | 344 |
| | **Total page** | | **1945** | **≈ 3560** |

---

## 4. Shape, border, elevation

| Token | Value | Evidence |
|---|---|---|
| `--r-btn` | `3px` | Buttons are near-square with a 3–4 px radius |
| `--r-card` | `4px` | Focus / story / news cards: crisp, editorial, almost sharp |
| `--r-photo` | `3px` | Photos sit flush inside cards with a hairline edge |
| `--r-pill` | `999px` | Arrow chips (circle), never on buttons |
| `--border-hair` | `1px solid rgba(28,28,26,.10)` | Card edges, values-bar dividers |
| `--border-sand` | `1px solid #E8DBC4` | Ornament / decorative rules |
| `--shadow-card` | `0 1px 2px rgba(28,28,26,.05)` | Essentially flat; depth comes from photography, not shadows |

**Design signature:** unlike a typical modern SaaS site, this design uses **near-square corners, hairlines instead of shadows, and line-art foliage** as its ornament system. Keep radii ≤ 4 px or the whole character collapses.

---

## 5. Ornament system (this is what makes it look "designed")

| Ornament | Where | Implementation |
|---|---|---|
| **Torn-paper edge** | bottom of hero, over the values bar | SVG `<path>` with irregular tear + 1 px darker fibre line; `preserveAspectRatio="none"`, height 40 px |
| **Pen-and-ink line art** (Odisha temple, palms, boat, foliage) | inside the hero tear, corners of 4 sections | single SVG illustration, masked by the tear; `currentColor` = `--a2-sand` |
| **Leaf sprig line art** | top-left / right of sections, footer corners | 3 SVG variants, opacity .5, absolute-positioned, `aria-hidden` |
| **Circular text stamp** | top-right of the Purpose collage ("ODISHA · INDIA · …") | SVG `textPath` on a circle, letter-spaced caps, rotating slowly on scroll (optional) |
| **Rust numerals + vertical rule** | every eyebrow: `01 |` + `OUR PURPOSE` + 200 px rule | flex row: 18 px caps numeral, 1 px vertical rule, label, 1 px horizontal rule |
| **Script accent + leaf** | hero right | font `Parisienne` 40 px, `rotate(-6deg)`, 3 lines with increasing indent |
| **Encircled arrow chip** | focus cards, news cards | 36 px circle, 1 px ink border, arrow → rotates 45° and fills rust on hover |
| **Quote mark** | purpose + impact testimonials | serif `“` at 40 px, gold in one place, rust in the other |

---

## 6. Motion plan (not visible in a static mock — proposed)

| Interaction | Spec |
|---|---|
| Hero | photo scale 1.0 → 1.04 over 1.2 s on load; eyebrow/H1/lead/CTA stagger 80 ms |
| Section reveals | fade + 16 px rise, 600 ms, `cubic-bezier(.22,1,.36,1)`, once |
| Card hover | photo scale 1.03, arrow chip fills `--a2-rust` with white arrow (no card lift — respects the flat aesthetic) |
| Counters | stat numerals count up once in view (150K+, 350+, 120+, 12+) |
| Stories carousel | manual arrows + drag, autoplay off by default |
| Torn edge | parallax 12 px on scroll (optional, disabled under reduced-motion) |
| Reduced motion | all of the above collapse to opacity-only or none |

---

## 7. Ready-to-use token file

See [`../brand/tokens.css`](../brand/tokens.css) and [`../brand/tailwind.preset.ts`](../brand/tailwind.preset.ts) — copy-paste ready, no build assumptions beyond Tailwind 3.4.
