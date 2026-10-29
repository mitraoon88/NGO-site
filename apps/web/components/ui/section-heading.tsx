import { cn } from "@/lib/cn";
import { Eyebrow } from "./eyebrow";

/**
 * SectionHeading — every section opens with: eyebrow → H2 → optional subline.
 * In three sections (Stories, Partners, News) an action sits on the right
 * baseline (carousel arrows, "View All →").
 *
 * `italicLast` renders the last word of the title in italic rust, exactly as
 * the Purpose heading does ("…and sustainable *Tomorrow.*").
 */
export function SectionHeading({
  num,
  eyebrow,
  title,
  italicLast,
  subline,
  onDark = false,
  align = "left",
  action,
  as: Tag = "h2",
  className,
}: {
  num?: string;
  eyebrow: string;
  title: React.ReactNode;
  italicLast?: string;
  subline?: React.ReactNode;
  onDark?: boolean;
  align?: "left" | "center";
  action?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className
      )}
    >
      <div className={cn("max-w-copy", align === "center" && "mx-auto")}>
        <Eyebrow num={num} onDark={onDark}>
          {eyebrow}
        </Eyebrow>

        <Tag
          className={cn(
            "mt-4 text-balance font-display text-h2 font-normal tracking-[-0.02em]",
            onDark ? "text-cream" : "text-ink"
          )}
        >
          {title}
          {italicLast && (
            <>
              {" "}
              <em className="italic text-rust-text">{italicLast}</em>
            </>
          )}
        </Tag>

        {subline && (
          <p
            className={cn(
              "mt-3 max-w-copy-sm text-pretty text-body-sm leading-relaxed sm:text-body",
              onDark ? "text-cream/72" : "text-ink-soft"
            )}
          >
            {subline}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
