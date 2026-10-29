# Phase 1 validation — sign-off

**Gate:** `npm run validate` (tokens → tsc → lint → build) + `validate.mjs` (axe, computed
contrast, keyboard, reflow, motion, fonts, console) against the production build on :3100.
**Result: PASS 28 · WARN 1 · FAIL 0 → Phase 1 APPROVED.**

Full evidence and the narrative report: [`../validation/README.md`](../validation/README.md) ·
raw JSON: [`../validation/report.json`](../validation/report.json).

---

## 1. Result board

| Page | axe WCAG 2.2 AA | Contrast pairs | h1 | main | alt text | Focus rings | Targets | Console | Network |
|---|---|---|---|---|---|---|---|---|---|
| `/kitchen-sink` | **0 violations** | **252 / 252** | 1 | ✔ | ✔ | 12 / 12 | 1 × 40px (W1) | 0 | 0 |
| `/` | **0 violations** | **7 / 7** | 1 | ✔ | ✔ | 8 / 8 | all ≥ 44px | 0 | 0 |

| Site check | 360 | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| Horizontal overflow | none | none | none | none | none | none |

- **Reduced motion** — every duration collapses to ~0 ms; `Reveal` content is visible immediately.
- **200 % text** — document width = client width at 1440; no horizontal scroll.
- **Fonts** — Inter (body) + Newsreader (display) confirmed from computed styles.

### The single warning (accepted)

`sm` button = **40 px** tall. That is the mockup's inline utility size. WCAG 2.5.8 (AA) needs
24 px, so it passes; 44 px is the AAA target and applies to primary actions, all of which are
48–52 px. **Rule going forward: `sm` never carries a primary CTA.**

---

## 2. Defects the gate caught (and the root cause of each)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Rust buttons showed ink labels on rust (2.78:1); outline button 1.04:1 | `tailwind-merge` treated custom `text-h3` as a *colour*, deleting `text-white` in the same class list | `lib/cn.ts` derives all merge groups from the preset; parity test enforces it |
| 2 | Wash labels 3.11:1 instead of 5.58:1 | `rust.wash` was translucent `rgba(…,0.08)`, compositing with the photo behind | solid `#FBEFEC` / wash-deep `#F7E3DD`; **ban on translucent colour tokens** |
| 3 | Eyebrow numerals 4.78:1 at 12 px | `opacity-90` on a passing colour | opacity removed from the numeral |
| 4 | On-dark Tag/Badge 1.86–2.75:1 | sheet-only variants pushing light accents into label duty | variants **deleted**, not patched: `Tag` is `rust-text` only, `Badge` lost its `forest` tone |
| 5 | Logo tagline 2.75:1 | 7.5 px type carrying meaning | declared ornament: `aria-hidden` + brand accent, exemption noted in the component |

Two harness bugs were fixed in the same pass — hidden `sr-only` labels and wrapper elements were
being measured as painted text, producing phantom failures. Reports from here on can be trusted.

---

## 3. Token enforcement is now mechanical

`scripts/check-tokens.mjs` (`npm run check:tokens`, first step of `npm run validate`) audits all
12 component files and fails the build on any hard-coded colour, arbitrary font size, unknown
`text-*` / `max-w-*` / `rounded-*` token, or preset↔merger drift.

```
fontSize 20 · borderRadius 3 · maxWidth 4 · boxShadow 2   ✓ 0 violations
```

---

## 4. Phase 1 scope, honestly stated

In: 12 colour tokens, 20 type steps, 3 type voices self-hosted, 13 primitives, 26 icons,
motion primitives, focus/reduced-motion behaviour, the review sheet.
Out (by design): photography (placeholders at correct crops), **ornament system**, real homepage
sections, client-supplied logos.

---

## 5. Decisions carried into Phase 2

1. **No translucent colour tokens.** Ever. A wash is a solid colour with a measured ratio.
2. **No component variant without an audited contrast pair.** If a variant can't reach AA on the
   surface it is used on, delete the variant.
3. **Derive, don't duplicate.** Class-group lists, token tables and specimen rows come from the
   preset — never a second hand-maintained copy.
4. **Restart the server after every build.** `next start` serves the previous build; a stale CSS
   chunk is indistinguishable from a design bug.
5. **Measure computed colours, not token intent.** Alpha blending, inheritance and merging all
   move the real number.

---

## 6. Next: Phase 2 — ornament & art system

| Item | Owner | Note |
|---|---|---|
| Torn-paper edge between bands | build | needs a real SVG mask, not a background image |
| Odisha line-art illustration set | build | 1.5 px stroke, matches icon system |
| Foliage / sprig flourishes | build | reuse `IconLeafSprig` geometry |
| Stamp / seal device | build | rotated, cream-on-forest |
| Script accent rules (Parisienne, one per view) | build | never on body text |
| Photography sourcing + partner-logo permission | **client** | blocks Phase 4 fidelity |

**Verdict: Phase 1 signed off. Proceeding to Phase 2.**

> **Superseded by the final audit:** [`07-phase-1-final-audit.md`](07-phase-1-final-audit.md) —
> 116 checks, 0 failures, plus the Next 16 upgrade proof. This document records the first gate.
