# Start here

One page. Pick the row that is your job.

---

## If you are the developer building the front end

**→ [`docs/14-ui-development-instructions.md`](docs/14-ui-development-instructions.md)**

Read Parts 0–3 before you write any code. Part 3 (the token contract) is the part
that breaks builds: it is a complete old-name → new-name map for every colour and
type size, plus the four contrast rules that follow from the measured ratios.

Then run it:

```bash
cd apps/web
npm ci
npm run dev        # http://localhost:3100
```

Look at three pages before you change anything:

| URL | What it is |
|---|---|
| `/` | the homepage — all 11 bands |
| `/kitchen-sink` | every primitive and every state on one page |
| `/ornaments` | every decoration at every size |

## If you are installing the WordPress half

**→ [`docs/13-integration.md`](docs/13-integration.md)**

Ten numbered steps, the `wp-config.php` constants, the CORS check, the ten gates,
and a go-live checklist. The fastest way to know the install is sound is step 2:

```bash
curl https://your-wp/wp-json/a2/v1/health | jq
# all four compliance switches must read false
```

## If you have to change something in the WordPress plugin

**→ [`docs/11-code-map.md`](docs/11-code-map.md)** — what each of the 15 files does
and why.

**→ [`docs/10-rulebook.md`](docs/10-rulebook.md)** — the rule that file exists to
enforce, and the condition under which it genuinely does not apply.

## If you are reading the API and building against it

**→ [`docs/12-rest-contract.md`](docs/12-rest-contract.md)** — every `a2/v1` route,
its exact JSON shape, and for each field you might want to add, why it is not
there.

## If you are editing copy or publishing content

**→ [`docs/14-ui-development-instructions.md`](docs/14-ui-development-instructions.md) Part 12** — the copy deck, the locked strings, and the banned-term table.

Locked copy cannot be changed by a developer. Banned terms fail the build.

## If you are reviewing the design work

**→ [`docs/09-phase-3-homepage.md`](docs/09-phase-3-homepage.md)** — the homepage
build, its five turning-point decisions, and what is deliberately not done.
Then `docs/02-design-tokens.md` and `docs/08-phase-2-ornaments.md`.

---

## The five things that get a pull request rejected

1. A raw hex colour or a raw `px` font size in a component.
2. `outline-none`, `outline-transparent`, or a custom focus ring.
3. A blocked term: `Donate`, `waste`, `garbage`, `wages`, `worker`, `80G`, `FCRA`.
4. A `+` appended to a metric figure in JSX.
5. A gate ignore comment, a deleted check, or a lowered threshold.

---

## The five facts worth knowing before you form an opinion

1. **The contrast numbers are measured, not estimated.** `contrast-audit.mjs`
   recomputes all 23 pairs from the WCAG formula on every run. When this document
   says `terracotta` on `stone-tint` is 4.24:1 and therefore fails for body text,
   that is arithmetic, not taste.
2. **The metrics are derived.** No figure on the site is a string in a template.
   If there are no source rows the page renders `—`, and that is the correct
   output, not a bug.
3. **The compliance switches default OFF** because the foundation is not
   registered yet. Enabling one is a logged act with a mandatory reason, not a
   code change.
4. **Consent gates have no override.** A beneficiary or minor record does not
   publish without a consent field. There is no admin bypass, deliberately.
5. **The WordPress engine has never run live.** It is syntax-clean and written
   against documented APIs, but you are the first person to execute it. The health
   endpoint is the smoke test.
