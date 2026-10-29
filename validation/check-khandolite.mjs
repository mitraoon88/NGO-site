#!/usr/bin/env node
/**
 * DRIFT CHECK — khandolite.css  ↔  khandolite.tokens.mjs
 * ======================================================
 *
 * WHY THIS EXISTS
 * ---------------
 * A design token is only a source of truth if nothing else can quietly hold a
 * second copy of it. The failure mode is mundane: someone adds a colour to the
 * CSS while debugging, it looks right, and six months later the token module and
 * the stylesheet disagree about what terracotta is.
 *
 * So this script does not "check the CSS looks nice". It asserts five things:
 *
 *   1. Every `--a2-*` custom property is either a colour token from
 *      khandolite.tokens.mjs (same name, same value) or an allow-listed
 *      non-colour value with a stated reason.
 *   2. Every colour token is actually declared — an orphaned token is a promise
 *      nothing keeps.
 *   3. There is no raw hex anywhere outside the token block.
 *   4. A visible focus ring exists and no outline is ever removed.
 *   5. Odia line-height is ≥ 1.8 and reduced motion is handled.
 *
 * Exit 1 on any drift. Wire into CI next to contrast-audit.mjs.
 *
 *   node validation/check-khandolite.mjs
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const tokens = (await import(resolve(root, 'brand/khandolite.tokens.mjs'))).default;
const rawCss = await readFile(resolve(root, 'brand/khandolite.css'), 'utf8');

const problems = [];
const warnings = [];

/* Strip comments once; every later regex works on this. */
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');

/* ── 1. Allow-list: non-colour properties, with the reason they exist ─────── */

const ALLOWED = {
	'--a2-font-sans': 'font stack — font.display + font.body',
	'--a2-font-display': 'font stack — font.display (serif display face)',
	'--a2-font-odia-serif': 'Odia display stack (Noto Serif Oriya first)',
	'--a2-font-odia-sans': 'Odia body stack (Noto Sans Oriya first)',
	'--a2-text-display-xl': 'fontSize.displayXl',
	'--a2-text-display-lg': 'fontSize.displayLg',
	'--a2-text-display-md': 'fontSize.displayMd',
	'--a2-text-heading-sm': 'fontSize.headingSm',
	'--a2-text-lead': 'fontSize.lead',
	'--a2-text-body': 'fontSize.body',
	'--a2-text-body-sm': 'fontSize.body-sm — 15px, secondary copy',
	'--a2-text-table': 'fontSize.table — 14px, tabular numerals',
	'--a2-text-ui': 'fontSize.ui — 14px, control labels',
	'--a2-text-note': 'fontSize.note',
	'--a2-text-eyebrow': 'fontSize.eyebrow',
	'--a2-text-micro': 'fontSize.micro',
	'--a2-page': 'layout.maxWidth 1280',
	'--a2-copy': 'layout.maxWidth.copy 640',
	'--a2-measure': 'layout.maxWidth.measure 68ch',
	'--a2-gutter': 'layout.gutter (responsive override expected)',
	'--a2-pad-section': 'layout.sectionPadding, 56/80/96 (responsive overrides expected)',
	'--a2-radius-btn': 'layout.radius.button 3',
	'--a2-radius-card': 'layout.radius.card 4',
	'--a2-ease': 'motion.reveal.easing',
	'--a2-ease-hover': 'motion.hover.easing',
	'--a2-dur-reveal': 'motion.duration.reveal 600',
	'--a2-dur-hover': 'motion.duration.hover 200',
	'--a2-header-h': 'layout.headerHeight 92 — hero offset uses the same value',
	'--a2-focus-width': 'focus geometry, pairs with color.terracotta',
	'--a2-focus-offset': 'focus geometry — keeps the ring clear of a 3px-radius button',
};

/* ── 2. Build the expected colour map ────────────────────────────────────── */

/**
 * Flatten `color` to `--a2-*` names.
 *
 * `DEFAULT` is skipped on purpose: the token module uses it to mean "the
 * unqualified name", so `terracotta.DEFAULT` → `--a2-terracotta`, not
 * `--a2-terracotta-default`.
 */
function flatten(node, prefix = '') {
	const out = {};
	for (const [key, value] of Object.entries(node)) {
		if (key === 'DEFAULT') {
			out[prefix] = value;
			continue;
		}
		const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
		const name = prefix ? `${prefix}-${kebab}` : kebab;
		if (value && typeof value === 'object') {
			Object.assign(out, flatten(value, name));
		} else if (typeof value === 'string') {
			out[name] = value;
		}
	}
	return out;
}

const colours = flatten(tokens.color);
const expected = new Map(
	Object.entries(colours).map(([name, hex]) => [`--a2-${name}`, hex.toLowerCase()])
);

/* ── 3. Parse declarations ───────────────────────────────────────────────── */

/** Every `--a2-x: value;` with the selector it was declared under. */
const declarations = [];
const ruleRe = /([^{}]*)\{([^{}]*)\}/g;
let rule;

while ((rule = ruleRe.exec(css)) !== null) {
	const selector = rule[1].trim().replace(/\s+/g, ' ') || '(anonymous)';
	const body = rule[2];

	if (!/--a2-/.test(body)) continue;

	const declRe = /(--a2-[a-z0-9-]+)\s*:\s*([^;]+);/g;
	let decl;
	while ((decl = declRe.exec(body)) !== null) {
		declarations.push({ prop: decl[1], value: decl[2].trim(), selector });
	}
}

/** First declaration wins for comparison; later ones are responsive overrides. */
const firstDecl = new Map();
for (const d of declarations) {
	if (!firstDecl.has(d.prop)) firstDecl.set(d.prop, d);
}

/* ── 4. Every declared var is expected or allow-listed ───────────────────── */

for (const [prop, d] of firstDecl) {
	if (expected.has(prop)) {
		const want = expected.get(prop);
		const got = d.value.toLowerCase();

		if (got !== want) {
			problems.push(`${prop} = ${d.value} in "${d.selector}", but the token module says ${want}`);
		}
		continue;
	}

	if (!(prop in ALLOWED)) {
		problems.push(
			`${prop} = ${d.value} in "${d.selector}" — not a token and not allow-listed. ` +
			`Add it to khandolite.tokens.mjs, or justify it in ALLOWED in this script.`
		);
	}
}

/* ── 5. Every colour token is declared ───────────────────────────────────── */

for (const [prop] of expected) {
	if (!firstDecl.has(prop)) {
		problems.push(`${prop} is in the token module but never declared in khandolite.css`);
	}
}

/* ── 6. No raw hex outside the token block ───────────────────────────────── */

// Remove every token-defining block, including those inside media queries.
const withoutTokens = css.replace(
	/(^|\})\s*((?::root|\[lang=[^\]]+\]|\[data-theme[^\]]*\])(?:\s*,\s*(?::root|\[lang=[^\]]+\]|\[data-theme[^\]]*\]))*)\s*\{[^{}]*\}/g,
	'$1'
);

const strays = [];
const rawHex = /#[0-9a-fA-F]{3,8}\b/g;
let hit;
while ((hit = rawHex.exec(withoutTokens)) !== null) {
	const start = withoutTokens.lastIndexOf('\n', hit.index) + 1;
	const end = withoutTokens.indexOf('\n', hit.index);
	strays.push(`${hit[0]} → ${withoutTokens.slice(start, end === -1 ? undefined : end).trim().slice(0, 90)}`);
}

if (strays.length) {
	problems.push(`Raw hex outside the token block (${strays.length}):\n      ` + strays.join('\n      '));
}

/* ── 7. Focus ring: present, visible, never removed ─────────────────────── */

const focusBlocks = [...css.matchAll(/:focus-visible[^{]*\{([^}]*)\}/g)].map((m) => m[1]);

if (focusBlocks.length === 0) {
	problems.push('No :focus-visible rule — every tab stop would be blind.');
} else {
	const usesToken = focusBlocks.some((b) => /var\(--a2-(terracotta|marigold)\)/.test(b));
	if (!usesToken) {
		problems.push('The :focus-visible rule does not use the terracotta or marigold token.');
	}
}

// `outline: none` anywhere is the failure the whole focus gate exists to catch.
const outlineKill = /outline\s*:\s*(none|0|transparent)\b/;
if (outlineKill.test(css)) {
	const where = css.slice(Math.max(0, css.search(outlineKill) - 80), css.search(outlineKill) + 40);
	problems.push(`An outline is removed — use outline-offset for spacing, never outline:none. Near: …${where.trim()}…`);
}

/* ── 8. Odia line-height ≥ 1.8 (stacked matras clip at Latin leading) ───── */

const odiaBlocks = [...css.matchAll(/\[lang="or"\][^{]*\{([^}]*)\}/g)].map((m) => m[1]).join('\n');

if (odiaBlocks === '') {
	problems.push('[lang="or"] rules are missing — Odia matras clip at Latin line-height.');
} else {
	const heights = [...odiaBlocks.matchAll(/line-height\s*:\s*([\d.]+)/g)].map((m) => Number(m[1]));
	if (heights.length === 0) {
		problems.push('[lang="or"] declares a font stack but no line-height — 1.8 is required.');
	} else if (Math.min(...heights) < 1.8) {
		problems.push(`Odia line-height ${Math.min(...heights)} < 1.8 — stacked matras will clip.`);
	}
}

/* ── 9. Reduced motion collapses ─────────────────────────────────────────── */

if (!/prefers-reduced-motion/.test(css)) {
	problems.push('No prefers-reduced-motion block — the blueprint requires motion collapse.');
}

/* ── Report ──────────────────────────────────────────────────────────────── */

const line = '─'.repeat(74);
console.log(`\n${line}\n  KHANDOLITE  ·  CSS ↔ TOKENS drift check\n${line}`);
console.log(`  token module   brand/khandolite.tokens.mjs`);
console.log(`  stylesheet     brand/khandolite.css`);
console.log(`  colour tokens  ${expected.size}`);
console.log(`  declarations   ${declarations.length} (${firstDecl.size} unique)`);
console.log(line);

if (warnings.length) {
	console.log('\nWarnings');
	for (const w of warnings) console.log('  · ' + w);
}

if (problems.length) {
	console.log(`\n${problems.length} problem(s)\n`);
	for (const p of problems) console.log('  ✗ ' + p);
	console.log('\nFAIL\n');
	process.exit(1);
}

console.log('\n  ✓ every private colour token matches the module');
console.log('  ✓ every declared variable is a token or an allow-listed value');
console.log('  ✓ no raw hex outside the token block');
console.log('  ✓ focus ring present and tokenised; no outline removed');
console.log('  ✓ Odia line-height ≥ 1.8; reduced motion collapses');
console.log('\n  PASS\n');
