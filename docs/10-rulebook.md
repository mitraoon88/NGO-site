# 10 · The Rulebook

**Who this is for:** the developer integrating this into the A2 Foundation site.
**What it is:** every rule the code enforces, stated as a rule, with the reason
and the file that enforces it. If a rule is not in this document, it is not a
rule — it is a preference, and you may overrule it.

Read this before you change anything. Read `11-code-map.md` before you change a
PHP file. Read `13-integration.md` before you install anything.

---

## How to read a rule

Each rule has four parts:

| Part | Means |
|---|---|
| **The rule** | One sentence, imperative. |
| **Why** | The consequence of breaking it. If the consequence is legal, it is marked ⚖. |
| **Enforced by** | The file that fails if you break it. "Convention" means nothing stops you — be careful. |
| **Break it if** | The condition under which the rule genuinely does not apply. |

Rules marked ⚖ are compliance rules. Do not break them to make a build go green.

---

# Part 1 — Tokens and design

### 1.1 The token module is the single source of truth

**The rule.** Colours, type sizes, spacing, motion and the term charter exist in
exactly one place: `brand/khandolite.tokens.mjs`. The CSS, the Tailwind preset
and `theme.json` are all generated or checked from it.

**Why.** Two copies of a colour is the most common way a design system dies. Six
months later nobody knows which `#B84A39` is the real one, and an accessibility
audit fails on a value nobody remembers choosing.

**Enforced by.** `validation/check-khandolite.mjs` — fails on any `--a2-*`
property that does not match the module, and on any raw hex outside the token
block. `validation/gen-theme-json.mjs` regenerates `theme.json`.

**Break it if.** Never. If you need a new colour, add it to the module and rerun
both scripts.

### 1.2 Terracotta is a fill, not small text ⚖

**The rule.** `terracotta.DEFAULT` (`#B84A39`) may be used for button fills,
rules, and display type at 24 px or larger. Any terracotta text **smaller than
24 px** must use `terracotta.deep` (`#A94434`).

**Why.** Measured: `#B84A39` on `stone-tint` is **4.24:1**. The accessibility bar
is contractual at AA, which needs 4.5:1 for body text. `#A94434` is the same hue
at 92% lightness and reaches **4.85:1** on stone-tint and **5.70:1** on cream.

| Pair | Ratio | Verdict |
|---|---|---|
| `terracotta` `#B84A39` on cream `#FDFBF7` | 4.98 | AA — fills and ≥24px display only |
| `terracotta` on stone-tint `#F3E7DE` | **4.24** | **fails AA for body text** |
| `terracotta.deep` `#A94434` on cream | 5.70 | AA for body text |
| `terracotta.deep` on stone-tint | 4.85 | AA for body text |

**Enforced by.** `validation/contrast-audit.mjs` recomputes every pair and fails
on any stale documented ratio. The forbidden list is also asserted.

**Break it if.** Never. This is a measured failure, not a taste question.

### 1.3 Marigold never touches a light surface ⚖

**The rule.** `marigold` (`#F2B705`) may only appear on charcoal. It is never
text, an icon, or a border on cream or stone-tint.

**Why.** Marigold on cream is **1.76:1**. That is not "a bit low" — white on
marigold is 1.9:1 and the WCAG floor for large text is 3:1. On charcoal it is
**8.32:1** and it is the correct accent for dark bands.

**Enforced by.** `contrast-audit.mjs` forbidden list; the token has no `deep`
variant precisely so it cannot be reached for accidentally.

**Break it if.** Never. If you need a warm accent on a light surface, use
`terracotta.deep`.

### 1.4 There is one focus ring, and it is never removed

**The rule.** Every interactive element keeps a visible focus indicator:
`outline: 2px solid var(--a2-terracotta)` at `2px` offset, or `marigold` on dark
surfaces. `outline: none` and `outline: transparent` are banned.

**Why.** A keyboard user who cannot see where they are cannot use the site. The
specific trap: Tailwind's `focus:outline-none` compiles to a *transparent*
outline, which passes a CSS review and produces an invisible focus state.

**Enforced by.** `khandolite.css` sets one unlayered `:focus-visible` rule with
`!important`; `check-khandolite.mjs` fails if an outline is removed;
`a11y-audit.mjs` tabs through every stop and fails on a blind one (55 stops, 0
blind, currently).

**Break it if.** Never.

### 1.5 Odia text gets more line height

**The rule.** Anything inside `[lang="or"]` uses `line-height: 1.8` and the Noto
Oriya stacks.

**Why.** Odia stacks matras above and below the baseline. At Latin leading the
diacritics clip against the line above, which is unreadable and invisible to
anyone reviewing the page in English.

**Enforced by.** `check-khandolite.mjs` (line-height ≥ 1.8 is asserted).

**Break it if.** Never for Odia.

### 1.6 Motion collapses, it does not merely slow down

**The rule.** Every transition and animation is inside a
`prefers-reduced-motion: reduce` block that sets duration to `0.01ms` and
iteration to `1`.

**Why.** A reduced-motion preference is a medical accommodation (vestibular
disorder), not a preference about aesthetics. A 200 ms fade is not an
accommodation.

**Enforced by.** `check-khandolite.mjs` asserts the block exists; `ux-audit.mjs`
renders with the media feature faked on.

---

# Part 2 — Words

### 2.1 The term charter is a build gate ⚖

**The rule.** Public copy may not contain any term in
`khandolite.tokens.mjs › termCharter` where `severity: 'block'`. The list, with
reasons:

| Never write | Write instead | Why |
|---|---|---|
| waste, garbage, trash | Sacred Remnant · Pushpa · Nirmalya | §0.2(6). The material is an offering, not refuse. This is the organisation's central claim. |
| payroll, wages | Sevika Livelihood Remittance | Same. "Wages" reframes a livelihood programme as casual labour. |
| donation, donate, donor | Voluntary Contribution, Contribute, Contributor | ⚖ Without 80G registration a donation solicitation is a claim you cannot make. |
| worker | Sevika | §20 glossary — the role has a name. |
| 80G, FCRA, tax-free, CSR grant | Reference the switch, not the benefit | ⚖ These are statutory statuses the foundation does not yet hold. |

**Why.** These are not tone-of-voice suggestions. The blueprint makes them
rulings, and three of them are statements about legal status.

**Enforced by.** Three layers, deliberately:
1. `a2-core/inc/terms.php` — `wp_insert_post_data` restores the previous body and tells the editor why.
2. `validation/check-term-charter.mjs` — fails the build on a match in shipped prose.
3. `a2-core/assets/js/term-charter.js` — shows the problem in the editor as you type.

**Known limitation.** WordPress has no clean "abort save" hook. Layer 1 cannot
stop the write; it restores the previous body and downgrades the notice. Layers 2
and 3 are what make the rule hold. This is stated in a comment in `terms.php` so
nobody assumes stronger enforcement than exists.

**Break it if.** Never for ⚖ rows. `warn` rows (`service`, `employee`) may be
kept where the context genuinely requires the word.

### 2.2 Locked copy is locked

**The rule.** The H1, the hero sub-headline, both CTA labels, the pillars
introduction and the footer disclosure come from
`khandolite.tokens.mjs › lockedCopy` and are rendered verbatim.

**Why.** These are the client's approved words. A developer tightening a
sentence is a unilateral change to a sign-off.

**Enforced by.** `check-term-charter.mjs` asserts each locked string is present
in `apps/web/content/home.ts`.

**Currently failing — by design.** The shipped `home.ts` still carries the
Phase-3 placeholder copy ("Donate Now", hand-typed metrics). See
`13-integration.md › Step 6`. The gate is red until that merge is done, and being
red is the correct signal.

---

# Part 3 — Content model

### 3.1 Every post type declares its layer

**The rule.** Each of the 26 CPTs in `a2-core/inc/cpt.php › register()` sets
`layer` to 1, 2 or 3. `public`, `publicly_queryable`, `exclude_from_search`,
`show_in_rest` and the sitemap entry are all **derived** from it. Nobody writes
`public => true` by hand.

| Layer | Meaning | Public? | In sitemap? | In public REST? |
|---|---|---|---|---|
| 1 | Public sacred narrative (programmes, drives, zones, temple sites, collection runs, batches, campaigns, certificates) | yes | yes | yes |
| 2 | Authenticated operations (tasks, field reports, attendance, volunteers, sevikas, enrolments, students, assessments, craft inventory, remittances, assets, expenses, contributions, CSR leads, grants, data room, grievances, documents) | no | no | no |
| 3 | Gated auditor data room | no | no | no |

**Why.** ⚖ The failure mode has a name in the blueprint (§13.3): narrative
privacy. One internal batch record in a Google result is a breach. Deriving the
five flags from one integer means a mistaken edit is a single wrong number, not
four consistent-looking wrong flags.

**Enforced by.** `inc/cpt.php › register_post_types()` derives; `filter_sitemap_types()`
re-checks; `inc/meta.php` uses `layer_of()` to decide whether meta reaches REST.

**Break it if.** Never. Add a Layer-1 type only with the client's sign-off.

### 3.2 Taxonomy terms are seeded, not typed

**The rule.** The five zones, five verticals, five remnant types, four processing
statuses, seven skills and two languages are installed on activation and an
editor does not create siblings of them. Children of `vertical` only.

**Why.** The five-zone model is final (§0.2(1)). Free-text terms means "South
Zone" and "south zone" both exist, and the dashboard matrix silently
double-counts one of them.

**Enforced by.** `inc/taxonomies.php › seed_terms()` is idempotent and runs on
`init` at priority 20, so a missing term is repaired without a migration.

### 3.3 Meta is registered, one field at a time

**The rule.** Every meta key lives in `a2-core/inc/meta.php › fields()`. Never
call `update_post_meta()` on a key that is not in that map.

**Why.** The map carries three things you cannot reconstruct later: the
sanitiser, the capability required to write it, and whether it is public. A raw
`update_post_meta()` on `a2_consent_date` bypasses the consent gate and the
sanitiser at once.

**Enforced by.** Convention plus review. `register_post_meta()` is the only path
that gets the `auth_callback`; anything else is a bug you should reject in review.

**Break it if.** A migration script, which must state in its own comment why it
is bypassing the registry.

### 3.4 Sanitisation is a single switch

**The rule.** All values pass through `inc/meta.php › sanitize_field()`. The
sanitiser id comes from the field definition, not from the caller.

Notable behaviours:

- `enum` — an unknown value is **rejected to the first allowed value**, never
  stored. A typo must not become state.
- `pct` — clamped to 0–100.
- `geo` — `"lat,long"` parsed numerically, range-checked, rejected if invalid, so
  a bad string cannot reach a map API.
- `csv_slug` / `csv_int` — each element sanitised, empties dropped.
- `date` / `datetime` — parsed then re-emitted as `Y-m-d` / ISO 8601, so a
  locale-formatted date cannot enter the database.

**Why.** A sanitiser that trusts the caller's intent will eventually receive a
hostile one.

### 3.5 Consent gates publishing ⚖

**The rule.** A record that identifies a person does not become public without
consent:

- `a2_beneficiary` — needs `a2_consent_date`; blocked if `a2_consent_withdrawn`.
- `a2_student` — needs `a2_guardian_consent: true`.

**Why.** ⚖ Minors and vulnerable adults. This is the §8.4 / §10.5 obligation.

**Enforced by.** `inc/meta.php › enforce_consent()` on `wp_insert_post_data`: the
post is downgraded to `draft` and the admin notice names the missing field.

**Break it if.** Never. There is no override, deliberately — unlike the term
charter, which has a logged admin override because a false positive there is
possible. A missing consent is never a false positive.

### 3.6 PII never enters a public row

**The rule.** Remittances are public only as a monthly aggregate. A Sevika's name
never appears on `/transparency-log`. CSR leads store `wp_hash(email)`, not the
address.

**Why.** ⚖ §8.4. An aggregate is publishable; a named payment is a privacy
breach even if the amount is small.

**Enforced by.** `inc/ledger.php › split_8020()` returns counts and totals only;
`inc/rest.php › /csr-enquiry` hashes on write.

---

# Part 4 — Access

### 4.1 Roles grant capability; scoping grants rows

**The rule.** Use a role to answer "may this person edit a collection run at
all". Use `inc/scoping.php` to answer "which collection runs". A role plugin
cannot do the second, and pretending otherwise is the mistake §9 warns about.

**Why.** Nine roles exist: Program Manager, Ops Coordinator, Heritage Coordinator,
Field Lead, Volunteer/Sevika, Accountant, CSR Manager, Auditor, Org Admin. Four
of them are zone-scoped. A role plugin gives you a checkbox; it cannot add
`tax_query` to a query someone else wrote.

**Enforced by.** Three doors closed in `inc/scoping.php`:
1. `pre_get_posts` — every query loop.
2. `template_redirect` — a direct URL.
3. `rest_post_query` — the REST collection.
Plus `can_access()` as the one predicate for anything else.

### 4.2 Scoping fails closed

**The rule.** A zone-scoped user with no zones assigned sees **nothing**, not
everything. `zones_for_user()` returning `[]` means "unrestricted" only for users
with `manage_options`; for everyone else it is a hard no.

**Why.** The alternative — "no assignment means no restriction" — is how a
permissions bug becomes a data leak. Cron, WP-CLI and the gateway webhook are
excluded from scoping entirely, because a remittance total silently computed over
one zone is a financial error dressed as a security feature.

### 4.3 Subscribers never reach wp-admin

**The rule.** Volunteers and Sevikas have the `subscriber` base role and are
redirected off `/wp-admin`.

**Why.** ⚖ Safeguarding. An account that cannot enter wp-admin cannot
accidentally see another Sevika's remittance row, regardless of what a future
plugin does to the capability map.

---

# Part 5 — Money ⚖

### 5.1 Nothing is paid until the signature verifies

**The rule.** A contribution has status `created` until the gateway webhook
verifies an HMAC-SHA256 signature over the **raw** request body. The browser's
return URL is a hint; it changes nothing.

**Why.** A user can close the tab mid-payment; a hostile user can type the
success URL. Counting the return URL as payment means the ledger reports money
that does not exist — which is the one error a transparency site cannot survive.

**Enforced by.** `inc/contributions.php › handle_webhook()`. Three specific
details worth not undoing:
- `hash_equals()`, not `===` — constant-time comparison.
- `$request->get_body()`, not `get_json_params()` — re-encoding JSON reorders
  keys and breaks the signature.
- Amount equality is checked against the stored intent; a mismatch is not settled.

### 5.2 The webhook is idempotent

**The rule.** A repeated `payment.captured` for the same payment ID is
acknowledged and not re-processed.

**Why.** Gateways retry. Without this, one payment fires the receipt action twice
and the audit trail shows two "paid" events for one receipt.

### 5.3 Contributions are created by code, never by hand

**The rule.** `create_posts` for `a2_contribution` is `do_not_allow` for every
user; only the gateway context can insert.

**Why.** A hand-made contribution row has no gateway ID, no signature and no
consent reference. It is unfalsifiable money.

### 5.4 The collection switch is off

**The rule.** `switches\enabled('contributions')` is false on a fresh install and
the endpoint returns `503` with `a2_reason: compliance_switch_off`.

**Why.** ⚖ Before registration, the site may present the mission and collect
expressed interest. It may not take money. The refusal is explicit so the front
end can render "register your interest" instead of an error.

### 5.5 The metrics are derived, and an empty metric renders "—"

**The rule.** The four homepage figures come from `inc/metrics.php`. None is a
string in a template. If there are no source rows, the figure is `—`.

| Figure | Derived from | Target — Year 1 |
|---|---|---|
| Metric Tons Diverted | Σ verified collection-run weight ÷ 1000 | 150+ |
| Compliance Hours | Σ verified attendance hours | 1,200+ |
| Direct Banking | bank-settled remittances ÷ remittances due | 100% |
| Children Sustained | students with attendance ≥ 60% | 60+ |

**Why.** ⚖ §11.4. An auditor asks "show me where 1,200 comes from". A hard-coded
number cannot answer. And a plausible-looking invented figure is worse than a
dash: a dash is honest, a fabrication is a liability.

**Also:** the "+" is appended only when the actual clears the target. `148.6`
renders `148.6`, never `150`. Targets always display labelled "Target — Year 1"
next to the actual, never alone.

---

# Part 6 — API

### 6.1 Responses are flat, and the shape is a contract

**The rule.** Every `a2/v1` formatter returns exactly the fields the UI renders.
No `_embedded`, no `_links`, no rendered/raw/protected triples. A field is never
renamed or removed without bumping the namespace.

**Why.** The front end types against these shapes. WordPress's default post
document is a document *about* a post — a component that reads it needs a mapper
kept in sync forever, or three levels of null-guarding on `_embedded`. Flattening
at the source also means the public API cannot leak a field nobody meant to
publish.

### 6.2 Card is the one listing shape

**The rule.** Every listing route returns
`{ id, slug, title, excerpt, href, image, date, tags, meta }` inside
`{ items, total, page, per_page, pages }`.

**Why.** One component contract instead of one per route.

### 6.3 CORS is locked to one origin

**The rule.** `Access-Control-Allow-Origin` echoes back exactly one value — the
configured front-end origin — and `Vary: Origin` is set.

**Why.** `*` plus cookies is a vulnerability, and `*` on an endpoint that accepts
a contribution intent is an invitation.

### 6.4 Rate limits are per route, per IP

**The rule.** Grievance: 5/hour. CSR enquiry: 5/hour. Transient-based.

**Why.** A shared bucket means a burst of grievances locks out the CSR form —
a denial of service with extra steps.

---

# Part 7 — Operations

### 7.1 Compliance switches default off, and require a reason

**The rule.** Four switches (`80g`, `fcra`, `csr_grant`, `contributions`) install
`false`. Turning one on requires a reason of at least 10 characters, which is
written to the audit log with the user and timestamp.

**Why.** ⚖ Each switch represents a legal status the foundation does not hold
yet. A switch flipped with no stated cause is, six months later,
indistinguishable from a mistake. The reason field is the difference between an
audit trail and a log file.

**Enforced by.** `inc/switches.php › install_defaults()` and `set()`; the admin UI
refuses the POST without a reason.

### 7.2 Revalidation is debounced and batched

**The rule.** Paths are collected during the request and flushed once on
`shutdown`, capped at 40, sent non-blocking with `X-A2-Secret`.

**Why.** Saving a post fires `save_post` several times; a bulk edit of 40 records
would otherwise issue 200 HTTP calls. Non-blocking matters because a slow Next.js
build must never hold up an editor's save.

### 7.3 The ledger is append-only in spirit

**The rule.** A verified row may be corrected, but the correction leaves an audit
entry with before/after. Deleting a verified row requires `manage_options` and is
logged to `error_log` as well as the audit option.

**Why.** A published figure that changes silently is indistinguishable from one
that was wrong on purpose.

---

## Rules this codebase deliberately does not have

Stated so you do not add them:

- **No page builder.** The front end is code. A builder would let someone
  reintroduce a banned term after the CI gate ran.
- **No comments.** `comments_open` is false sitewide; a comments table on a
  beneficiary-facing site is a moderation liability with no upside.
- **No author archives.** They leak staff logins one post at a time.
- **No SVG uploads below admin.** An SVG can carry script.
- **No app passwords.** A per-user credential that bypasses MFA, on a site
  holding beneficiary records.
- **No file editor.** `DISALLOW_FILE_EDIT` — a compromised admin should not be
  able to become arbitrary PHP.
