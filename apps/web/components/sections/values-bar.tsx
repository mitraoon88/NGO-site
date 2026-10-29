import { ValueItem } from "@/components/ui/value-item";
import { values } from "@/content/home";
import type { IconName } from "@/components/ui/icon-ornament";

/**
 * ValuesBar — four principles sitting on the torn-paper edge.
 *
 * Its job is to convert the hero's emotion into a *method statement* before the
 * reader scrolls any further, so it is deliberately quiet: no heading, no CTA,
 * no surface of its own. It is the tear's payload.
 *
 * Layout: 4 columns on desktop with hairline rules between them; 2×2 at 768;
 * one column at 390. The rules are drawn as borders on every item except the
 * first, and turned off at the breakpoints where the grid wraps — a wrapped grid
 * with vertical rules draws a line down the middle of a row, which reads as a
 * table rather than a rhythm.
 */
export function ValuesBar() {
  return (
    <section aria-label="What we stand for" className="bg-cream">
      <div className="a2-container py-7 sm:py-8 lg:py-9">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-0">
          {values.map((v, i) => (
            <li
              key={v.label}
              className={
                // rules only where a neighbour sits beside the item
                i === 0
                  ? "lg:pr-6"
                  : "lg:border-l lg:border-sand lg:pl-6 lg:pr-6 last:lg:pr-0"
              }
            >
              <ValueItem icon={v.icon as IconName} label={v.label} note={v.note} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
