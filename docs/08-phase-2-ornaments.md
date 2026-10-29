# Phase 2 — ornament & art system

**Live:** `/ornaments` on the preview server (:3100)
**Boards:** `reference/phase2/` — 10 captures (hero, tear, vignette, foliage, stamp, script, mobile, tablet)
**Gates:** `fidelity.mjs` **14 match / 0 drift** · axe **0 violations** (38 PASS / 1 WARN / 0 FAIL) · `final-gate.mjs` **116 PASS / 0 WARN / 0 FAIL** on 3 routes
**Status:** built, typed, token-clean, measured against the reference, validated.

The client's brief was *"the replica not exactly, but the concepts used should
resemble highly"*. That is a measurement brief, so Phase 2 now ends with one:
`validation/harness/fidelity.mjs` extracts the reference's ornament geometry from
`uploads/A2 Foundation Nonprofit Homepage Mockup.png` (809 × 1945) and the same
geometry from the built page, normalises both to the page width, and fails on drift.

---


> **Superseded in Phase 3 — the tear geometry.** Two numbers in this document were
> measured against a profile contaminated by the mockup's burnt-in hero text, and
> Phase 3 replaced them after re-tracing the sheet edge column by column:
>
> * the tear is **not level** — it is level for the left 62% of the page and then
>   climbs **9.39% of the page width** into the top-right corner (this doc's
>   "level / 8.7% / 150-canvas" is wrong);
> * the sheet is painted **up** from the deckle, not down from the box top, and the
>   band must therefore have **no background of its own**;
> * the deckle's depth only reads as paper when the slow wander carries most of the
>   movement and the per-tooth nicks are tiny.
>
> See `docs/09-phase-3-homepage.md` §2 for the measured profile and the three failed
> attempts. Everything else in this document still stands.

## 1. Fidelity — the acceptance table

Every row is measured from pixels on **both** sides: the reference is thresholded in
Pillow, and the build is screenshotted and thresholded with the same rule. DOM boxes
would flatter us — a 1325 × 166 `<svg>` is not 1325 px of drawing.

| # | Property | Reference | Build | Δ | Tolerance |
|---|---|---|---|---|---|
| 1 | Tear reveals paper (cream below) | cream below the tear | `rgb(251,247,240)` | concept ✓ | — |
| 2 | Tooth depth (% of page width) | 2.22% | 2.03% | −8.8% | ±40% |
| 3 | Deckle pitch (% of page width) | 0.74% | 0.69% | −6.9% | ±30% |
| 4 | Tear rise toward the right | −9.39% | −7.99% | −14.9% | ±30% |
| 5 | Illustration width (% of band) | 91.7% | 88.8% | −3.2% | ±25% |
| 6 | Illustrator ink depth below the tear | 4.08% | 5.62% | +37.7% | ±45% |
| 7 | Illustration right overhang | −14.2px | 0px | bleeds ✓ | ±100% |
| 8 | Illustration ink centroid (0…1) | 0.77 | 0.73 | −5.2% | ±15% |
| 9 | Ink on paper, not on photograph | cream sheet | `ochre` on `cream` | concept ✓ | — |
| 10 | Stamp diameter | 186.9px | 96px | −48.6% | ±60% |
| 11 | Stamp right overhang | 0px (touches edge) | 0px | 0% | ±100% |
| 12 | Script accent centroid X | 0.78 | 0.85 | +9.3% | ±22% |
| 13 | Script accent centroid Y | 0.12 | 0.10 | −14.7% | ±60% |
| 14 | Foliage clipped by the page edge | x0 = 0 | negative inset | concept ✓ | — |

Reproduce with `node validation/harness/fidelity.mjs` (writes
`validation/fidelity-report.json`, exits 1 on any drift).

### What the measurements changed

| What we assumed | What the reference actually does |
|---|---|
| The tear is a level band | The sheet **climbs ~9% of the page width** toward the right. That wedge *is* the composition: it is why the vignette has a tall margin on the right and a sliver on the left. `TornEdge rise` draws the measured wedge on a 150-unit canvas. |
| The vignette is a wide, even frieze | Almost nothing before 40% of the width; everything from 62% rightward, densest at 70–88% (**centroid 0.77**). An even spread reads as wallpaper — that was the first pass's failure. |
| More teeth = finer | The comparable quantity is **pitch**, not count: 135 pulls across an 809px page = 0.74% of the width. 240 pulls on a 1440px page was twice the reference's density and read as a saw blade. |
| The mark sits below the tear | It is printed **on and across** it — ink grows with the sheet, from a 10px scribble at the far left to palms cropped by the right edge. |
| Anchors can be hand-placed | They can't. Each motif carries `data-a="X Y S"` and `anchorMark()` reads the tear's **own** `riseEdge()` to size and seat it in the cream the wedge leaves. There is no second copy of the slope to drift. |

---

## 2. What Phase 2 delivered

Six primitives, all decoration, all `currentColor`, all `aria-hidden` +
`pointer-events-none`:

| Component | File | What it is | Where the mockup uses it |
|---|---|---|---|
| `TornEdge` | `ornaments/torn-edge.tsx` | Deckled paper edge as an SVG mask: 132-pull level band **and** a 140-pull rising wedge carrying the measured diagonal, plus a 1.5-unit fibre shadow | Hero → Values join |
| `OdishLineArt` + `…Compact` | `ornaments/odisha-line-art.tsx` | Pen-and-ink Odisha vignette: far line, scrub, boat + traders, Ghats, shikhara + mandapa, banyan, palms; `anchorMark()` seats each motif on the tear | Printed in the tear |
| `FoliageSpray` / `LeafSprig` / `FoliageCorner` | `ornaments/foliage.tsx` | Engraved botanical: almond leaves, midrib + 4–9 veins, two-pass spray | Purpose, Focus, Stories, footer corners |
| `CircleStamp` | `ornaments/circle-stamp.tsx` | Live `textPath` rubber stamp, 48-tick die edge, `useId()` path id | Overlaps Purpose photo |
| `ScriptAccent` | `ornaments/script-accent.tsx` | Parisienne flourish, 4 lines, −6°, leaf | Hero right |
| `OrnamentHero` | `ornaments/ornament-demo.tsx` | The composite proof band | Hero |

Plus **4 ornament tokens** (`ochre`, `ochre-soft`, `foliage`, `foliage-deep`),
**3 script type steps** (`script`, `script-sm`, `script-xs`), `shadow-script`,
`--a2-tear-h`, and two CSS primitives (`a2-hero-field`, `a2-hero-glow`).

---

## 3. The decisions that make it look right

### The tear is a polyline, and its diagonal is derived
Smoothing the path turns a tear into a **scallop shell** — the most common way this
effect looks fake. The deckle is straight runs of ~0.7% of the page width with
deterministic deep bites, high-frequency noise biased over low (low-frequency
weights alone read as dunes). On top of that, `riseEdge(x)` is the measured wedge;
`anchorMark()` and the tear are the *same* function, so the illustration cannot
float off the paper.

### The vignette is printed on the paper, scaled by the room it has
At the left the wedge leaves almost no cream, at the right it leaves a lot. Each
motif is therefore scaled to **fit the cream between the tear and the band's foot**
(capped per-motif) — which is why the drawing grows to the right exactly as the
reference's does, and why it never lands on the photograph, where `ochre` on
`forest` is all but invisible.

### Stacking is part of the ornament
`TornEdge` is `z-10`; the illustration must be `z-20` or the sheet paints over the
ink. This cost a full debug cycle: the mark was rendering, measuring, and invisible.

### Tokens, not literals
`ochre` is 4.61:1 on cream — the only ornament ink used for anything text-like.
`ochre-soft` (2.48:1 on cream) and `foliage` (1.95:1) are pure decoration, exempt
under WCAG 1.4.11 and documented as such in `tokens.css`.

---

## 4. Contract every ornament obeys

- `aria-hidden` unless a `title` is passed; `pointer-events-none`; always behind text
- ink from a token, never a literal
- one script per page
- re-crop for small screens, never squash
- honours `prefers-reduced-motion`
- never the sole carrier of a fact
- geometry after mount only where it depends on layout (`anchorMark`); identical
  markup on the server, so hydration stays silent

---

## 5. Known gaps carried forward

- **Photography.** The hero photograph is a flat forest field; the reference's tear
  reveals a real image, so the ink-on-photo rows are conceptual until Phase 4.
- **Stamp at 1440.** 96px vs the reference's 186.9px (−48.6%) is inside tolerance but
  is a size choice, not a match; revisit when the Purpose photo exists.
- `/ornaments` is a review sheet, not a page of the site.
