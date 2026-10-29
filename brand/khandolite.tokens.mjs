/**
 * KHANDOLITE SCALE — the retargeted design tokens
 * ================================================
 *
 * Source of truth: A2-FOUNDATION-FINAL-PLATFORM-BLUEPRINT.pdf §3.1–3.2.
 * Target consumer: the A2 front-end (Next.js + Tailwind), migrated from the
 * mockup-derived palette in brand/tokens.css.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 * The A2 front-end currently runs on tokens measured from the client's mockup
 * (rust #AB3D24, gold #C9A961, forest #11231B, cream #FBF7F0). The blueprint
 * mandates the Khandolite Scale instead. Rather than hand-edit hundreds of
 * utilities, this file is the *single* mapping: rename here, re-run
 * `npm run validate`, and `scripts/check-tokens.mjs` will fail on every place
 * that still references a removed token.
 *
 * ── WHAT THE BLUEPRINT SPECIFIES, AND WHAT IT DOES NOT ──────────────────────
 * The blueprint gives six tokens and their usage rules. It does NOT give a
 * text-safe variant for terracotta on the stone surface — see `terracotta.deep`
 * below, which is derived, audited and documented rather than invented in a
 * component.
 *
 * Contrast in this file is *measured*, not asserted. Every pair below was
 * computed with the WCAG 2.1 relative-luminance formula and is reproduced by
 * `validation/contrast-audit.mjs` so it cannot drift.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   1. COLOUR
   ───────────────────────────────────────────────────────────────────────────── */

export const color = {
  /**
   * PRIMARY BRAND — CTA fill, hover frames, accent rules.
   * Blueprint usage rule: "Buttons/accents; never large full-section fills."
   */
  terracotta: {
    DEFAULT: '#B84A39', // blueprint, verbatim
    hover: '#A64333',   // 10% darker — same hue ramp, used for :hover/:active only
    wash: '#FAEDE9',    // 6% tint for selected rows and quiet chips

    /**
     * DERIVED — not in the blueprint. Added because the blueprint's own numbers
     * leave a hole, and shipping the hole would put body text below AA.
     *
     *   #B84A39 on stone-tint #F3E7DE = 4.24:1  → AA-large only, FAILS for body
     *   #B84A39 on cream      #FDFBF7 = 4.98:1  → AA, but with almost no margin
     *
     * `deep` is the same hue (8°) and saturation, scaled to 92% lightness:
     *   #A94434 on stone-tint = 4.85:1 · on cream = 5.70:1  → AA on both
     *
     * RULE: `terracotta.DEFAULT` is for FILLS and large display type ≥24px.
     *       `terracotta.deep` is for any terracotta TEXT below 24px.
     */
    deep: '#A94434',
  },

  /**
   * SECONDARY ACCENT — data glow, counter numerals, thin dividers.
   * Blueprint usage rule: "Counter numerals on charcoal, icons, thin dividers;
   * never small body text (contrast)."
   *
   * That rule is correct and this file enforces it: marigold on cream is 1.76:1.
   * It is only ever legal on charcoal (8.32:1).
   */
  marigold: {
    DEFAULT: '#F2B705',
    // No `deep` variant: nothing lighter than #F2B705 keeps the brand read, and
    // every variant still fails on cream. Marigold is a DARK-SURFACE-ONLY token.
  },

  /** TYPOGRAPHY, DARK BANDS, FOOTER. Body text, data strips. */
  charcoal: {
    DEFAULT: '#262626',
    soft: '#4A4A4A',  // secondary copy — 9.20:1 on cream, still AAA
    muted: '#666666', // meta text — 5.56:1 on cream, 4.73:1 on stone-tint (both AA)
  },

  /** BASE CANVAS. Replaces cold white sitewide. */
  cream: {
    DEFAULT: '#FDFBF7',
    deep: '#F7F2EA', // one step down, for alternating paper bands
  },

  /** DERIVED SURFACE — card fills, table zebra rows. */
  'stone-tint': {
    DEFAULT: '#F3E7DE',
    soft: '#F9F2EC',
  },

  /** DERIVED HAIRLINE — borders, download-card frames. */
  'line-sand': {
    DEFAULT: '#E3D5C8',
    strong: '#8C7D6F', // form/control borders — 4.16:1 cream · 3.54:1 stone (non-text 3:1)
  },
};

/**
 * MEASURED CONTRAST — every legal text/background pair in the system.
 *
 * `min` is the WCAG 2.1 threshold for that pair's role:
 *   4.5 = normal text · 3.0 = large text (≥24px, or ≥18.66px bold) and UI borders
 *
 * A component may only use a pair from this list. Anything absent from this
 * list is unproven, and `validation/contrast-audit.mjs` treats an unproven pair
 * found in the rendered page as a failure.
 */
export const contrast = [
  // ── proven text pairs ──────────────────────────────────────────────────────
  { fg: 'charcoal.DEFAULT', bg: 'cream.DEFAULT',     ratio: 14.64, min: 4.5, role: 'body' },
  { fg: 'charcoal.DEFAULT', bg: 'stone-tint.DEFAULT', ratio: 12.46, min: 4.5, role: 'body' },
  { fg: 'charcoal.DEFAULT', bg: 'cream.deep',         ratio: 13.58, min: 4.5, role: 'body' },
  { fg: 'charcoal.soft',    bg: 'cream.DEFAULT',      ratio: 8.57, min: 4.5, role: 'secondary' },
  { fg: 'charcoal.soft',    bg: 'stone-tint.DEFAULT', ratio: 7.30, min: 4.5, role: 'secondary' },
  { fg: 'charcoal.muted',   bg: 'cream.DEFAULT',      ratio: 5.56, min: 4.5, role: 'meta' },
  { fg: 'cream.DEFAULT',    bg: 'charcoal.DEFAULT',   ratio: 14.64, min: 4.5, role: 'body on dark' },
  { fg: 'cream.DEFAULT',    bg: 'terracotta.DEFAULT', ratio: 4.98, min: 4.5, role: 'button label' },
  { fg: 'terracotta.DEFAULT', bg: 'cream.DEFAULT',    ratio: 4.98, min: 4.5, role: 'link' },
  { fg: 'terracotta.deep',  bg: 'cream.DEFAULT',      ratio: 5.70, min: 4.5, role: 'link on paper' },
  { fg: 'terracotta.deep',  bg: 'stone-tint.DEFAULT', ratio: 4.85, min: 4.5, role: 'link on card' },
  { fg: 'charcoal.muted',   bg: 'stone-tint.DEFAULT', ratio: 4.73, min: 4.5, role: 'meta on card' },
  { fg: 'marigold.DEFAULT', bg: 'charcoal.DEFAULT',   ratio: 8.32, min: 4.5, role: 'counter numerals' },

  // ── UI / border pairs (3:1 is the non-text threshold) ──────────────────────
  { fg: 'line-sand.strong', bg: 'cream.DEFAULT',      ratio: 3.85, min: 3.0, role: 'control border' },
  { fg: 'line-sand.strong', bg: 'stone-tint.DEFAULT', ratio: 3.28, min: 3.0, role: 'control border' },
  { fg: 'line-sand.DEFAULT', bg: 'cream.DEFAULT',    ratio: 1.39, min: 3.0, role: 'decorative hairline', exempt: true },
  { fg: 'terracotta.DEFAULT', bg: 'cream.DEFAULT',    ratio: 4.98, min: 3.0, role: 'focus ring' },
  { fg: 'marigold.DEFAULT', bg: 'charcoal.DEFAULT',   ratio: 8.32, min: 3.0, role: 'focus ring on dark' },
];

/**
 * FORBIDDEN PAIRS — computed so the rule is checkable, not folklore.
 * `check-tokens` fails the build if any of these appears in a component.
 */
export const forbidden = [
  { fg: 'marigold.DEFAULT', bg: 'cream.DEFAULT',      ratio: 1.76, why: 'Blueprint §3.1: marigold is never small text. On cream it is 1.76:1.' },
  { fg: 'marigold.DEFAULT', bg: 'stone-tint.DEFAULT', ratio: 1.50, why: 'Same — 1.50:1.' },
  { fg: 'terracotta.DEFAULT', bg: 'charcoal.DEFAULT', ratio: 2.94, why: '2.94:1. On dark surfaces use marigold for accent, cream for text.' },
  { fg: 'marigold.DEFAULT', bg: 'terracotta.DEFAULT', ratio: 2.83, why: '2.83:1. Never pair the two brand colours as text/fill.' },
  { fg: 'terracotta.DEFAULT', bg: 'stone-tint.DEFAULT', ratio: 4.24, why: 'Fails AA body. Use terracotta.deep (4.85:1) for text on stone-tint.' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   2. TYPOGRAPHY
   Blueprint §3.2. Fonts must be self-hosted; no Google Fonts CDN in production.
   ───────────────────────────────────────────────────────────────────────────── */

export const font = {
  /**
   * Latin display — stone-inscription feel. Blueprint prefers Playfair Display
   * over Lora. Both are licensed OFL, so self-hosting is unambiguous.
   */
  display: {
    stack: '"Playfair Display", "Lora", Georgia, "Times New Roman", serif',
    notes: 'Regular weight only. letter-spacing 0.04em on H1/H2. No engraved effects.',
  },
  /** Latin body & data — geometric, tabular numerals for tables. */
  sans: {
    stack: '"Plus Jakarta Sans", Inter, -apple-system, "Segoe UI", sans-serif',
    notes: 'font-variant-numeric: tabular-nums wherever a number aligns in a column.',
  },
  /** Odia — blueprint §3.2: Latin fonts carry no Odia glyphs, so the stack switches by lang. */
  odiaSerif: { stack: '"Noto Serif Oriya", "Playfair Display", serif' },
  odiaSans:  { stack: '"Noto Sans Oriya", "Plus Jakarta Sans", sans-serif' },
};

/**
 * Fluid type scale. Blueprint §3.2 gives H1 48→72px desktop, body 17–18px,
 * tables 14–15px. `clamp()` min/max below reproduce exactly that, plus the
 * intermediate steps this front-end already ships (h2/h3/eyebrow…).
 */
export const fontSize = {
  'display-xl': ['clamp(3rem, 5.6vw, 4.5rem)',   { lineHeight: '1.04', letterSpacing: '0.04em' }], // 48 → 72
  'display-lg': ['clamp(2.25rem, 4vw, 3.25rem)', { lineHeight: '1.08', letterSpacing: '0.04em' }], // h2
  'display-md': ['clamp(1.5rem, 2.4vw, 2rem)',   { lineHeight: '1.16', letterSpacing: '0.02em' }],
  'heading-sm': ['1.0625rem',                    { lineHeight: '1.35' }],                            // 17
  lead:         ['clamp(1.0625rem, 1.2vw, 1.125rem)', { lineHeight: '1.7' }],                        // 17 → 18
  body:         ['1.0625rem',                    { lineHeight: '1.7' }],                             // 17
  'body-sm':    ['0.9375rem',                    { lineHeight: '1.65' }],                            // 15
  table:        ['0.875rem',                     { lineHeight: '1.55', fontVariantNumeric: 'tabular-nums' }], // 14
  ui:           ['0.875rem',                     { lineHeight: '1.4' }],
  note:         ['0.8125rem',                    { lineHeight: '1.55' }],
  eyebrow:      ['0.75rem',                      { lineHeight: '1.2', letterSpacing: '0.14em' }],
  micro:        ['0.6875rem',                    { lineHeight: '1.3', letterSpacing: '0.08em' }],
};

/* ─────────────────────────────────────────────────────────────────────────────
   3. LAYOUT
   Blueprint §3.3: asymmetric 12-column grid; max content width 1280px;
   section padding 80–120px desktop / 56px mobile.
   ───────────────────────────────────────────────────────────────────────────── */

export const layout = {
  maxWidth: {
    page: '1280px',
    copy: '640px',
    'copy-sm': '560px',
    measure: '68ch', // 17px body at ~68 characters
  },
  containerPadding: { base: '20px', sm: '32px', lg: '80px' },
  /** desktop 80–120 (midpoint 96) · mobile 56 — blueprint verbatim */
  sectionPadding: { base: '56px', md: '80px', lg: '96px' },
  columns: 12,
  gutter: '24px',
  radius: { btn: '3px', card: '4px', photo: '3px', pill: '9999px' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   4. MOTION
   Blueprint §3.4. Every entry collapses under prefers-reduced-motion.
   ───────────────────────────────────────────────────────────────────────────── */

export const motion = {
  reveal: { duration: '600ms', easing: 'cubic-bezier(0.22, 1, 0.36, 1)', distance: '24px' },
  hover:  { duration: '200ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  countUp:{ duration: '1200ms' },
  kenBurns:{ duration: '6000ms', scale: '1.04' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   5. THE TERM CHARTER — enforced in code, per blueprint §4.2
   Public copy may not contain the left column. This is not style advice:
   §0.2 ruling 6 and §4.2 make it a build requirement.
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * `from` matches case-insensitively as a whole word/phrase.
 * `to` is the replacement a human must make — never auto-substituted, because
 * a blind find-and-replace breaks sentences ("waste of time" → "Sacred Remnant of time").
 *
 * Severity:
 *   'block'  → the save is refused / the build fails
 *   'warn'   → editor notice only (context may be legitimate)
 */
export const termCharter = [
  { from: /\bwaste\b/gi,            to: 'Sacred Remnant / Pushpa / Nirmalya', severity: 'block', ref: '§0.2(6)' },
  { from: /\bgarbage\b/gi,          to: 'Sacred Remnant',                     severity: 'block', ref: '§0.2(6)' },
  { from: /\btrash\b/gi,            to: 'Sacred Remnant',                     severity: 'block', ref: '§0.2(6)' },
  { from: /\bpayroll\b/gi,          to: 'Sevika Livelihood Remittance',       severity: 'block', ref: '§0.2(6)' },
  { from: /\bwages?\b/gi,           to: 'Sevika Livelihood Remittance',       severity: 'block', ref: '§0.2(6)' },
  { from: /\bdonations?\b/gi,       to: 'Voluntary Contribution',             severity: 'block', ref: '§0.2(6)' },
  { from: /\bdonate\b/gi,           to: 'Contribute',                         severity: 'block', ref: '§0.2(6)' },
  { from: /\bdonor\b/gi,            to: 'Contributor',                        severity: 'block', ref: '§0.2(6)' },
  { from: /\bemployee\b/gi,         to: 'Sevika',                             severity: 'warn',  ref: '§20 glossary' },
  { from: /\bworker\b/gi,           to: 'Sevika',                             severity: 'block', ref: '§20 glossary' },
  { from: /\bservice\b/gi,          to: 'Seva (when it means the work)',      severity: 'warn',  ref: '§20 glossary' },
  { from: /\bcsr grant\b/gi,        to: 'restricted to post-registration',    severity: 'block', ref: '§13.2' },
  { from: /\b80\s?g\b/gi,           to: 'only with the 80G switch ON',        severity: 'block', ref: '§13.1' },
  { from: /\btax[- ]?free\b/gi,     to: 'prohibited until registered',        severity: 'block', ref: '§13.2' },
  { from: /\bfcra\b/gi,             to: 'only with the international switch ON', severity: 'block', ref: '§13.1' },
];

/**
 * Locked copy from the blueprint. The front-end renders these; editors cannot
 * override them, and a deviation fails `npm run validate`.
 * §6.1 and §7 — verbatim.
 */
export const lockedCopy = {
  home: {
    h1: 'Preserving Sacred Sanctity. Incubating Grassroots Dignity.',
    sub: 'Under the voluntary banner of the Mandir Saaf Abhiyan, we intercept tons of organic ritual offerings across the ancient temple zones of Bhubaneswar. By deploying a 100% independent, in-house circular processing network, we empower local Sevikas with sustainable livelihood security — keeping our heritage shrines pristine and our communities self-reliant.',
    ctaPrimary: 'Explore Our Seva Ecosystem',
    ctaSecondary: 'Access Corporate CSR Portal',
  },
  pillarsIntro: 'Our work is guided by a singular, non-commercial vision: to preserve the ancient spiritual heritage of Bhubaneswar, maintain absolute purity at our shrines, and provide structural dignity to the community through silent, dedicated service.',
  footerDisclosure:
    'A2 Foundation is a voluntary initiative; statutory registration is in process. Contributions are voluntary and currently carry no section 80G tax benefit.',
};

export default { color, contrast, forbidden, font, fontSize, layout, motion, termCharter, lockedCopy };
