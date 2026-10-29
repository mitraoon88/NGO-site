# Ad-hoc probes (not part of any gate)

These are the throwaway scripts used during the build to answer one-off questions
("where does the tear sit?", "how tall is each band?"). They are kept because they
are useful when you are debugging a specific band, and they are **not** gates —
nothing in `signoff-phase3.sh` calls them, and they are allowed to have rough edges.

| Script | Answers |
|---|---|
| `tops.mjs` | the document `y` and height of every band on the live page |
| `probe2.mjs` | samples the torn-edge path at several x positions |
| `cmp.mjs` | renders `reference/stack-comparison.html` and reports its height + console errors |
| `make-og.mjs` | regenerates `apps/web/public/og.png` from the OG template |

They expect the dev server on `http://127.0.0.1:3100`. `make-og.mjs` also wants a
`.tmp-shots/og/og.html` template, which is not vendored — regenerate the template
if you need that one.
