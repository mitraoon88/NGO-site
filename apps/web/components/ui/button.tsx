import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/icons";

/**
 * Button — the mockup uses exactly four treatments. Nothing else is allowed.
 *
 *   rust           solid rust token, white label         → primary action
 *   outline-light  transparent, 1px white/55 border      → secondary on photography
 *   cream          solid cream on photography/dark       → Get Involved cards
 *   link           text + arrow, no fill                 → "Read Story →"
 *
 * Geometry is measured: 48px tall, 3px radius, 14px/600 label, 12px gap to arrow.
 */

type Variant = "rust" | "outline-light" | "cream" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-3 font-sans font-semibold " +
  "transition-colors duration-[180ms] ease-a2 disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<Variant, string> = {
  rust: "bg-rust text-white hover:bg-rust-hover active:bg-rust-active rounded-btn",
  "outline-light":
    "rounded-btn border border-white/55 text-white hover:bg-white/12 backdrop-blur-[2px]",
  cream: "rounded-btn bg-cream text-ink hover:bg-white",
  link: "text-rust-text hover:text-rust px-0 rounded-none",
};

/**
 * Sizes are **44px minimum on every variant**. `sm` used to be 40px, which is a
 * comfortable mouse target and a bad thumb target — and it failed the 44px rule
 * the gate enforces (WCAG 2.5.5). The height difference between `sm` and `md` is
 * now carried by padding and type, not by shaving the touch target.
 */
const sizes: Record<Size, string> = {
  sm: "h-11 px-4 text-note",
  md: "h-12 px-5 text-ui",
  lg: "h-[52px] px-6 text-ui",
};

export function buttonClass(variant: Variant = "rust", size: Size = "md", className?: string) {
  return cn(
    base,
    variants[variant],
    variant === "link" ? "h-auto" : sizes[size],
    className
  );
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "rust",
  size = "md",
  withArrow = false,
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
      {withArrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant = "rust",
  size = "md",
  withArrow = false,
  className,
  children,
  ...props
}: CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass(variant, size, className)} {...props}>
      {children}
      {withArrow && <Arrow />}
    </a>
  );
}

/** Arrow nudges right on hover — the only motion on a button. */
function Arrow() {
  return (
    <IconArrowRight
      size={18}
      className="transition-transform duration-300 ease-a2 group-hover:translate-x-1"
    />
  );
}
