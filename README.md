# A2 Foundation — UI/UX & Platform Package

Everything needed to build the A2 Foundation site: the design system, the Next.js
front end, the WordPress engine, the validation gates, and the instruction set.

**Read [`START-HERE.md`](START-HERE.md) first.** It is one page and it tells you
which document to open for the job you are doing.

---

## The 60-second version

| | |
|---|---|
| **What this is** | A headless build: WordPress holds content and business rules, Next.js renders the public site. |
| **What is signed off** | The design tokens (23/23 measured contrast pairs), the 11-band homepage, the 13 UI primitives, the ornament system. |
| **What is yours** | The palette swap, the copy swap, and wiring the page to the API. [`docs/14`](docs/14-ui-development-instructions.md) is the complete instruction sheet. |
| **What must never change** | The four locked strings, the compliance switches defaulting OFF, the consent gates, the metric derivation. |
| **Where the rules are** | [`docs/10-rulebook.md`](docs/10-rulebook.md) — 38 rules, each with the file that enforces it. |

## Run it

```bash
cd apps/web
npm ci
npm run dev            # http://localhost:3100
```

Optional — the WordPress half:

```bash
# see docs/13-integration.md for the full sequence
cp -r a2-core /path/to/wp-content/plugins/
wp plugin activate a2-core
curl https://your-wp/wp-json/a2/v1/health | jq
```

## The shape of the repo

```
START-HERE.md            ← one page: which doc for which job
docs/
  10-rulebook.md         the 38 rules, and the file that enforces each
  11-code-map.md         what every PHP file does
  12-rest-contract.md    every a2/v1 route and its exact JSON
  13-integration.md      installing the WordPress half
  14-ui-development-instructions.md   ← the UI/UX instruction sheet
  01–09, blueprint-source.txt         how the design was derived
brand/
  khandolite.tokens.mjs  THE single source of truth (colour, type, layout,
                         motion, term charter, locked copy)
  khandolite.css         CSS custom properties, checked against the module
  khandolite.tailwind.preset.mjs
a2-core/                 the WordPress plugin — 15 PHP files
a2-ekamra/theme.json     generated from the token module
apps/web/                the Next.js 14 front end
  components/ui          13 primitives
  components/sections    the 11 bands
  components/ornaments   decoration
  content/home.ts        all page copy (the only file with text in it)
validation/
  contrast-audit.mjs     23/23 WCAG pairs — fails on drift
  check-khandolite.mjs   CSS ↔ token drift, raw-hex ban
  check-term-charter.mjs banned terms in shipped copy
  gen-theme-json.mjs     regenerates theme.json
  harness/               playwright + axe: a11y, UX, zoom, fidelity
reference/
  source/homepage-mockup.png   the client mockup the design was measured from
  stack-comparison.html        the build-vs-buy comparison
```

## The gates

```bash
cd apps/web && npm run validate                 # tokens → types → lint → build

cd ../../validation
node contrast-audit.mjs        # 23/23 pairs
node check-khandolite.mjs      # 0 drift
node check-term-charter.mjs    # exit 0  (see note)

cd harness && npm install && npx playwright install chromium
node a11y-audit.mjs            # 40 pass / 0 fail, 55 tab stops, 0 blind
node ux-audit.mjs              # 19/19
node final-gate.mjs            # 123 pass / 1 warn / 0 fail
node fidelity.mjs              # 17 rows, 0 drift
```

**Note on `check-term-charter.mjs`:** it currently **fails, by design.** The
shipped page still carries Phase-3 placeholder copy (`Donate Now`, hand-typed
metric figures, `worker`). Fixing that is Part 12 of `docs/14`. Do not weaken the
script to make it pass.

## Status

| | |
|---|---|
| Design system | signed off |
| Homepage | built, validated, awaiting final client sign-off |
| WordPress engine | written, `php -l` clean on 15/15 files, **not yet run against a live install** |
| Palette + copy swap | **not started** — this is the next task |
| Deploy key | issued separately; see the handover message |
