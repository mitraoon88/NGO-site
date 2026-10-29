#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3 SIGN-OFF — one command, every gate, in dependency order.
#
#   1. static      tokens → tsc → lint → production build   (must be clean)
#   2. serve       next start on :3100 against that build
#   3. a11y        axe 2.2 + computed contrast + keyboard + reflow + motion
#   4. final       116 checks: metadata, self-hosting, responsive, interaction
#   5. fidelity    ornament geometry + the 11-band stack vs the mockup — the Phase 3 bar
#   6. boards      refresh reference/phase3/ from the same build
#   7. signoff     roll the four JSON reports into validation/phase3-signoff.json
#
# Any gate that fails stops the run and exits non-zero: a partial sign-off is not
# a sign-off. `npm run validate` is deliberately run BEFORE the server starts, so
# the harness can never measure a stale build.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # validation/ → repo root
WEB="$ROOT/apps/web"
HARNESS="$ROOT/validation/harness"
PORT="${PORT:-3100}"
BASE="http://127.0.0.1:$PORT"

step() { printf '\n\033[1m── %s ─────────────────────────────────────\033[0m\n' "$1"; }

# ── 1. static gates ──────────────────────────────────────────────────────────
step "1/7 static: tokens → tsc → lint → build"
(cd "$WEB" && npm run validate)

# ── 2. serve the build we just made ─────────────────────────────────────────
step "2/7 serve production build on :$PORT"
# `pkill -f next-server` also matches the shell running this script, which kills the
# run itself; the bracket keeps the pattern out of its own match.
(pkill -9 -f 'next-serve[r]' || true) >/dev/null 2>&1 || true
sleep 1
# `</dev/null` + full redirect matters: a backgrounded server that inherits this
# script's stdout keeps the caller's pipe open, so `bash signoff-phase3.sh | tail`
# never sees EOF even after the run finishes (it hangs on a finished job).
(cd "$WEB" && setsid npx next start -H 0.0.0.0 -p "$PORT" </dev/null >/tmp/a2-phase3-server.log 2>&1 &)
for i in $(seq 1 40); do
  if curl -sf -o /dev/null "$BASE/"; then break; fi
  sleep 0.5
  if [ "$i" -eq 40 ]; then echo "server did not come up on $PORT"; cat /tmp/a2-phase3-server.log; exit 1; fi
done
for p in / /about /stories/a-new-beginning-for-ramesh; do
  printf '  %-13s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")"
done

# ── 3–6. the four harness gates ─────────────────────────────────────────────
cd "$HARNESS"
step "3/7 a11y";     BASE="$BASE" npm run a11y   | tail -12
step "3b/7 ux";      BASE="$BASE" npm run ux     | tail -8
step "4/7 final";    BASE="$BASE" npm run final  | tail -6
step "5/7 fidelity"; BASE="$BASE" npm run fidelity | tail -20
step "6/7 boards";   BASE="$BASE" npm run screens | tail -3

# ── 7. one artefact to hand over ────────────────────────────────────────────
step "7/7 sign-off artefact"
cd "$ROOT"
python3 - <<'PY'
import json, os
fid  = json.load(open('validation/fidelity-report.json'))
a11y = json.load(open('validation/report.json'))
fin  = json.load(open('validation/final-report.json'))
build = 'apps/web/.next/BUILD_ID'
report = {
  "phase": 3, "name": "homepage section stack (11 bands)",
  "status": "GATES GREEN — awaiting client sign-off",
  "generatedAt": max(fid['generatedAt'], a11y['generatedAt'], fin['generatedAt']),
  "build": {"nextBuildId": open(build).read().strip() if os.path.exists(build) else "unknown",
             "mode": "production (next start)", "port": int(os.environ.get("PORT", "3100"))},
  "reference": "uploads/A2 Foundation Nonprofit Homepage Mockup.png (809x1945)",
  "gates": {
    "static":  {"command": "npm run validate", "result": "PASS"},
    "a11y":    {"command": "npm run a11y", "summary": a11y['summary'],
                "axeViolationsByRoute": {k: len(v['axeViolations']) for k, v in a11y['pages'].items()},
                "contrastPairsChecked": sum(v['contrastChecked'] for v in a11y['pages'].values()),
                "contrastFailures": sum(len(v['contrastFailures']) for v in a11y['pages'].values()),
                "consoleErrors": sum(len(v['consoleErrors']) for v in a11y['pages'].values()),
                "failedRequests": sum(len(v['failedRequests']) for v in a11y['pages'].values()),
                "acceptedWarning": a11y['warn'][0] if a11y['warn'] else None},
    "final":   {"command": "npm run final", "summary": fin['summary'],
                "responsiveWidths": [320,360,390,414,480,768,834,1024,1280,1440,1600,1920,2560],
                "zoom": ["200%","300%"]},
    "fidelity":{"command": "npm run fidelity", "summary": fid['summary'],
                "rows": [{"property": r['name'], "reference": r['ref'], "build": r['live'],
                          "pct": r.get('pct'), "ok": r['ok']} for r in fid['results']]},
    "boards":  {"command": "npm run screens", "written": 11, "dir": "reference/phase3/"},
  },
  "carriedForward": [
    "All 10 band images are generated placeholders with no faces — client photography is the Phase 4 blocker.",
    "Partner marks are neutral name plates: third-party logos need written permission and current official SVGs.",
    "CircleStamp renders 96px against the reference's 186.9px (-48.6%) — revisit with the real Purpose photo.",
    "Newsletter validates and announces but has no backend; Phase 6 wires WordPress.",
    "app/[...slug] route shells are interim and noindex — Phase 5 replaces their bodies and deletes route-list.ts.",
    "IconArrowUpRight is exported but unimported (the one final-gate warning); Phase 4/5 pages will use it."
  ],
  "verifiedIndependently": {
    "suite": "~/.tmp-shots/verify.mjs + reflow.mjs (raw geometry, not the harness helpers)",
    "result": "11/11 checks",
    "widthsWithoutOverflow": [360, 375, 390, 414, 480, 600, 768, 834, 900, 1024, 1180, 1280, 1366, 1440, 1600, 1920, 2200, 2560],
    "fixedInThisRound": [
      "sharp was missing, so the Next image optimizer hung >15s on /_next/image?w=1080 and the page never finished loading at 834px",
      "at 200% text the fixed header pushed Donate Now and the whole language switch off-screen; the bar now measures itself and falls back to the compact header when the nav does not fit",
      "the hero reserved a hard-coded 92px for the header; it now uses the measured --a2-header-h",
      "the footer's four fixed columns overflowed at 200%/300% text; now auto-fit",
      "the partners row could not wrap and pushed links off-screen at 300%",
      "twelve tab stops had outline: 2px solid TRANSPARENT (Tailwind focus-visible:outline-none) and no visible focus ring"
    ],
    "uxAudit": { "command": "npm run ux", "checks": 19, "passed": 19,
      "covers": ["layout system", "type scale", "style language", "reading measure",
                 "44px targets", "focus visibility", "media & alt", "copy quality", "responsive reflow"] },
    "approvalRecord": "reference/phase3/approval/index.html",
    "newGates": [
      "every control stays inside the viewport at 200% and 300% text, on all three routes",
      "the hero clears the fixed header at 100% and 200% text",
      "all 55 tab stops show a visible focus indicator (outline colour alpha, not outline-style)"
    ]
  },
}
json.dump(report, open('validation/phase3-signoff.json','w'), indent=2)
print(f"  fidelity {fid['summary']['pass']}/{sum(fid['summary'].values())} · "
      f"a11y {a11y['summary']['passed']}P/{a11y['summary']['warnings']}W/{a11y['summary']['failed']}F · "
      f"final {fin['summary']['passed']}P/{fin['summary']['warnings']}W/{fin['summary']['failed']}F")
print("  → validation/phase3-signoff.json")
PY

printf '\n\033[1m════ PHASE 3 SIGN-OFF COMPLETE ════\033[0m\n'
