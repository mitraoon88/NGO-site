import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * CircleStamp — the faded rubber-stamp impression that overlaps the top-right of
 * the Purpose section in the mockup ("ODISHA · INDIA" inside a ticked ring).
 *
 * Built as live SVG text on a path, not an image, so:
 *   • the ring text stays crisp at any size and can be translated per locale;
 *   • the ink is `currentColor` (default `ochre-soft`) and inherits the surface;
 *   • screen readers get one meaningful string ("Odisha, India") instead of the
 *     ring being read out letter by letter.
 *
 * It is intentionally low-contrast: a real stamp on paper is not 4.5:1, and this
 * element carries no information that is not already in the address line. It is
 * `aria-hidden` by default; pass `label` when the stamp is the only place a fact
 * appears.
 */

type Props = {
  className?: string;
  /** ring text, repeated to fill the circle */
  around?: string;
  /** stacked centre lines */
  lines?: [string, string];
  /** accessible name — omit to mark it decorative */
  label?: string;
};

const RING = 84;          // radius of the text baseline
const C = 100;            // centre
const CIRC = 2 * Math.PI * RING;

export function CircleStamp({
  className,
  around = "ODISHA · INDIA · A2 FOUNDATION",
  lines = ["ODISHA", "INDIA"],
  label,
}: Props) {
  // One id per instance: three stamps on the review sheet would otherwise emit
  // three `#a2-stamp-ring` paths and every textPath would bind to the first —
  // a duplicate-id failure that also silently links the wrong geometry.
  const pathId = `a2-stamp-ring-${useId().replace(/[:]/g, "")}`;
  const repeats = Math.max(1, Math.round(CIRC / (around.length * 9.4)));
  const ringText = Array.from({ length: repeats }, () => around).join(" · ");

  return (
    <div
      className={cn("pointer-events-none select-none", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
        {/* outer + inner rules */}
        <circle cx={C} cy={C} r="96" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
        <circle cx={C} cy={C} r="70" stroke="currentColor" strokeWidth="1.2" opacity=".45" />

        {/* tick ring — 48 dashes, the stitched edge of a real stamp die */}
        <g stroke="currentColor" strokeWidth="1.6" opacity=".6">
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const r1 = 76;
            const r2 = i % 4 === 0 ? 84 : 81;
            return (
              <line
                key={i}
                x1={C + Math.cos(a) * r1}
                y1={C + Math.sin(a) * r1}
                x2={C + Math.cos(a) * r2}
                y2={C + Math.sin(a) * r2}
              />
            );
          })}
        </g>

        {/* ring text on a circular path */}
        <defs>
          <path
            id={pathId}
            d={`M${C} ${C - RING} a${RING} ${RING} 0 1 1 0 ${RING * 2} a${RING} ${RING} 0 1 1 0 ${-RING * 2}`}
          />
        </defs>
        <text
          className="font-sans"
          fill="currentColor"
          fontSize="10.5"
          fontWeight="600"
          letterSpacing="2.4"
          opacity=".85"
        >
          <textPath href={`#${pathId}`} startOffset="0">
            {ringText}
          </textPath>
        </text>

        {/* centre: a small sprig, the two lines, a rule, a second sprig */}
        <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".8">
          <path d="M97 52c3-5 6-7 9-7M97 52c-3-4-6-5-9-4" />
          <path d="M97 148c3 5 6 7 9 7M97 148c-3 4-6 5-9 4" />
        </g>
        <text
          className="font-sans"
          fill="currentColor"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          letterSpacing="3"
        >
          <tspan x={C} y={C - 2}>{lines[0]}</tspan>
        </text>
        <text
          className="font-sans"
          fill="currentColor"
          textAnchor="middle"
          fontSize="13"
          fontWeight="500"
          letterSpacing="3.4"
          opacity=".85"
        >
          <tspan x={C} y={C + 18}>{lines[1]}</tspan>
        </text>
      </svg>
    </div>
  );
}
