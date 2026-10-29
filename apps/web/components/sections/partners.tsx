import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FoliageSpray } from "@/components/ornaments/foliage";
import { IconArrowRight } from "@/components/icons";
import { partners } from "@/content/home";

/**
 * Partners — a quiet credibility strip.
 *
 * **Why these are name plates and not logos.** The mockup shows real third-party
 * marks (Tata Trusts, HCL Foundation, Infosys, Reliance Foundation, Bharti,
 * USAID, UNDP). An organisation may only display a partner's mark with that
 * partner's written permission, and every mark has a current official form that
 * must be used unmodified. Dropping the mockup's approximations into production
 * would be a trademark problem *and* a factual claim about relationships the
 * client has not confirmed. So the strip renders neutral text plates at the same
 * rhythm and weight, and the section is flagged for sign-off; swapping in
 * approved SVGs is a content change, not a layout change.
 *
 * It stays quiet by design: no heading, small caps, one row, and the strip's job
 * is credibility rather than persuasion.
 */
export function Partners() {
  return (
    <section aria-labelledby="partners-title" className="relative overflow-hidden bg-cream">
      <FoliageSpray className="pointer-events-none absolute -right-10 top-0 hidden w-[120px] text-foliage/30 lg:block" />

      <div className="a2-container relative z-10 py-7 sm:py-8">
        {/* `flex-wrap` + `basis` instead of a `shrink-0` block with a `26rem` cap.
            The cap is in rem, so at 300% text it asked for 1248px and pushed every
            partner name and the "and more" link past the right edge. Wrapping lets
            the two halves stack when they no longer fit side by side. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-10">
          <div className="max-w-[26rem] lg:basis-[20rem] lg:grow-0">
            <Eyebrow num={partners.num}>{partners.eyebrow}</Eyebrow>
            <p className="mt-3 text-pretty font-sans text-note leading-relaxed text-ink-soft">
              {partners.subline}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="partners-title" className="sr-only">
              Our partners
            </h2>
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:justify-end">
              {partners.items.map((p) => (
                <li
                  key={p.name}
                  className="font-display text-ui font-medium tracking-[-0.01em] text-ink-muted transition-colors hover:text-ink"
                >
                  {p.name}
                </li>
              ))}
              <li>
                <Link
                  href={partners.more.href}
                  className="inline-flex min-h-11 items-center gap-1.5 font-sans text-note font-semibold text-rust-text hover:text-rust"
                >
                  {partners.more.label}
                  <IconArrowRight size={14} />
                </Link>
              </li>
            </ul>
            {/* ink-muted at full opacity, not `/80`: the 80% version measured
                3.37:1 against cream and failed axe's color-contrast rule. 11px is
                still 11px — the fix is the colour, not a bigger font. */}
            <p className="mt-3 font-sans text-micro text-ink-muted lg:text-right">
              {partners.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
