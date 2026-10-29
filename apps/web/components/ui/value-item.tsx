import { cn } from "@/lib/cn";
import { IconOrnament, type IconName } from "./icon-ornament";

/**
 * ValueItem — one of the four principles on the torn-paper bar.
 *
 * Measured from the mockup: a 28px line icon, then an 11px caps label (ink, 600,
 * 0.12em) over a 10px note (ink-soft). The four items sit in one row on desktop,
 * 2×2 at 768, and one column at 390 — the mockup only shows the desktop state, so
 * the wrap behaviour is a build decision documented in docs/09.
 *
 * Separators are drawn by the *bar*, not by the item, so an item can be reordered
 * or added without its neighbours' borders falling out of step.
 */
export function ValueItem({
  icon,
  label,
  note,
}: {
  icon: IconName;
  label: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-4">
      {/* The mockup's icons are larger than the 16px UI default and carry the
          brand's two inks: rust for the community/heart marks, gold-deep for the
          botanical ones. That split is in the mockup, so it is reproduced here. */}
      <IconOrnament
        name={icon}
        size={30}
        className={cn(
          "mt-0.5",
          icon === "leaf" || icon === "sprout" || icon === "leaves"
            ? "text-gold-deep"
            : "text-rust"
        )}
      />
      <div className="min-w-0">
        <p className="font-sans text-micro font-semibold uppercase tracking-[0.12em] text-ink">
          {label}
        </p>
        <p className="mt-1 font-sans text-nano leading-snug tracking-normal text-ink-soft">
          {note}
        </p>
      </div>
    </div>
  );
}
