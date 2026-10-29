# A2 Foundation — Phase 1 review sheet

**Live:** `/kitchen-sink` on the preview server (port 3100)
**Screenshots:** `reference/phase1/` — six review boards
**Status:** built, type-checked, linted, built for production, zero console errors at 1440 and 390,
and **validated** — axe 0 violations, 259/259 contrast pairs pass, 0 failures across 320–2560,
200 %/300 % zoom and reduced motion; 116 checks in total. See
[`06-phase-1-validation.md`](06-phase-1-validation.md) and the final
[`07-phase-1-final-audit.md`](07-phase-1-final-audit.md).

---

## What Phase 1 delivered

| Area | Delivered | Where |
|---|---|---|
| **Tokens** | 12 colours, 3 type voices, 9-step fluid type scale, container/spacing/radius/shadow, motion easings | `brand/tokens.css` + `brand/tailwind.preset.ts` |
| **Fonts** | Newsreader (display, 400/500 + italic), Inter (400/500/600), Parisienne (script) — self-hosted via `next/font` | `app/layout.tsx` |
| **Primitives** | Button (4 treatments × 3 sizes × states), Eyebrow, Tag, Badge, Card (4 variants), CardMedia, ArrowChip, SectionHeading, TextField, Newsletter, Logo, Reveal | `components/ui/` |
| **Icons** | 26 hand-drawn 1.5px line-art icons (values 4 · focus 4 · stats 4 · actions 3 · socials 4 · arrows/play/quote/sprig 7) | `components/icons/index.tsx` |
| **Review surface** | `app/kitchen-sink/page.tsx` — colour, type, buttons, eyebrows, headings, cards, inputs, icons, logo, motion, spacing | `/kitchen-sink` |

Everything on the sheet is driven by the token file. There is **no hard-coded hex, radius or
font size in any component** — that is the rule the rest of the build inherits.

---

## Measured token sheet (as rendered)

### Colour — 12 swatches, contrast verified
`cream #FBF7F0` · `cream-deep #F6EFE3` · `sand #E8DBC4` · `ink #1C1C1A` (15.98:1) ·
`ink-soft #3A3A38` (10.67:1) · `rust #AB3D24` (5.74:1) · `rust-text #B23A26` (5.58:1) ·
`forest #11231B` · `forest-deep #0E231D` · `gold #C9A961` (7.29:1 on forest) ·
`gold-deep #A9853F` (icons on cream) · `peach #E9A184`

The one correction to the mockup is visible on the sheet: the eyebrow terracotta was 2.95:1
(fails AA at 12px), so it is split into a fill token and a text token.

### Typography — as rendered at 1440
| Token | Renders at | Used for |
|---|---|---|
| `text-hero` | **88px** | the three-line hero headline |
| `text-h2` | **58px** | section headings (Purpose, Focus Areas, Stories) |
| `text-h2-sm` | 48px | Impact band, Get Involved |
| `text-h3` | 24px | focus-card titles |
| `text-stat` | 50px | 150K+ / 350+ / 120+ / 12+ |
| `text-lead` | 18px | hero lead, section sublines |
| `text-base` | 16px | body copy |
| `text-sm` | 14px | card copy, footer links |
| `text-eyebrow` | 12px / 0.18em caps | every section opener |

Serif numerals are set to **old-style proportional** (`font-variant-numeric`), matching the
mockup's "150K+" and "12+".

### Geometry
Container 1280px (mockup: 88.6% of viewport → 1276px @1440) · gutters 20/32/40 ·
section rhythm 64/80/96 · radius **btn 3 · card 4 · photo 3** · buttons 48px tall ·
card photos 16:10 · story thumbs 4:5.

---

## Four bugs found and fixed during this phase

Worth recording, because each one would have silently propagated into every section:

1. **Custom font sizes were being merged away.** `tailwind-merge` treats `text-h2` as a colour
   unless it is told otherwise — the exact bug that produced 16px headings in the first build.
   Fixed by extending the class groups in `lib/cn.ts`.
2. **`next/font` families were not applying.** The CSS variables resolved to the literal names
   ("Newsreader") rather than the hashed families, so the browser fell back to Georgia. Fixed by
   chaining `var(--font-a2-display, "Newsreader")` in the token layer.
3. **Event handler passed from a server component** to the client-only `Newsletter`, which broke
   the static build of `/kitchen-sink` (it hung, then 500'd). Fixed by making the handler optional.
4. **Reveal blocks could stay invisible** if they were already on screen at mount (smooth-scroll
   and anchor jumps skip the observer). Fixed with an in-view check on mount.

---

## What Phase 1 deliberately does *not* include

- **No art system yet** — torn-paper edge, Odisha line-art, foliage, circular stamp and the script
  accent are Phase 2. The script is shown on the sheet only as a type specimen.
- **No header or hero** — Phase 3.
- **No photography** — the cards show labelled placeholders (`PHOTO 16:10`, `4:5`) on purpose, so
  nobody mistakes a stock image for the real art direction.
- **No CMS** — Phase 6.

---

## Review checklist (what I need from the client)

- [ ] Is the **serif** acceptable? It is Newsreader; the mockup's face is unidentified. If the
      client owns the original, we swap one line.
- [ ] Is the **script** acceptable (Parisienne) — used only in the hero accent?
- [ ] Confirm the **rust split** for eyebrows (visually identical, passes AA).
- [ ] Confirm the **button geometry** — 48px tall, 3px radius, no shadow. This is the detail that
      makes the design read as editorial rather than SaaS.
- [ ] Confirm **card flatness** — no shadows anywhere; separation comes from the cream/cream-deep
      contrast. Adding a shadow breaks the character.
- [ ] Approve the **icon style** (1.5px hand-drawn line-art) before Phase 2, because the ornament
      system must match it.

Once these are ticked, Phase 2 (torn edge, line-art illustration, foliage, stamp, script accent)
is the next thing I build — it is the highest-risk visual work and it needs to land before the hero.
