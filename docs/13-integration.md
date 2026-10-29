# 13 · Integration Guide

**Audience:** the developer putting this onto the A2 Foundation website.
**Assumes:** you can run `wp`, `composer` and `npm`, and you have shell access to
the host that will run WordPress.

**Outcome when you finish:** a running WordPress install with `a2-core` active,
a Next.js front end reading `a2/v1`, the ten governance checks passing, and four
compliance switches correctly OFF.

Work through the steps in order. Steps 1–5 are one sitting. Step 6 depends on a
client decision and is the only step that may need a conversation.

---

## 0 · What you are installing

Two halves:

```
WordPress (private, wp.a2foundation.in)     Next.js (public, a2foundation.in)
├── a2-core plugin   ← all business logic   ├── renders a2/v1 JSON
│   ├── 26 CPTs, 6 taxonomies               ├── owns CSP + all public headers
│   ├── 9 roles + zone scoping              ├── static, on-demand ISR
│   ├── term charter (×3)                   └── consumes brand/khandolite.css
│   ├── ledger + governed metrics
│   ├── contributions + HMAC webhook
│   ├── compliance switches
│   └── a2/v1 REST
└── a2-ekamra theme  ← presentation only
```

The split is blueprint §11.1: **all business logic in `a2-core`, nothing in
`functions.php`.** If you find yourself adding a filter to a theme file, the
logic belongs in the plugin.

`a2-core` is a complete, self-contained plugin. You can install it on an existing
WordPress site without touching the theme, and check the REST surface before the
front end exists. Do that first — it is the fastest way to know the install is
sound.

---

## 1 · Requirements

| Component | Minimum | Notes |
|---|---|---|
| PHP | 8.2 | The plugin version-gates and shows a notice below this rather than fataling. 8.3 recommended. |
| WordPress | 6.4 | `register_post_meta` with typed schema, `wp_sitemaps_post_types`. |
| MySQL / MariaDB | 5.7 / 10.4 | `utf8mb4`. Odia text needs it. |
| Node | 18.17 | Next.js 14. |
| HTTPS | required | Razorpay webhooks and secure cookies. |

PHP extensions: `mbstring` (Odia string lengths), `json`, `curl`, `intl`
(recommended for `number_format_i18n` on Devanagari/Odia numerals).

---

## 2 · Install WordPress and the plugin

```bash
# 1. WordPress core somewhere private, e.g. /var/www/a2-wp
wp core download --path=/var/www/a2-wp --locale=en_IN

# 2. Config — see step 3 for the constants that matter
wp config create --path=/var/www/a2-wp \
  --dbname=a2 --dbuser=a2 --dbpass='<strong>' --dbhost=localhost \
  --extra-php <<'PHP'
define('DISALLOW_FILE_EDIT', true);
define('WP_AUTO_UPDATE_CORE', 'minor');
define('AUTOMATIC_UPDATER_DISABLED', false);
PHP

# 3. Install
wp core install --path=/var/www/a2-wp \
  --url='https://wp.a2foundation.in' \
  --title='A2 Foundation' --admin_user=a2admin \
  --admin_email='web@a2foundation.in' --skip-email

# 4. The plugin
cp -r a2-core /var/www/a2-wp/wp-content/plugins/
wp plugin activate a2-core --path=/var/www/a2-wp
```

**Verify the install before going further.** This is the cheapest possible test:

```bash
curl -s https://wp.a2foundation.in/wp-json/a2/v1/health | jq
```

Expect:

```json
{
  "ok": true,
  "version": "0.1.0",
  "php": "8.3.x",
  "schema": "1",
  "switches": { "80g": false, "fcra": false, "csr_grant": false, "contributions": false },
  "metrics_cached_at": null
}
```

If `ok` is false, the `reason` field says why. **All four switches must be
`false`.** If any is `true` on a fresh install, stop and report it — that is the
one failure mode with legal consequences.

Then check the model:

```bash
# 26 post types
curl -s 'https://wp.a2foundation.in/wp-json/a2/v1/bootstrap' | jq '.zones | length'   # → 5

# The term charter is readable without auth (CI needs this)
curl -s 'https://wp.a2foundation.in/wp-json/a2/v1/term-charter' | jq '.rules | length'  # → 15

# Metrics render "—" with no rows. This is correct.
curl -s 'https://wp.a2foundation.in/wp-json/a2/v1/metrics' | jq '[.[].value]'  # → ["—","—","—","—"]
```

---

## 3 · `wp-config.php` constants

The plugin reads **constants only, never database options.** A secret in
`wp_options` is a secret in every backup and every `wp db export`.

Add to `wp-config.php`, above the `/* That's all, stop editing! */` line:

```php
/* ── A2 Core ─────────────────────────────────────────────────────────────── */

/**
 * The ONE origin allowed to call a2/v1 from a browser.
 * Local dev is http://localhost:3100; production is the public site.
 * Must match exactly — scheme, host, port, no trailing slash.
 */
define('A2_FRONTEND_ORIGIN', 'https://a2foundation.in');

/** Shared secret for on-demand ISR. Generate: openssl rand -hex 32 */
define('A2_REVALIDATE_SECRET', '<64 hex chars>');

/**
 * Gateway credentials. Leave UNDEFINED until the contributions compliance
 * switch is legitimately ON — the accessors return '' and every entry point
 * refuses cleanly, which is the desired behaviour before registration.
 */
// define('A2_RAZORPAY_KEY_ID', 'rzp_live_...');
// define('A2_RAZORPAY_KEY_SECRET', '...');
// define('A2_RAZORPAY_WEBHOOK_SECRET', '...');
```

Do not put these in `.env` and load them with a library — `wp-config.php` is the
one file the WordPress hardening guides tell you to protect, and one place to
protect is enough.

### Where each is read

| Constant | Read by | If absent |
|---|---|---|
| `A2_FRONTEND_ORIGIN` | `frontend_origin()` | `http://localhost:3100` |
| `A2_REVALIDATE_SECRET` | `revalidate_secret()` | revalidation silently no-ops |
| `A2_RAZORPAY_*` | gateway accessors | contributions return `503` |

---

## 4 · CORS

One origin, echoed, with `Vary: Origin`. Set it once:

```php
define('A2_FRONTEND_ORIGIN', 'https://a2foundation.in');
```

The plugin **removes WordPress's default `rest_send_cors_headers`** and installs
its own. If you add a second CORS layer at the nginx level, make sure it does not
send a wildcard — two `Access-Control-Allow-Origin` headers is a hard browser
error, and `*` plus cookies is a vulnerability.

Test it:

```bash
curl -s -D- -o/dev/null \
  -H 'Origin: https://a2foundation.in' \
  https://wp.a2foundation.in/wp-json/a2/v1/metrics | grep -i 'access-control\|vary'
```

Expect exactly:

```
Access-Control-Allow-Origin: https://a2foundation.in
Access-Control-Allow-Credentials: true
Vary: Origin
```

Then confirm a hostile origin gets nothing:

```bash
curl -s -D- -o/dev/null -H 'Origin: https://evil.example' \
  https://wp.a2foundation.in/wp-json/a2/v1/metrics | grep -ci 'access-control-allow-origin'
# → 0
```

---

## 5 · The environment seam

The front end reads WordPress through one module, and falls back to mock data
when WordPress is unreachable. That fallback is why you can develop with no
backend running.

```
apps/web/lib/wp.ts
  const WP = process.env.WP_API_URL ?? 'https://wp.a2foundation.in/wp-json/a2/v1'
  ── getMetrics()      → /metrics
  ── getBootstrap()    → /bootstrap
  ── getLedger()       → /ledger
  ── getProgrammes()   → /programmes?vertical=
  ── getDrives()       → /drives?upcoming=1
  ── getDocument(url)  → POST /document-request   (lead-gated download)
```

`apps/web/.env.local`:

```bash
WP_API_URL=https://wp.a2foundation.in/wp-json/a2/v1
NEXT_PUBLIC_SITE_URL=https://a2foundation.in
A2_REVALIDATE_SECRET=<same value as wp-config>
```

**Rule:** the front end never calls WordPress from the browser. Every fetch is
server-side (RSC / route handler) or through a Next route that proxies it. This
keeps `A2_FRONTEND_ORIGIN` meaningful and stops the WordPress host from being
exposed to client IPs.

### The revalidation route

`apps/web/app/api/revalidate/route.ts` must:

```ts
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

export async function POST(req: Request) {
  const given = req.headers.get('x-a2-secret') ?? '';
  const want = process.env.A2_REVALIDATE_SECRET ?? '';

  // Length check first: timingSafeEqual throws on a length mismatch.
  const ok =
    given.length === want.length &&
    want.length > 0 &&
    timingSafeEqual(Buffer.from(given), Buffer.from(want));

  if (!ok) return new Response('forbidden', { status: 403 });

  const { paths } = await req.json();
  for (const p of Array.isArray(paths) ? paths : []) {
    if (typeof p === 'string' && p.startsWith('/')) revalidatePath(p);
  }
  return Response.json({ revalidated: paths?.length ?? 0 });
}
```

Note `timingSafeEqual` — the plugin uses `hash_equals()` on its side for the same
reason. Do not replace either with `===`.

---

## 6 · Merge the design system (the one step that needs a decision)

The shipped page currently carries Phase-3 placeholder copy. Two things must be
retargeted before this can go live.

### 6.1 Swap the palette

`brand/tokens.css` and `brand/tailwind.preset.ts` are the **old mockup palette**
(cream `#FBF7F0`, forest `#11231B`, rust `#AB3D24`, gold `#C9A961`, sand
`#E8DBC4`, ink `#1C1C1A`). They are superseded by `brand/khandolite.css` and
`brand/khandolite.tailwind.preset.mjs`.

The preset ships a migration table:

| Old name | Khandolite name | Note |
|---|---|---|
| `rust` | `terracotta` | and `terracotta-deep` for text under 24 px |
| `gold` | `marigold` | dark surfaces only |
| `forest` | `charcoal` | |
| `sand` | `line-sand` | |
| `cream` | `cream` | value changed: `#FBF7F0` → `#FDFBF7` |
| `ink` | `charcoal` | |

Procedure:

```bash
cd apps/web
grep -rn "bg-rust\|text-rust\|border-rust\|bg-gold\|bg-forest\|border-sand" --include=*.tsx | wc -l
# Replace, then:
cd ../.. && node validation/check-khandolite.mjs
node validation/contrast-audit.mjs
```

Then retire the old files: delete `brand/tokens.css` and
`brand/tailwind.preset.ts` so nobody imports them again.

### 6.2 Replace the copy with locked copy

`apps/web/content/home.ts` must render `lockedCopy` from
`khandolite.tokens.mjs` verbatim:

| Field | Must become |
|---|---|
| H1 | `Preserving Sacred Sanctity. Incubating Grassroots Dignity.` |
| Sub | the full `Under the voluntary banner…` paragraph |
| CTA primary | `Explore Our Seva Ecosystem` |
| CTA secondary | `Access Corporate CSR Portal` |
| Footer | `A2 Foundation is a voluntary initiative; statutory registration is in process. Contributions are voluntary and currently carry no section 80G tax benefit.` |

And four specific defects in the current content:

1. **`Donate Now` → `Support the Mission`.** ⚖ "Donate" is a blocked term.
2. **Hand-typed metrics (138–141, 202, 253) → the `/a2/v1/metrics` payload.** The
   numbers must be derived, and each renders with `Target — Year 1` beside it.
3. **`worker` → `Sevika`** (`home.ts:105`).
4. **The metric figures must never carry a `+`** unless the derived value clears
   its target — `metrics.php › format_value()` already enforces this server-side;
   do not re-add one in JSX.

When done:

```bash
node validation/check-term-charter.mjs   # must exit 0
```

---

## 7 · Configure the admin

```bash
# 1. Assign the zones first. Scoping fails closed — a scoped user with no
#    zone sees NOTHING, which will look like a broken install if you skip this.
wp user meta update <ops-coordinator-id> a2_zone_scope \
  '["south-old-town","central-unit"]' --format=json

# 2. Confirm the roles exist
wp role list --fields=name,role | grep a2_

# 3. Confirm every switch is OFF
wp option get a2_compliance_switches --format=json
# → {"80g":false,"fcra":false,"csr_grant":false,"contributions":false}
```

Then, in **A2 Platform → Overview**: all four metric cards should show `—` with
the note "No source rows yet — the site renders '—' rather than a figure". That
is the correct first-run state. It is not a bug, and it must not be "fixed" by
seeding a plausible number.

---

## 8 · Seed content (optional, dev only)

WordPress will have no content. To see the page with data:

```bash
# Create one zone and one verified collection run
wp post create --post_type=a2_collection_run --post_status=publish \
  --post_title='Run 2026-10-27 South' \
  --meta_input='{"a2_run_date":"2026-10-27","a2_zone_slug":"south-old-town","a2_weight_kg":1840.5,"a2_baskets":42,"a2_temples_covered":7,"a2_verified":1,"a2_verified_at":"2026-10-27T18:00:00+05:30"}'

curl -s https://wp.a2foundation.in/wp-json/a2/v1/metrics | jq '.[0]'
# → { "key": "metric_tons_diverted", "value": "1.8", ... }
```

**Do not run this against production.** A verified run is a published figure; a
seeded figure on a live site is a false claim, which is the exact thing
`metrics.php` exists to prevent.

---

## 9 · The ten checks

Run all of these before you say the integration is done. Each is a hard gate.

```bash
# ── PHP ─────────────────────────────────────────────────────────────────────
find a2-core -name '*.php' -exec php -l {} \; | grep -v 'No syntax errors'
# → no output

# ── Design system ───────────────────────────────────────────────────────────
node validation/contrast-audit.mjs      # 23/23 pairs, exit 0
node validation/check-khandolite.mjs    # no drift, exit 0
node validation/gen-theme-json.mjs      # regenerates a2-ekamra/theme.json

# ── Copy ────────────────────────────────────────────────────────────────────
node validation/check-term-charter.mjs  # exit 0 (fails until step 6 is done — by design)

# ── Front end ───────────────────────────────────────────────────────────────
cd validation/harness
node a11y-audit.mjs        # 40 pass / 0 fail, focus ring 55 stops / 0 blind
node ux-audit.mjs          # 19/19
node final-gate.mjs        # 123 pass / 1 warn (the warn is documented)
node fidelity.mjs          # 17 rows / 0 drift

# ── Whole thing ─────────────────────────────────────────────────────────────
bash validation/signoff-phase3.sh     # EXIT=0
```

`check-term-charter.mjs` will fail until step 6. That is intentional: it is the
gate catching the placeholder copy, and it should stay red until the copy is
replaced — not be commented out.

---

## 10 · Go-live checklist

- [ ] `a2/v1/health` returns `ok: true` and **all four switches `false`**
- [ ] `A2_FRONTEND_ORIGIN` matches the production origin exactly, no trailing slash
- [ ] CORS verified from the real origin, and refused from a hostile one
- [ ] `A2_REVALIDATE_SECRET` set in **both** `wp-config.php` and `.env.production`
- [ ] Gateway constants **absent** unless the `contributions` switch is legitimately on
- [ ] Every scoped user has at least one zone (fail-closed means they otherwise see nothing)
- [ ] Metrics render `—`, not a number, until real verified rows exist
- [ ] `check-term-charter.mjs` exits 0
- [ ] The footer disclosure line is present on every page
- [ ] `wp db export` taken **before** the first real ledger verification
- [ ] Redirects live: `/impact/` → 301 → `/dashboard/`
- [ ] CSP is set by Next.js, not by WordPress, and covers `frame-ancestors 'none'`

---

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Health says `ok: false, reason: php` | PHP < 8.2 | Upgrade. The plugin deliberately does not run. |
| CORS preflight fails | Two `Access-Control-Allow-Origin` headers | Remove the nginx/proxy one; the plugin sets it. |
| A coordinator sees nothing | Fail-closed with no zones assigned | Assign `a2_zone_scope` (step 7). |
| Metrics show `—` forever | No **verified** runs | Verify a run in A2 Platform → Ledger. Unverified rows do not count. |
| Webhook returns 400 | Signature computed over re-encoded JSON | Pass the raw body. See `handle_webhook()`. |
| Editor saves but the body reverts | Term charter blocked it | Read the admin notice; it names the term and the replacement. |
| `check-term-charter.mjs` fails | Placeholder copy still live | Step 6. Do not weaken the script. |
| Revalidation does nothing | `A2_REVALIDATE_SECRET` empty or mismatched | The failure is silent by design; check both sides. |
| A profile field edit is ignored | Nonce or `a2_zone_scope_present` missing | The hidden input is required to distinguish "none selected" from "form not submitted". |

---

## Support surface

If you have to change something not covered here, the header comment on the file
that owns the behaviour explains why it is the way it is. That is deliberate: this
codebase is meant to be handed to an in-house developer, not maintained by its
author.

Files with the most decision-density, in order:

1. `inc/terms.php` — the three-layer enforcement and its stated limitation
2. `inc/contributions.php` — money, signatures, idempotency
3. `inc/metrics.php` — why every figure is derived and why `—` is a feature
4. `inc/scoping.php` — the three doors, and failing closed
5. `inc/cpt.php` — why `public` is derived, never written
