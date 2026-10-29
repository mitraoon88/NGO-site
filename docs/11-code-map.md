# 11 · Code Map

**What this is:** for each file in `a2-core/`, what it does, the hooks it
attaches, and the decisions embedded in it that you would otherwise have to
reverse-engineer.

**How to use it:** find the file, read the row, then open the file. Every file
has a header comment that repeats the important part in more detail. This
document is the index; the files are the source.

**Reading order if you are new:** `a2-core.php` → `switches.php` → `cpt.php` →
`meta.php` → `rest.php`. That is the spine: bootstrap, gates, model, fields, API.
Everything else hangs off it.

---

## Bootstrap

### `a2-core.php` — 190 lines

The plugin entry point. Nothing else runs until this file is done.

| Does | Detail |
|---|---|
| Declares `strict_types` + namespace `A2\Core` | Every file in the plugin follows. |
| Guards on `ABSPATH` | Direct file access exits; there is no "if called directly" path. |
| **Version gate** | If PHP < 8.2 it shows an admin notice and returns instead of fataling halfway through a page render. A half-booted plugin is worse than a disabled one. |
| Defines `VERSION`, `SCHEMA`, `A2_CORE_PATH/URL/FILE/VERSION` | `SCHEMA` is bumped when the CPT/meta register changes. |
| **Config readers** | `frontend_origin()`, `revalidate_secret()`, `razorpay_key_id()`, `razorpay_key_secret()`, `razorpay_webhook_secret()`. All read a `wp-config.php` constant and fall back to a safe default. **Never a database option** — a secret in `wp_options` is a secret in every backup. |
| **Explicit boot order** | 14 `require_once` calls, ordered by dependency. `terms.php` first (no dependencies, used by everything); `switches.php` second (read by cpt/rest/contributions). |
| Activation hook | CPTs → taxonomies → roles → switch defaults → `flush_rewrite_rules()`. Order matters: rewrite rules cannot flush against unregistered types. |
| Deactivation hook | Deliberately keeps roles and switch state. A deactivate/reactivate cycle must not silently re-open a compliance switch. |
| `GET /a2/v1/health` | Version, PHP version, schema, switch states, metric snapshot freshness. The endpoint your uptime monitor polls. |

**Changed from Setu:** Setu had the same shape at 71 lines with 3 CPTs and no
gates. The version gate, the config accessors and the health payload are new.

---

## The gates

### `inc/switches.php` — 4 compliance switches

| Function | Does |
|---|---|
| `definitions()` | The four switches as data: `label`, `danger`, `trigger`, `default`. `trigger` is the **legal condition** required to enable it, and it is displayed in the admin so a future operator does not have to ask. |
| `install_defaults()` | Writes `false` for any key not already present. **Fails closed** — a new switch added in a future version appears OFF, not missing. |
| `enabled($key)` | `false` for an unknown key, so a typo in a caller is a closed gate rather than an open one. |
| `set($key, $bool, $reason)` | Capability check, capped 200-entry audit log, `error_log`, `do_action('a2_compliance_switch_changed')`, `wp_cache_flush()`. |
| `footer_disclosure()` | Returns the wording for the 80G switch. The footer renders it; the UI does not compose its own sentence. |

**Decision worth keeping:** the reason is mandatory. `set()` logs it; the admin
form refuses a reason under 10 characters. This is the difference between an
audit trail and a log file.

### `inc/terms.php` — the term charter, ×3

| Function / hook | Does |
|---|---|
| `charter()` | 15 rules, each `match` / `replacement` / `severity` / `why` / `ref`. The `why` and `ref` are shown to the editor — telling someone *what* not to write without *why* produces compliance, not understanding. |
| `scan($text)` | Whole-word, case-insensitive matching. Returns hits with replacement and reason. |
| `blocking_hits()` | Only `severity: block`. |
| `governed_post_types()` | 14 types. Layer 2 records are included — an internal field-report note still becomes public copy eventually. |
| `guard_save()` on `wp_insert_post_data` | **Enforcement 1.** Restores the previous `post_content` and `post_title`, stashes the hits in a transient. |
| `blocked_notice()` on `admin_notices` | **Enforcement 1b.** Lists match → replacement + why + §ref, and says "your previous copy is still live — nothing was lost". |
| `enqueue_editor_guard()` | **Enforcement 3.** Localises the same 15 rules into the block editor. |
| `GET /a2/v1/term-charter` | **Enforcement 2's data source.** Public (no secrets in it) so a CI box can read it before credentials exist. |

**Known limitation, stated in the file:** WordPress has no clean abort-save hook.
`wp_insert_post_data` cannot stop the write, only replace the payload. So layer 1
is "the bad copy does not go live" rather than "the save fails". Layers 2 and 3
are what make the rule hold. Do not upgrade this claim in a comment.

---

## The model

### `inc/cpt.php` — 26 post types

`register()` is a data table: one row per CPT with `layer`, `title`, `singular`,
`icon`, `supports`, `note`. `register_post_types()` **derives** five flags from
`layer`:

```
public              = layer === 1
publicly_queryable  = layer === 1
exclude_from_search = layer !== 1
show_in_rest        = layer === 1
rewrite             = layer === 1 ? slug : false
```

`layer_of($post_type)` is the accessor every other file uses.

`filter_sitemap_types()` removes every non-Layer-1 type from the XML sitemap.
WordPress would already exclude `public: false` types — the filter exists so the
intent survives a future mistake in the `public` flag.

**The 26, by layer** (full list with notes in the file):

- **L1 (8):** `a2_project`, `a2_drive`, `a2_zone`, `a2_temple_site`,
  `a2_collection_run`, `a2_processing_batch`, `a2_campaign`, `a2_certificate`
- **L2 (18):** `a2_task`, `a2_field_report`, `a2_attendance`, `a2_volunteer`,
  `a2_beneficiary`, `a2_enrollment`, `a2_student`, `a2_assessment`, `a2_product`,
  `a2_remittance`, `a2_asset`, `a2_expense`, `a2_contribution`, `a2_csr_lead`,
  `a2_grant`, `a2_resource_doc`, `a2_grievance`, `a2_document`

Note `a2_product` (Sacred Crafts) is Layer 2: §0.2(4) says non-public, noindex,
sitemap-excluded, and no public `/products` route exists.

### `inc/taxonomies.php` — 6 taxonomies

`register()` holds the taxonomy args **and the canonical terms**. `seed_terms()`
runs on `init` at priority 20 and inserts only what is missing, so it is
idempotent and needs no migration.

- `vertical` — hierarchical, 5 terms, public
- `service_zone` — hierarchical, 5 terms, public. North/Patia is `phase: planned` in the REST payload.
- `remnant_type` — flat, 5 terms, public
- `processing_status` — flat, 4 terms, **private** (internal state, no public archive)
- `skill` — flat, 7 terms, private
- `language` — flat, `en` / `or`, private (Polylang reads it)

### `inc/roles.php` — 9 roles

`matrix()` is the whole thing as data: `label`, `base` WP role, `scope` sentence,
`caps` to add, `deny` to remove.

`install_roles()` is additive — it adds missing caps and removes denied ones, but
never wipes a capability an administrator granted by hand. Re-running it is safe.

`capabilities()` lists all 21 custom caps so the administrator is never locked out
of their own platform.

`zones_for_user()` is the accessor `scoping.php` uses. Empty array = unrestricted,
and **only** for `manage_options` users.

**Design note:** caps are added on top of the base role rather than replacing it,
because replacing an editor's caps breaks the block editor in ways that are hard
to trace.

### `inc/scoping.php` — row-level isolation

Closes three doors, because a WordPress install hands you rows through more than
one:

| Door | Hook | What it does |
|---|---|---|
| Query loops | `pre_get_posts` | Adds a `tax_query` on `service_zone`. Zero zones → `post__in: [0]`. |
| A direct URL | `template_redirect` | `wp_die()` 403 if `can_access()` is false. |
| REST by ID | `rest_post_query` | Same tax_query, with `__none__` as the fail-closed term. |

`should_scope()` returns false for cron, WP-CLI, logged-out users and
`manage_options` — a scoped aggregate is a financial error, not a security
feature.

`can_access($post_id)` is the single predicate. Use it; do not invent a weaker
one.

`render_zone_field()` / `save_zone_field()` add the zone checkboxes to the user
profile — without them the scoping is unimplementable by an administrator.

### `inc/meta.php` — the field registry

`fields()` is the map: per post type, per key, `label` / `type` / `san` / `cap` /
`public` / `enum` / `note`.

`register_meta_fields()` calls `register_post_meta()` with:
- `show_in_rest` = **Layer 1 AND marked public** — so `a2_beneficiary` meta never reaches the public API even though the post type exists.
- `auth_callback` = the field's required capability. Per-field, not per-request: a compromised token cannot set `a2_verified_by`.
- `sanitize_callback` = `sanitize_field()` with the field's declared sanitiser.

`sanitize_field()` is one switch: `int`, `pct`, `float`, `bool`, `slug`,
`csv_slug`, `csv_int`, `enum`, `date`, `datetime`, `geo`, `text`.

`enforce_consent()` on `wp_insert_post_data` downgrades `a2_beneficiary` and
`a2_student` to draft without their consent fields, and names the missing field in
an admin notice. **No override exists** — deliberately, unlike the term charter.

---

## The ledger and the money

### `inc/metrics.php` — governed counters

`definitions()` — the four figures with `label`, `target`, `unit`, `source`,
`definition`. The `definition` sentence is rendered in the admin so the figure
explains itself.

`snapshot($fresh)` — computes all four, caches 15 min in a transient, filterable
so an audited figure can be published ahead of the rows.

`compute($key)` — the actual arithmetic:
- tonnes = Σ `a2_weight_kg` over **verified** runs ÷ 1000
- hours = Σ `a2_hours_verified`
- banking % = remittances with a `a2_transfer_ref` ÷ all remittances
- children = students with `a2_attendance_pct ≥ 60`

`format_value()` — `null` renders `—`. The `+` is appended **only** when the
actual clears the target. `148.6` renders `148.6`.

`invalidate()` on `a2_ledger_updated` and `a2_compliance_switch_changed`.

`GET /a2/v1/metrics`

### `inc/ledger.php` — `/transparency-log` read model

| Function | Does |
|---|---|
| `runs($args)` | Verified collection runs only, filtered by zone / date range, flattened. |
| `monthly($months)` | Direct SQL `GROUP BY DATE_FORMAT(...)`. `$wpdb->prepare` with an escaped `%%Y-%%m`, months clamped 1–36. Used because `WP_Query` cannot `GROUP BY` meta. |
| `split_8020($months)` | Remittance vs programme spend, aggregated. Month-granular so no Sevika is identifiable. |
| `verify_run($post_id)` | The one write that changes a public figure. Requires `a2_verify_ledger`, requires the row be in your zone, **requires a non-zero weight** (an empty row would count as zero and depress a published total). |
| `audit()` / `audit_entries()` | Capped 500-entry ring buffer in an option. |
| `log_update()` on `post_updated` | Logs a change to an already-verified row. |
| `log_delete()` on `before_delete_post` | Logs to the audit option **and** `error_log`. |
| `GET /a2/v1/ledger`, `POST /a2/v1/ledger/{id}/verify` | |

### `inc/contributions.php` — Voluntary Contributions

| Piece | Does |
|---|---|
| `deny_manual_creation()` on `map_meta_cap` | `create_posts` → `do_not_allow` unless `A2_GATEWAY_CONTEXT`. |
| `normalise_amount()` | Min ₹100 (a ₹1 intent is a card-testing probe that costs more in fees than it raises), max ₹1,00,000. |
| `create_intent()` | Gateway order → local record with status `created`. No money counted anywhere at this point. |
| `handle_webhook($raw_body, $signature, $secret)` | **The only path to `paid`.** HMAC-SHA256 over the raw body, `hash_equals`, amount equality against the stored intent, idempotent on payment ID. `payment.captured` / `authorized` → paid + `do_action('a2_contribution_paid')`; `failed` / `refund.processed` → their own transitions; unknown events return 200 so the gateway stops retrying. |
| `gateway_request()` | The only function that talks to a network API. |
| `POST /a2/v1/contribution-intent` | Checks `switches\enabled('contributions')` **first**, returns 503 with `a2_reason` when off. |
| `POST /a2/v1/gateway-webhook` | Passes `$request->get_body()`, never `get_json_params()`. |

---

## The API and the seam

### `inc/rest.php` — `a2/v1`

`card()` — the one listing shape. `envelope()` — the one pagination shape.
`listing()` — runs the query and returns the envelope. `tax_query_from()` — builds
a `tax_query` from request params without trusting their shape.

Routes: `/bootstrap`, `/programmes`, `/drives`, `/stories`, `/zones`,
`/documents`, `/grievance`, `/csr-enquiry`. (`/metrics`, `/ledger`,
`/term-charter`, `/health`, `/contribution-intent`, `/gateway-webhook`,
`/revalidate` live in their own files.)

`cors_headers()` removes WordPress's default CORS filter and replaces it with one
that echoes a single configured origin plus `Vary: Origin`.

`rate_limit($bucket, $limit, $window)` — per route, per IP.

**`/documents` returns no file URL.** The download is lead-captured; exposing the
URL would make the gate decorative.

### `inc/revalidate.php` — the Next.js seam

`on_save` / `on_delete` / `on_switch` / `on_ledger` collect paths into a
transient; `flush_queue()` on `shutdown` sends them **once**, non-blocking, capped
at 40, with `X-A2-Secret`.

`POST /a2/v1/revalidate` lets you test the seam without publishing anything; paths
are regex-validated to `^/[A-Za-z0-9\-_/?=.]*$` so the endpoint cannot be used to
make the front end fetch an attacker's origin.

### `inc/security.php` — the baseline

Nine groups, each a default-off decision:

1. **Attack surface** — XML-RPC off including `pingback.ping`; `X-Pingback` removed.
2. **User enumeration** — `?author=` 301s home, `/wp/v2/users` unset logged-out, author archives 301, `rest_user_query` restricted to self.
3. **Content surface** — comments and pings closed sitewide; generator removed.
4. **Uploads** — `big_image_size_threshold` 4000; SVG only for `manage_options`; an admin notice when a featured image has no alt text.
5. **Capabilities** — `unfiltered_html` denied below admin; application passwords disabled.
6. **Headers** — `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`. **CSP is deliberately not set here** — the Next.js front end owns that header, and a second weaker policy from WordPress would only cover wp-admin while creating a false sense of coverage.
7. **Login** — one generic error (no username oracle); Sevikas redirected off wp-admin.
8. **File editor** — `DISALLOW_FILE_EDIT`.

---

## The operator's view

### `inc/admin.php` — four screens

| Screen | Capability | Shows |
|---|---|---|
| Overview | `a2_view_metrics` | The four figures with their target and as-of date, a card that looks visually "empty" when there are no rows, the switch states with their legal triggers, and the count of runs waiting for verification. |
| Compliance | `a2_manage_switches` | Each switch with the condition required to enable it, a mandatory reason field, and the change log. |
| Ledger | `a2_view_ledger` | Unverified runs. Shows "Other zone" or "Read only" instead of a button where the action is not permitted, and "Enter weight first" when the row cannot be verified yet. |
| Audit log | `a2_view_audit_log` | Switch changes and corrections to published figures, with a before/after diff. |

### `assets/js/term-charter.js` — editor guard

Reads `window.A2TermCharter.terms` (localised from `terms.php`), scans the block
text plus the title, and renders:
- a document panel listing match → replacement + why + §ref,
- a sidebar notice counting blocked terms.

**It never blocks typing.** Disabling the publish button mid-sentence teaches an
editor to hate the CMS and nothing about the rule. The server-side and CI layers
are what enforce.

### `assets/css/admin.css`

Plain, high-contrast admin styling. Colour is never the only signal — every state
also has a word (`ON` / `OFF`). 44 px minimum targets. The focus ring is the same
token as the front end. Tokens are hard-coded here rather than imported, because
wp-admin must keep working if the theme is switched.

---

## Dependency graph

```
a2-core.php
 ├── inc/terms.php ......... no deps
 ├── inc/switches.php ...... no deps
 ├── inc/cpt.php ........... no deps  (layer_of() used by meta, rest, revalidate)
 ├── inc/taxonomies.php .... no deps
 ├── inc/roles.php ......... cpt (scoped_post_types lives in scoping)
 ├── inc/scoping.php ....... cpt, roles
 ├── inc/meta.php .......... cpt (layer_of)
 ├── inc/metrics.php ....... cpt, meta
 ├── inc/ledger.php ........ cpt, meta, metrics, scoping
 ├── inc/contributions.php . switches, metrics, meta
 ├── inc/rest.php ........... cpt, metrics, ledger, switches
 ├── inc/security.php ...... —
 ├── inc/revalidate.php .... cpt
 └── inc/admin.php ......... metrics, ledger, switches, roles, scoping
```

No file requires another at runtime — the boot order is for the `init` hook
priorities, not for `require`. A file that needed a `require` would indicate a
namespace mistake.
