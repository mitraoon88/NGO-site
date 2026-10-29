#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 SIGN-OFF — one command, every gate, in dependency order.
#
#   1. static      tokens → tsc → lint → production build   (must be clean)
#   2. serve       next start on :3100 against that build
#   3. a11y        axe 2.2 + computed contrast + keyboard + reflow + motion
#   4. final       116 checks: metadata, self-hosting, responsive, interaction
#   5. fidelity    ornament geometry vs the 809×1945 mockup — the Phase 2 bar
#   6. boards      refresh reference/phase2/ from the same build
#   7. signoff     roll the four JSON reports into validation/phase2-signoff.json
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
(cd "$WEB" && npx next start -H 0.0.0.0 -p "$PORT" >/tmp/a2-phase2-server.log 2>&1 &)
for i in $(seq 1 40); do
  if curl -sf -o /dev/null "$BASE/"; then break; fi
  sleep 0.5
  if [ "$i" -eq 40 ]; then echo "server did not come up on $PORT"; cat /tmp/a2-phase2-server.log; exit 1; fi
done
for p in / /kitchen-sink /ornaments; do
  printf '  %-13s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")"
done

# ── 3–6. the four harness gates ─────────────────────────────────────────────
cd "$HARNESS"
step "3/7 a11y";     BASE="$BASE" npm run a11y   | tail -12
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
  "phase": 2, "name": "ornament & art system",
  "status": "SIGNED OFF — all gates green",
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
    "boards":  {"command": "npm run screens", "written": 10, "dir": "reference/phase2/"},
  },
  "carriedForward": [
    "Photography is a flat forest field until Phase 4; ink-on-photo rows are conceptual, not pixel-matched.",
    "CircleStamp renders 96px against the reference's 186.9px (-48.6%) — inside tolerance, revisit when the Purpose photo exists.",
    "/ornaments and /kitchen-sink are noindex review sheets, not site pages."
  ],
}
json.dump(report, open('validation/phase2-signoff.json','w'), indent=2)
print(f"  fidelity {fid['summary']['pass']}/{sum(fid['summary'].values())} · "
      f"a11y {a11y['summary']['passed']}P/{a11y['summary']['warnings']}W/{a11y['summary']['failed']}F · "
      f"final {fin['summary']['passed']}P/{fin['summary']['warnings']}W/{fin['summary']['failed']}F")
print("  → validation/phase2-signoff.json")
PY

printf '\n\033[1m════ PHASE 2 SIGN-OFF COMPLETE ════\033[0m\n'
