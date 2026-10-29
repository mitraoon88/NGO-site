import { cn } from "@/lib/cn";

/**
 * TornEdge — the deckled paper edge where the hero photograph meets the page.
 *
 * This is the one ornament that has to look *wrong* to look right, so the spec is
 * explicit:
 *
 *   • **Teeth, not waves.** Torn paper tears in short straight pulls separated by
 *     notches. A smoothed path turns that into a scallop shell, which is the single
 *     most common way this effect looks fake. So the deckle is a polyline: 88 short
 *     runs (~9px each at 806 units, i.e. ~1.1% of the width) with a deterministic
 *     deep bite every 29th tooth. The reference measures ~135 direction changes and
 *     a 2.2%-of-width amplitude; matching the *density*, not just the amplitude, is
 *     what makes it read as fibre rather than as a mountain range.
 *   • **Fibre shadow.** The same edge repeated 1.5 units lower, stroked 1px in
 *     `--a2-tear-shadow`. That single hairline is what makes the tear read as
 *     physical rather than as a cut-out.
 *   • **Horizontal stretch only.** `preserveAspectRatio="none"` with
 *     `vector-effect="non-scaling-stroke"` on the fibre: the tooth pattern may
 *     stretch with the viewport, the shadow line may not thicken.
 *   • Height is `--a2-tear-h` (18–34px). At 360px a 6px tear reads as a printing
 *     defect, not a paper edge.
 *
 * **`rise` — the diagonal.** Measured on the reference, the sheet is not torn along
 * a level line: the paper edge climbs from y≈400 of 809 on the left to y≈335 at the
 * right, 8.7% of the page width. That wedge is the composition — it is why the
 * illustration has a tall margin on the right and a sliver on the left, and why the
 * drawing's own mass grows to the right. A level deckle cannot express it (a 30-unit
 * band has no room), so `rise` switches to a 150-unit canvas whose deckle line is
 * that wedge plus the same fibre noise, and the tear also sags slightly around
 * x≈0.5 to leave room for the boat at the waterline. The band's height is set by
 * the caller (`h-[13vw]`), because a rising edge needs a box to rise in.
 *
 * `RISE` here and the shear in `odisha-line-art.tsx` are one calculation: the mark
 * is printed on this sheet, so it is sheared by the same 80-units-over-the-width
 * slope. Change one and the drawing stops sitting on the paper.
 *
 * `tone` is the colour that bleeds *through* the tear — i.e. the surface of the
 * section underneath.
 */

type Props = {
  /** the colour that shows through the tear — the next section's surface */
  tone?: "cream" | "cream-deep" | "forest" | "forest-deep" | "sand";
  /** which edge of the parent the tear hugs */
  edge?: "bottom" | "top";
  /** draw the rising paper wedge instead of a level band (height comes from className) */
  rise?: boolean;
  className?: string;
};

const W = 806;
const H = 30;            // level band
const HR = 100;          // rising band (band height comes from the caller)
// The reference measures 135 pulls across its 809px page: a pitch of 0.74% of the
// page width. Pitch is the page-relative quantity, so the 1440px build wants the
// same *share* — ~135 pulls, not the 240 an earlier pass used (that was twice the
// reference's density and read as a saw blade).
const TEETH_LEVEL = 132;
const TEETH_RISE = 140;
/* ── the measured wedge ────────────────────────────────────────────────────────
   Traced column by column off the mockup at 809px (the first row of ten
   consecutive cream rows — a single bright pixel is a highlight in the
   photograph, a run of them is the sheet):

       x   0% → y 398     x  40% → y 401     x  70% → y 370
       x  20% → y 407     x  50% → y 394     x  85% → y 337
       x  30% → y 404     x  62% → y 400     x  95% → y 323

   So the tear is **level for the left 62% of the page and then climbs 77px
   (9.5% of the width) into the top-right corner**, where it levels off again.
   That shape is the composition: a calm paper edge across the copy, then a
   diagonal that opens the tall margin the vignette is printed in.

   Two earlier versions had this wrong and both looked wrong in a way that was
   hard to name. The first ramped from the middle to a level 30-unit band; the
   second exaggerated the knee to 13% and spread the climb across 60% of the
   width, which turned the wedge into a diagonal across the whole hero. The
   profile above is the one to trust — it is measured, not inferred.

   `AMP_RISE` and `SAG` keep the fibre calm: the reference's tear wanders about
   1.4% of the band's height, with long slow pulls and no saw teeth. */
const AMP = 4.4;         // ±units on the level band (2.2% of 806 is ~18 units peak-to-peak)
// The reference's deckle wanders ±2.2% of the page width — 32px at 1440, i.e.
// about 9.7 units of a 65-unit deckle. The shape matters more than the number:
// `deckle()` supplies the slow wander, this supplies the per-tooth nick.
const AMP_RISE = 15.5;
const SEED = 1_373;      // fixed so server and client render identical bytes

/* LEFT_Y / RIGHT_Y are fractions of the band, and the band is now tall enough to
   hold the drawing (see hero.tsx). The reference's climb is 77 mock px ≈ 137 at
   1440, which in a 15vw (216px) band is 63 units — so the sheet runs from 63% down
   to the top-right corner. That leaves a ~76px paper strip across the copy and a
   ~200px printed margin on the right, which is where the vignette's mass sits. */
const LEFT_Y = 66;       // paper strip across the left two-thirds
const RIGHT_Y = 6;       // sheet reaches the top-right corner, keeping 6 units of paper above the ink
const KNEE = 0.60;       // level from 0 → 60%
const RISE_TO = 0.96;    // the climb is finished by 96%
const SAG = 0;           // no sag: the reference's edge is level at the right

function pseudoNoise(i: number) {
  // Deterministic, cheap, irrational. The weights matter: an earlier version put
  // most of the energy in the low frequencies and the deckle came out as a row of
  // dunes. A tear is mostly HIGH frequency — every pull is its own event — with
  // just enough low frequency to keep it from looking like a saw blade.
  const hi = Math.sin(i * 1.93 + SEED) * 0.46;
  const mid = Math.sin(i * 0.53 + 1.7) * 0.34;
  const lo = Math.sin(i * 0.13 + 4.1) * 0.2;
  return hi + mid + lo; // -1 … 1
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** y of the mean paper edge at x (0…W) for the rising wedge */
export function riseEdge(x: number) {
  const t = x / W;
  const u = Math.min(1, Math.max(0, (t - KNEE) / (RISE_TO - KNEE)));
  return LEFT_Y + (RIGHT_Y - LEFT_Y) * smoothstep(u) + SAG;
}

/**
 * The reference's tear has exactly two scales, and reproducing both is what makes
 * it read as paper instead of as a saw blade:
 *
 *   1. a **slow wander** — the pull-to-pull drift of a hand tearing paper, roughly
 *      ±1.5% of the band with a wavelength of ~60px; and
 *   2. **individual fibre nicks** — 1–2px catches, one per tooth.
 *
 * A single-frequency noise (`sin` per tooth, which is what an earlier version used)
 * can express neither: it is a triangle wave, and at 140 teeth it looked like a
 * mountain range. The slow component below is a smoothed value-noise over tooth
 * index; the nicks are added on top. `NOISE` controls the wander, `NICK` the bite.
 */
const WANDER_POINTS = 26;   // ≈ one control point every 30px of a 806-unit page
const NOISE = Array.from({ length: WANDER_POINTS + 1 }, (_, i) =>
  Math.sin(i * 1.7 + SEED) * 0.6 + Math.sin(i * 0.9 + 2.3) * 0.4
);
/** smooth value-noise: interpolate between control points, no sharp corners */
function wander(i: number, teeth: number) {
  const t = (i / teeth) * WANDER_POINTS;
  const lo = Math.floor(t);
  const hi = Math.min(WANDER_POINTS, lo + 1);
  return NOISE[lo] + (NOISE[hi] - NOISE[lo]) * smoothstep(t - lo);
}

function deckle(line: (x: number) => number, amp: number, teeth: number): [number, number][] {
  return [
    [0, line(0)],
    ...Array.from({ length: teeth }, (_, i): [number, number] => {
      const x = ((i + 0.5) / teeth) * W;
      /* The proportion here is the whole trick, and getting it backwards is what
         produced a mountain range twice:
           • the WANDER is most of the movement — the edge genuinely drifts up and
             down across the page, and that drift is what the reference's 2.2%
             depth actually measures;
           • the NICKS are tiny — a fibre catch is 1–2px on screen, not 8. At
             0.55·amp they were 14px teeth and the tear read as a saw blade.
         A gate can be satisfied by a zigzag; an eye cannot be fooled by one. */
      const nick = i % 2 === 0 ? amp * 0.10 : -amp * 0.035;
      const deep = i % 37 === 11 ? -amp * 0.55 : 0;   // an occasional real catch
      return [x, line(x) + wander(i, teeth) * amp + nick + deep];
    }),
    [W, line(W)],
  ];
}

const level = () => H / 2;
const DECKLE = deckle(level, AMP, TEETH_LEVEL);
const RISE_DECKLE = deckle(riseEdge, AMP_RISE, TEETH_RISE);

/**
 * Fill from the deckle UP to the band's TOP — i.e. the sheet is the part *below*
 * the torn edge, and everything above it is left transparent so the parent's
 * photograph shows through.
 *
 * The previous version filled downward (`M0 0 … Z`), which paints the region
 * *above* the edge. Inside a section whose own background matches, the two are
 * indistinguishable — but the moment the tear sits in its own box (the hero) it
 * showed as a solid dark strip with a deckle beneath it. Filling upward is
 * self-evident: a torn sheet rises to the top of its box or it is not a tear.
 */
function tearPath(pts: [number, number][], height: number, offsetY = 0): string {
  const p = pts.map(([x, y]) => [x, y + offsetY] as [number, number]);
  let d = `M0 ${height} L0 ${p[0][1]}`;
  for (const [x, y] of p) d += ` L${x} ${y}`;
  d += ` L${W} ${p[p.length - 1][1]} L${W} ${height} Z`;
  return d;
}

const BAND = tearPath(DECKLE, H);
const FIBRE = tearPath(DECKLE, H, 1.5);
const RISE_BAND = tearPath(RISE_DECKLE, HR);
const RISE_FIBRE = tearPath(RISE_DECKLE, HR, 1.5);

const tones = {
  cream: "text-cream",
  "cream-deep": "text-cream-deep",
  forest: "text-forest",
  "forest-deep": "text-forest-deep",
  sand: "text-sand",
} as const;

export function TornEdge({ tone = "cream", edge = "bottom", rise, className }: Props) {
  const viewBox = `0 0 ${W} ${rise ? HR : H}`;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 select-none",
        rise ? "top-0" : edge === "bottom" ? "bottom-0" : "top-0 rotate-180",
        tones[tone],
        className
      )}
      style={rise ? undefined : { height: "var(--a2-tear-h)" }}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="block h-full w-full"
        role="presentation"
        data-orn="tear"
      >
        <path d={rise ? RISE_BAND : BAND} fill="currentColor" />
        <path
          d={rise ? RISE_FIBRE : FIBRE}
          fill="none"
          stroke="var(--a2-tear-shadow)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/**
 * TornEdgeWithArt — a torn band that carries the Odisha vignette *on the paper*,
 * crossing the tear. This is the mockup's composition: the illustration is printed
 * on the cream sheet and the photo tears away above it, so the mark must sit over
 * the paper colour, not over the photograph.
 */
export function TornEdgeWithArt({
  tone = "cream",
  children,
  className,
}: Props & { children: React.ReactNode }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <TornEdge tone={tone} />
    </div>
  );
}
