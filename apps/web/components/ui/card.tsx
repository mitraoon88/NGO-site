import { cn } from "@/lib/cn";

/**
 * Card — three shapes only, all measured off the mockup:
 *   .card-flat   cream-deep fill + hairline, 4px radius, no shadow
 *   .card-photo  photo flush to the top edge, body below (Focus Areas)
 *   .card-inline no surface at all; thumb + text column (Stories)
 *
 * The design is deliberately flat — separation comes from the cream/cream-deep
 * contrast, not from shadows. Adding a shadow breaks the character.
 */

export function Card({
  variant = "flat",
  interactive = true,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "flat" | "photo" | "inline" | "paper";
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative",
        variant === "flat" && "rounded-card border border-hair bg-cream-deep",
        variant === "photo" && "overflow-hidden rounded-card border border-hair bg-cream-deep",
        // "paper" = the polaroid frame used by the Purpose collage
        variant === "paper" && "rounded-photo border border-hair bg-cream p-1.5",
        variant === "inline" && "flex gap-5",
        interactive && "transition-colors duration-300 ease-a2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Card media wrapper — keeps the photo inside the corner radius, scales on hover. */
export function CardMedia({
  ratio = "16/10",
  className,
  children,
}: {
  ratio?: "16/10" | "4/5" | "1/1" | "3/2";
  className?: string;
  children: React.ReactNode;
}) {
  const ratios = {
    "16/10": "aspect-[16/10]",
    "4/5": "aspect-[4/5]",
    "1/1": "aspect-square",
    "3/2": "aspect-[3/2]",
  } as const;

  return (
    <div className={cn("relative overflow-hidden rounded-photo bg-sand/40", ratios[ratio], className)}>
      <div className="absolute inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-[900ms] [&>img]:ease-a2 group-hover:[&>img]:scale-[1.03]">
        {children}
      </div>
    </div>
  );
}
