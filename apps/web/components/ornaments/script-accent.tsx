import { cn } from "@/lib/cn";
import { LeafSprig } from "./foliage";

/**
 * ScriptAccent — the Parisienne flourish on the hero, right of the headline:
 * "Stronger / Communities / Brighter / Futures", indented line by line, rotated
 * ≈ −6°, with a hand-drawn leaf alongside.
 *
 * Rules that keep it from becoming decoration soup:
 *   1. **Once per page.** The Analysis memo calls it "the only script on the page".
 *   2. **Never body copy.** It is a visual echo of the headline, so it is
 *      `aria-hidden` — nothing is lost if a screen reader skips it.
 *   3. Sizes come from the `script*` type tokens; the component adds no values.
 *
 * On photography it uses cream + a soft legibility scrim (`shadow-script`); on
 * paper it uses `rust-text`. The component owns that pairing so callers can't get
 * it wrong.
 */

type Props = {
  lines?: string[];
  tone?: "light" | "dark";
  withLeaf?: boolean;
  className?: string;
};

const steps = ["text-script", "text-script-sm", "text-script", "text-script-xs"] as const;
const indents = ["", "ml-[0.55em]", "ml-[1.5em]", "ml-[2.15em]"] as const;

export function ScriptAccent({
  lines = ["Stronger", "Communities", "Brighter", "Futures"],
  tone = "light",
  withLeaf = true,
  className,
}: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative select-none",
        "origin-left -rotate-[6deg]",
        className
      )}
    >
      <div className="flex flex-col">
        {lines.map((line, i) => (
          <span
            key={line}
            className={cn(
              "font-script",
              steps[i % steps.length],
              indents[i % indents.length],
              tone === "light" ? "text-cream [text-shadow:var(--a2-shadow-script)]" : "text-rust-text"
            )}
          >
            {line}
          </span>
        ))}
      </div>

      {withLeaf && (
        <LeafSprig
          className={cn(
            // Own slot, right of the widest line and level with the last two:
            // positioned, not flexed, so no indentation can push the script into it.
            "absolute -right-8 -bottom-6 h-8 w-8 rotate-12 sm:-bottom-7 sm:h-10 sm:w-10",
            tone === "light" ? "text-cream/90" : "text-ochre"
          )}
        />
      )}
    </div>
  );
}
