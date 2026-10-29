# A2 Foundation — Homepage Visual Analysis

**Source file:** `uploads/A2 Foundation Nonprofit Homepage Mockup.png` · 809 × 1945 px · RGB PNG
**Analysis method:** pixel sampling (colour modes, contrast ratios), row/column projection to locate
typographic baselines and card edges, and column-run detection to recover the grid. Every number
marked *measured* comes from those passes; anything marked *inferred* is my reading, and the few
genuinely ambiguous points are listed in §8 rather than guessed at silently.

---

## 1. What we were given

A single, full-page homepage capture — one viewport width, no mobile, no other pages, no
hover/active states, no style guide. Everything below is therefore reverse-engineered from one
image, which is why §7 (open questions) exists.

**It reads as an AI-generated concept rather than a designer's pixel-perfect comp.** Evidence:

1. **Text is occluded by photographs in four places** — "livelihoods to our landscapes" sits *behind*
   the plant leaf in the impact band; "stronger communities" runs *under* the children's photograph
   in Get Involved; the circular "ODISHA · INDIA" stamp overlaps the portrait frame; the word
   FOUNDATION in the header lockup is clipped by the hero image. A human comp wouldn't ship these.
2. **Partner logos are sliced by the section boundary**, and a stray blue glyph (reads as a QR/
   UN-style mark) floats in the strip.
3. **Two different serif behaviours** in the same paragraph block ("Real Change Real People" has a
   ghosted duplicate line under the body copy).
4. Type metrics are inconsistent by ±2 px between otherwise identical card titles.

**What this means for the project:** treat the mockup as *art direction*, not a measurement
authority. We replicate the layout, palette, type hierarchy and ornament exactly, and we fix the
z-order/occlusion defects — that's the difference between "exact replica" and "exact replica of a
broken image". §8 lists each decision so the client can veto any of them.

---

## 2. Section map (measured y-coordinates)

Annotated in `reference/overlay-sections.png` (+ 3 crops). Design values assume a 1440 px desktop
render, i.e. mock px × 1.78.

| # | Section | Mock y-range | Mock h | Design h | Background |
|---|---|---|---|---|---|
| 01 | Header | 0–60 | 60 | 107 | cream `#FBF7F0`, translucent over hero |
| 02 | Hero | 60–400 | 340 | 605 | full-bleed photograph |
| 03 | Values bar | 400–465 | 65 | 116 | cream, sitting on the torn-paper edge |
| 04 | Our Purpose | 465–735 | 270 | 481 | cream + line-art foliage |
| 05 | Focus Areas | 735–968 | 233 | 415 | cream + line-art foliage |
| 06 | Our Impact | 968–1177 | 209 | 372 | forest `#11231B` + plant photo bottom-right |
| 07 | Stories | 1177–1352 | 175 | 312 | cream |
| 08 | Get Involved | 1352–1528 | 176 | 313 | full-bleed sunset photograph |
| 09 | Partners | 1528–1585 | 57 | 101 | cream |
| 10 | News & Insights | 1585–1752 | 167 | 297 | cream |
| 11 | Footer | 1752–1945 | 193 | 344 | forest-deep `#0E231D` |

Rhythm: five cream sections are separated by three dark/photo "acts" (hero → impact → get involved),
so the page breathes in a 3-beat cadence rather than alternating mechanically.

---

## 3. Grid & rhythm (measured)

| Measure | Mock (809 px) | → 1440 px | Implementation |
|---|---|---|---|
| Container | x 46 → 763 = **717 px (88.6 %)** | **1276 px** | `max-w-page` (1280) + `px-gutter` |
| Columns | **4 × 167.5 px, 22 px gutters** | 4 × 298, gap 39 | `grid-cols-4 gap-10` |
| Focus cards | y 781–960 (photo 781–850, body 850–960) | — | `aspect-[16/10]` + `p-6` |
| Story cards | y 1231–1345 | — | horizontal thumb + text |
| News cards | y 1610–1655 | — | thumb 96 px + text |
| Section padding | 40–80 px | 71–142 | `py-section` (64–96) |
| Card radius | 3–4 px | 6–7 | `rounded-card` (4 px) — **keep tight** |

Left margin is **not** centred on the text column: headings, cards and eyebrows all start at x≈46
(or x≈75 for the inner third of Purpose). One container, one alignment edge — that discipline is
what makes the page feel calm.

---

## 4. Colour system (measured mode colours + contrast)

| Role | Hex | Sampled where | Contrast | Verdict |
|---|---|---|---|---|
| Cream page | `#FBF7F0` | 1 625 px mode of the trust band | — | — |
| Cream card | `#F6EFE3` | focus / story / news card fills | — | — |
| Ink heading | `#1C1C1A` | serif H2 in Purpose | **15.98:1** | AAA |
| Ink body | `#3A3A38` | Purpose paragraph | **10.67:1** | AAA |
| Forest band | `#11231B` | 1 158 px mode of impact section | — | — |
| Forest footer | `#0E231D` | 463 px mode of footer | — | — |
| Rust button | `#AB3D24` | Donate / Our Impact / Learn More / Explore | white on it **6.13:1** | AA |
| Rust text | `#B23A26` *(adapted)* | eyebrows, italic "Tomorrow.", story tags | **5.58:1** | AA |
| Gold | `#C9A961` | stat icons, quote mark, hairlines on forest | **7.29:1** on forest | AAA |
| Gold deep | `#A9853F` | outline icons on cream | 3.06:1 | decorative only |
| Sand | `#E8DBC4` | dividers, ornament line-art | — | — |

**Colour logic worth naming in the deck:** three families, three jobs.

- **Cream + sand** = the paper the site is printed on.
- **Forest** = the two places where the organisation states its results (impact + footer).
- **Rust** = action, and only action. Every clickable primary is rust; almost nothing else is.
- **Gold** = ornament. It carries no meaning that isn't also in a text label.

### The one accessibility correction (evidence)
Mockup eyebrows are a *lighter* terracotta, approximately `#E2704F`. Measured against cream that is
**2.95:1** — a clear WCAG AA failure for 12 px text. We split the colour into two tokens:
`--a2-rust` (`#AB3D24`) for fills and `--a2-rust-text` (`#B23A26`, 5.58:1) for small labels.
Visually indistinguishable at a glance; legally defensible in an audit. All other sampled pairs pass
(see `02-design-tokens.md` §1).

---

## 5. Typography (measured baselines)

Recovered by row-projection of ink density:

| Element | Lines detected | Baseline pitch | Cap-height | Estimated design size |
|---|---|---|---|---|
| Hero H1 "People / Planet / Possibility" | 3 | **49 px** | ~35 px | **88 px / 0.98 lh / −0.02em** |
| Purpose H2 (4 lines) | 4 | **33 px** | ~24 px | **58 px / 1.05** |
| Purpose body | 4 | 20 px | ~10 px | 16–18 px / 1.7 |
| Impact H2 | 2 | 28 px | — | 48 px / 1.08 |
| Impact stat numeral | 1 | — | 20 px | 50 px |
| Focus card title | 1 | — | 11 px | 24 px |
| Story/news card title | 2 | 22 px | 9 px | 22 px |
| Eyebrow caps | 1 | — | 6 px | 12 px / 0.18em / 600 |
| Nav link | 1 | — | 7 px | 14.5–15 px / 500 |

**Three type voices:**
1. **Display serif** (moderate contrast, calligraphic `y`/`g`/`R`, generous counters) — all headings,
   card titles, stat numerals, testimonials. *Build spec: Newsreader, weight 400, tight tracking.*
2. **Humanist sans** — nav, buttons, body, labels, dates, footer. *Build spec: Inter 400/500/600.*
3. **Monoline script** — only the hero accent, "Stronger Communities / Brighter Futures", rotated
   ≈ −6°, right-aligned, with a hand-drawn leaf beside it. *Build spec: Parisienne 40 px.*

Numerals are **old-style in serif contexts** (the "150K+" uses proportional old-style figures) but
**tabular in the deck-stat treatment**. Preserve both — it's a small signal of craft.

---

## 6. Section-by-section anatomy

### 01 · Header — 2-line logo lockup, 6 links, 3 utilities
- Logo: "A2" in serif, rust, ~40 px with a **gold laurel/leaf** super-script; below it "FOUNDATION"
  in 11 px letterspaced caps (ink); below that the tagline "PEOPLE · PLANET · POSSIBILITY" in 8 px,
  0.24em tracking, rust.
- Nav centred: Home (active, rust, **1 px underline offset 14 px**), About, Our Work, Impact,
  Stories, Get Involved — 14.5 px, 500, ink.
- Utilities right: search (magnifier, no field), `Donate Now →` rust button 150 × 32 (→ 148 × 48 design), language `EN | ଓଡ଼ିଆ` with the Odia label in a lighter weight.
- **Behaviour (inferred):** sticky; on scroll the cream becomes solid with a hairline bottom border;
  a scroll-progress hairline in rust is a natural addition but is **not** in the mockup — flagged.

### 02 · Hero — the design's centre of gravity
- Full-bleed photograph, subject right-of-centre, warm bokeh, strong left-side scrim
  (`linear-gradient(100deg, rgba(20,14,8,.82), rgba(20,14,8,.35) 55%, transparent)`).
- Eyebrow: tiny rust `00` numeral + `A BRIGHTER TOMORROW` (cream, 0.2em, 11 px).
- H1: three lines, cream, serif, ~88 px, deliberately ragged right (People / Planet / Possibility).
- Lead: 3 lines, max-width ≈ 300 mock px (→ 534 design px), 90 % cream.
- CTAs: `Our Impact →` (rust, 140 × 26 mock → 190 × 48) and `Watch Our Story ▶` (transparent,
  1 px white 55 % border, 45 px). Note the **second button is deliberately secondary** — outline,
  not ghost.
- Script accent, right side, 3 lines growing in indent, plus leaf glyph — the only script on the page.
- **Torn-paper edge** at the bottom: irregular tear with a 1 px darker fibre shadow, revealing a
  **pen-and-ink Odisha illustration** (temple, palms, boat, hills) in sand on cream. This is the site's
  single strongest brand signature and must be an SVG, not a raster crop.
- Evidence of an **"ODISHA · INDIA" circular stamp** top-right of the *next* section, not the hero.

### 03 · Values bar — 4 principles on the tear
`COMMUNITY FIRST / People-led development` · `SUSTAINABLE CHANGE / Long-term impact` ·
`INCLUSIVE GROWTH / No one left behind` · `TRANSPARENT ACTION / Accountable and ethical`
Each: 28 px circle-line icon, 11 px caps label (ink, 600, 0.12em), 10 px note (ink-soft).
Separated by 1 px sand vertical rules at 60 % height. Purpose: it converts the hero's emotion into a
**method statement** before the reader scrolls further.

### 04 · Our Purpose — text + collage, with a quote bridging them
- Left (~45 %): eyebrow `01 | OUR PURPOSE ——`, H2 4 lines with the last word **italic + rust**
  ("Tomorrow."), body 4 lines, rust CTA `Learn More About Us →`.
- Right (~55 %): **layered collage** — landscape photo (sunset, palms, village) with a second
  portrait photo (elder, warm interior) overlapping at 60 % height and offset right, an overlapping
  cream **"DRIVEN BY PEOPLE / INSPIRED BY POSSIBILITIES" card** with a gold leaf, and the circular
  **stamp** top-right. Frames have 4 px padding in cream + hairline (polaroid logic).
- Quote runs *under* the collage bottom-left: `“Real change begins when communities believe in their
  own potential.”` — 14 px serif italic with a rust 40 px quotation mark.
- Foliage line-art at both margins, plus a small rust 5-dot grid.

### 05 · Focus Areas — four "seamless" cards
`OUR FOCUS AREAS` + subline "Integrated solutions for stronger communities and a healthier planet."
Each card: photo top (16:10, flush to card edges, 3 px radius), then cream body with
**gold outline icon** (book · heart · sprout · leaf), serif title (Education / Health & Wellbeing /
Livelihoods / Environment), 2-line copy, and an **encircled arrow** bottom-right.
Cards sit at y 781–960, exactly on the 4-column grid. No shadows — separation comes from the
cream-deep fill against cream.

### 06 · Our Impact — the dark act
- Forest bleed edge-to-edge, with an oversized **leaf/plant photograph** entering bottom-right and
  faint sand botanical line-art at both edges.
- Left: eyebrow `03 | OUR IMPACT`, H2 "Real Change / Real People" (2 lines, cream), 4-line body,
  rust CTA `Explore Our Impact →`.
- Right: **four stat blocks** — gold icon above, numeral (150K+ · 350+ · 120+ · 12+), label
  (Lives Touched · Communities · Projects Implemented · Years of Impact), separated by 1 px gold-at-22 %
  rules. Below them a **testimonial**: gold `“`, 2-line cream italic, attribution
  "— Community Member, Odisha" in muted cream.
- ⚠️ In the mockup the body copy is partly **occluded by the leaf photo**; the gold quote is placed
  inline with the paragraph. Build fix: give the photo a 40 % max width and put the testimonial in its
  own row (see §8-B).

### 07 · Stories — 3-up, horizontal cards, arrows top-right
Head: eyebrow `04 | OUR STORIES`, subline in peach "Real stories. Real people. Real change.",
two circular arrows (left filled sand-muted, right outline) at the far right.
Each card: **square-ish portrait 90 × 118 mock px on the left**, then column: rust caps tag
(EDUCATION / LIVELIHOODS / ENVIRONMENT), 2-line serif title ("A New Beginning for Ramesh"…),
2-line copy, `Read Story →` in rust with arrow.
Deliberately editorial: no card background — the column *is* the card. This is a carousel (arrows
imply more than three items), showing 3 of N.

### 08 · Get Involved — conversion act on a photograph
Sunset photograph, four children seated, warm rim light.
Left: eyebrow `05 | GET INVOLVED`, H2 "Be Part of the Change" (2 lines, cream, 44 px), 3-line body.
Right: **three full-width cream buttons** stacked, each 190 × 52 mock (→ 340 × 92 design) with
gold icon, bold label, muted sublabel, and arrow right:
`Donate Now / Support our mission` · `Volunteer / Give your time and skills` ·
`Partner With Us / Create greater impact together`.
The cream buttons on a dark photograph is the page's clearest CTA hierarchy — replicate exactly.

### 09 · Partners — quiet credibility strip
`OUR PARTNERS` + subline, then a single row of logo lockups, right-capped by `and more →`.
⚠️ **Legal flag:** the mockup uses real marks (Tata Trusts, HCL Foundation, Infosys, Reliance
Foundation, Bharti, USAID, UN/UNDP-style glyph). An NGO may only display a partner's mark with
written permission; also verify each partnership and each logo's *current* form. See §8-C.

### 10 · News & Insights — compact 3-up
Head + `View All →`. Each card: 96 × 62 thumb left, then date in 9 px caps (12 SEP 2026), 2-line
serif title, encircled arrow bottom-right. Card fill cream-deep, 4 px radius.

### 11 · Footer — 5 zones
Left: logo lockup (cream) + 3-line mission + 4 social icons (Facebook, Instagram, LinkedIn, YouTube
in filled circles/rounded squares).
Middle: `Quick Links` (About, Our Work, Impact, Stories, Get Involved, Contact) and `Our Focus`
(Education, Health & Wellbeing, Livelihoods, Environment), separated by 1 px vertical rules.
Right: `Stay Connected` + 2-line note + inline newsletter (white input 176 × 30 + rust 32 × 30 submit).
Bottom bar: hairline; left `Privacy Policy | Terms of Use | Sitemap`, right `© 2026 A2 Foundation.
All rights reserved.` Plus large foliage line-art in both bottom corners.

---

## 7. Component inventory (what has to exist before we build sections)

| # | Component | Variants / states | Used in |
|---|---|---|---|
| 1 | `Logo` | full lockup (header), stacked (footer), mark only | 01, 11 |
| 2 | `NavLink` | default · active (rust + underline) · focus | 01 |
| 3 | `Button` | rust · outline-light · cream-solid · link-with-arrow | everywhere |
| 4 | `ArrowChip` | outline → filled on hover | 05, 10 |
| 5 | `Eyebrow` | with numeral + rule · plain | every section |
| 6 | `SectionHeading` | h2 + subline, left · with trailing action (arrows / View All) | 05, 07, 09, 10 |
| 7 | `ValueItem` | icon + label + note | 03 |
| 8 | `FocusCard` | photo + icon + title + copy + chip | 05 |
| 9 | `StatBlock` | icon + numeral + label | 06 |
| 10 | `Testimonial` | quote + attribution, gold-on-forest · rust-on-cream | 04, 06 |
| 11 | `StoryCard` | thumb-left horizontal | 07 |
| 12 | `NewsCard` | thumb-left compact | 10 |
| 13 | `ActionCard` | icon + label + sublabel + arrow (cream on photo) | 08 |
| 14 | `PartnerLogo` | text lockup · graphic lockup | 09 |
| 15 | `PhotoFrame` | polaroid (cream border + hairline) · flush | 02, 04, 05 |
| 16 | `TornEdge` | hero-only, with line-art slot | 02 |
| 17 | `OrnamentFoliage` | 3 SVG variants, corner / margin placement | 04, 05, 06, 11 |
| 18 | `CircleStamp` | text-on-path, optional slow rotation | 04 |
| 19 | `ScriptAccent` | text + leaf | 02 |
| 20 | `Carousel` | 3-up, arrows, drag, no autoplay | 07 |
| 21 | `Newsletter` | inline input + submit, success/error states | 11 |
| 22 | `Icon` set | 4 value icons, 4 focus icons, 4 stat icons, social, search, arrows | all |

---

## 8. Risks, defects and the decisions I need the client to confirm

These are the places where "exact replica" is either impossible (the mockup is a static picture) or
undesirable (the picture contains defects). My proposed treatment is in the right-hand column.

| # | Issue in the mockup | Proposed treatment |
|---|---|---|
| **A** | **Text occluded by photos** in 4 places (impact body, get-involved body, stamp over portrait, header "FOUNDATION" under hero) | Fix z-order: text always above imagery; hero photo starts *below* the header bar. No visual loss. |
| **B** | Impact band: leaf photo overlaps the body copy; testimonial shares the paragraph column | Photo capped at 38 % width bottom-right with a soft mask; testimonial gets its own row under the stats |
| **C** | **Real partner logos** (Tata, HCL, Infosys, Reliance, Bharti, USAID, UN glyph) | Build with neutral placeholder lockups; swap only with written permission. Flag: USAID's status changed in 2025 — verify current endorsement before publishing |
| **D** | No mobile design provided | I design mobile-first (breakpoints 390 / 768 / 1024 / 1440) and show it for approval before build — see build plan Phase 2 |
| **E** | No states (hover, focus, active, empty, loading, error) | Defined in the design system (`02-design-tokens.md` §6) and reviewed with the client |
| **F** | No other pages (About, Our Work, Impact, Stories, Get Involved, Donate) | Phase 5 covers the five most important; each reuses these components |
| **G** | Fonts unidentified (licensed display serif + script) | Build with Newsreader + Parisienne; if the client owns the original fonts, swapping is a one-line token change |
| **H** | Odia word `ଓଡ଼ିଆ` in the language switcher, but no bilingual layouts | Phase 6: full Odia route (`/or`) with `hreflang`; the switcher ships functional, not decorative |
| **I** | Stat numerals, dates and partner names are invented | Confirm real figures/copy before launch; content is placeholder-flagged in the CMS until signed off |
| **J** | Eyebrow colour fails AA at small sizes | Split into `rust` (fills) + `rust.text` (labels) — visually identical, audit-proof |
| **K** | Torn edge + illustration behaviour at other widths | Torn edge = responsive SVG (height 32–48 px); line-art illustration re-crops, never stretches |

**Two questions that change scope, so I'd like them answered before Phase 2:**

1. **Is the photography owned?** If the hero/collage images are placeholders, I'll generate
   consent-safe stand-ins for the prototype and hand over a shot list. If they're licensed assets the
   client already owns, send them and we'll use the real ones from day one.
2. **Is this page the whole site, or the first of six?** It changes whether we build a one-off page or
   a component library + templates. My plan assumes the latter.

---

## 9. How we prove "exact replica"

Not by opinion — by overlay. At the end of every phase:

1. Render our page at **1440 px** with the same content, full-page screenshot.
2. Upscale the client mockup to 1440 px (LANCZOS) and set it to 50 % opacity over our render.
3. Measure drift section-by-section: **container edge ±4 px, section height ±2 %, heading size
   ±1 px, colour ΔE < 2**.
4. Publish a side-by-side diff per section in `reference/fidelity/` so the client sees the number,
   not a promise.

Automation: a Playwright script captures the 11 section screenshots at 1440/1024/768/390 and writes
`fidelity/report.md`; the Colour check compares computed styles against `brand/tokens.css`.
