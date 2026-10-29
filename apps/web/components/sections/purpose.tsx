import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buttonClass } from "@/components/ui/button";
import { IconArrowRight, IconQuote } from "@/components/icons";
import { FoliageSpray } from "@/components/ornaments/foliage";
import { CircleStamp } from "@/components/ornaments/circle-stamp";
import { purpose } from "@/content/home";

/**
 * Purpose — text left, a three-layer collage right, quote beneath it.
 *
 * **The collage is a contact sheet, not a card stack.** Measured off the mockup:
 * a 3:2 landscape print fills the column, a 4:5 portrait print sits on top of it
 * from the right and drops below its bottom edge, and the cream "Driven by
 * People" plate overlaps the portrait's lower-left corner. The white frames are
 * what make this read as *prints laid on paper* rather than as UI cards.
 *
 * **Every overlap is small.** The portrait crosses the landscape by ~8% of the
 * column and the plate crosses the portrait by ~12%; pushing either further turns
 * a collage into a pile, which is the failure mode this layout invites.
 *
 * **The quote is anchored under the landscape, not centred.** In the mockup it
 * starts at the landscape's left edge and is partly covered by the plate — the
 * cover-up is the one thing not reproduced, because a quote you cannot read is a
 * defect. It sits in the gap between the landscape's bottom and the plate's left,
 * so nothing overlaps.
 *
 * Mobile: the collage stacks (landscape, portrait inset, plate, quote) and the
 * text stays first in the DOM, so the reading order never depends on the widths.
 */
export function Purpose() {
  return (
    <section
      aria-labelledby="purpose-title"
      className="a2-relative overflow-hidden bg-cream"
    >
      {/* margin botanicals — decoration only */}
      <FoliageSpray className="pointer-events-none absolute -left-10 top-8 hidden w-[170px] text-foliage/45 lg:block" />
      <FoliageSpray className="pointer-events-none absolute -right-12 bottom-8 hidden w-[150px] -scale-x-100 text-foliage/35 lg:block" />

      <div className="a2-container a2-section relative z-10">
        <div className="grid items-start gap-12 lg:grid-cols-[42fr_58fr] lg:gap-12">
          {/* ── text column ─────────────────────────────────────────────── */}
          <div className="max-w-copy lg:pt-2">
            <Eyebrow num={purpose.num}>{purpose.eyebrow}</Eyebrow>

            <h2
              id="purpose-title"
              className="mt-5 font-display text-h2 font-normal leading-[1.06] tracking-[-0.02em] text-ink"
            >
              {purpose.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <em className="block italic text-rust-text">{purpose.italicLast}</em>
            </h2>

            <p className="mt-6 max-w-measure text-pretty font-sans text-body leading-relaxed text-ink-soft">
              {purpose.body}
            </p>

            <Link href={purpose.cta.href} className={buttonClass("rust", "md", "mt-8")}>
              {purpose.cta.label}
              <IconArrowRight size={16} />
            </Link>
          </div>

          {/* ── collage ───────────────────────────────────────────────────
              A measured frame, not a flow of overlapping blocks: the three prints
              are absolutely placed inside one box with an explicit aspect ratio,
              so the band's height is known before anything loads.

              The flow version was the bug — `-translate-y` moves a box without
              shrinking its layout slot, so the portrait still reserved its full
              4:5 height and the collage came out 1.9× the reference. Absolute
              positioning is also what makes the overlaps stay proportional at
              every width, which a stack of negative margins cannot do. */}
          <div className="relative">
            <div className="relative mx-auto aspect-[10/7] w-full max-w-[26rem] lg:mx-0 lg:ml-auto lg:max-w-[34rem]">
              {/* layer 1 — the landscape print, the collage's spine */}
              <figure className="absolute left-0 top-0 w-[86%] overflow-hidden rounded-photo border border-hair bg-white p-1.5 shadow-card">
                <Image
                  src={purpose.images.landscape.src}
                  alt={purpose.images.landscape.alt}
                  width={purpose.images.landscape.width}
                  height={purpose.images.landscape.height}
                  sizes="(min-width: 1024px) 30vw, 70vw"
                  className="aspect-[3/2] w-full object-cover"
                />
              </figure>

              {/* layer 2 — the portrait print, overlapping from the right */}
              <figure className="absolute right-0 top-[36%] w-[38%] overflow-hidden rounded-photo border border-hair bg-white p-1.5 shadow-card">
                <Image
                  src={purpose.images.portrait.src}
                  alt={purpose.images.portrait.alt}
                  width={purpose.images.portrait.width}
                  height={purpose.images.portrait.height}
                  sizes="(min-width: 1024px) 12vw, 34vw"
                  className="aspect-[4/5] w-full object-cover"
                />
              </figure>

              {/* layer 3 — the plate: cream on cream, so it needs the shadow */}
              <div className="absolute bottom-0 left-[6%] w-[42%] rounded-photo border border-hair bg-cream px-5 py-4 shadow-card">
                <p className="font-sans text-nano font-semibold uppercase tracking-[0.16em] text-ink">
                  {purpose.card.line1}
                </p>
                <p className="mt-1 font-sans text-nano uppercase tracking-[0.16em] text-ink-soft">
                  {purpose.card.line2}
                </p>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="mt-3 h-8 w-8 text-gold-deep"
                  fill="none"
                >
                  <path
                    d="M12 21V11M12 11C12 7 15 4.5 19 4c.5 4-2 7.5-7 7zM12 14c0-3.5-2.6-6-6.5-6.4C5 11.2 7.6 14 12 14z"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* the stamp, tucked outside the top-right corner */}
              <CircleStamp
                className="absolute -right-8 -top-8 hidden h-[86px] w-[86px] text-ochre/75 lg:block"
                around="ODISHA · INDIA · A2 FOUNDATION · "
                lines={["ODISHA", "· INDIA ·"]}
              />
            </div>

            {/* the quote, under the landscape and clear of the plate */}
            <blockquote className="relative mx-auto mt-8 max-w-[27rem] pl-10 lg:mx-0 lg:ml-auto">
              <IconQuote
                size={28}
                className="absolute left-0 top-0.5 text-rust"
                aria-hidden
              />
              <p className="text-pretty font-sans text-body italic leading-relaxed text-ink">
                {purpose.quote}
              </p>
              <footer className="mt-1.5 font-sans text-note text-ink-muted">
                — {purpose.quoteAttribution}
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
