"use client";

/**
 * OdishLineArt — the site's signature mark.
 *
 * A pen-and-ink vignette printed across the torn margin under the hero. Composed
 * from the reference's own inventory, left to right: a single nervous line at the
 * sheet's left extremity, stippled scrub, a boat with two traders at the waterline,
 * low Eastern Ghats tiers, then the dense mass — a tiered temple complex with an
 * arcaded mandapa — a banyan, and a palm grove running off the right edge.
 *
 * **The three measured rules this canvas encodes.**
 *
 *   1. *Mass, not frieze.* On the reference the eight-column ink profile is
 *      `[4, 0, 0, 10, 324, 707, 523, 288]`: nothing before 40% but thin ground
 *      strokes, everything from 62% rightward, densest at 70–88% (centroid 0.775).
 *      An evenly-spread drawing reads as wallpaper; that was the first pass's
 *      failure. The left third here is deliberately empty.
 *   2. *The sheet rises, so the mark does too.* The paper edge climbs ~8.7% of the
 *      page width toward the right, and the ink grows with it: a scribble ~10px
 *      tall at the left, ~45px at the boat, ~110px through the temple, and the
 *      palms running past the top of the ribbon and being cropped by the tear.
 *      That growth is the drawing's whole perspective.
 *   3. *It is printed, not placed.* The mark bleeds 3px past the right edge, is
 *      cropped by it, and the ink is allowed to sit on paper that is only a sliver
 *      deep at the left. Nothing is centred in a tidy clearing.
 *
 * The canvas is 1200×150 (8:1) to cover the deepest point of the ribbon; it is
 * pinned to the tear's top edge and given a width, so height follows the aspect and
 * no `slice` crop is ever needed.
 *
 * Rules inherited from the Phase 1 icon system:
 *   1. `currentColor` only — the parent decides the ink.
 *   2. `aria-hidden` — decoration; its meaning is in the copy.
 *   3. 1.3–1.6px stroke, no fills, whole-unit geometry, so it prints from vector.
 */

import { useEffect, useRef } from "react";
import { riseEdge } from "./torn-edge";

/**
 * Pixel height of the tear band the mark is printed on. It has to be the same
 * number the hero uses (`h-[16vw]`), because the anchors are computed in the tear's
 * own 0…150 coordinate space and then converted to CSS pixels.
 */
const VB_H = 192;

/** the band the mark is printed in, as a share of the viewport width */
const BAND_PX = 0.16;

/**
 * anchorMark — place each motif against the torn edge, measured rather than assumed.
 *
 * Every group carries `data-a="X Y S"`: its intended x, the y in the drawing that
 * should sit on the paper edge, and the vertical squash that brings the vignette to
 * the reference's proportion. For each anchor we ask the deckle where the sheet
 * actually is at that x (`riseEdge`, the same function that draws the tear), convert
 * that to pixels, and set a transform on the group.
 *
 * Why after mount and not in the markup: the mapping depends on the rendered band
 * height, which is fluid (16vw). On the server we emit the same paths untransformed,
 * so the markup is identical for every client and hydration is silent; the effect
 * then puts the ink on the paper. This is geometry, not animation, so it does not
 * consult `prefers-reduced-motion`.
 */
function anchorMark(root: SVGSVGElement | null, vbW: number, vbH: number) {
  if (!root) return;
  const box = root.getBoundingClientRect();
  const bandPx = root.parentElement?.getBoundingClientRect().height ?? 0;
  if (!bandPx || !box.width || !box.height) return;
  // This svg is 8:1 inside a 6.25:1 band, so its OWN scale (box.height/150) is not
  // the band's (bandPx/150). Using the band's scale here put every motif ~45 units
  // above the tear — on the photograph, where the ink is invisible.
  const kY = box.height / vbH;          // css px per drawing unit, vertically
  // the svg is pinned to the band's foot, so its top sits above the band's top by
  // (band − box): every band-px measurement has to be shifted by that much before
  // it becomes a drawing unit.
  const svgTop = bandPx - box.height;

  for (const g of Array.from(root.querySelectorAll<SVGGElement>("[data-a]"))) {
    const [ax, , maxSc] = g.dataset.a!.split(",").map(Number);
    const bb = g.getBBox();
    if (!bb.height) continue;

    // The cream between the torn edge and the foot of the band is the printed
    // area, and it is narrow at the left and wide at the right. So each motif is
    // scaled to FIT that space and sat on the band's foot — the reference's ink is
    // deepest on the right for exactly this reason. Nothing is hand-sized: the
    // wedge sets the scale, which is why the drawing grows to the right.
    const edgePx = (riseEdge(ax) / 150) * bandPx - svgTop;   // sheet edge, in svg px
    // both clearances are fractions of the band, not pixel constants: a 34px foot
    // is a sixth of a 230px band and more than the whole of a 120px one, which is
    // how the phone variant ended up with motifs squeezed to slivers.
    const foot0 = bandPx * FOOT;
    const room = bandPx - foot0 - edgePx - bandPx * GAP;   // px of cream available
    const sc = Math.max(0.08, Math.min(maxSc, room / (bb.height * kY)));
    const foot = (box.height - foot0) / kY;            // band foot, in drawing units

    const ty = foot - (bb.y + bb.height) * sc;
    g.setAttribute("transform", `matrix(1 0 0 ${sc} ${ax} ${ty}) translate(${-ax} 0)`);
  }
}

/** bare sheet under the mark, and clearance under the tear — as shares of the band */
const FOOT = 0.14;
const GAP = 0.015;

type Props = {
  className?: string;
  /** geometry is fixed by the canvas; a caller may still size the box */
  style?: React.CSSProperties;
  /** decorative by default; pass a title only if it ever carries meaning */
  title?: string;
  /**
   * printed on a torn band: derive each motif's scale and position from the tear.
   * Off by default so specimen instances on /ornaments keep their drawn layout
   * instead of being re-anchored against whatever box they happen to sit in.
   */
  band?: boolean;
};

const svgProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * The vignette is drawn once, then sheared onto the tear. A shear distorts stroke
 * width by direction (a 0.3 squash would thin every horizontal pen line to a
 * third), so the pen is pinned to the viewport with `vector-effect`. Declared here
 * rather than in a global stylesheet: it belongs to this drawing.
 */
const INK = "[&_path]:[vector-effect:non-scaling-stroke]";

export function OdishLineArt({ className, style, title, band }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (band) anchorMark(ref.current, 1200, VB_H);
  }, [band]);
  return (
    <svg
      ref={ref}
      viewBox="0 0 1200 192"
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className ? `${INK} ${className}` : INK}
      {...svgProps}
    >
      {title && <title>{title}</title>}

      {/* THE SHEAR IS THE WHOLE TRICK. On the reference the ink hugs the torn edge
          the entire way across: it is *printed on the sheet*, so when the sheet rises
          toward the right, the drawing rises with it. Drawn flat, the mark either
          floats over the photograph at the left or sinks to the bottom of the band at
          the right. So the group carries a vertical shear tuned to the tear's own
          slope (≈0.13 canvas units per unit) plus a flattening to 0.20, which brings
          the ink ribbon to the reference's proportion: a median 4% of the page width
          deep, 92% wide, mass at 0.78. The slope is the tear's own 80-units-over-the
          -width, and the offset puts the ground line just inside the sheet — the previous
          value left the ink on the photograph, where ochre on forest is all but
          invisible — so
          the ink straddles the deckle exactly as printed ink on torn paper does. `non-scaling-stroke` (set on the element
          below) keeps every pen line 1.45px however the matrix squeezes it. */}

      {/* ── x 0.05–0.35 · the sparse left edge ─────────────────────────────────
          The reference's ink starts 7% of the page in, as almost nothing: a thin
          torn line riding the paper, a few reeds, a couple of distant marks. That
          thin 30% is why its bbox spans 92% of the width while its mass sits at
          0.78 — an empty left is not the same as a short drawing. */}
      <g data-a="150,130,0.55" opacity=".55" strokeWidth="1.1">
        <path d="M40 132c26-4 48-5 70-2 20 3 38 2 56-2 16-4 30-3 44 2 12 4 24 4 38 1" />
        <path d="M60 140c18-2 34-2 50 0M120 141c14-2 26-2 38 0M210 139c16-2 30-2 44 0" />
        <path d="M96 128l4-8M104 128l2-6M170 130l4-7M178 130l2-5M262 128l4-8" />
        <path d="M300 122c5-3 9-3 12 0M322 116c4-3 8-3 11 0" opacity=".8" />
      </g>

      {/* ── x 0.36–0.55 · the far line, scrub, and the waterline ─────────────
          The reference's first ink is a single torn line riding the paper at 7% of
          the width; the left third is otherwise bare. Filling it in is what made an
          earlier pass read as wallpaper. */}
      <g data-a="700,66,0.62" opacity=".85" strokeWidth="1.15">
        <path d="M436 118c10-3 18-4 26-2 7 2 12 0 18-3 6-3 12-3 18 0 5 3 10 4 16 2" />
        <path d="M442 126c8-2 15-2 22 0M452 132c7-2 13-2 19 0" opacity=".7" />
      </g>
      <g opacity=".5" strokeWidth="1.1">
        <path d="M492 122l4-7M500 122l2-5M508 121l4-6M517 122l2-4M526 121l4-5M535 122l2-4" />
        <path d="M492 132c22-3 42-4 62-2M504 139c18-2 34-2 50 0" />
        <path d="M548 134c14-2 26-2 38 0" />
      </g>

      {/* ── x 0.44–0.56 · the boat and its two traders ──────────────────────
          The strongest motif on the left, riding high where the deckle dips. */}
      <g data-a="640,74,0.95">
        <path d="M528 104c6 9 16 13 29 13h56c13 0 22-4 27-13" />
        <path d="M528 104h112" />
        <path d="M542 104l7-11h70l7 11" />
        <path d="M585 93V60M572 64h26" />
        <path d="M542 104l-12-6 3-7" />
        <g strokeWidth="1.25">
          <path d="M557 93v-9M553 84a3.4 3.4 0 116.8 0M557 77v-3" />
          <path d="M605 93v-8M601 85a3.2 3.2 0 116.4 0" />
        </g>
        <path d="M521 110c-24 2-42 4-58 7" opacity=".6" />
      </g>

      {/* ── x 0.55–0.70 · the ghats, three receding tiers ────────────────────
          Ridges, not clouds: a hard crest line with an engraver's hatch beneath,
          stepping down to the right where the temple mass begins. */}
      <g data-a="900,60,0.66">
        <path d="M632 84c16-10 30-17 44-18 13 0 18 6 31 7 12 1 20-5 33-4 15 1 22 9 37 10" />
        <path d="M660 96c14-7 24-11 36-10 11 1 15 5 26 6 10 1 17-3 27-2 12 1 18 6 28 8" opacity=".8" />
        <g opacity=".45" strokeWidth="1.1">
          <path d="M646 80l4 6M656 77l5 7M668 80l5 7M682 82l4 6M696 84l5 6M712 82l4 6M726 85l4 5" />
          <path d="M668 96l4 6M684 95l4 6M700 97l4 5M716 96l4 5" />
          <path d="M640 66l3 5M650 63l3 5M662 66l3 5" />
        </g>
      </g>

      {/* ── x 0.70–0.87 · the temple mass: shikhara, flanking towers, arcade ─
          The densest thing in the drawing and the reason the ink centroid sits at
          0.78. Its spires run to the top of the canvas, so they are the tallest
          silhouette and are cropped by the tear as the reference's are. */}
      <g data-a="1116,42,0.52">
        {/* main shikhara + finial */}
        <path d="M762 126V86l7-6v-7l6-6v-7l6-6v-7l7-6 7 6v7l6 6v7l6 6v7l7 6v40" />
        <path d="M788 18V9l7-8 7 8v9" />
        <path d="M795 1V-6" />
        <g opacity=".5" strokeWidth="1.1">
          <path d="M766 112h44M766 100h44M769 88h38M772 76h32M776 64h24M781 54h14" />
          <path d="M792 40l7-4 7 4-7 4z" />
        </g>
        {/* flanking shikharas */}
        <path d="M726 130v-24l6-5v-6l5-5v-6l6-5 6 5v6l5 5v6l6 5v24" />
        <path d="M748 56v-7l4-6 4 6v7" />
        <path d="M826 130v-18l5-4v-5l5-4 5 4v5l5 4v18" />
        <g opacity=".45" strokeWidth="1.1">
          <path d="M729 120h30M731 110h26M734 100h20M737 90h14" />
          <path d="M830 123h24M832 115h20M834 107h16" />
        </g>
        {/* arcaded mandapa in front of the towers */}
        <path d="M846 136V112a8 8 0 0116 0v24M868 136V111a8 8 0 0116 0v25M890 136V111a8 8 0 0116 0v25M912 136V112a8 8 0 0116 0v24M934 136V113a8 8 0 0116 0v23" />
        <path d="M838 108h120M842 102h112" />
        <path d="M830 136h132M822 144h148" />
        {/* small shrine at the foot of the shikhara */}
        <path d="M700 130v-16l8-6 8 6v16M692 130h34M696 120h26" />
        <g opacity=".4" strokeWidth="1.1">
          <path d="M846 136l-5 8M862 136l-4 8M878 136l-4 8M894 136l-4 8M910 136l-4 8M926 136l-4 8" />
        </g>
      </g>

      {/* ── x 0.86–0.99 · banyan, then the palm grove cropped by the edge ───
          The grove is not centred in a clearing: it leaves frame, exactly as in
          the reference. */}
      <g data-a="1200,28,0.46">
        {/* banyan behind, a wide crown */}
        <path d="M968 140c-2-18-1-32 3-44" opacity=".85" />
        <path d="M971 96c-10-4-18-3-25 2M971 96c-8-8-16-10-24-7M971 96c2-9-2-15-9-19M971 96c10-5 14-13 12-21M971 96c11-1 19-6 23-13" opacity=".85" />
        <path d="M956 108c-6 2-11 6-14 11M988 106c6 3 10 8 12 13" opacity=".6" />
        {/* palm 1, tallest */}
        <path d="M1058 152c0-36 2-62 6-86" />
        <path d="M1064 66c-15-9-27-8-37 1M1064 66c-13-14-26-18-38-13M1064 66c1-15-5-25-13-31M1064 66c14-11 18-24 14-35M1064 66c16-4 27-12 31-23" />
        <path d="M1064 66c-4 15-3 28 2 38M1064 66c5 14 12 23 21 29" opacity=".7" />
        {/* palm 2 */}
        <path d="M1122 152c0-29 2-50 5-70" />
        <path d="M1127 82c-12-7-21-6-29 1M1127 82c-11-11-21-14-31-10M1127 82c1-12-4-20-11-25M1127 82c11-9 14-19 11-28" />
        {/* palm 3 and 4, running out of frame */}
        <path d="M1180 152c0-21 1-36 3-50" opacity=".9" />
        <path d="M1183 102c-9-6-16-5-22 1M1183 102c8-7 10-15 8-22M1183 102c9-2 16-7 18-14" opacity=".9" />
        <path d="M1196 152c0-14 1-25 2-34" opacity=".7" />
        <g opacity=".5" strokeWidth="1.1">
          <path d="M1028 148l5-9M1035 148l3-7M1048 148l4-6M1108 148l5-8M1115 148l3-6M1160 148l5-7M1178 148l3-5" />
        </g>
        <path d="M1004 142c40-4 74-4 106-1M1024 146c30-3 56-3 82-1" opacity=".45" />
      </g>

      {/* ── sky notes: an engraved flock over the grove ────────────────────── */}
      <g data-a="1220,24,0.4" opacity=".55" strokeWidth="1.2">
        <path d="M1010 30c5-4 9-4 13 0M1032 20c4-3 8-3 11 0M1052 32c5-4 9-4 13 0" />
        <path d="M1092 14c4-3 8-3 11 0M1128 24c5-3 9-3 12 0" />
      </g>
    </svg>
  );
}

/**
 * OdishLineArtCompact — the same composition re-cropped for narrow viewports:
 * far line, boat, ghats, one shikhara, one palm, at a 520×200 proportion. The mass
 * still sits right of centre and still grows to the right, so the small screen
 * tells the same story as the large one. Re-cropped, never squashed (§K).
 */
export function OdishLineArtCompact({ className, style, title, band }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (band) anchorMark(ref.current, 520, 200);
  }, [band]);
  return (
    <svg
      ref={ref}
      viewBox="0 0 520 200"
      data-band={band ? "" : undefined}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className ? `${INK} ${className}` : INK}
      {...svgProps}
    >
      {title && <title>{title}</title>}

      {/* far line + scrub */}
      <g data-a="40,168,1">
        <path d="M6 128c9-3 16-3 23-2 6 1 10 0 16-3 5-2 10-2 15 0" opacity=".85" strokeWidth="1.15" />
        <g opacity=".5" strokeWidth="1.1">
          <path d="M40 150l4-7M50 150l2-5M60 149l4-6M70 150l2-4" />
          <path d="M30 160c20-3 38-3 56-2M44 168c16-2 30-2 44 0" />
        </g>
      </g>

      {/* boat */}
      <g data-a="150,138,1">
        <path d="M78 126c5 8 14 12 25 12h46c11 0 19-4 23-12" />
        <path d="M78 126h94" />
        <path d="M90 126l6-10h62l6 10" />
        <path d="M126 116v-30M114 89h24" />
        <g strokeWidth="1.2">
          <path d="M104 116v-8M100 108a3 3 0 116 0" />
          <path d="M148 116v-7M144 109a3 3 0 116 0" />
        </g>
      </g>

      {/* ghats */}
      <g data-a="240,108,1">
        <path d="M180 108c14-9 26-15 38-16 12 0 16 5 27 6 11 1 18-4 29-3" />
        <g opacity=".45" strokeWidth="1.1">
          <path d="M192 104l3 5M204 101l4 6M218 104l4 5M234 106l3 5M248 104l3 5" />
        </g>
      </g>

      {/* shikhara + finial, and the arcade at its feet */}
      <g data-a="330,190,1">
        <path d="M300 168V120l7-5v-6l6-5v-6l6-5 6 5v6l6 5v6l7 5v48" />
        <path d="M325 54v-8l6-7 6 7v8" />
        <path d="M331 39v-6" />
        <g opacity=".5" strokeWidth="1.1">
          <path d="M304 152h42M304 138h42M307 124h36M310 112h30M314 100h22M318 90h14" />
        </g>
        <path d="M262 180V160a7 7 0 0114 0v20M352 180V160a7 7 0 0114 0v20" />
        <path d="M254 180h124M246 190h140" />
      </g>

      {/* palm and its neighbour, running off the right edge */}
      <g data-a="470,190,1">
        <path d="M446 190c0-30 2-52 5-70" />
        <path d="M451 120c-12-8-21-7-29 1M451 120c-10-11-20-14-30-10M451 120c1-12-4-19-10-24M451 120c11-9 14-18 11-27" />
        <path d="M490 190c0-18 1-30 3-40" opacity=".85" />
        <path d="M493 151c-8-5-14-4-19 1M493 151c7-6 9-13 7-19" opacity=".85" />
      </g>
    </svg>
  );
}
