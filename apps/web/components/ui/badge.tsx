import { cn } from "@/lib/cn";

/**
 * Tag — the small caps category label above story titles
 * ("EDUCATION", "LIVELIHOODS", "ENVIRONMENT"). Not a pill: no fill, no border,
 * rust text, 11px, 0.14em tracking. That flatness is what keeps the Stories
 * cards looking editorial rather than like tags in a CMS.
 *
 * There is deliberately no `onDark` mode and no dark fill: the light rust/gold
 * accents (peach, gold-deep) measure under 3:1 on forest, so in the mockup these
 * categories only ever sit on cream and only ever use `rust-text`.
 */
export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-sans text-micro font-semibold uppercase leading-none tracking-[0.14em]",
        "text-rust-text", // 5.29:1 on cream, 5.53:1 on cream-deep
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Badge — the only pill in the system, used for the date on news cards and for
 * status labels in the kitchen sink. Kept separate from Tag on purpose.
 *
 * Tones are restricted to combinations that actually pass AA. There is no
 * `forest` tone: cream on forest passes, but an 10px semibold pill is not the
 * place to prove it, and a solid dark pill fights the photography behind it.
 */
export function Badge({
  children,
  tone = "sand",
  className,
}: {
  children: React.ReactNode;
  tone?: "sand" | "rust" | "outline";
  className?: string;
}) {
  const tones = {
    sand: "bg-sand text-ink", //            12.00:1
    rust: "bg-rust-wash text-rust-text", //  5.29:1
    outline: "border border-hair text-ink-soft",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-sans text-nano font-semibold uppercase leading-none",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
