import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/icons";

/**
 * ArrowChip — the 36px encircled arrow on focus cards, news cards and carousels.
 * Hover is driven by the *parent* (`.group`), so the whole card is the target.
 * States: outline → rust fill + white arrow. Disabled variant for carousel edges.
 */
export function ArrowChip({
  size = "md",
  onDark = false,
  disabled = false,
  className,
  label,
}: {
  size?: "sm" | "md";
  onDark?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border transition-colors duration-300 ease-a2",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        onDark
          ? "border-cream/45 text-cream group-hover:border-cream group-hover:bg-cream group-hover:text-forest"
          : "border-ink/35 text-ink group-hover:border-rust group-hover:bg-rust group-hover:text-white",
        disabled && "opacity-40 group-hover:border-ink/35 group-hover:bg-transparent group-hover:text-ink",
        className
      )}
    >
      <IconArrowRight
        size={size === "sm" ? 15 : 16}
        className="transition-transform duration-300 ease-a2 group-hover:translate-x-0.5"
      />
    </span>
  );
}
