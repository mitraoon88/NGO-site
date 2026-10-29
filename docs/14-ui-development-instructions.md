# 14 · UI/UX Development & Integration Instruction Sheet

**Version 1.0 · for the integrating developer · no prior knowledge of this project assumed.**

---

## How to use this document

This is the only document you need to build and ship the A2 Foundation front end.
It is written so that you can follow it top to bottom without asking anyone a
question. Where a decision was already made, the decision and its reason are
both here, so you can tell the difference between "I must do this" and "I may
change this if I have a better idea."

**Read the whole of Parts 0–3 before you write any code.** Those three parts are
the setup and the rules. Everything after them is reference — look it up as you
need it.

| Part | You need it when |
|---|---|
| **0** — Before you start | Today, first |
| **1** — Environment and commands | Today, first |
| **2** — Where everything lives | Today, first |
| **3** — The token contract (the naming map) | Today, first — this is the part that breaks builds |
| **4** — The 13 UI primitives | Every time you build a component |
| **5** — Ornaments | Whenever a section needs decoration |
| **6** — Icons | Whenever you need a glyph |
| **7** — The 11 homepage sections | Building or rebuilding the page |
| **8** — Responsive, zoom and overflow | Before you call any layout done |
| **9** — Accessibility obligations | Before every commit |
| **10** — Motion | Whenever something moves |
| **11** — Wiring to WordPress | When you replace mock data |
| **12** — The copy deck | When you touch any text |
| **13** — The gates and how to pass them | Before every commit and before handover |
| **14** — Packaged setup (Tailwind, fonts, globals) | Copy-paste, once |
| **15** — Troubleshooting | When something fails |
| **16** — The printable checklist | Every PR |

### The four things that will get a pull request rejected

Read these now, so you never have to be told twice:

1. **A raw hex colour or a raw `px` font size in a component.** Every value comes
   from a token. `bg-[#B84A39]` and `text-[17px]` are both rejected.
2. **`outline-none`, `outline-transparent`, or a custom focus ring.** The system
   has exactly one focus treatment, defined once. A second ring colour is the ring
   that fails on the one surface nobody tested.
3. **The word "Donate" (or waste, garbage, wages, worker, 80G, FCRA).** Blocked
   terms. The build fails on them and so will review.
4. **A `+` appended to a metric figure in JSX.** The server decides when a `+` is
   earned. A client-side `+` turns 148.6 tonnes into a false compliance claim.

---

# Part 0 — Before you start

## 0.1 What you are building

A **headless** setup: WordPress holds the content and the business rules, Next.js
renders the public pages.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  a2-core (WordPress plugin) │        │  apps/web (Next.js 14)       │
│  private, wp.a2foundation.in│◄───────│  public, a2foundation.in     │
│                             │  a2/v1 │                              │
│  • 26 content types         │  JSON  │  • 11 homepage bands         │
│  • roles + zone scoping     │        │  • 13 UI primitives          │
│  • term charter             │        │  • design tokens             │
│  • ledger + metrics         │        │  • static + on-demand ISR    │
│  • compliance switches      │        │  • owns CSP and all headers  │
└─────────────────────────────┘        └──────────────────────────────┘
```

**You are responsible for the right-hand box.** The left-hand box is written and
documented in `docs/10`–`docs/13`; you install it, you do not modify it.

## 0.2 What already exists and is signed off

Do not redesign these. They have been through eleven rounds of audit.

| Thing | State |
|---|---|
| The design token system (`brand/khandolite.*`) | **Signed off.** 23/23 contrast pairs measured, 0 drift. |
| The 11 homepage bands | **Built and validated.** a11y 40/0, UX 19/19, fidelity 17/0. |
| The 13 UI primitives | **Built.** Every control ≥ 44×44, 55 tab stops, 0 blind. |
| The ornament system | **Signed off.** All decoration-only, all `aria-hidden`. |
| The WordPress plugin | **Written.** 15 files, `php -l` clean, not yet run live. |

## 0.3 What is not done and is yours to do

1. **The palette swap.** The page currently uses the old mockup palette
   (`rust`/`forest`/`gold`). It must move to Khandolite
   (`terracotta`/`charcoal`/`marigold`). Part 3 is the complete map.
2. **The copy swap.** The page currently shows Phase-3 placeholder copy. It must
   show `lockedCopy` from the token module. Part 12 is the complete deck.
3. **The data wiring.** The page currently reads `content/home.ts`. It must read
   `a2/v1`. Part 11 is the complete contract.
4. **Everything else on the site.** Phase 5 route bodies, Phase 7 Odia. Out of
   scope for this sheet.

## 0.4 The three questions you will want to ask

**"Can I change a design decision?"**
If the reason for it is stated in this document and the reason is *measured*
(contrast ratio, tap target, overflow), no. If the reason is *aesthetic* and you
have a better idea, yes — write the reason in the commit message and update the
relevant doc.

**"What if the design needs a value that isn't a token?"**
Add it to `brand/khandolite.tokens.mjs`, regenerate, and run the drift check. Never
add it inline. If it is genuinely local (a one-off SVG dimension), it goes in the
component with a comment saying why it is local.

**"What if WordPress is not available yet?"**
Keep building. `content/home.ts` is the fallback and every component already works
against it. Part 11 shows the adapter that swaps one for the other without
touching a single component.

---

# Part 1 — Environment and commands

## 1.1 What you need installed

| Tool | Version | Why |
|---|---|---|
| Node | 18.17+ (20 LTS recommended) | Next.js 14 |
| npm | 9+ | lockfile is `package-lock.json` |
| PHP | 8.2+ | only to lint the plugin: `php -l` |
| Git | any | |

Nothing else. No Docker required, no database for the front end.

## 1.2 First run

```bash
cd apps/web
npm ci                 # installs exactly the lockfile, not "close enough"
npm run dev            # http://localhost:3100
```

The dev server binds `0.0.0.0:3100` on purpose so it is reachable from a container
or a phone on the same network.

Open `http://localhost:3100` — the homepage. Also useful:

| URL | What it is |
|---|---|
| `/` | the homepage, all 11 bands |
| `/kitchen-sink` | every primitive and every state on one page — build against this |
| `/ornaments` | every ornament at every size — check a decoration here |
| `/about`, `/impact`, … | route shells (interim, Phase 5 replaces them) |

## 1.3 Commands

| Command | Does | When |
|---|---|---|
| `npm run dev` | dev server, hot reload | always |
| `npm run build` | production build; **fails on a type error** | before every push |
| `npm run validate` | tokens → `tsc` → lint → build | before every push |
| `npm run check:tokens` | fails on a banned class name | faster than a build |
| `npm run lint` | eslint | |

Gates live one level up (they need Playwright):

```bash
cd ../../validation/harness
npm install                    # once
npx playwright install chromium
node a11y-audit.mjs            # accessibility + focus ring
node ux-audit.mjs              # 19 UI/UX checks
node final-gate.mjs            # 123 checks incl. 10 zoom checks
node fidelity.mjs              # 17 rows vs the approved design
node screens.mjs               # screenshots to reference/phase3/
```

**Non-negotiable: `npm run validate` must pass before you push.** It is the only
gate that catches a type error, and a type error in a React Server Component
manifests as a blank page in production, not as a console warning.

## 1.4 The one-minute orientation

```
apps/web/
├── app/
│   ├── layout.tsx          ← fonts, metadata, <html lang>
│   ├── globals.css         ← Tailwind layers + the one focus rule
│   ├── page.tsx            ← the homepage: imports the 11 sections in order
│   └── kitchen-sink/       ← build against this page
├── components/
│   ├── ui/                 ← the 13 primitives (Part 4)
│   ├── sections/           ← the 11 bands (Part 7)
│   ├── ornaments/          ← decoration (Part 5)
│   └── icons/              ← 25 glyphs (Part 6)
├── content/home.ts         ← ALL page copy. The only file with text in it.
├── lib/cn.ts               ← classname merge helper
└── tailwind.config.ts      ← imports the preset; only local extensions here

brand/                      ← one level above apps/web, shared with WordPress
├── khandolite.tokens.mjs   ← THE source of truth
├── khandolite.css          ← CSS variables
└── khandolite.tailwind.preset.mjs
```

**Rule: no user-visible string is ever typed inside a component.** Text lives in
`content/home.ts`. This is what makes the copy swap in Part 12 a one-file change
and what lets the term-charter lint scan a single directory.

---

# Part 2 — Where everything lives, and which file to open

## 2.1 "I need to change X" → open this file

| I need to change… | Open |
|---|---|
| a colour, font, size, spacing, radius | `brand/khandolite.tokens.mjs` |
| the CSS variable that mirrors a token | `brand/khandolite.css` (and change both) |
| a Tailwind utility name | `brand/khandolite.tailwind.preset.mjs` |
| any text on the page | `apps/web/content/home.ts` |
| how a section is laid out | `apps/web/components/sections/<name>.tsx` |
| how a button looks | `apps/web/components/ui/button.tsx` |
| a glyph | `apps/web/components/icons/index.tsx` |
| a decoration | `apps/web/components/ornaments/` |
| the focus ring | `apps/web/app/globals.css` — **only there** |
| the font families loaded | `apps/web/app/layout.tsx` (`next/font`) |
| the order of the bands | `apps/web/app/page.tsx` |
| where the page gets data | `apps/web/lib/wp.ts` (you create this; Part 11) |
| what a content type holds | `a2-core/inc/meta.php` |
| what the API returns | `docs/12-rest-contract.md` |

## 2.2 The import aliases

`@/` resolves to `apps/web/`. Use it:

```ts
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { focus } from "@/content/home";
```

`brand/` is outside the app and is imported by relative path from
`tailwind.config.ts` and `globals.css` only. **Components never import from
`brand/`.** A component uses a Tailwind class; the preset already resolved it.

## 2.3 The one shared class helper

```ts
// lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`cn` uses `tailwind-merge`, which means **a class passed later wins**. This is why
every primitive takes a `className` prop and applies it last:

```tsx
<div className={cn("rounded-card border", className)} />
// caller passes className="p-6" → padding is added, not overwritten
```

**Do not build class strings by concatenation.** `` `rounded-card ${x}` `` leaves
both `rounded-card` and `rounded-full` in the DOM when `x` is `rounded-full`, and
the one that wins is decided by CSS source order, not by your code. Always `cn()`.

---

# Part 3 — The token contract

> **This is the most important part of this document.** Getting it wrong produces
> a page that looks fine and fails every audit.

## 3.1 The rule

There is **one** place a design value is defined:

```
brand/khandolite.tokens.mjs
        │
        ├──► brand/khandolite.css                 (CSS custom properties)
        ├──► brand/khandolite.tailwind.preset.mjs (utility class names)
        └──► a2-ekamra/theme.json                 (WordPress block theme)
```

Three checkers enforce it:

| Checker | Fails when |
|---|---|
| `validation/contrast-audit.mjs` | a documented contrast ratio no longer reproduces |
| `validation/check-khandolite.mjs` | the CSS and the module disagree, or a raw hex appears outside the token block |
| `apps/web/scripts/check-tokens.mjs` | a banned class name (`text-rust`, `bg-forest`, …) survives in a component |

## 3.2 Colour: the complete naming map

The existing page uses palette names measured off the client mockup. The target
palette is Khandolite. **Run `npm run check:tokens` after each file you convert** —
it names the file and line still holding an old name.

### Surfaces

| Old class | Old hex | New class | New hex | Note |
|---|---|---|---|---|
| `bg-cream` | `#FBF7F0` | `bg-cream` | `#FDFBF7` | **value changes** — slightly brighter |
| `bg-cream-deep` | `#F6EFE3` | `bg-cream-deep` | `#F7F2EA` | value changes |
| `bg-cream-white`, `bg-white` | `#FFFFFF` | `bg-cream` | `#FDFBF7` | pure white is not in the palette; use cream |
| `bg-sand` | `#E8DBC4` | `bg-stone-tint` | `#F3E7DE` | card fills, zebra rows |
| `bg-sand-soft`, `bg-sand/40` | `#F1E7D6` | `bg-stone-tint-soft` | `#F9F2EC` | |
| `bg-sand/25`, `bg-sand/50` | alpha | `bg-stone-tint` | `#F3E7DE` | **solid, not alpha** — see §3.6 |

### Dark bands

| Old class | Old hex | New class | New hex | Note |
|---|---|---|---|---|
| `bg-forest` | `#11231B` | `bg-charcoal` | `#262626` | the three dark "acts" |
| `bg-forest-deep` | `#0E231D` | `bg-charcoal` | `#262626` | **both map to one dark** — see §3.7 |

### Text

| Old class | Old hex | New class | New hex | Contrast on cream |
|---|---|---|---|---|
| `text-ink` | `#1C1C1A` | `text-charcoal` | `#262626` | 14.64 ✓ |
| `text-ink-soft` | `#3A3A38` | `text-charcoal-soft` | `#4A4A4A` | 8.57 ✓ |
| `text-ink-muted` | `#6B6B66` | `text-charcoal-muted` | `#666666` | 5.56 ✓ |
| `text-rust` | `#AB3D24` | `text-terracotta-deep` | `#A94434` | 5.70 ✓ |
| `text-rust-text` | `#B23A26` | `text-terracotta-deep` | `#A94434` | 5.70 ✓ |
| `text-gold` (on dark) | `#C9A961` | `text-marigold` | `#F2B705` | 8.32 on charcoal ✓ |

### Actions and accents

| Old class | Old hex | New class | New hex | Rule |
|---|---|---|---|---|
| `bg-rust` | `#AB3D24` | `bg-terracotta` | `#B84A39` | **fills only** |
| `hover:bg-rust-hover` | `#96331D` | `hover:bg-terracotta-hover` | `#A64333` | |
| `active:bg-rust-active` | `#822B18` | `active:bg-terracotta-deep` | `#A94434` | |
| `bg-rust-wash` | `#FBEFEC` | `bg-terracotta-wash` | `#FAEDE9` | |
| `border-rust`, `border-rust/25` | alpha | `border-terracotta` | `#B84A39` | solid |
| `bg-gold` | `#C9A961` | `bg-marigold` | `#F2B705` | **dark surfaces only** |
| `text-gold-deep` | `#A9853F` | `text-line-sand-strong` | `#8C7D6F` | decorative only; see §3.3 |
| `text-peach` (error on dark) | `#E9A184` | `text-marigold` | `#F2B705` | dark surfaces only |
| `text-ochre`, `text-ochre/85` | `#8A6A52` | `text-line-sand-strong` | `#8C7D6F` | decoration |
| `text-foliage`, `text-foliage/40` | `#C8B090` | `text-line-sand` | `#E3D5C8` | decoration |
| `text-on-path` | — | local SVG class | — | keep as-is, it is an SVG text-on-path helper |

### Hairlines

| Old | New | Note |
|---|---|---|
| `border-hair` (`rgba(28,28,26,0.10)`) | `border-line-sand` `#E3D5C8` | **solid token** replacing an alpha |
| form/control borders | `border-line-sand-strong` `#8C7D6F` | 3.85:1 on cream — the only border that reaches 3:1 |
| `shadow-card` | **delete** | the system is flat; only `shadow-menu` survives |

## 3.3 The four rules that follow from the measured contrast

Learn these four. They account for most of the review comments you will get.

| Rule | Because |
|---|---|
| **`terracotta` is a fill. `terracotta-deep` is text.** Any terracotta-coloured text under 24 px uses `text-terracotta-deep`. | `#B84A39` on `stone-tint` is **4.24:1** — fails AA for body text. `#A94434` is the same hue and reaches **4.85:1** there. |
| **`marigold` never touches a light surface.** No `text-marigold` on cream or stone-tint. Ever. | Marigold on cream is **1.76:1**. That is not "a bit low", it is invisible. On charcoal it is 8.32:1 and correct. |
| **`line-sand` is a hairline, `line-sand-strong` is a control border.** | `#E3D5C8` never reaches 3:1, so it can divide but cannot define an interactive edge. `#8C7D6F` reaches 3.85:1. |
| **`charcoal-muted` is the lightest text that is allowed.** | `#666666` is 5.56:1 on cream and **4.73:1 on stone-tint** — the tightest legal pair in the system. Anything lighter fails on a card. |

### The full legal table, for when you are unsure

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| charcoal | cream | 14.64 | AA + AAA |
| charcoal | stone-tint | 12.46 | AA + AAA |
| charcoal-soft | cream | 8.57 | AA + AAA |
| charcoal-soft | stone-tint | 7.30 | AA + AAA |
| charcoal-muted | cream | 5.56 | AA |
| charcoal-muted | stone-tint | 4.73 | AA — the floor |
| cream | charcoal | 14.64 | AA + AAA |
| cream | terracotta (button) | 4.98 | AA — fills |
| terracotta | cream (link) | 4.98 | AA |
| terracotta-deep | cream | 5.70 | AA |
| terracotta-deep | stone-tint | 4.85 | AA |
| marigold | charcoal | 8.32 | AA + AAA |
| line-sand-strong | cream | 3.85 | non-text UI ✓ |
| **marigold on cream** | | **1.76** | **forbidden** |
| **marigold on stone-tint** | | **1.50** | **forbidden** |
| **terracotta on charcoal** | | **2.94** | **forbidden** |
| **terracotta on stone-tint** | | **4.24** | **forbidden for body text** |

## 3.4 Type: the complete size map

The type scale also changes. Two entries shrink — that is intentional and is
explained below.

| Old class | Old value | New class | New value | Effect |
|---|---|---|---|---|
| `text-hero` | `clamp(3rem, 6.2vw, 5.5rem)` → 88 px | `text-display-xl` | `clamp(3rem, 5.6vw, 4.5rem)` → **72 px** | **hero gets smaller — see §3.5** |
| `text-h2` | `clamp(2.25rem, 4.2vw, 3.625rem)` → 58 px | `text-display-lg` | `clamp(2.25rem, 4vw, 3.25rem)` → 52 px | h2 slightly smaller |
| `text-h2-sm` | `clamp(1.9rem, 3.4vw, 3rem)` | `text-display-lg` | same as above | |
| `text-h3` | `clamp(1.35rem, 2vw, 1.5rem)` | `text-display-md` | `clamp(1.5rem, 2.4vw, 2rem)` → 32 px | h3 slightly larger |
| `text-h4` | `1.0625rem` (17 px) | `text-heading-sm` | `1.0625rem` | identical |
| `text-stat` | `clamp(2.25rem, 3.6vw, 3.125rem)` | `text-display-lg` + `tabular-nums` | | metric numerals |
| `text-lead` | `clamp(1rem, 1.15vw, 1.125rem)` | `text-lead` | `clamp(1.0625rem, 1.2vw, 1.125rem)` | body lead |
| `text-body` | `1rem` (16 px) | `text-body` | `1.0625rem` (**17 px**) | **body gets larger — see §3.5** |
| `text-body-sm` | `0.9375rem` | `text-body-sm` | `0.9375rem` | identical |
| `text-ui` | `0.875rem` | `text-ui` | `0.875rem` | identical |
| `text-label` | `0.75rem` | `text-note` | `0.8125rem` | form labels, small print |
| `text-note` | `0.8125rem` | `text-note` | `0.8125rem` | identical |
| `text-eyebrow` | `0.75rem`, `0.18em` | `text-eyebrow` | `0.75rem`, **`0.14em`** | tracking tightens slightly |
| `text-micro` | `0.6875rem` (11 px) | `text-micro` | `0.6875rem` | same |
| `text-nano` | `0.625rem` (**10 px**) | `text-micro` | `0.6875rem` | **10 px is gone — see §3.5** |
| `text-table` | — | `text-table` | `0.875rem` + `tabular-nums` | new, for data tables |
| `text-script*` | Parisienne ramp | **unchanged** | local extension | see §3.6 |
| `text-logo-*` | 5 sizes | **unchanged** | local extension | see §3.6 |

## 3.5 The three intentional visual changes

These will make the page differ from the approved Phase-3 render. Each was
decided for a reason, and each requires a **fidelity re-baseline** (`fidelity.mjs`
will show drift until you re-approve).

**1 · The hero is smaller (88 px → 72 px).**
The blueprint specifies H1 at 48 → 72 px. The mockup measured 88 px. 72 px wins
because the blueprint's figure is what the client signed, and because at 88 px the
hero headline at 200% text size overflows a 1280 px viewport — which the zoom gate
catches. **Do not raise it back.** If the client objects, the answer is "72 px is
the signed figure" and the re-baseline is a client decision, not a developer one.

**2 · Body copy is larger (16 px → 17 px).**
17 px is the blueprint's body size and the measure is 68ch, which at 17 px keeps
paragraphs inside the 90-character line the UX audit enforces. Every section gets
slightly taller. Re-baseline the height expectations: the homepage grows by
roughly 2–4%.

**3 · 10 px type is gone.**
`text-nano` becomes `text-micro` (11 px). 10 px semibold caps is below every
readability floor in the brief and is the single most common accessibility finding
on nonprofit sites. The ValueItem note and the Badge label both move to 11 px; the
value bar gets ~2 px taller per row.

## 3.6 Two extension points you may keep

The Khandolite system does not own a **script face** or **logo geometry**, because
neither is a design-system value — one is a brand flourish, the other is a
fixed-size lockup. Both stay as **local extensions** in
`apps/web/tailwind.config.ts`:

```ts
// tailwind.config.ts — local extensions. NOT tokens. Reason required for each.
theme: {
  extend: {
    fontFamily: { script: "var(--a2-font-script)" },   // Parisienne — hero accent only
    fontSize: {
      // Logo lockup geometry. Fixed px on purpose: a logo must not scale with
      // the fluid type ramp or it stops looking like the logo.
      "logo-mark": ["38px", { lineHeight: "0.82", letterSpacing: "-0.03em" }],
      "logo-mark-sm": ["26px", { lineHeight: "0.82", letterSpacing: "-0.03em" }],
      "logo-word": ["11px", { lineHeight: "1", letterSpacing: "0.26em" }],
      "logo-word-sm": ["8px", { lineHeight: "1", letterSpacing: "0.24em" }],
      "logo-tag": ["7.5px", { lineHeight: "1", letterSpacing: "0.24em" }],
      // Script ramp — the hero flourish grows line by line in the mockup.
      script: ["clamp(1.6rem, 2.8vw, 2.4rem)", { lineHeight: "0.94" }],
      "script-sm": ["clamp(1.5rem, 2.6vw, 2.25rem)", { lineHeight: "0.94" }],
      "script-xs": ["clamp(1.4rem, 2.4vw, 2.1rem)", { lineHeight: "0.94" }],
    },
  },
}
```

**Constraint on `font-script`:** the script accent is **decorative**. If the words
carry meaning, they must also exist as real text. The hero accent is
`aria-hidden="true"` for exactly this reason.

## 3.7 Why `forest` and `forest-deep` both become `charcoal`

The old palette had two darks, so the three dark bands could alternate. Khandolite
has one dark (`#262626`) plus `cream-deep` and `stone-tint`.

**The design consequence:** the three dark "acts" (hero, impact, get-involved) are
now separated by *photography texture and the cream bands between them*, not by a
second dark. Do not invent a `charcoal-deep`. If a band needs to read darker,
that is a photograph or a gradient on photography, handled in the section, not a
new token.

## 3.8 Spacing, radius, motion

| Old | New | Value |
|---|---|---|
| `--a2-section` `clamp(3.5rem, 6vw, 6rem)` | `padding: var(--a2-pad-section)` | 56 / 80 / 96 px |
| gutter `clamp(1.25rem, 5vw, 5rem)` | `padding-inline: var(--a2-gutter)` | 20 / 32 / 80 px |
| header `104px` | `var(--a2-header-h)` | **92 px** — the hero offset uses the same var |
| `max-w-measure` `52ch` | `max-w-measure` **`68ch`** | body measure widens to the blueprint value |
| `rounded-btn` 3 px | `rounded-btn` 3 px | identical |
| `rounded-card` 4 px | `rounded-card` 4 px | identical |
| `ease-a2` `cubic-bezier(.22,1,.36,1)` | `ease-a2` same | identical |
| `duration-300` etc. | `duration-hover` 200 ms / `duration-reveal` 600 ms | use the token, not the number |

**Header height changed 104 → 92 px.** Anything that offsets from the header —
the hero's top padding, a sticky sub-nav, an anchor scroll — must use
`var(--a2-header-h)`, never the literal `92px`. Three separate bugs in Phase 3
came from a hard-coded header height.

## 3.9 What `check:tokens` rejects

```bash
npm run check:tokens
```

Fails on any of these surviving in `app/`, `components/`, `lib/`:

```
text-rust  text-rust-text  bg-rust  bg-rust-hover  bg-rust-wash  border-rust
text-forest  bg-forest  bg-forest-deep  border-forest  text-forest
text-gold  bg-gold  text-gold-deep  border-gold
text-ink  text-ink-soft  text-ink-muted  bg-ink  border-ink
bg-sand  text-sand  border-sand  bg-cream-white  text-cream-white
text-peach  text-ochre  text-foliage
shadow-card
```

Plus a hex-literal scan: `bg-[#`, `text-[#`, `border-[#` anywhere in a component.

**How to work through it efficiently:** convert one file at a time, and run the
checker after each. It prints `file:line: offending-class`.

---

# Part 4 — The 13 UI primitives

Everything on this site is built from these. **Do not build a component that
duplicates one of them.** If a primitive is missing a variant you need, add the
variant to the primitive — do not fork it.

## 4.0 The inventory

| # | Primitive | File | Use it for |
|---|---|---|---|
| 1 | `Button` / `ButtonLink` | `ui/button.tsx` | every action |
| 2 | `Card` | `ui/card.tsx` | four card shapes |
| 3 | `CardMedia` | `ui/card.tsx` | a photo inside a card |
| 4 | `Tag` | `ui/badge.tsx` | the small caps category label |
| 5 | `Badge` | `ui/badge.tsx` | the only pill (dates, status) |
| 6 | `Eyebrow` | `ui/eyebrow.tsx` | `01 | OUR PURPOSE ——` |
| 7 | `SectionHeading` | `ui/section-heading.tsx` | eyebrow + H2 + subline + action |
| 8 | `TextField` | `ui/input.tsx` | a labelled input with an error |
| 9 | `Newsletter` | `ui/input.tsx` | the footer subscribe row |
| 10 | `Reveal` | `ui/reveal.tsx` | fade-up on scroll (once) |
| 11 | `ValueItem` | `ui/value-item.tsx` | one of the four principles |
| 12 | `ArrowChip` | `ui/arrow-chip.tsx` | the 36 px encircled arrow |
| 13 | `IconOrnament` | `ui/icon-ornament.tsx` | a line icon at 30 px |
| + | `Logo` | `ui/logo.tsx` | the wordmark (fixed sizes) |

## 4.1 Button

Four variants. **No fifth.** Each corresponds to a role in the visual hierarchy; a
fifth variant means two actions look equally important.

| Variant | Looks like | Use for | Count on the homepage |
|---|---|---|---|
| `rust` → **`terracotta`** | solid terracotta, cream label | the primary action in a band | 1 per band, max |
| `outline-light` | transparent, 1 px cream/55 border | secondary on photography | paired with the primary in the hero |
| `cream` | solid cream on a dark or photo surface | Get Involved rows | |
| `link` | text + arrow, no fill | "Read Story →" | |

**Sizes:** `sm` 44 px · `md` 48 px · `lg` 52 px. **`sm` is 44 px, not 40 px** — 40 px
is a comfortable mouse target and a bad thumb target, and it failed the 44 px gate.
The visual difference between `sm` and `md` is carried by padding and type, never
by shaving the touch target.

### What you change in the migration

```diff
- rust: "bg-rust text-white hover:bg-rust-hover active:bg-rust-active rounded-btn",
+ rust: "bg-terracotta text-cream hover:bg-terracotta-hover active:bg-terracotta-deep rounded-btn",

- cream: "rounded-btn bg-cream text-ink hover:bg-white",
+ cream: "rounded-btn bg-cream text-charcoal hover:bg-cream-deep",

- link: "text-rust-text hover:text-rust px-0 rounded-none",
+ link: "text-terracotta-deep hover:text-terracotta px-0 rounded-none",
```

Two notes:

- The primary variant keeps its **internal name `rust`** in the code or is renamed
  `primary` — either is fine, but pick one and be consistent. The **class names**
  are what matter and they are all listed above.
- `cream` hover was `hover:bg-white`. Pure white is not in the palette; hover goes
  to `cream-deep`, which is a visible but quiet change.

### Usage

```tsx
<Button variant="rust" withArrow>Support the Mission</Button>

<ButtonLink href="/impact" variant="outline-light" size="lg">
  Explore Our Seva Ecosystem
</ButtonLink>
```

`withArrow` adds the 18 px arrow that nudges 4 px right on hover. That nudge is the
**only** motion on a button.

## 4.2 Card

Four shapes. The design is deliberately flat: **separation comes from the
cream / cream-deep contrast, not from shadows.** Adding a shadow breaks the
character of the page.

| Variant | Structure | Used by |
|---|---|---|
| `flat` | `cream-deep` fill + hairline + 4 px radius, no shadow | news cards |
| `photo` | photo flush to the top edge, body below | Focus Areas |
| `paper` | cream + hairline + 6 px padding — the polaroid frame | Purpose collage |
| `inline` | no surface at all; thumb + text column | Stories |

### What you change

```diff
- variant === "flat"  && "rounded-card border border-hair bg-cream-deep",
+ variant === "flat"  && "rounded-card border border-line-sand bg-cream-deep",
- variant === "photo" && "overflow-hidden rounded-card border border-hair bg-cream-deep",
+ variant === "photo" && "overflow-hidden rounded-card border border-line-sand bg-cream-deep",
- variant === "paper" && "rounded-photo border border-hair bg-cream p-1.5",
+ variant === "paper" && "rounded-photo border border-line-sand bg-cream p-1.5",
```

`interactive` (default `true`) adds the 300 ms colour transition. Set
`interactive={false}` on a card that is not a link — a hover transition on a
non-interactive surface is a lie about affordance.

## 4.3 CardMedia

```tsx
<CardMedia ratio="16/10">
  <Image src={…} alt={…} fill sizes="(min-width:1024px) 33vw, 100vw" />
</CardMedia>
```

Four ratios: `16/10` (default), `4/5`, `1/1`, `3/2`. The wrapper is
`overflow-hidden` and the photo scales to `1.03` over 900 ms on **card** hover —
the card is the target, not the image.

**Two obligations, both gate-checked:**

1. `alt` is never omitted. Decorative → `alt=""`. Informative → one sentence,
   under 125 characters.
2. `sizes` is never omitted on a `fill` image. Without it Next serves a 1920 px
   image into a 380 px slot and LCP misses the 2.5 s budget.

Change: `bg-sand/40` → `bg-stone-tint` (solid; an alpha over photography picks up
the photo and is how a "safe" ratio becomes unsafe).

## 4.4 Tag

Flat caps label. **Not a pill: no fill, no border.** That flatness is what keeps
the story cards looking editorial rather than like a CMS tag list.

`text-micro text-semibold uppercase tracking-[0.14em] text-terracotta-deep`

**There is deliberately no dark mode and no dark fill.** The old comment said it:
the light accents measure under 3:1 on the dark band, so these categories only
ever sit on cream and only ever use `terracotta-deep`.

Any tracking value other than `0.14em` is rejected by the UX audit's type check — see §13.3.

## 4.5 Badge

The **only** pill in the system. Dates on news cards, status labels in the kitchen
sink. Kept separate from `Tag` on purpose: one is editorial, one is metadata.

| Tone | Classes | Ratio | Use |
|---|---|---|---|
| `sand` → **`stone`** | `bg-stone-tint text-charcoal` | 12.46 | date on a card |
| `rust` → **`terracotta`** | `bg-terracotta-wash text-terracotta-deep` | 5.70 | a status that matters |
| `outline` | `border border-line-sand-strong text-charcoal-soft` | 8.57 | quiet metadata |

There is no dark tone. Cream on charcoal passes (14.64) but a 10 px semibold pill
is not the place to prove it, and a solid dark pill fights the photography behind
it. If you need a badge on a dark band, use `text-marigold` with no fill.

## 4.6 Eyebrow

The `01 | OUR PURPOSE ——` device that opens every band.

Anatomy, left to right: numeral (tabular) → 1 px vertical rule, 16 px tall → the
label → 52 px horizontal rule.

| Prop | Default | Notes |
|---|---|---|
| `num` | undefined | `"01"`…`"06"`. Tabular numerals. |
| `onDark` | `false` | flips label to `marigold`, rules to `marigold/40` |
| `withLine` | `true` | the trailing 52 px rule |

**Never apply opacity to the numeral.** A 90%-alpha terracotta numeral lands at
4.78:1 on cream, which is under AA at 12 px. The numeral is part of the label.

Change: `text-rust-text` → `text-terracotta-deep`; `bg-rust-text/35` →
`bg-terracotta-deep/35`; on dark `text-gold` → `text-marigold`,
`bg-gold/40` → `bg-marigold/40`.

## 4.7 SectionHeading

Every band opens with the same three-part device: eyebrow → H2 → optional subline.
In Stories, Partners and News an action sits on the right baseline.

| Prop | Notes |
|---|---|
| `num` | passed through to `Eyebrow` |
| `eyebrow` | the caps label |
| `title` | may be an array of lines — the mockup breaks headlines deliberately |
| `italicLast` | renders the final word in *italic terracotta-deep* (the Purpose heading) |
| `subline` | capped at `max-w-copy-sm`, `text-body-sm`, `text-charcoal-soft` |
| `onDark` | heading → `cream`, subline → `cream/72` |
| `align` | `left` (default) or `center` |
| `action` | right-baseline slot — `View All →`, carousel arrows |
| `as` | `h2` (default). **Use `h1` on a page whose only heading is this.** |

`sm:` prefixed flex means the action drops below the heading on mobile. Do not
change that to a fixed row — at 390 px the action squeezes the heading to three
words a line.

## 4.8 TextField

```tsx
<TextField
  label="Email address"
  hint="We reply within two working days."
  error={errors.email}
  optional={false}
/>
```

- `<label htmlFor>` is wired via `useId` — never render an input without a label.
- `aria-invalid` is set from `error`.
- The error is a `role="alert"` paragraph linked by `aria-describedby`. **An error
  is never signalled by colour alone** — a red border tells a screen-reader user
  nothing.
- 48 px tall, 3 px radius, cream fill, `border-line-sand-strong`, focus ring from
  `globals.css` only.

Change: `border-hair` → `border-line-sand-strong`; `border-rust-text` (error) →
`border-terracotta-deep`; `text-rust-text` (error text) → `text-terracotta-deep`;
`text-ink-muted` → `text-charcoal-muted`.

## 4.9 Newsletter

Inline email + square submit. Has real `idle / loading / done / error` states,
which is what a static mockup cannot show.

- Validates on submit, not on keystroke. Error clears on the next keystroke.
- Success is `role="status"` (polite); error is `role="alert"` (assertive).
- The submit button is a 48 × 48 square with `aria-label="Subscribe"` — it has no
  text, so it needs a name.
- **`state === "loading"` disables the button.** That is correct here and only
  here: it is a submit-in-flight, not a permanently disabled control.

The old success/error colours were `text-gold` / `text-peach` on the dark footer.
Both become `text-marigold` (8.32:1 on charcoal). Do not use `text-terracotta` on
charcoal — 2.94:1, forbidden.

## 4.10 Reveal

Fade + 16 px rise, 600 ms, **once**. Wraps children in a `div` (or the `as` tag).

Three behaviours that are load-bearing and must not be "simplified":

1. **If the element is already on screen at mount, it shows on the next frame** —
   it does not wait for a scroll event. Smooth-scroll, restored scroll positions
   and anchor jumps all delay an IntersectionObserver, and the result is content
   that stays invisible.
2. **If the visitor prefers reduced motion, it is visible immediately** — no
   transition, no observer.
3. It is a **client component** (`"use client"`). Everything else on the page is
   server-rendered; wrapping a whole band in `Reveal` makes the whole band client
   and doubles the JS. Wrap the smallest thing that needs it.

`delay` staggers siblings. Keep the largest stagger under 240 ms or the last card
appears after the user has already scrolled past it.

## 4.11 ValueItem

One of the four principles on the values bar: a 30 px line icon, an 11 px caps
label, a 10 px → **11 px** note.

The icon colour split is reproduced from the mockup: botanical marks (`leaf`,
`sprout`, `leaves`) take `text-line-sand-strong`, community marks take
`text-terracotta`. Do not unify them — the two-ink split is a brand detail.

Change: `text-gold-deep` → `text-line-sand-strong`; `text-rust` → `text-terracotta`;
`text-ink` → `text-charcoal`; `text-ink-soft` → `text-charcoal-soft`;
`text-nano` → `text-micro`.

## 4.12 ArrowChip

The 36 px encircled arrow on focus cards, news cards and carousels.

- **It is not a button.** It is a visual affordance inside a card that is itself
  the link. `aria-hidden` when there is no `label`; `aria-label` when there is.
- Hover is driven by the parent `.group`, so the whole card is the target.
- States: outline → terracotta fill + cream arrow. `disabled` at 40% opacity for
  carousel edges.
- On dark: `border-cream/45` → hover `bg-cream text-charcoal`.

## 4.13 IconOrnament

A line icon at a token size. `size` defaults to 28; the values bar uses 30.

**Always `aria-hidden`.** The component wraps every glyph in
`<span aria-hidden>`. Giving 30 decorative glyphs an accessible name produces 30
meaningless stops in the screen-reader flow.

## 4.14 Logo

Fixed-size wordmark. Uses the `text-logo-*` local extensions. **Not a token** — a
logo that scales with the fluid type ramp stops looking like the logo.

`aria-label="A2 Foundation"` on the anchor; the SVG itself is `aria-hidden`.

## 4.15 Adding a primitive

If you genuinely need a 14th:

1. It goes in `components/ui/`, one file, named after the thing.
2. It takes `className` and applies it last via `cn()`.
3. It uses tokens only — no hex, no px font sizes.
4. It has a header comment that states **why it exists and what it replaced**.
5. Add it to `/kitchen-sink` with every state.
6. Add it to this table.

A primitive without all six is a component in the wrong folder.

---

# Part 5 — Ornaments

Decorations are the layer that makes this page look like the client's mockup
rather than a Tailwind template. They are also the layer most likely to become an
accessibility problem, so the rules are strict.

## 5.1 The rules

| Rule | Why |
|---|---|
| Every ornament is `aria-hidden` and has no accessible name | The ornaments are pattern, not information. A screen reader reading "Leaf sprig, Leaf sprig, Leaf sprig" is worse than silence. |
| Decoration only — no text, no controls, no links inside an ornament | An interactive ornament cannot be `aria-hidden`. |
| `pointer-events-none` on every ornament | A decorative SVG over a card must not eat the card's click. |
| Position with the layout, not with absolute magic numbers | Ornaments that only look right at 1440 px are a bug that ships. |
| Hide the dense ones below `sm` | At 390 px a foliage spray is 40% of the viewport. |

## 5.2 The inventory

| Component | What it is | Where it is used |
|---|---|---|
| `TornEdge` | the torn-paper edge under the hero | once, under the hero |
| `TornEdgeWithArt` | torn edge + the pen-and-ink village | once, same place |
| `OdishLineArt` | full temple-silhouette line drawing | hero, desktop only |
| `OdishLineArtCompact` | reduced silhouette | hero, mobile |
| `OrnamentHero` | the combined hero decoration | hero |
| `CircleStamp` | the round "seal" | Purpose, overlapping the photo |
| `FoliageSpray` | a botanical spray | band corners |
| `FoliageCorner` | a corner cluster | Focus Areas |
| `LeafSprig` | a single sprig | small accents, list bullets |
| `ScriptAccent` | the script flourish | hero accent only |
| `riseEdge` | helper that computes the tear path | internal |

## 5.3 Interaction with motion

`ScriptAccent`, `TornEdge` and the foliage sit inside `Reveal` wrappers in some
bands. **Do not animate an ornament independently of its band** — two motion
systems on one surface is how a page starts to feel unstable.

All ornament transitions use `ease-a2` and collapse to `0.01ms` under
`prefers-reduced-motion` (handled globally in `khandolite.css`; do not re-declare).

## 5.4 Checking your work

```
/ornaments
```

renders every ornament at every size on both cream and charcoal. Before you ship a
section that uses one, confirm it appears correctly on that page — the ornament
page is the single place all of them are visible at once.

---

# Part 6 — Icons

## 6.1 The 25 glyphs

`components/icons/index.tsx` exports, all with the same `IconProps`
(`size` default 16–18, `className`, `strokeWidth`):

```
Navigation & actions   IconArrowRight  IconArrowUpRight  IconPlay  IconSearch
Brand & values         IconCommunity   IconCommunities  IconHeart   IconLives
                       IconLeaf        IconLeafSprig     IconLeaves  IconSprout
                       IconShield      IconBook          IconHealth
Programme              IconProjects    IconCalendar      IconVolunteer
                       IconPartner     IconDonate        IconQuote
Social                 IconFacebook    IconInstagram     IconLinkedIn  IconYouTube
```

## 6.2 Rules

- **Decorative glyphs** get `aria-hidden` (or are wrapped by `IconOrnament`,
  which does it for you). Almost all glyphs are decorative — the text beside them
  carries the meaning.
- **A glyph that is the only content of a control** needs an `aria-label` on the
  control, not on the SVG. See `Newsletter`'s `aria-label="Subscribe"`.
- **`IconDonate` must be renamed** to `IconContribute` in the migration. The name is
  not user-visible, but the word is a blocked term and the lint scans `.tsx` files.
  The glyph itself is fine — it is a hand holding a heart.
- Icons use `currentColor`. Colour comes from the parent's `text-*` class, which
  means the token rules in §3.3 apply to icons too: **no `text-marigold` icon on
  cream.**

## 6.3 Sizes

| Context | Size |
|---|---|
| inline with body text | 16 |
| inside a button | 18 |
| `ArrowChip` | 15 (`sm`) / 16 (`md`) |
| `ArrowChip` visual diameter | 32 (`sm`) / 36 (`md`) |
| `ValueItem` / `IconOrnament` | 28–30 |
| hero / section accent | 32–40 |

Never scale a glyph with `w-full`. A glyph is a fixed optical size; it does not
stretch.

---

# Part 7 — The 11 homepage sections

## 7.1 The order is the argument

```
 1  SiteHeader          fixed cream bar, 92 px
 2  Hero                dark, photography, H1, both CTAs, the torn edge
 3  ValuesBar           four principles on the tear — the tear's payload
 4  Purpose             01 | cream, collage, stamp, quote
 5  FocusAreas          02 | cream, 3 photo cards
 6  Impact              03 | DARK — the four governed metrics + testimonial
 7  Stories             04 | cream, carousel of 3
 8  GetInvolved         05 | DARK — the contribution CTA
 9  Partners            06 | cream, name plates
10  News                cream, 3 cards
11  SiteFooter          DARK — navigation, disclosure, newsletter
```

The page breathes in three beats: **hero → impact → get involved** are the dark
"acts"; the cream bands between them are the reading. The values bar exists to
convert the hero's emotion into a method statement *before* the first cream band.

**Do not reorder anything.** Two specific consequences of reordering: the values
bar only works directly under the tear (it is the tear's payload, not a standalone
strip), and Impact only works after Focus Areas (the metrics answer "of what?").

## 7.2 The page file

```tsx
// app/page.tsx
<a href="#main-content" className="a2-skip">Skip to content</a>
<SiteHeader />
<main id="main-content" tabIndex={-1}>
  <Hero /> <ValuesBar /> <Purpose /> <FocusAreas /> <Impact />
  <Stories /> <GetInvolved /> <Partners /> <News />
</main>
<SiteFooter />
```

Three things here are not optional:

1. **The skip link is the first focusable element** and points at `#main-content`.
2. **`<main tabIndex={-1}>`** — without the `-1`, the skip link moves the
   *scroll position* but not focus, so the next Tab returns to the header.
3. **Only three components are client components:** `SiteHeader` (scroll state,
   mobile sheet), `Stories` (carousel), `NewsletterForm` (validation states).
   Everything else ships as HTML. Making a band client adds its whole subtree to
   the JS bundle.

## 7.3 Section-by-section build notes

### 1 · SiteHeader

- **Solid cream bar, not a transparent overlay.** The overlay version made the
  nav unreadable over the bright part of the hero photograph, and it failed
  contrast on scroll.
- Height `var(--a2-header-h)` = 92 px. Fixed. The hero offsets by the same var.
- Breakpoint: **`hdr-lg:` (64rem), not `lg:`.** This is a rem breakpoint on
  purpose: at the 200% text size WCAG requires, a 1280 px viewport still reads as
  "desktop" to a px breakpoint while six nav links plus the CTA need half again
  the room. In Phase 3 this pushed the contribute button and the language switch
  off-screen.
- The language switch renders `ଓଡ଼ିଆ` in real Noto Sans Oriya type with
  `lang="or"`. It is not wired yet (Phase 7). Do not remove it — a missing
  language affordance on a bilingual site is a content decision, not a cleanup.
- Mobile: a sheet. Focus must be trapped while open and returned to the trigger on
  close.

### 2 · Hero

- Dark band. Photography with a scrim; the scrim is not a token, it is a gradient
  on the image, defined in the section with a comment.
- H1 uses `text-display-xl` → **72 px max** (was 88). See §3.5.
- Both CTAs: `rust`/`terracotta` primary + `outline-light` secondary. Labels come
  from `lockedCopy` (Part 12): **"Explore Our Seva Ecosystem"** and
  **"Access Corporate CSR Portal"**.
- **The hero must clear the fixed header at any text size.** Compute the top
  padding as `calc(var(--a2-header-h) + <section padding>)`. A literal `92px` here
  is a bug the moment the header changes.
- **200% / 300% text:** every control stays inside the viewport. The Phase-3 bug
  was the secondary CTA leaving the right edge. Test by setting the root font size
  to 32 px and 48 px, not by zooming the browser (which also scales the viewport).
- The script accent (`ScriptAccent`) is `aria-hidden`. The words it draws are
  decorative.

### 3 · ValuesBar

- Four `ValueItem`s. No heading, no CTA, no surface of its own — it is deliberately
  quiet.
- 4 columns desktop with hairline `border-line-sand` rules between them; 2×2 at
  `sm`; one column at 390.
- **Rules are drawn as borders on every item except the first, and switched off at
  the wrapping breakpoints.** A wrapped grid with vertical rules draws a line down
  the middle of a row, which reads as a table rather than a rhythm.
- The four items' text comes from `values` in `content/home.ts` — but Part 12
  replaces them with the blueprint's four principles. Check the copy deck.

### 4 · Purpose

- `01 | OUR PURPOSE ——`, H2 with `italicLast` (**"…and sustainable *Tomorrow.*"** in
  italic `terracotta-deep`), body, one link-style CTA.
- The collage: three photos in `paper` frames + the `CircleStamp` overlapping.
  The stamp is 96 px in the build where the reference measures 187 px — this is a
  **known, documented deviation**; revisit only when the real Purpose photograph
  arrives (the current one is a placeholder).
- The quote uses `IconQuote` and is a `<blockquote>` with a `<cite>`.

### 5 · FocusAreas

- `02`, three `photo` cards. Each is a single link: `<a>` wrapping the whole card,
  with the title as the accessible name. The `ArrowChip` inside is `aria-hidden`.
- Card titles are `text-display-md`. Bodies are `text-body-sm`, 3 lines max —
  clamp with `line-clamp-3` and keep the full text in the excerpt for the
  detail page.
- The three verticals come from `/programmes?vertical=`. In the mockup they are
  Education / Livelihoods / Environment; in the blueprint the verticals are
  Heritage Care / Women Self-Dependency / Education / Ecological Restoration /
  General Seva. **The blueprint wins** — see Part 12.

### 6 · Impact — **the band that must not be hard-coded**

- `03`, dark. This is the band that carries the four governed metrics.
- **Every figure comes from `/a2/v1/metrics`.** None is a string in JSX.
- Each figure renders as a pair: the value, then `Target — Year 1: 150+` beneath
  it. Never the value alone.
- If `has_data` is false the value renders **`—`**, in `text-charcoal-muted`,
  with the label still present. That is the correct first-run state, not an error.
- **Never append a `+` in JSX.** The server appends it only when the actual
  clears the target.
- Numerals use `tabular-nums` so the four counters do not jitter.
- The testimonial below the counters is a `<figure>` + `<blockquote>` + `<figcaption>`.

The four figures and their Year-1 targets:

| Label | Target — Year 1 |
|---|---|
| Metric Tons Diverted | 150+ |
| Compliance Hours | 1,200+ |
| Direct Banking | 100% |
| Children Sustained | 60+ |

### 7 · Stories

- `04`, cream, a carousel of 3 with real prev/next.
- Client component. Keyboard: arrow keys move, `Home`/`End` jump, focus follows
  the moved slide.
- Each slide is a `Card variant="inline"`: thumb + `Tag` category + title + excerpt
  + `Read Story →` link.
- **`Tag` sits on cream only** — see §4.4.
- Carousel arrows use `ArrowChip` with `disabled` at the ends, not hidden. A button
  that disappears at the end of a list moves every subsequent control.
- `aria-roledescription="carousel"`, `aria-live="polite"` on the slide container.

### 8 · GetInvolved

- `05`, dark. Three `Card variant="cream"` rows, each one action.
- This is where the contribution CTA lives. **The word is "Support the Mission"**
  or "Contribute" — never "Donate".
- **Pre-registration, this band must not take money.** It posts to
  `/csr-enquiry` (register interest) and the contribution endpoint returns
  `503 a2_contributions_off`. The UI must treat that 503 as a first-class state:
  the CTA becomes "Register your interest", not an error toast. See Part 11.
- The band's body copy and the footer disclosure are the two places the
  "not yet registered" fact is stated. Do not soften either.

### 9 · Partners

- `06`, cream. **Name plates, not logos.** The client has not supplied permission or
  current official SVGs; inventing logo-looking marks is a legal risk.
- The row must wrap. In Phase 3 it did not, and at 200% text it overflowed.
  `flex flex-wrap` with `gap`, never a fixed-width row.
- `note` in `content/home.ts` says "Placeholder name plates — replace with approved
  partner marks." Keep that note in the code until real marks arrive.

### 10 · News

- Three `Card variant="flat"`: `Badge tone="stone"` date, title, excerpt,
  `Read Story →`.
- Dates in `<time dateTime={iso}>` with a readable label. Never a bare string.
- Heading action is `View All →` (`ArrowChip` + text), a real link.

### 11 · SiteFooter

- Dark. Four link columns + the newsletter + the legal bar.
- **The disclosure is mandatory and comes from `lockedCopy.footerDisclosure`**
  verbatim: *"A2 Foundation is a voluntary initiative; statutory registration is
  in process. Contributions are voluntary and currently carry no section 80G tax
  benefit."*
- The 80G wording is generated by `a2-core`'s `switches\footer_disclosure()` once
  the switch exists. Until then, use the locked string.
- Social icons: `aria-label` on each link (`"A2 Foundation on Instagram"`), glyph
  `aria-hidden`.
- The newsletter is `Newsletter` from `ui/input.tsx`.

## 7.4 The container

One container, one gutter, everywhere:

```css
.a2-container {
  max-width: var(--a2-page);          /* 1280px */
  margin-inline: auto;
  padding-inline: var(--a2-gutter);   /* 20 / 32 / 80 */
}
```

And one section rhythm:

```css
.a2-section { padding-block: var(--a2-pad-section); }  /* 56 / 80 / 96 */
```

**Never** write `py-16` on a section or `max-w-[1280px]` on a wrapper. The UX audit
fails a page with two different gutters, and it is right to: two gutters means the
left edge of your content moves between bands at some viewport width.

---

# Part 8 — Responsive, zoom and overflow

## 8.1 The five tested widths

Every layout decision is tested at these widths. Not "mobile, tablet, desktop" —
these five numbers, because each one breaks something different.

| Width | What it represents | What breaks here |
|---|---|---|
| **360** | the narrowest common Android | everything two-column; long words |
| **390** | iPhone 14 | the values bar wraps to one column |
| **768** | tablet portrait | 2×2 grids; the header switches to the sheet |
| **1280** | the design container | the nav needs all six links + CTA |
| **2560** | a 4K monitor | content must not stretch to 2560 |

**Zero horizontal overflow at every width.** Not `overflow-x: hidden` on `<body>` —
that hides the bug rather than fixing it, and it breaks `position: sticky`. Find
the element that is too wide.

```bash
cd ../../validation/harness && node final-gate.mjs   # includes the 360→2560 sweep
```

## 8.2 The breakpoint list

| Token | Width | Used for |
|---|---|---|
| `sm:` | 640 px | 2-column grids, subline beside heading |
| `md:` | 768 px | values bar 2×2, nav sheet → row |
| `lg:` | 1024 px | 3-column card grids, hero two-column |
| `xl:` | 1280 px | maximum container |
| **`hdr-lg:`** | **64 rem** | **the header only** |

`hdr-lg` is a **rem** breakpoint and it is used by exactly one component. The
reason is in §7.3 #1: whether six nav links fit depends on the width of the *text*,
not the width of the viewport, and at 200% text a 1280 px viewport still reads as
desktop to a px breakpoint. Do not add a second rem breakpoint without the same
kind of reason.

## 8.3 Zoom and text scaling — the two are different

| Test | How | What it proves |
|---|---|---|
| **Browser zoom 200%** | Ctrl/Cmd + `+` four times | reflow at half the effective width |
| **Text-only scaling 200%** | set `html { font-size: 32px }` | layout survives without the viewport shrinking |

**Both must pass, and they fail differently.** Browser zoom narrows the viewport,
so a fluid layout usually copes. Text-only scaling leaves the viewport at 1280 px
while every `rem` doubles — this is the case that pushed the header's controls
off-screen in Phase 3, and it is the case WCAG 1.4.4 actually requires.

Test it directly:

```bash
# in devtools console
document.documentElement.style.fontSize = '32px'   # 200%
document.documentElement.style.fontSize = '48px'   # 300%
```

Then check, at each of the five widths:

- every control is inside the viewport
- no text overlaps another element
- the hero clears the fixed header
- no content is clipped by a fixed height

## 8.4 Why there are no fixed heights on text containers

`h-12` on a button is a **touch target** — that is a fixed height and it is
correct. `h-40` on a card body is **not**: at 200% text the text overflows a box
that cannot grow, and the overflow is invisible because it is clipped.

The rule: a fixed height is legal only when its content cannot wrap — a button
label, an avatar, an icon tile. Everything containing a sentence uses
`min-height` or nothing.

## 8.5 Overflow checklist

- No `w-[Npx]` on anything containing text. `max-w-` only.
- Long unbroken strings (URLs, ticket IDs) get `break-words` or `overflow-wrap: anywhere`.
- Tables scroll in their own container (`overflow-x: auto`), never the page.
- A decorative SVG that is wider than the viewport gets `overflow-hidden` on its
  band, not on `<body>`.
- `min-w-0` on any flex child that contains text — a flex child defaults to
  `min-width: auto` and refuses to shrink below its content.

## 8.6 The 44 × 44 rule

Every interactive control is at least 44 × 44 CSS px. Not the visual size — the
**hit area**.

- A 36 px `ArrowChip` inside a card is fine: the *card* is the target.
- A lone 36 px chip needs padding or a `::after` that extends the hit area.
- `sm` buttons are 44 px by definition (§4.1).
- Links inside a paragraph are exempt — WCAG exempts inline text.

The gate counts this: **63 controls measured, all ≥ 44 × 44.** A regression is a
build failure.

## 8.7 Reduced motion

Not a design preference. Set it in the OS and re-check every band:

```bash
# devtools → Rendering → Emulate CSS media feature prefers-reduced-motion: reduce
```

Everything must be **immediately visible and static**. Not "faster". Not "a shorter
fade". The `Reveal` component already short-circuits (§4.10); the CSS collapse in
`khandolite.css` handles transitions and keyframes.

---

# Part 9 — Accessibility obligations

The accessibility bar is **contractual at WCAG 2.1 AA**. It is not an aspiration.

## 9.1 Your obligations, as a checklist

### Semantics
- [ ] One `<h1>` per page. On the homepage it is the hero. On an interior page whose
      only heading is a `SectionHeading`, pass `as="h1"`.
- [ ] Heading levels never skip (`h2` → `h4` is a failure).
- [ ] Every band is a `<section>` with an accessible name: `aria-labelledby` the
      heading, or `aria-label` for the values bar (which has no heading).
- [ ] Lists are `<ul>`/`<ol>`. A stack of divs is not a list.
- [ ] The page has exactly one `<main>`, and it has `id="main-content"` + `tabIndex={-1}`.

### Focus
- [ ] Every tab stop has a visible ring. **The system rule in `globals.css` is the
      only ring.** No component declares its own.
- [ ] Focus order follows the visual order. If you use `order-` or `flex-row-reverse`,
      you have created a keyboard trap.
- [ ] A modal/sheet traps focus and returns it to the trigger on close.
- [ ] A skip link is the first focusable element.
- [ ] **Never `outline-none`.** If you need spacing, use `outline-offset`.
      (Tailwind's `focus:outline-none` compiles to `outline: 2px solid transparent`,
      which passes a CSS review and produces an invisible ring. This exact bug
      blinded 12 tab stops in Phase 3 and `outline-style` still reported `solid`,
      so nothing caught it.)

### Images and media
- [ ] Every `<img>`/`<Image>` has `alt`. Decorative → `alt=""` (not omitted).
- [ ] `alt` is a sentence under 125 characters, not a filename, not "image of".
- [ ] Every `fill` image has `sizes`. Every sized image has `width`/`height`.
- [ ] Video: no autoplay with sound; if it autoplays it is muted and has a pause
      control.
- [ ] Decorative SVG and ornament components are `aria-hidden` with no accessible
      name.

### Colour and contrast
- [ ] Every text/background pair is in the table in §3.3.
- [ ] Colour is **never the only signal.** An error has text; a required field has a
      word; a status has a label. (The `Badge` tones are all paired with text.)
- [ ] Focus indicator contrast ≥ 3:1 against both the control and its background.

### Forms
- [ ] Every input has a `<label htmlFor>`. Placeholders are not labels.
- [ ] Required is `required` + a visible cue, not just a red asterisk.
- [ ] Errors: `aria-invalid`, `aria-describedby` to the message, `role="alert"`.
- [ ] Grouped inputs are `<fieldset>` + `<legend>`.
- [ ] Autocomplete attributes on name/email/tel.

### Motion
- [ ] `prefers-reduced-motion: reduce` → everything static.
- [ ] Nothing flashes more than 3 times per second.
- [ ] No animation loops. Everything plays once.

### Language
- [ ] `<html lang="en-IN">`.
- [ ] Any Odia run is wrapped `<span lang="or">`, which switches the font stack and
      the 1.8 line-height automatically.
- [ ] A link whose text is not descriptive alone gets `aria-label`
      ("Read Story →" × 3 needs "Read: A New Beginning for Ramesh").

## 9.2 The gate

```bash
cd ../../validation/harness && node a11y-audit.mjs
```

Result must read:

```
axe violations        0
contrast failures     0
44px targets          0
focus ring blind      0   (55 tab stops checked)
PASS 40 · WARN 0 · FAIL 0
```

The focus-ring check is custom: it tabs through **every** stop and measures
whether a ring is actually painted (not whether `outline-style` says `solid`).
That distinction is the whole reason the check exists.

## 9.3 The four accessibility bugs from Phase 3, so you do not re-introduce them

1. **Transparent outline.** 12 tab stops had none, and no audit caught it because
   the computed style said `solid`. Fixed with one unlayered `!important` rule.
2. **Programmatic `.focus()` does not trigger `:focus-visible`.** A test that calls
   `.focus()` proves nothing about the keyboard path. Tab for real.
3. **Disabled buttons are not tabbable.** A carousel arrow that becomes `disabled`
   at the end of a list is a control the keyboard user cannot reach — use
   `aria-disabled` + a no-op handler, and keep it focusable.
4. **`fullPage` screenshots need a scroll pass.** Lazy images below the fold are
   blank in the capture. The harness scrolls first; if you add a screenshot step,
   do the same or your review board will show empty bands.

---

# Part 10 — Motion

## 10.1 The whole motion budget

| Motion | Duration | Easing | Where |
|---|---|---|---|
| colour / border hover | 200 ms | `ease-a2-hover` | every interactive surface |
| reveal (fade + 16 px rise) | 600 ms | `ease-a2` | `Reveal` |
| card photo scale 1 → 1.03 | 900 ms | `ease-a2` | card hover |
| arrow nudge 4 px right | 300 ms | `ease-a2` | button hover |
| metric count-up | 1200 ms | — | Impact, once, on reveal |
| hero Ken Burns 1 → 1.04 | 6000 ms | `ease-a2` | hero photography only |

That is the complete list. **A seventh motion is a design change, not a detail.**

## 10.2 Rules

- Everything plays **once**. No infinite loops except the (disabled-under-reduced-motion)
  Ken Burns.
- Nothing animates on page load except the hero. Loading animation is a tax on
  every visit to celebrate the first.
- **No layout-shifting animation.** Animate `opacity` and `transform` only. Animating
  `height`/`width`/`top` forces a reflow on every frame and is what makes a page
  feel heavy on a mid-range Android.
- `transition-delay` staggers stay under 240 ms total (§4.10).
- **Never animate an element into existence and leave it animated.** If it ends
  off-screen or at a non-1 opacity, it is a bug.

## 10.3 The count-up

The Impact metrics count up once on reveal.

- `<1000 ms` feels responsive; `1200 ms` matches the token.
- **It must be `aria-hidden` during the count and the final value announced once.**
  A screen reader reading 0, 12, 45, 89, 120 is a mess. Render the final value in
  the accessible name and animate a `aria-hidden` span.
- Under `prefers-reduced-motion`, render the final value immediately.
- **The final value is the server's string.** Do not re-compute it in JS — that is
  how a `+` gets invented.

## 10.4 Testing motion

```bash
# reduced motion ON — nothing may move
# reduced motion OFF — the six motions above, no more
```

Watch the network tab: if the hero photo animates 6 s and the LCP is measured at
the animation's end, LCP misses 2.5 s. The hero image is `priority` and the Ken
Burns starts **after** it decodes.

---

# Part 11 — Wiring to WordPress

This is the step that turns the page from a design into a product. Do it in one
pass, and do not touch a component while doing it.

## 11.1 The principle: one adapter, no component changes

```
components/  ──►  lib/wp.ts  ──►  a2/v1  ──►  WordPress
   (unchanged)      (new)                     (a2-core)
                 │
                 └─ falls back to content/home.ts when WordPress is unreachable
```

**No component ever calls `fetch`.** A component receives props. `lib/wp.ts` is the
only file that knows a URL exists. This is what lets the page build with no
backend, and what stops a 40-component refactor when the API moves.

## 11.2 `lib/wp.ts`

```ts
// apps/web/lib/wp.ts
import { home as mock } from "@/content/home";

const BASE = process.env.WP_API_URL ?? "https://wp.a2foundation.in/wp-json/a2/v1";

export type Metric = {
  key: string;
  value: string;      // pre-formatted — render as-is
  raw: number | null;
  label: string;
  target: string;     // ALWAYS render beside the value
  as_of: string;
  has_data: boolean;
};

export type CardItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  href: string;
  image: { src: string; alt: string; width: number; height: number } | null;
  date: string;              // ISO 8601
  tags: string[];
  meta: Record<string, string>;
};

export type Envelope<T> = {
  items: T[]; total: number; page: number; per_page: number; pages: number;
};

async function get<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      next: { revalidate },
      // 4s: the LCP budget is 2.5s, so a slow WordPress must not become a slow page.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // never throw into a render
  }
}

/** The four governed figures. Falls back to no-data state, never to mock numbers. */
export async function getMetrics(): Promise<Metric[]> {
  const live = await get<Metric[]>("/metrics", 300);
  return live ?? [];
}

export async function getProgrammes(): Promise<Envelope<CardItem>> {
  const live = await get<Envelope<CardItem>>("/programmes?per_page=3", 300);
  return live ?? { items: [], total: 0, page: 1, per_page: 3, pages: 0 };
}

export async function getDrives(): Promise<Envelope<CardItem>> {
  const live = await get<Envelope<CardItem>>("/drives?upcoming=1&per_page=3", 300);
  return live ?? { items: [], total: 0, page: 1, per_page: 3, pages: 0 };
}

export async function getStories(): Promise<Envelope<CardItem>> {
  const live = await get<Envelope<CardItem>>("/stories?per_page=3", 300);
  return live ?? { items: [], total: 0, page: 1, per_page: 3, pages: 0 };
}

export async function getZones() {
  return (await get<{ slug: string; name: string; phase: "active" | "planned"; count: number }[]>("/zones", 3600)) ?? [];
}

export async function getSwitches(): Promise<Record<string, boolean>> {
  return (await get<Record<string, boolean>>("/bootstrap", 60)).then((b) => (b as any)?.switches ?? {});
}
```

**Three decisions embedded here, each deliberate:**

1. **`getMetrics` falls back to `[]`, not to mock figures.** A missing metric renders
   `—`. A mock figure renders a false claim. Never do the second.
2. **`AbortSignal.timeout(4000)`** — WordPress being slow must degrade to the
   fallback, not turn the page into a 30 s load.
3. **`next: { revalidate }`** is the second cache layer behind the plugin's own
   15-minute transient. Two layers on purpose: the transient protects the database
   from a traffic spike, the fetch cache protects the WordPress host.

## 11.3 The mapping table: content → API

| Section | Today (`content/home.ts`) | After (API) | Notes |
|---|---|---|---|
| Hero | `hero.title`, `hero.lead` | `lockedCopy.home` from the token module | fixed copy, not CMS |
| Hero CTAs | `hero.primary`, `hero.secondary` | `lockedCopy.home.ctaPrimary/ctaSecondary` | fixed copy |
| ValuesBar | `values[4]` | `lockedCopy` + static | four principles are fixed |
| Purpose | `purpose.*` | static copy + one image | |
| FocusAreas | `focus.cards[3]` | `/programmes?per_page=3` | **verticals change — see Part 12** |
| Impact stats | `impact.stats[4]` | `/metrics` | **the whole point** |
| Impact testimonial | `impact.testimonial` | `a2_story` featured | |
| Stories | `stories.items[3]` | `/stories?per_page=3` | consent-gated server-side |
| GetInvolved | `involved.actions[3]` | static + switch state | |
| Partners | `partners.items` | static until real marks | permission pending |
| News | `news.items[3]` | `/news?per_page=3` | |
| Footer | `footer.*` | `lockedCopy.footerDisclosure` + switches | |

## 11.4 The priority order (do it in this order)

1. **Metrics.** Highest risk, highest value. Wire `Impact` to `/metrics` first and
   confirm the `—` state renders correctly.
2. **Footer disclosure.** A compliance statement on every page.
3. **FocusAreas → `/programmes`.** Introduces the `Card` mapper.
4. **Stories → `/stories`.** Introduces consent-gated content.
5. **News → `/news`.** Same mapper.
6. **Everything else stays static** until Phase 5.

## 11.5 The metric component, written correctly

```tsx
// components/sections/impact.tsx  (the metric part)
type Props = { metric: Metric };

function MetricFigure({ metric }: Props) {
  return (
    <div>
      {/* The value. Tabular so four counters do not jitter. */}
      <p className="font-display text-display-lg tabular-nums text-cream">
        {metric.has_data ? metric.value : "—"}
      </p>

      <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-cream">
        {metric.label}
      </p>

      {/* Mandatory. A value shown alone is read as an achievement. */}
      <p className="mt-1 text-note text-marigold">
        Target — Year 1: {metric.target}
      </p>
    </div>
  );
}
```

Note what is **not** there: no `+` concatenation, no `Number()` parsing, no
percentage maths, no fallback number. The server formatted the string; the
component renders it.

## 11.6 The error and empty states you must handle

| State | Server says | UI must render |
|---|---|---|
| No source rows | `value: "—", has_data: false` | `—` + label + target |
| Data is real | `value: "148.6"` | `148.6` + label + target |
| API unreachable | `getMetrics()` → `[]` | the whole band's figures as `—`, **not** hidden |
| Contributions off | `503 a2_contributions_off` | "Register your interest", **not** an error toast |
| Rate limited | `429` | "Please try again later" with the retry hint |
| Story not consented | absent from `/stories` | the card is not rendered |

**The rule that covers all six: never invent content to fill a gap.** A dash, an
empty state or a hidden band is always better than a plausible placeholder — every
time, on this project specifically.

## 11.7 Revalidation

Editors publish in WordPress; the Next page must not wait for a deploy.

`a2-core` posts to `/api/revalidate` with `X-A2-Secret` after any publish, batched
and debounced. You implement the route handler:

```ts
// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";

export async function POST(req: Request) {
  const given = req.headers.get("x-a2-secret") ?? "";
  const want = process.env.A2_REVALIDATE_SECRET ?? "";
  const ok =
    want.length > 0 &&
    given.length === want.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(want));

  if (!ok) return new Response("forbidden", { status: 403 });

  const { paths } = await req.json();
  let n = 0;
  for (const p of Array.isArray(paths) ? paths : []) {
    if (typeof p === "string" && p.startsWith("/")) { revalidatePath(p); n++; }
  }
  return Response.json({ revalidated: n });
}
```

`timingSafeEqual` — not `===`. A string comparison leaks the secret one character at
a time to an attacker who can measure response time.

## 11.8 Server vs client: the boundary rule

| Put it on the server (the default) | Put it on the client (only when it must) |
|---|---|
| any `fetch` | event handlers |
| data shaping | carousel index |
| metadata | form state |
| most of every band | scroll state |

Three components are client: `SiteHeader`, `Stories`, `NewsletterForm`. If you add
a fourth, say why in the PR. Each one adds its subtree to the bundle, and the
budget is **LCP < 2.5 s on 4G India** — which is a mid-range Android on a congested
network, not a laptop on fibre.

---

# Part 12 — The copy deck

> **Do not paraphrase anything in this part.** This is the client's approved
> wording. Change a comma and you have made a unilateral edit to a sign-off.

## 12.1 Where copy lives

| Kind of copy | Lives in | Editable by |
|---|---|---|
| **Locked copy** (hero, CTAs, pillars intro, footer disclosure) | `khandolite.tokens.mjs › lockedCopy` | nobody |
| **Page copy** (section headings, bodies, card text) | `apps/web/content/home.ts` | developer, with review |
| **Content** (programmes, stories, news, metrics) | WordPress | editor |
| Interface labels ("Read Story", "Target — Year 1") | component, inline | developer |

Locked copy is locked because `check-term-charter.mjs` asserts each string is
present verbatim. If you change one, the gate fails — and the gate is right.

## 12.2 The locked strings

**H1 — verbatim, one `<h1>`, exactly this sentence:**

> Preserving Sacred Sanctity. Incubating Grassroots Dignity.

**Hero sub-headline — verbatim:**

> Under the voluntary banner of the Mandir Saaf Abhiyan, we intercept tons of
> organic ritual offerings across the ancient temple zones of Bhubaneswar. By
> deploying a 100% independent, in-house circular processing network, we empower
> local Sevikas with sustainable livelihood security — keeping our heritage
> shrines pristine and our communities self-reliant.

**Primary CTA:** `Explore Our Seva Ecosystem`

**Secondary CTA:** `Access Corporate CSR Portal`

**Pillars intro (for `/our-seva/`, Phase 5):**

> Our work is guided by a singular, non-commercial vision: to preserve the ancient
> spiritual heritage of Bhubaneswar, maintain absolute purity at our shrines, and
> provide structural dignity to the community through silent, dedicated service.

**Footer disclosure — on every page, verbatim:**

> A2 Foundation is a voluntary initiative; statutory registration is in process.
> Contributions are voluntary and currently carry no section 80G tax benefit.

## 12.3 The four governed metrics

Each renders as **value + label + `Target — Year 1: X`**. The label capitalisation
is part of the deck.

| Label | Target — Year 1 |
|---|---|
| Metric Tons Diverted | 150+ |
| Compliance Hours | 1,200+ |
| Direct Banking | 100% |
| Children Sustained | 60+ |

**Banned:** the old hand-typed figures (138, 141, 202, 253). They were Phase-3
placeholders and they are now unbacked claims.

## 12.4 The term charter — never write these

| Never | Write instead |
|---|---|
| waste, garbage, trash | Sacred Remnant · Pushpa · Nirmalya |
| payroll, wages | Sevika Livelihood Remittance |
| donation, donate, donor | Voluntary Contribution, Contribute, Contributor |
| worker | Sevika |
| 80G | *only* in the locked disclosure sentence, with the switch OFF |
| FCRA | *only* behind the international switch |
| CSR grant | *only* post-registration |
| tax-free | prohibited until registered |

**Discouraged** (allowed where the context genuinely needs the word): `service`
(→ Seva when it means the work), `employee` (→ Sevika).

## 12.5 The four things wrong with the current page copy

Fix these in the same pass. Each is a specific defect, not a preference.

| # | Where | Now | Must become |
|---|---|---|---|
| 1 | `content/home.ts:201–204` | `Donate Now` | `Support the Mission` |
| 2 | `content/home.ts:137–141` | `138`, `141`, `202`, `253` typed | the `/metrics` payload |
| 3 | `content/home.ts:105` | `worker` | `Sevika` |
| 4 | `home.ts` hero | `People / Planet / Possibility` | the locked H1 |

Plus a fifth, structural: **`focus.cards` names Education / Livelihoods /
Environment.** Those are the mockup's verticals. The blueprint's five verticals are
**Heritage Care · Women Self-Dependency · Education · Ecological Restoration ·
General Seva**. `/programmes` returns the blueprint's, and the three featured cards
are `heritage-care`, `women-self-dependency`, `ecological-restoration`.

## 12.6 The 7 Sacred Pillars, and why they are not the values bar

There are two different lists in the source material and they are not
interchangeable:

- **The values bar (4 items)** is the mockup's strip under the hero. Keep it as 4.
- **The 7 Sacred Pillars** are the blueprint's moral spine and belong on
  `/our-seva/` as a 3-column interactive grid (Phase 5). Their intro paragraph is
  the locked `pillarsIntro` above.

Do not put 7 items on the values bar. The bar exists to convert the hero's emotion
into a method statement in one glance; seven items is a menu, not a method.

## 12.7 Microcopy standards

| Situation | Standard | Example |
|---|---|---|
| Button | verb + object, sentence case, ≤ 4 words | `Support the Mission`, not `Click here` |
| Link | describes the destination | `Read: A New Beginning for Ramesh`, not `Read more` |
| Error | what happened + what to do | `Enter a valid email address.`, not `Invalid input` |
| Empty state | what is missing + why it is honest | `—` with the note `No verified records yet` |
| Metric | value + target, always paired | `148.6` / `Target — Year 1: 150+` |
| Date | `<time datetime>` + readable label | `27 Oct 2026` |
| Numbers | `tabular-nums`, Indian grouping | `1,200` · `₹2,500` |

Never use "simply", "just", "easy", "obviously". Never blame the user for an
error. Never write "Oops".

---

# Part 13 — The gates, and how to pass each one

## 13.1 The full suite

```bash
# ── fast, run constantly ───────────────────────────────────────────────────
cd apps/web
npm run check:tokens        # banned class names + raw hex in components
npm run lint                # eslint
npx tsc --noEmit            # types
npm run build               # the build itself

# ── before every push ──────────────────────────────────────────────────────
npm run validate            # all four above, in order

# ── before handover (needs Playwright) ─────────────────────────────────────
cd ../../validation/harness
node a11y-audit.mjs         # 40 / 0 / 0  · 55 tab stops, 0 blind
node ux-audit.mjs           # 19/19
node final-gate.mjs         # 123 / 1 / 0  · 10 zoom checks
node fidelity.mjs           # 17 rows, 0 drift
node screens.mjs            # the review boards

# ── repository-level ───────────────────────────────────────────────────────
cd ../..
node validation/contrast-audit.mjs      # 23/23 pairs
node validation/check-khandolite.mjs     # no CSS ↔ token drift
node validation/check-term-charter.mjs   # 0 blocked terms in shipped copy
node validation/gen-theme-json.mjs       # regenerate theme.json
bash validation/signoff-phase3.sh        # everything, exit 0
```

## 13.2 What each gate catches that the others do not

| Gate | Catches | Misses |
|---|---|---|
| `check:tokens` | a surviving `text-rust`, a hex literal | a wrong colour that is still a token |
| `contrast-audit` | a documented ratio that no longer reproduces | anything in the rendered page |
| `check-khandolite` | CSS/token drift, a removed outline, Odia line-height | component misuse |
| `a11y-audit` | axe violations, contrast *as rendered*, 44 px, blind tab stops | anything not on the three tested routes |
| `ux-audit` | two gutters, non-token sizes, line length, shadows | semantic errors |
| `final-gate` | horizontal overflow 360→2560, 10 zoom checks | a bad character |
| `fidelity` | drift from the approved boards | anything the boards do not show |
| `term-charter` | banned words in shipped copy, locked-copy drift | a banned word in a CMS field |

No single gate is sufficient. That is why there are eight.

## 13.3 The UX audit's 19 checks, and how to satisfy each

| Group | Check | How to satisfy it |
|---|---|---|
| **Layout** | one container width | `max-w-page` on `.a2-container` only |
| | one gutter | `--a2-gutter` only |
| | section paddings from a closed set | `--a2-pad-section` only |
| **Type** | body/UI sizes from tokens | `text-body`, `text-ui` — never `text-[17px]` |
| | display ramp stays fluid | `clamp()` tokens only |
| | two families only | `font-display`, `font-sans` (+ `font-script` accent) |
| **Style** | near-square corners | `rounded-btn` 3 px, `rounded-card` 4 px |
| | hairlines instead of shadows | one shadow in the whole page (`shadow-menu`) |
| **Reading** | no paragraph past 90 characters | `max-w-measure` (68ch) |
| | line height ≥ 1.35 | token values already satisfy this |
| **Interaction** | every control ≥ 44×44 | see §8.6 |
| | every tab stop has a visible ring | `globals.css`, and do not override it |
| **Media** | alt present | every `<Image>` |
| | images load | no 404s in the network tab |
| | dimensions set | `width`/`height` or `fill` + `sizes` |
| | alt under 125 characters | rewrite, do not truncate |
| **Copy** | no banned terms | see §12.4 |
| | locked strings verbatim | copy from §12.2 |
| **Responsive** | no overflow at 5 widths | `final-gate.mjs` |
| | no fixed heights on text | §8.4 |

## 13.4 When a gate fails and you believe the gate is wrong

Three possibilities, in order of likelihood:

1. **You are wrong.** This is the case ~90% of the time. Read the failure text
   carefully; every gate names the file, the line, and what it expected.
2. **The gate is stale.** A gate asserts a number that the *client* has since
   changed. In that case the gate is updated in the same commit as the change, with
   the new number justified in the commit message — never silently loosened.
3. **The gate is genuinely wrong.** Write down what it is checking, why that check
   is invalid, and what replaces it. Fix it with a test.

**Never** do any of these:

- add an ignore comment
- delete a check
- lower a threshold "temporarily"
- comment out the gate in CI
- skip the gate for "just a copy change"

A gate is a promise to the client. Weakening one is a decision for whoever signed
the contract, not for whoever is trying to merge.

## 13.5 The fidelity re-baseline — unavoidable, so do it deliberately

After the token swap, `fidelity.mjs` **will** report drift. That is expected: the
hero is smaller, the body is larger, the two darks collapsed into one, and 10 px
type moved to 11 px (§3.5). Those are decisions, not regressions.

The process, in one pass at the end — not file by file:

1. Finish the palette and type swap completely.
2. `node fidelity.mjs` → note every drifted row.
3. For each row write one line: **"changed by the token swap — reason X"** or
   **"regression — fix it"**.
4. Fix every row in the second category.
5. Re-baseline the first category **in a single commit**, with each reason in the
   message.
6. `node screens.mjs` → the new boards become the reference for Phase 4.

Do not re-baseline row by row while converting files: you will re-baseline a real
regression by accident and never find it again.

---

# Part 14 — Packaged setup (copy-paste)

Everything in this part is a file you replace wholesale. Do it once, in this order.

## 14.1 `apps/web/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";
import preset from "../../brand/khandolite.tailwind.preset.mjs";

const config: Config = {
  // The preset resolves every colour, size, radius and motion value from the
  // token module. Do not add colours here.
  presets: [preset as unknown as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /* Fonts resolve to the CSS variables next/font exposes — not to the literal
         family names, which only exist on a machine that has the font installed. */
      fontFamily: {
        display: "var(--a2-font-display)",
        sans: "var(--a2-font-sans)",
        script: "var(--a2-font-script)",
        "odia-sans": "var(--a2-font-odia-sans)",
        "odia-serif": "var(--a2-font-odia-serif)",
      },

      /* LOCAL EXTENSIONS — not tokens. Each needs a reason (see §3.6). */
      fontSize: {
        "logo-mark": ["38px", { lineHeight: "0.82", letterSpacing: "-0.03em" }],
        "logo-mark-sm": ["26px", { lineHeight: "0.82", letterSpacing: "-0.03em" }],
        "logo-word": ["11px", { lineHeight: "1", letterSpacing: "0.26em" }],
        "logo-word-sm": ["8px", { lineHeight: "1", letterSpacing: "0.24em" }],
        "logo-tag": ["7.5px", { lineHeight: "1", letterSpacing: "0.24em" }],
        script: ["clamp(1.6rem, 2.8vw, 2.4rem)", { lineHeight: "0.94" }],
        "script-sm": ["clamp(1.5rem, 2.6vw, 2.25rem)", { lineHeight: "0.94" }],
        "script-xs": ["clamp(1.4rem, 2.4vw, 2.1rem)", { lineHeight: "0.94" }],
      },

      /* The one surviving shadow: the mobile menu sheet. Everything else is flat. */
      boxShadow: {
        menu: "0 18px 44px -18px rgba(38,38,38,0.45)",
      },

      /* Opacity steps the components use. Declared so `text-cream/72` is a real
         utility rather than an arbitrary value. */
      opacity: {
        3: "0.03", 6: "0.06", 8: "0.08", 12: "0.12", 14: "0.14",
        16: "0.16", 18: "0.18", 22: "0.22", 35: "0.35", 45: "0.45",
        55: "0.55", 65: "0.65", 72: "0.72", 78: "0.78", 82: "0.82",
        85: "0.85", 88: "0.88",
      },
    },
  },
  plugins: [],
};

export default config;
```

## 14.2 `apps/web/app/globals.css`

```css
/* The token layer. Generated values, checked by validation/check-khandolite.mjs. */
@import "../../brand/khandolite.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    @apply bg-cream font-sans text-charcoal antialiased;
    text-rendering: optimizeLegibility;
  }

  /* ── ONE focus treatment for the whole system ─────────────────────────────
     Unlayered on purpose. Tailwind's `focus-visible:outline-none` compiles to
     `outline: 2px solid transparent`, which lives in a late cascade layer and
     silently beat an earlier rule — blinding 12 tab stops in Phase 3 while
     `outline-style` still reported `solid`, so no audit caught it.

     Components must not declare a focus ring. A second ring colour is the ring
     that fails on the one surface nobody tested. */
  :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 2px solid var(--a2-terracotta) !important;
    outline-offset: 2px;
  }

  /* On charcoal and photography, terracotta is 2.94:1 and disappears.
     Marigold is 8.32:1 — same ring, correct ink. */
  .on-dark :where(a, button, input, select, textarea, [tabindex]):focus-visible,
  .bg-charcoal :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline-color: var(--a2-marigold) !important;
  }

  ::selection {
    background: var(--a2-terracotta);
    color: var(--a2-cream);
  }
}

@layer components {
  /* The one container. Never write max-w-[1280px] on a wrapper. */
  .a2-container {
    margin-inline: auto;
    max-width: var(--a2-page);
    padding-inline: var(--a2-gutter);
  }

  /* The one section rhythm. Never write py-16 on a section. */
  .a2-section {
    padding-block: var(--a2-pad-section);
  }

  /* Skip link — the first focusable element on the page. */
  .a2-skip {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 100;
    padding: 12px 20px;
    background: var(--a2-charcoal);
    color: var(--a2-cream);
    font-weight: 600;
  }
  .a2-skip:focus {
    left: 8px;
    top: 8px;
  }
}

@layer utilities {
  /* Reveal — the CSS half of the Reveal component, so there is no runtime
     style injection. The component toggles `.is-in`. */
  .a2-reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .a2-reveal.is-in {
    opacity: 1;
    transform: none;
  }
}
```

`khandolite.css` already carries the `prefers-reduced-motion` collapse, the Odia
`[lang="or"]` stacks and the 1.8 line-height. **Do not re-declare them here.**

## 14.3 `apps/web/app/layout.tsx` — the font wiring

The four faces stay, but the **CSS variable names must match the preset**:

| Face | Role | Variable |
|---|---|---|
| `Newsreader` | serif display | `--a2-font-display` |
| `Inter` | UI sans | `--a2-font-sans` |
| `NotoSansOriya` | Odia only | `--a2-font-odia-sans` |
| `Parisienne` | script accent | `--a2-font-script` |

```tsx
const display = Newsreader({ subsets: ["latin"], display: "swap",
  weight: ["400", "500"], style: ["normal", "italic"], variable: "--a2-font-display" });

const sans = Inter({ subsets: ["latin"], display: "swap",
  weight: ["400", "500", "600"], variable: "--a2-font-sans" });

// Odia: the header language switch renders ଓଡ଼ିଆ, and Inter's latin subset has no
// glyphs for it — without this face the label is tofu.
const odia = NotoSansOriya({ subsets: ["oriya"], display: "swap",
  weight: ["400"], variable: "--a2-font-odia-sans" });

const script = Parisienne({ subsets: ["latin"], display: "swap",
  weight: ["400"], variable: "--a2-font-script" });
```

Then in `metadata`, replace the placeholder metadata with the real one:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://a2foundation.in"),
  title: {
    default: "A2 Foundation — Preserving Sacred Sanctity",
    template: "%s · A2 Foundation",
  },
  description: "Preserving sacred sanctity, incubating grassroots dignity — "
    + "circular restoration of temple remnants across Bhubaneswar's heritage zones.",
  // …OG + Twitter cards, og image 1200×630
};

export const viewport: Viewport = {
  themeColor: "#262626",   // charcoal token, not the old forest
  width: "device-width",
  initialScale: 1,
};
```

`themeColor` is the one place a hex literal is allowed in the app, because the
browser reads it before CSS exists. It must still equal the charcoal token.

## 14.4 `.env.local`

```bash
WP_API_URL=https://wp.a2foundation.in/wp-json/a2/v1
NEXT_PUBLIC_SITE_URL=https://a2foundation.in
A2_REVALIDATE_SECRET=<64 hex chars, same value as wp-config.php>
```

Never commit this file. `A2_REVALIDATE_SECRET` must be identical in
`wp-config.php` and `.env.production` — a mismatch fails silently by design.

## 14.5 The conversion order

Convert in this order. Each step ends with `npm run check:tokens` clean.

1. `tailwind.config.ts` (14.1)
2. `app/globals.css` (14.2)
3. `app/layout.tsx` (14.3)
4. `components/ui/*` — smallest first: `eyebrow`, `badge`, `button`, `card`, `input`
5. `components/sections/values-bar` → confirm the values bar still works
6. `components/sections/site-header` → confirm the `hdr-lg` breakpoint
7. `components/sections/hero` → confirm the header offset
8. the remaining seven sections
9. `components/ornaments/*` and `components/icons/*` (`IconDonate` → `IconContribute`)
10. delete `brand/tokens.css` and `brand/tailwind.preset.ts`
11. `node fidelity.mjs` → the re-baseline pass (§3.5 and the closing note of §13)

Step 10 is not cleanup. Leaving the old files means the next person can import the
old palette and the whole migration becomes advisory.

---

# Part 15 — Troubleshooting

Every entry here is a failure that actually happened during this build. They are
ordered by how much time they cost.

## 15.1 Build and tooling

| Symptom | Cause | Fix |
|---|---|---|
| `npm run build` passes locally, blank page in production | a runtime error in a Server Component, swallowed | `npm run build` on the same Node version as production; check the server logs, not the browser console |
| `Module not found: brand/khandolite.tailwind.preset.mjs` | the preset path is relative to `apps/web/`, not the repo root | `../../brand/...` from `apps/web/tailwind.config.ts` |
| Tailwind class has no effect | the file is not in `content:` | add the glob; `components/**` covers it |
| A class works in dev, not in the build | it is built by string concatenation | use `cn()`, or a full class name in a map (§2.3) |
| `text-cream/72` does nothing | the opacity step is not declared | it is in 14.1's `opacity` block — do not delete it |
| `check:tokens` passes but the page is grey | you replaced a class with nothing | diff the file; it names the line it changed |
| Huge JS bundle | a band was made a client component | `"use client"` should appear in exactly three files |

## 15.2 Layout

| Symptom | Cause | Fix |
|---|---|---|
| Hero hidden under the header | hard-coded `top-0` or a literal `104px` | offset by `calc(var(--a2-header-h) + …)` |
| Content shifts left between bands | two different gutters | `.a2-container` only |
| Page scrolls sideways at 360 px | a fixed width on a text container, or a flex child that will not shrink | `max-w-` not `w-[Npx]`; `min-w-0` on the flex child |
| `overflow-x: hidden` "fixed" it | it did not — it hid it | remove it and find the element |
| A card's text overflows its box at 200% | fixed `h-` on a text container | `min-height` or nothing |
| Values bar rules draw through a row | rules not switched off at the wrapping breakpoint | `lg:border-l` only |
| Partners row overflows at 200% text | fixed-width row | `flex flex-wrap` |
| Sticky element stops sticking | an ancestor has `overflow: hidden` | move the overflow to the band |

## 15.3 Focus and keyboard

| Symptom | Cause | Fix |
|---|---|---|
| No focus ring on one element | a utility layer killed it | the unlayered `!important` rule in 14.2 must be present |
| Ring is invisible on the dark band | terracotta on charcoal = 2.94:1 | add `.on-dark` to the band, or `bg-charcoal` |
| Ring is invisible only on some stops | `focus:outline-none` on a variant | search for it; delete it |
| Skip link does not move focus | `<main>` without `tabIndex={-1}` | add it |
| Tab order jumps backwards | `order-` or `flex-row-reverse` | reorder the DOM |
| A carousel arrow cannot be reached | it is `disabled` | `aria-disabled` + a no-op handler |
| Sheet does not return focus | no focus return on close | store the trigger, `.focus()` it on close |
| A test says focus is fine but it is not | the test used `.focus()` | `:focus-visible` does not fire for a programmatic focus — tab for real |

## 15.4 Images and performance

| Symptom | Cause | Fix |
|---|---|---|
| LCP > 2.5 s | hero image not `priority`, or no `sizes` on `fill` | `priority` on the hero only; `sizes` on every `fill` |
| Screenshots show blank bands | lazy images below the fold | scroll the page before capturing |
| Image is 1920 px wide in a 380 px slot | missing `sizes` | add it |
| Layout jumps as images load | no `width`/`height` | set them, or `fill` inside an aspect-ratio wrapper |
| Ken Burns makes LCP worse | animation starts before decode | start it after `onLoad` |
| The image optimizer hangs | sharp missing or a bad remote pattern | `next.config.mjs › images.remotePatterns` must include the WP host |

## 15.5 Data and API

| Symptom | Cause | Fix |
|---|---|---|
| Metrics all show `—` | no **verified** runs exist | verify a run in WP → A2 Platform → Ledger. Unverified rows do not count |
| Metrics show `—` after data was added | 15-minute transient | `?fresh=true`, or wait |
| CORS preflight fails | two `Access-Control-Allow-Origin` headers | remove the nginx one; the plugin sets it |
| Fetch returns HTML, not JSON | wrong `WP_API_URL` (missing `/a2/v1`) | fix the env var |
| Story cards are empty | consent gate — the story is not consented | correct behaviour; consent it in WP |
| Contribution button shows an error | 503 `a2_contributions_off` is the **normal** pre-registration state | render "Register your interest", not a toast |
| Revalidation does nothing | secret mismatch, or `.env` not loaded in production | both sides must match; failure is silent by design |
| A coordinator sees nothing in WP | fail-closed with no zone assigned | assign `a2_zone_scope` |

## 15.6 Copy and compliance

| Symptom | Cause | Fix |
|---|---|---|
| `check-term-charter` fails on `home.ts` | placeholder copy still live | Part 12 §12.5 |
| It fails on a `//` comment | it should not — comments are warnings | check the file is not in `PROSE_DIRS` |
| Locked copy drift | a string was reflowed or a comma changed | copy from §12.2 verbatim |
| A metric has a `+` that should not | added in JSX | delete it; the server decides |
| An editor's save reverts | the term charter blocked it | read the admin notice; it names the replacement |
| A beneficiary will not publish | consent gate, no override | add `a2_consent_date` — there is no bypass, by design |

## 15.7 Validation harness

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module '@playwright/test'` | `node_modules` empty (it is not snapshotted) | `cd validation/harness && npm install && npx playwright install chromium` |
| Browser launch fails, missing libs | no system deps | `sudo apt-get update -qq && sudo npx playwright install-deps chromium` |
| `a11y-audit` reports a contrast failure that looks fine | an alpha colour over photography | use a solid token (§3.2) |
| `ux-audit` flags a `py-16` | hand-written section padding | `.a2-section` |
| `final-gate` flags overflow but you see none | the element is off-canvas until scrolled | the gate names the selector; scroll to it |
| `fidelity` reports drift after the swap | expected — the three deliberate visual changes in §3.5 | re-baseline once, deliberately |
| Every gate passes but the page looks wrong | the gates measure; they do not judge | review the boards from `screens.mjs` |

---

# Part 16 — The checklist

Print this. One copy per pull request.

## Before you start a PR

- [ ] `git pull` on the target branch
- [ ] `npm ci` (not `npm install`)
- [ ] `npm run dev` and look at the page you are about to change

## While building

- [ ] Every colour is a token class — no `#`, no `rgb(`
- [ ] Every font size is a token class — no `text-[17px]`
- [ ] Every spacing value is a token or a Tailwind step from the scale
- [ ] `className` is applied last, via `cn()`
- [ ] No new `"use client"` (there are exactly three)
- [ ] No user-visible string typed in a component — it goes in `content/home.ts`
- [ ] Every interactive element ≥ 44 × 44
- [ ] No `outline-none`, no custom focus ring
- [ ] Every image has `alt`; every `fill` has `sizes`
- [ ] Every section is a `<section>` with an accessible name
- [ ] Heading levels do not skip
- [ ] No fixed height on a container holding a sentence
- [ ] New motion uses a token duration and collapses under reduced motion

## Before you push

- [ ] `npm run validate` → clean
- [ ] `cd ../../validation/harness && node a11y-audit.mjs` → 40/0/0, 0 blind
- [ ] `node ux-audit.mjs` → 19/19
- [ ] `node final-gate.mjs` → 0 fail
- [ ] `node ../../validation/check-term-charter.mjs` → exit 0
- [ ] Checked at **360, 390, 768, 1280, 2560**
- [ ] Checked at **200% browser zoom**
- [ ] Checked at **200% and 300% text-only** (`html { font-size: 32px / 48px }`)
- [ ] Checked with **reduced motion ON**
- [ ] Tabbed through the whole page — every stop has a visible ring
- [ ] Network tab: no console errors, no 404s, no CORS failures
- [ ] The other two routes still pass (`/`, `/kitchen-sink`, `/ornaments`)

## Copy and compliance

- [ ] No blocked term (`waste`, `garbage`, `trash`, `payroll`, `wages`,
      `donation`, `donate`, `donor`, `worker`, `80G`, `FCRA`, `tax-free`,
      `CSR grant`)
- [ ] Locked strings verbatim from §12.2
- [ ] No hand-typed metric figure anywhere
- [ ] No `+` appended to a metric in JSX
- [ ] Every metric renders with its `Target — Year 1` line
- [ ] Footer disclosure present and verbatim

## The PR itself

- [ ] Title says what changed, in the user's terms
- [ ] Body states **why**, and names the reason if the change deviates from this
      document
- [ ] Screenshots at 390 and 1280 (before/after if it is a layout change)
- [ ] Any changed gate value is justified explicitly, not silently loosened
- [ ] Any new local extension is listed with its reason

## Definition of done for the whole integration

- [ ] The palette swap is complete and `check:tokens` is clean
- [ ] `brand/tokens.css` and `brand/tailwind.preset.ts` are **deleted**
- [ ] The copy swap is complete and `check-term-charter` exits 0
- [ ] Metrics come from `/a2/v1/metrics` and render `—` when empty
- [ ] The contribution CTA handles `503 a2_contributions_off` as a normal state
- [ ] The footer disclosure is on every page
- [ ] `/api/revalidate` is implemented with `timingSafeEqual`
- [ ] The fidelity re-baseline is done in a single commit, with reasons
- [ ] `bash validation/signoff-phase3.sh` exits 0
- [ ] All eight gates green, and you can explain what each one catches

---

## Appendix A — The decisions, and who owns them

So you know when to ask instead of deciding.

| Decision | Owner | If you disagree |
|---|---|---|
| The four Khandolite hexes | **Client** | not negotiable |
| `terracotta.deep` `#A94434` for small text | Engineering (measured) | show a ratio that beats it |
| Marigold is dark-surface only | Engineering (measured) | show a 4.5:1 pairing |
| H1 at 72 px not 88 px | **Blueprint** | client decides, not you |
| Body at 17 px | **Blueprint** | client decides |
| 10 px type removed | Engineering (accessibility) | do not re-add |
| `font-script` allowed as an extension | Engineering (brand) | keep; the hero needs it |
| Lucide icons | Engineering | swap is fine if sizes hold |
| 92 px header | Measurement | adjust only with the hero offset in the same commit |
| The 11 band order | **Design (signed off)** | client decides |
| Partners as name plates | **Client (licensing pending)** | replace when marks are approved |
| Locked copy | **Client** | never |
| Term charter terms | **Blueprint §0.2(6) / §20 glossary** | never |
| Metric targets | **Client (Year 1)** | client decides |
| Compliance switches default OFF | **Blueprint §13** | never |
| Consent gates have no override | **Blueprint §8.4** | ask; do not add a bypass |

## Appendix B — The five-minute orientation for a new developer

If someone joins mid-project, this is what to tell them:

1. The site is Next.js reading a WordPress API. You build the Next.js half.
2. Every design value is in `brand/khandolite.tokens.mjs`. Nothing is hard-coded.
3. Thirteen primitives in `components/ui/`. Build with them; do not fork them.
4. Eleven bands in `components/sections/`, in a specific order, for a reason.
5. All text is in `content/home.ts`. Four strings are locked and unchangeable.
6. Three components are client. Everything else is server.
7. There are eight gates. `npm run validate` is the fast one.
8. Read `docs/14` Part 3 before your first commit. It is the part that breaks
   builds.
9. If a rule in this document says "because [measured thing]", it is not a
   preference.
10. When a gate fails and you think it is wrong, ask. Roughly nine times in ten it
    is right.

## Appendix C — File-by-file "what to touch"

| File | Touch it for | Never touch it for |
|---|---|---|
| `brand/khandolite.tokens.mjs` | a new colour/size/motion value | a one-off component need |
| `brand/khandolite.css` | a CSS variable that must mirror a token | component styles |
| `brand/khandolite.tailwind.preset.mjs` | exposing a token as a utility | adding a colour that is not a token |
| `apps/web/tailwind.config.ts` | font variables, local extensions | colours |
| `apps/web/app/globals.css` | the container, the section rhythm, the one focus rule | anything component-specific |
| `apps/web/app/layout.tsx` | fonts, metadata, `<html lang>` | layout |
| `apps/web/app/page.tsx` | the band order | a band's internals |
| `apps/web/content/home.ts` | page copy | locked copy |
| `components/ui/*` | adding a variant | a one-off need in one section |
| `components/sections/*` | layout and composition | a value that should be a token |
| `components/ornaments/*` | decoration | anything with meaning |
| `components/icons/index.tsx` | a new glyph | a size (sizes are optical, set by the caller) |
| `lib/wp.ts` | the API seam | component logic |

---

**End of the instruction sheet.**

If something you need is not in here, the answer is in one of:

- `docs/10-rulebook.md` — the rule and its reason
- `docs/11-code-map.md` — what the WordPress half does
- `docs/12-rest-contract.md` — the exact API shape
- `docs/13-integration.md` — installing the WordPress half
- the header comment on the file you are editing — why it is the way it is

Those header comments are not decoration. They exist so this project does not need
its original author to be reachable.
