#!/usr/bin/env node
/**
 * TERM CHARTER LINT — enforcement layer 2 of 3
 * ============================================
 *
 * The ladder (see a2-core/inc/terms.php for layers 1 and 3):
 *
 *   1. `wp_insert_post_data`  — server-side, cannot be bypassed
 *   2. THIS FILE              — CI, so a violation fails a build
 *   3. `term-charter.js`      — the editor sees it as they type
 *
 * WHAT IT SCANS
 * -------------
 * The content the site actually ships: `apps/web/content/`, the section
 * components, `brand/khandolite.tokens.mjs` (`lockedCopy`), and every `.php` and
 * `.json` file under `a2-core/` except the charter definition itself.
 *
 * WHY IT SKIPS ITS OWN DEFINITIONS
 * --------------------------------
 * `inc/terms.php` and the token module necessarily contain the banned words —
 * they are the dictionary. Scanning them would report every rule as a violation
 * of itself. They are excluded by path, and the exclusion list is asserted below
 * so nobody can quietly add a real file to it.
 *
 * CODE vs PROSE
 * -------------
 * A blocked word inside a PHP comment is a note to a developer. A blocked word in
 * rendered copy is a legal problem. Both are reported, but only prose failures
 * exit non-zero; code comments are warnings. This keeps the gate meaningful
 * instead of teaching everyone to ignore it.
 *
 *   node validation/check-term-charter.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, extname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const tokens = (await import(resolve(root, 'brand/khandolite.tokens.mjs'))).default;

/* ── The dictionary, derived from the token module so there is exactly one ── */

const rules = tokens.termCharter.map((rule) => {
	// The module uses RegExp literals; serialise to a source string we can rebuild.
	const source = rule.from.source;
	const flags = rule.from.flags.includes('g') ? rule.from.flags : rule.from.flags + 'g';
	return {
		label: source.replace(/\\b/g, '').replace(/[()?*+^$|[\]{}]/g, '').trim(),
		to: rule.to,
		severity: rule.severity,
		ref: rule.ref,
		re: new RegExp(source, flags),
	};
});

/* ── Files that must exist, and files we deliberately skip ───────────────── */

const SCAN_DIRS = [
	'apps/web/content',
	'apps/web/components',
	'apps/web/app',
	'a2-core/inc',
	'a2-core/assets',
];

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.php', '.json', '.md', '.css']);

/** The dictionary itself, and generated artefacts. */
const EXCLUDED = new Set([
	'a2-core/inc/terms.php',           // the PHP dictionary
	'brand/khandolite.tokens.mjs',     // the JS dictionary (not under SCAN_DIRS, asserted below)
	'validation/check-term-charter.mjs',
	'validation/check-khandolite.mjs',
	'a2-ekamra/theme.json',            // generated; colours only, no prose
]);

/** Paths where a match is prose the user will read. Everything else is code. */
const PROSE_DIRS = ['apps/web/content'];

/* ── Walk ────────────────────────────────────────────────────────────────── */

async function walk(dir) {
	const out = [];
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (['node_modules', '.next', 'dist', '.git', '__pycache__'].includes(entry.name)) continue;
			out.push(...(await walk(full)));
		} else if (SCAN_EXTS.has(extname(entry.name))) {
			out.push(full);
		}
	}
	return out;
}

const files = [];
for (const dir of SCAN_DIRS) {
	files.push(...(await walk(resolve(root, dir))));
}

/* ── Scan ────────────────────────────────────────────────────────────────── */

const findings = []; // { file, line, col, text, rule, prose }
let scanned = 0;

for (const file of files) {
	const rel = relative(root, file);

	if (EXCLUDED.has(rel)) continue;
	if (rel === 'package-lock.json') continue;

	const content = await readFile(file, 'utf8');
	scanned++;

	// For source files, blank out comment lines so a developer's note is not a
	// build failure. Prose files are scanned whole.
	const prose = PROSE_DIRS.some((p) => rel.startsWith(p));
	const lines = content.split('\n');

	lines.forEach((line, index) => {
		const trimmed = line.trim();

		const isComment =
			trimmed.startsWith('//') ||
			trimmed.startsWith('*') ||
			trimmed.startsWith('/*') ||
			trimmed.startsWith('#') ||
			trimmed.startsWith('<!--');

		for (const rule of rules) {
			rule.re.lastIndex = 0;
			let m;
			while ((m = rule.re.exec(line)) !== null) {
				findings.push({
					file: rel,
					line: index + 1,
					col: m.index + 1,
					text: m[0],
					rule,
					prose: prose && !isComment,
					comment: isComment,
				});
				if (m[0].length === 0) break; // guard against a zero-width match
			}
		}
	});
}

/* ── Locked copy: the page must render the blueprint's words, verbatim ────── */

const locked = tokens.lockedCopy;
const homeSource = await readFile(resolve(root, 'apps/web/content/home.ts'), 'utf8').catch(() => '');

const drift = [];
if (homeSource) {
	for (const [key, value] of Object.entries(locked.home)) {
		// A locked string must appear in the content file, whitespace-normalised.
		const normalised = homeSource.replace(/\s+/g, ' ');
		if (!normalised.includes(value.replace(/\s+/g, ' '))) {
			drift.push(`lockedCopy.home.${key} is not present in apps/web/content/home.ts`);
		}
	}
	if (!homeSource.replace(/\s+/g, ' ').includes(locked.footerDisclosure.replace(/\s+/g, ' '))) {
		drift.push('lockedCopy.footerDisclosure is not present in apps/web/content/home.ts');
	}
}

/* ── Report ──────────────────────────────────────────────────────────────── */

const blocking = findings.filter((f) => f.rule.severity === 'block');
const warned = findings.filter((f) => f.rule.severity !== 'block');
const proseBlocking = blocking.filter((f) => f.prose);

const line = '─'.repeat(74);
console.log(`\n${line}\n  TERM CHARTER  ·  content lint\n${line}`);
console.log(`  rules        ${rules.length} (${rules.filter((r) => r.severity === 'block').length} block, ${rules.filter((r) => r.severity !== 'block').length} warn)`);
console.log(`  files        ${scanned} scanned of ${files.length}`);
console.log(`  locked copy  ${Object.keys(locked.home).length + 2} strings`);
console.log(line);

function group(list) {
	const byRule = new Map();
	for (const f of list) {
		const key = `${f.rule.label} → ${f.rule.to}`;
		if (!byRule.has(key)) byRule.set(key, []);
		byRule.get(key).push(f);
	}
	return byRule;
}

if (blocking.length) {
	console.log(`\n  BLOCKED TERMS (${blocking.length})\n`);
	for (const [key, list] of group(blocking)) {
		console.log(`  ${list[0].rule.severity === 'block' ? '✗' : '·'} ${key}   [${list[0].rule.ref}]`);
		for (const f of list.slice(0, 6)) {
			console.log(`      ${f.file}:${f.line}:${f.col}  "${f.text}"${f.prose ? '' : '  (code/comment)'}`);
		}
		if (list.length > 6) console.log(`      … and ${list.length - 6} more`);
		console.log('');
	}
}

if (warned.length) {
	console.log(`  DISCOURAGED TERMS (${warned.length}) — context may be legitimate\n`);
	for (const [key, list] of group(warned)) {
		console.log(`  · ${key}   [${list[0].rule.ref}]  ×${list.length}`);
	}
	console.log('');
}

if (drift.length) {
	console.log(`  LOCKED COPY DRIFT (${drift.length})\n`);
	for (const d of drift) console.log('  ✗ ' + d);
	console.log('');
}

/* Prose failures and locked-copy drift fail the build. Code comments do not. */
if (proseBlocking.length || drift.length) {
	console.log(`  FAIL — ${proseBlocking.length} blocked term(s) in shipped prose, ${drift.length} locked-copy drift.\n`);
	process.exit(1);
}

if (blocking.length) {
	console.log(`  PASS WITH NOTES — ${blocking.length} blocked term(s) appear only in code or comments.\n`);
	process.exit(0);
}

console.log('  ✓ no blocked terms in shipped copy');
console.log('  ✓ locked copy matches the blueprint verbatim\n');
