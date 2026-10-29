# Validation harness

Executable gates for the A2 build. Everything here runs against the **production build**
(`next start`), never the dev server, and writes machine-readable evidence into `validation/`.

```bash
cd ../../apps/web && npm run validate && npm start &   # tokens → tsc → lint → build, then serve
cd ../validation/harness && npm i
npm run a11y       # axe-core WCAG 2.2 + computed contrast + keyboard + reflow + reduced motion
npm run final      # + metadata/SEO, self-hosting, performance, responsive 320–2560, tokens, brand
npm run fidelity   # ornament geometry vs the 809×1945 mockup — 14 match / 0 drift
npm run screens    # refreshes the phase1 + phase2 review boards
npm run og         # regenerates apps/web/public/og.png using the live brand fonts
```

| Variable | Default | Use |
|---|---|---|
| `BASE` | `http://127.0.0.1:3100` | point the gate at another port (e.g. an upgrade candidate) |
| `REPORT` | `validation/report.json` / `final-report.json` | write the evidence somewhere else so the canonical run is not overwritten |

## Two rules learned the hard way

1. **Restart the server after every `next build`.** `next start` keeps serving the previous build;
   a stale CSS chunk looks exactly like a design bug (fonts fall back to Times New Roman).
2. **Measure computed colours, never token intent.** Alpha blending, inheritance and class merging
   all move the real ratio — that is how `text-white` once vanished from a rust button.
