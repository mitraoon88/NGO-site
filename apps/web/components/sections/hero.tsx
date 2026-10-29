import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buttonClass } from "@/components/ui/button";
import { IconArrowRight, IconPlay } from "@/components/icons";
import { TornEdge } from "@/components/ornaments/torn-edge";
import { OdishLineArt, OdishLineArtCompact } from "@/components/ornaments/odisha-line-art";
import { ScriptAccent } from "@/components/ornaments/script-accent";
import { hero } from "@/content/home";

/**
 * Hero — the design's centre of gravity.
 *
 * Structure, top to bottom:
 *   photograph (priority, focal point right)
 *   → measured left scrim so cream type has contrast to sit on
 *   → content: eyebrow, 3-line H1, lead, two CTAs
 *   → script accent, right, the only script on the page
 *   → torn edge carrying the Odisha vignette, which is the page's signature
 *
 * **The scrim is a contrast device, not a mood.** Cream on the raw photograph
 * measured well under 4.5:1 wherever the image is bright. `.a2-scrim-hero` is the
 * mockup's own angle and stops, expressed in `tokens.css` terms — it is what makes
 * the type pass rather than a decorative wash. The right-hand third stays clear so
 * the photograph reads.
 *
 * **Everything below the text is ornament.** The tear and the illustration are
 * `aria-hidden`, `pointer-events-none`, and sit behind the content; nothing in
 * the hero depends on them for meaning.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="a2-relative overflow-hidden bg-forest">
      {/* ── photograph ────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          width={hero.image.width}
          height={hero.image.height}
          priority
          sizes="100vw"
          className="a2-ken h-full w-full object-cover object-[62%_center]"
        />
        {/* the measured scrim — a token, because a scrim is a contrast device */}
        <div aria-hidden className="a2-scrim-hero absolute inset-0" />
        {/* a floor wash so the tear always has something to bite into */}
        <div aria-hidden className="a2-scrim-floor absolute inset-x-0 bottom-0 h-40" />
      </div>

      {/* ── content ───────────────────────────────────────────────────────── */}
      {/* `pt` clears the fixed header using the height the header measures for
            itself (`--a2-header-h`), not a constant. At 200% text the bar grows to
            two rows and the hero moves down with it. The 92px fallback is the
            bar's height at the design size, for first paint before the observer
            runs. */}
        <div className="a2-container relative z-20 pb-[26vw] pt-24 sm:pb-[13vw] sm:pt-28 md:pb-[6vw] lg:pb-4 lg:pt-[var(--a2-header-h,92px)]">
        <div className="max-w-[34rem]">
          <Eyebrow onDark>{hero.eyebrow}</Eyebrow>

          <h1
            id="hero-title"
            className="mt-5 font-display text-hero font-normal leading-[0.98] tracking-[-0.025em] text-cream"
          >
            {hero.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-[30rem] text-pretty font-sans text-lead leading-relaxed text-cream/88">
            {hero.lead}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={hero.primary.href} className={buttonClass("rust", "md")}>
              {hero.primary.label}
              <IconArrowRight size={16} />
            </Link>
            <Link
              href={hero.secondary.href}
              className={buttonClass("outline-light", "md")}
            >
              {hero.secondary.label}
              <IconPlay size={15} />
            </Link>
          </div>
        </div>

        {/* script accent — the only script on the page */}
        <ScriptAccent className="absolute right-4 top-24 hidden max-w-[15rem] sm:flex md:right-8 lg:right-12 lg:top-28 lg:max-w-[17rem]" />
      </div>

      {/* ── torn edge + Odisha vignette ───────────────────────────────────
          The photograph is torn away along a line that climbs toward the right, and
          the vignette is printed on the sheet that the tear exposes. Geometry, all
          measured off the mockup and normalised to the 1440 design width:

            • the band is 228px: the drawing itself is 212px at 92% of a 1440 page,
              and the extra 16px is the paper that shows above the tallest spire —
              a band exactly as tall as the art clips it. The sheet climbs 137px
              across it, the reference's measured rise;
            • the ink spans 92% of the page and stands 4–5% of the width tall;
            • its mass sits at 0.77 across the band — right of centre, never even.

          The art is sized by width, not height: its canvas fixes the aspect, so
          `w-[92%]` is the only number that matters and the drawing can never be
          squashed. `-right-px` gives the reference's slight bleed past the edge. */}
      <div className="relative z-10 mt-auto">
        <div className="relative h-[46vw] overflow-hidden sm:h-[24vw] md:h-[15vw] lg:h-[228px]">
          {/* No `bg-cream` on this box. The tear paints the sheet UP from the
              deckle, so everything above the deckle must stay transparent for the
              photograph to show through — a band background was the thing making
              the wedge invisible (every column measured its "paper" at y=0). */}
          <TornEdge tone="cream" rise className="absolute inset-x-0 top-0 h-full" />
          <OdishLineArt
            band
            className="absolute bottom-[18px] -right-px z-20 hidden h-auto w-[92%] text-ochre md:block"
          />
          <OdishLineArtCompact
            band
            className="absolute bottom-[10px] -right-px z-20 w-[96%] text-ochre md:hidden"
          />
        </div>
      </div>
    </section>
  );
}
