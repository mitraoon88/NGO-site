import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buttonClass } from "@/components/ui/button";
import { IconArrowRight, IconQuote } from "@/components/icons";
import { IconOrnament, type IconName } from "@/components/ui/icon-ornament";
import { FoliageSpray } from "@/components/ornaments/foliage";
import { impact } from "@/content/home";

/**
 * Impact — the dark act in the page's three-beat cadence.
 *
 * Two defects in the mockup are fixed here, both listed in Analysis §8-B:
 *
 *  1. **The plant photograph no longer eats the copy.** In the mockup an oversized
 *     leaf crop covers the body paragraph and part of the CTA. Here it is capped
 *     at 30% of the band, anchored bottom-right, and sits *behind* the text layer
 *     with the grid reserving space for it at large widths.
 *  2. **The testimonial gets its own row.** Inline, the gold quote collided with
 *     the paragraph. It now spans the full width under the stats, which also
 *     gives it the room to be read as the emotional close of the section.
 *
 * The stats are a description list: each numeral and label is one pair, so a
 * screen reader announces "150K+, Lives Touched" as a unit rather than reading
 * four stray numbers.
 */
export function Impact() {
  return (
    <section
      aria-labelledby="impact-title"
      className="a2-relative overflow-hidden bg-forest"
    >
      {/* botanical line-art at both margins, plus the plant photograph */}
      <FoliageSpray className="pointer-events-none absolute -left-14 top-1/4 hidden w-[180px] text-foliage/25 md:block" />
      <FoliageSpray className="pointer-events-none absolute -right-16 bottom-0 hidden w-[200px] -scale-x-100 text-foliage/20 md:block" />

      <div className="a2-container a2-section relative z-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] lg:items-center lg:gap-14">
          {/* ── statement ───────────────────────────────────────────────── */}
          <div className="max-w-copy">
            <Eyebrow num={impact.num} onDark>
              {impact.eyebrow}
            </Eyebrow>

            <h2
              id="impact-title"
              className="mt-5 font-display text-h2 font-normal leading-[1.04] tracking-[-0.02em] text-cream"
            >
              {impact.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <p className="mt-6 max-w-[34ch] text-pretty font-sans text-body leading-relaxed text-cream/78">
              {impact.body}
            </p>

            <Link href={impact.cta.href} className={buttonClass("rust", "md", "mt-8")}>
              {impact.cta.label}
              <IconArrowRight size={16} />
            </Link>
          </div>

          {/* ── stats ───────────────────────────────────────────────────── */}
          <div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 sm:gap-x-0">
              {impact.stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={
                    "sm:px-4 " + (i === 0 ? "sm:pl-0" : "sm:border-l sm:border-gold/22")
                  }
                >
                  <IconOrnament
                    name={stat.icon as IconName}
                    size={26}
                    className="text-gold"
                  />
                  <dd className="mt-3 font-display text-stat font-normal leading-none tracking-[-0.01em] text-cream tabular-nums">
                    {stat.value}
                  </dd>
                  <dt className="mt-2 font-sans text-note leading-snug text-cream/70">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>

            {/* ── testimonial, now its own row ───────────────────────────── */}
            <figure className="mt-9 border-t border-gold/22 pt-7">
              <IconQuote size={26} className="text-gold" aria-hidden />
              <blockquote className="mt-3">
                <p className="max-w-[46ch] text-balance font-display text-h4 italic leading-relaxed text-cream">
                  {impact.testimonial.quote}
                </p>
              </blockquote>
              <figcaption className="mt-3 font-sans text-note text-cream/65">
                — {impact.testimonial.attribution}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      {/* the plant photograph, capped so it cannot cover the copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 hidden h-[70%] w-[30%] max-w-[380px] lg:block"
      >
        <Image
          src="/images/ph-focus-environment.jpg"
          alt=""
          width={700}
          height={438}
          sizes="30vw"
          className="h-full w-full object-cover opacity-70 [mask-image:linear-gradient(to_top,black_35%,transparent)]"
        />
      </div>
    </section>
  );
}
