import { cn } from "@/lib/cn";

/**
 * Foliage — the botanical line-art that lives in the page margins.
 *
 * The mockup's foliage is *engraved*: each leaf is an almond outline with a
 * midrib and 6–9 diagonal veins, and a spray is a fan of 5–7 leaves of falling
 * size on a single curving stem, drawn twice (a pale back layer, a deeper front
 * layer). The hatching is the whole character of the mark — plain outlines read
 * as weeds, so the vein geometry is part of the spec.
 *
 * Contrast: `foliage` is 1.95:1 on cream and that is correct. This is decoration
 * with no information in it (WCAG 1.4.11 exempts purely decorative graphics);
 * anything that *labels* something uses `ochre` (4.61:1).
 *
 * Geometry note: a leaf is drawn base-at-origin, tip at (0, −len), and every vein
 * is clamped inside the almond's half-width. An earlier version flipped the group
 * vertically to draw "upward", which put every vein *outside* the leaf — the
 * shape then read as a thin needle inside a cage.
 */

type Props = { className?: string };

function Leaf({
  x = 0,
  y = 0,
  len = 60,
  wid = 17,
  rotate = 0,
  veins = 7,
  opacity = 1,
  strokeWidth = 1.1,
}: {
  x?: number;
  y?: number;
  len?: number;
  wid?: number;
  rotate?: number;
  veins?: number;
  opacity?: number;
  strokeWidth?: number;
}) {
  // vein pairs, each from the midrib out to the edge, shortening toward the tip
  let veinPath = "";
  for (let i = 1; i <= veins; i++) {
    const t = i / (veins + 1);
    const vy = -len * t;
    const hw = wid * Math.sin(Math.PI * t) * 0.78;
    const drop = len * 0.055;
    veinPath += `M0 ${vy.toFixed(1)} Q${(hw * 0.5).toFixed(1)} ${(vy - drop * 0.4).toFixed(1)} ${hw.toFixed(1)} ${(vy - drop).toFixed(1)} `;
    veinPath += `M0 ${vy.toFixed(1)} Q${(-hw * 0.5).toFixed(1)} ${(vy - drop * 0.4).toFixed(1)} ${(-hw).toFixed(1)} ${(vy - drop).toFixed(1)} `;
  }

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      {/* almond: two symmetric quadratics from base to tip */}
      <path
        d={`M0 0 C${wid} ${-len * 0.3} ${wid * 0.8} ${-len * 0.78} 0 ${-len} C${-wid * 0.8} ${
          -len * 0.78
        } ${-wid} ${-len * 0.3} 0 0 Z`}
      />
      {/* midrib */}
      <path d={`M0 0 L0 ${-len}`} opacity=".85" />
      {/* veins — always inside the outline */}
      <path d={veinPath} opacity=".5" strokeWidth={strokeWidth * 0.8} />
    </g>
  );
}

/** One spray: a curving stem with leaves fanning off it, sizes falling off. */
export function FoliageSpray({ className }: Props) {
  const leaves: Array<[number, number, number, number, number]> = [
    // [stemX, stemY, len, wid, rotateDeg]
    [96, 336, 96, 26, -34],
    [88, 286, 88, 24, 26],
    [80, 236, 78, 21, -44],
    [72, 190, 66, 18, 18],
    [64, 148, 54, 15, -52],
    [58, 112, 42, 12, 10],
  ];

  return (
    <svg
      viewBox="0 0 200 420"
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* stem: one gentle S, drawn past the last leaf so it reads as a branch */}
      <path d="M104 420C100 372 96 320 88 268c-8-52-14-98-20-140" />

      {/* pale back layer — the mockup's second, lighter pass */}
      <g opacity=".4">
        <Leaf x={90} y={300} len={104} wid={28} rotate={-14} veins={8} />
        <Leaf x={80} y={220} len={82} wid={22} rotate={34} veins={7} />
      </g>

      {/* front layer */}
      {leaves.map(([x, y, len, wid, rotate], i) => (
        <Leaf
          key={i}
          x={x}
          y={y}
          len={len}
          wid={wid}
          rotate={rotate}
          veins={Math.max(4, 9 - i)}
          opacity={1 - i * 0.04}
        />
      ))}
    </svg>
  );
}

/** The 3-leaf cutting — the same engraved construction at glyph scale. */
export function LeafSprig({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* stem, bottom-left to top-right */}
      <path d="M10 58C20 50 30 38 40 24" />
      {/* three leaves: two fanned left, one right */}
      <Leaf x={22} y={44} len={26} wid={9} rotate={-128} veins={5} />
      <Leaf x={31} y={32} len={24} wid={8} rotate={-146} veins={4} opacity={0.9} />
      <Leaf x={34} y={34} len={22} wid={8} rotate={-38} veins={4} opacity={0.95} />
      <Leaf x={40} y={24} len={17} wid={6} rotate={-24} veins={3} opacity={0.8} />
    </svg>
  );
}

/** Mirrored pair for the footer's bottom corners. */
export function FoliageCorner({
  side = "left",
  className,
}: Props & { side?: "left" | "right" }) {
  return (
    <FoliageSpray
      className={cn(
        "absolute -bottom-4 -z-10 w-[130px] text-foliage/40 sm:w-[160px]",
        side === "left" ? "-left-10 rotate-[6deg]" : "-right-10 -scale-x-100 rotate-[6deg]",
        className
      )}
    />
  );
}
