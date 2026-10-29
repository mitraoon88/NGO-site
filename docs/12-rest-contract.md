# 12 · REST Contract — `a2/v1`

**Rule:** these shapes are a contract. The front end types against them. A field
is never renamed or removed without bumping the namespace to `a2/v2` and
supporting both during a transition.

**Base:** `https://wp.a2foundation.in/wp-json/a2/v1`

**Why flat:** WordPress's default post document contains `_embedded`, `_links`,
and a `rendered`/`raw`/`protected` triple for every text field. A React component
wants `{ title, href, excerpt, image }`. Flattening at the source means no mapper
to keep in sync, no three-level null-guarding, and — importantly — no field
leaking into the public API because nobody meant to publish it.

---

## Route index

| Method | Route | Auth | Returns |
|---|---|---|---|
| GET | `/health` | public | version, PHP, schema, switch states |
| GET | `/bootstrap` | public | metrics + programmes + drives + zones + switches in one call |
| GET | `/metrics` | public | the four governed figures |
| GET | `/programmes` | public | paginated programme cards |
| GET | `/drives` | public | paginated drive cards |
| GET | `/stories` | public | paginated consented stories |
| GET | `/zones` | public | the five zones with phase |
| GET | `/ledger` | public | verified runs, monthly aggregate, 80/20 split |
| GET | `/documents` | public | data-room cards, **no file URLs** |
| GET | `/term-charter` | public | the 15 rules (CI reads this) |
| POST | `/grievance` | public, rate-limited | ticket ID |
| POST | `/csr-enquiry` | public, rate-limited | `{ received: true, stage: "eoi" }` |
| POST | `/contribution-intent` | public, switch-gated | gateway order |
| POST | `/gateway-webhook` | HMAC signature | acknowledgement |
| POST | `/ledger/{id}/verify` | `a2_verify_ledger` | `{ verified: true }` |
| POST | `/revalidate` | `edit_posts` | `{ queued: [...] }` |

All GETs are public because `post_status` governs exposure. Layer 2 and Layer 3
post types are not in the REST surface at all (`show_in_rest: false`), so there is
no authenticated variant of `/programmes` that reveals more.

---

## The card shape

Every listing returns this, inside an envelope. One component contract.

```jsonc
{
  "id": 412,
  "slug": "heritage-care-old-town",
  "title": "Heritage Care — Old Town Core",     // plain text, tags stripped
  "excerpt": "Daily interception across seven shrines…",
  "href": "https://wp.a2foundation.in/heritage-care-old-town/",
  "image": {
    "src": "https://wp.a2foundation.in/wp-content/uploads/2026/10/drive.jpg",
    "alt": "Volunteers sorting floral offerings at a shrine courtyard",
    "width": 1200,
    "height": 800
  },                                             // or null
  "date": "2026-10-27T13:30:00+00:00",           // ISO 8601, render in <time datetime>
  "tags": ["heritage-care", "south-old-town"],   // vertical + zone + remnant_type slugs
  "meta": { "progress_pct": "68", "zone_slugs": "south-old-town" }
}
```

`image` is `null` when there is no featured image — the component handles it. It
is never an empty object, so `card.image?.src` is a complete guard.

`meta` keys have the `a2_` prefix stripped. Values are WordPress meta strings
unless the field is registered as `integer`/`number`/`boolean` in
`inc/meta.php`, in which case they arrive typed.

## The envelope

```jsonc
{ "items": [ /* cards */ ], "total": 42, "page": 1, "per_page": 12, "pages": 4 }
```

`total` is present so the UI can render "of N" without a second `HEAD` request.

---

## `GET /metrics`

```jsonc
[
  {
    "key": "metric_tons_diverted",
    "value": "148.6",          // formatted, no "+" unless the target is cleared
    "raw": 148.6,              // null when there are no source rows
    "label": "Metric Tons Diverted",
    "target": "150+",          // ALWAYS render this beside the value
    "as_of": "2026-10-29",
    "has_data": true
  },
  { "key": "compliance_hours",   "value": "—", "raw": null, "has_data": false, … },
  { "key": "direct_banking_pct", "value": "100%", … },
  { "key": "children_sustained",  "value": "62+", … }
]
```

**Render rules, non-negotiable (rulebook §5.5):**

1. Never display `value` without `target`, labelled `Target — Year 1`.
2. `has_data: false` → the design renders an em-dash state, not `0`.
3. Never append a `+` client-side. The server appends it only when the actual
   clears the target; a client-side `+` turns 148.6 into a false claim.
4. Never cache past `as_of` + 15 minutes. `?fresh=true` bypasses the server cache.

Cached 15 minutes; invalidated on any ledger write.

---

## `GET /ledger`

```jsonc
{
  "runs": [
    {
      "id": 912,
      "date": "2026-10-27",
      "zone": "south-old-town",
      "weight_kg": 1840.5,
      "baskets": 42,
      "temples_covered": 7,
      "remnant_type": "terracotta-floral",
      "verified_at": "2026-10-27T18:00:00+00:00",
      "href": "…"
    }
  ],
  "monthly": [ { "month": "2026-10", "weight_kg": 1840.5, "runs": 1 } ],
  "split": {
    "remittance_inr": 480000,
    "programme_inr": 120000,
    "total_inr": 600000,
    "remittance_pct": 80.0
  }
}
```

**Only verified runs appear.** A run with `a2_verified` unset is not in this
payload, not in `/metrics`, and not in any export. `verified_at` is the audit
anchor: it is the timestamp an auditor will ask for.

Query: `?zone=`, `?from=`, `?to=` (ISO dates), `?limit=` (1–200), `?months=` (1–36).

`split` is month-aggregated on purpose. It never contains a named remittance.

---

## `GET /bootstrap`

One call for the homepage, so the LCP path is one request:

```jsonc
{
  "metrics": [ /* as /metrics */ ],
  "programmes": { "items": [...], "total": 3, … },   // 3 cards
  "drives":     { "items": [...], … },                // next 3 upcoming
  "zones":      [ /* as /zones */ ],
  "switches":   { "80g": false, "fcra": false, "csr_grant": false, "contributions": false },
  "generated_at": "2026-10-29T05:00:00+00:00"
}
```

`switches` is included so the front end can hide a "80G receipts" block without a
second request. It is a read of the same gate the server enforces — hiding the
block is presentation; the server refusal is the actual protection.

---

## `GET /zones`

```jsonc
[
  { "slug": "south-old-town",   "name": "South (Old Town Core)",      "phase": "active",   "count": 12 },
  { "slug": "central-unit",     "name": "Central (Unit Area Hub)",    "phase": "active",   "count": 8  },
  { "slug": "east-rasulgarh",   "name": "East (Rasulgarh Corridor)",  "phase": "active",   "count": 5  },
  { "slug": "west-nayapalli",   "name": "West (Nayapalli Cluster)",   "phase": "active",   "count": 3  },
  { "slug": "north-patia",      "name": "North (Patia Corporate Line)","phase": "planned", "count": 0  }
]
```

`phase: "planned"` must render differently from `active` — the blueprint makes
the Patia zone a Year-2 line, and a map dot that looks identical to a live zone is
a misrepresentation.

---

## `GET /documents`

```jsonc
[
  {
    "id": 77,
    "title": "Corporate Prospectus 2026–27",
    "label": "PDF · 3.2 MB · audited",
    "bytes": 3355443,
    "size": "3.2 MB",
    "audited": true,
    "gated": true
  }
]
```

**There is no `url` field, deliberately.** The download is lead-captured (§6.6):
the front end POSTs the enquiry, the server issues a short-lived signed URL. Adding
a `url` here would make the gate decorative.

---

## `GET /term-charter`

```jsonc
{
  "rules": [
    {
      "match": "waste",
      "replacement": "Sacred Remnant / Pushpa / Nirmalya",
      "severity": "block",
      "why": "The material is a sacred offering, not refuse.",
      "ref": "§0.2(6)"
    }
  ]
}
```

Public because it holds no secrets and the CI lint must read it on a box with no
credentials. `validation/check-term-charter.mjs` reads the same rules from the
token module — if the two drift, the PHP side is authoritative for saved content
and the JS side for shipped content, and both must agree. They are maintained
together; see `inc/terms.php › charter()`.

---

## `POST /grievance`

```jsonc
// request
{ "body": "The bin outside the east gate has not been emptied since Tuesday…", "anonymous": true }

// 200
{ "ticket_id": "A2-261029-K7M2Q", "status": "received" }

// 422 — under 20 characters
{ "code": "a2_too_short", "message": "Please describe the issue in at least 20 characters.", "data": { "status": 422 } }

// 429 — more than 5/hour from this IP
{ "code": "a2_rate_limited", "message": "Too many submissions. Please try later.", "data": { "status": 429 } }
```

Only the ticket ID is returned. No internal post ID, no author. Status is then
looked up by ticket ID via the public status route.

---

## `POST /contribution-intent`

```jsonc
// request
{ "amount_inr": 2500, "consent_ref": "consent-2026-10-29-8f2a", "email": "a@b.in" }

// 200 — gateway order created; NO money counted yet
{ "order_id": "order_Nx1...", "key_id": "rzp_live_...", "amount": 2500, "currency": "INR", "status": "created" }

// 503 — the compliance switch is off (the expected state pre-registration)
{
  "code": "a2_contributions_off",
  "message": "Voluntary contributions are not open yet. You can register interest instead.",
  "data": { "status": 503, "a2_reason": "compliance_switch_off" }
}

// 422
{ "code": "a2_amount_too_low", "message": "The minimum voluntary contribution is ₹100." }
```

**The front end must handle 503 as a first-class state**, not an error toast. The
CTA becomes "Register your interest" and posts to `/csr-enquiry` instead.

`status: "created"` means an intent exists. It does **not** mean a contribution
has been received. Only the webhook moves a record to `paid`.

---

## `POST /gateway-webhook`

Called by Razorpay, not by the browser. `X-Razorpay-Signature` is HMAC-SHA256 over
the raw body.

```jsonc
// 200
{ "received": true, "ok": true, "post_id": 1203 }

// 400
{ "code": "a2_webhook_rejected", "message": "signature mismatch", "data": { "status": 400 } }
```

Unknown event types return **200** so the gateway stops retrying. A non-2xx there
causes an infinite retry storm against your server.

---

## Error shape

WordPress's standard `WP_Error` shape:

```jsonc
{ "code": "a2_forbidden", "message": "You cannot verify ledger rows.", "data": { "status": 403 } }
```

Codes used by this plugin: `a2_forbidden`, `a2_not_a_run`, `a2_out_of_zone`,
`a2_no_weight`, `a2_amount_too_low`, `a2_amount_too_high`, `a2_contributions_off`,
`a2_consent_required`, `a2_webhook_rejected`, `a2_rate_limited`, `a2_too_short`,
`a2_invalid`, `a2_bad_paths`, `a2_gateway_unconfigured`, `a2_gateway_error`.

Handle `a2_contributions_off` explicitly — it is the only "error" that is the
normal operating state.

---

## Client example

```ts
// apps/web/lib/wp.ts
const BASE = process.env.WP_API_URL ?? 'https://wp.a2foundation.in/wp-json/a2/v1';

type Card = {
  id: number; slug: string; title: string; excerpt: string; href: string;
  image: { src: string; alt: string; width: number; height: number } | null;
  date: string; tags: string[]; meta: Record<string, string>;
};

async function get<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const getBootstrap = () => get<Bootstrap>('/bootstrap', 60);
export const getMetrics   = () => get<Metric[]>('/metrics', 300);
export const getLedger    = () => get<Ledger>('/ledger', 300);
```

`next: { revalidate }` is the second cache layer behind the plugin's own 15-minute
transient. Two layers is intentional: the transient protects the database from a
traffic spike, the fetch cache protects the WordPress host.
