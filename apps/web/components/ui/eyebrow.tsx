import { cn } from "@/lib/cn";

/**
 * Eyebrow — the `01 | OUR PURPOSE ——` device that opens every section.
 *
 * Measured from the mockup: 12px caps, 0.18em tracking, 600 weight, rust text,
 * with a numeral, a 1px vertical rule, the label, then a 52px horizontal rule.
 * On dark sections the colour flips to gold and the rules to gold/35.
 */
export function Eyebrow({
  num,
  children,
  onDark = false,
  withLine = true,
  className,
}: {
  num?: string;
  children: React.ReactNode;
  onDark?: boolean;
  withLine?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-3 font-sans text-eyebrow font-semibold uppercase",
        onDark ? "text-gold" : "text-rust-text",
        className
      )}
    >
      {num && (
        <>
          {/* no opacity: a 90%-alpha rust numeral lands at 4.78:1 on cream,
            which fails AA at 12px. The numeral is part of the label. */}
        <span className="tabular-nums">{num}</span>
          <span
            aria-hidden
            className={cn("h-4 w-px", onDark ? "bg-gold/40" : "bg-rust-text/35")}
          />
        </>
      )}
      <span>{children}</span>
      {withLine && (
        <span
          aria-hidden
          className={cn("h-px w-[52px]", onDark ? "bg-gold/40" : "bg-rust-text/35")}
        />
      )}
    </p>
  );
}
