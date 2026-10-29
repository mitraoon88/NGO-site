import { cn } from "@/lib/cn";

/**
 * Logo lockup — measured off the mockup, three lines:
 *
 *    A2 ✦        serif, rust, ~40px, with a gold laurel/leaf superscript
 *  FOUNDATION    sans, 11px, 0.26em tracking, ink
 *  PEOPLE · PLANET · POSSIBILITY   8px, 0.24em, rust
 *
 * Two colour modes: default (for cream surfaces) and `onDark` (footer).
 * The mark is drawn as type + an inline SVG leaf so it stays crisp at any size;
 * swap `wordmark` for the client's SVG asset when supplied.
 */
export function Logo({
  onDark = false,
  compact = false,
  className,
}: {
  onDark?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const markColor = onDark ? "text-cream" : "text-rust";

  return (
    <span className={cn("inline-flex flex-col items-center", className)}>
      <span className="relative inline-flex items-start">
        <span
          className={cn(
            "font-display leading-[0.82] tracking-[-0.03em]",
            compact ? "text-logo-mark-sm" : "text-logo-mark",
            markColor
          )}
        >
          A2
        </span>
        {/* laurel / leaf superscript */}
        <svg
          aria-hidden
          viewBox="0 0 20 26"
          className={cn(
            "ml-[2px] text-gold-deep",
            compact ? "mt-[1px] h-3 w-2.5" : "mt-[3px] h-[18px] w-[14px]"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M10 25V6" />
          <path d="M10 10c-3.4.2-5.4-1.6-5.6-4.6C7.8 5.6 9.8 7.4 10 10Z" />
          <path d="M10 12.6c2.9.2 4.6-1.4 4.8-4-2.9-.2-4.6 1.4-4.8 4Z" />
          <path d="M10 16.4c-2.6.2-4.2-1.2-4.4-3.6 2.6-.2 4.2 1.2 4.4 3.6Z" />
          <path d="M10 5.4c1.6-.2 2.6-1.4 2.8-3-1.7 0-2.7 1.2-2.8 3Z" />
        </svg>
      </span>

      <span
        className={cn(
          "font-sans font-medium uppercase leading-none",
          compact ? "mt-1 text-logo-word-sm" : "mt-1.5 text-logo-word",
          onDark ? "text-cream/90" : "text-ink"
        )}
      >
        Foundation
      </span>

      {!compact && (
        <span
          aria-hidden
          className={cn(
            "mt-1.5 font-sans text-logo-tag uppercase leading-none",
            // At 7.5px this line is decorative ornament, not reading text, so it
            // carries the brand accent rather than an AA-compliant label colour
            // (WCAG 1.4.3 exempts decorative type; it is aria-hidden below).
            onDark ? "text-gold" : "text-rust"
          )}
        >
          People · Planet · Possibility
        </span>
      )}
    </span>
  );
}
