import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { FoliageCorner } from "@/components/ornaments/foliage";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconYouTube,
} from "@/components/icons";
import { NewsletterForm } from "./newsletter-form";
import { footer, site } from "@/content/home";

/**
 * SiteFooter — five zones on forest-deep, plus a legal bar.
 *
 * Layout: brand + mission + social | Quick Links | Our Focus | newsletter, with
 * hairline rules between the three link zones (turned off once the grid wraps —
 * see ValuesBar for why). The two foliage sprays are the page's closing ornament
 * and are pinned to the bottom corners, clipped by the section edge.
 *
 * The social links are external, so each gets a visible label plus
 * `rel="noreferrer noopener"`; the icon alone would be an unlabelled link for a
 * screen reader and a mystery target for anyone who cannot see the glyph.
 */
const socialIcons = {
  facebook: IconFacebook,
  instagram: IconInstagram,
  linkedin: IconLinkedIn,
  youtube: IconYouTube,
} as const;

export function SiteFooter() {
  return (
    <footer className="a2-relative overflow-hidden bg-forest-deep">
      <FoliageCorner side="left" className="-left-12 -bottom-10 hidden opacity-50 lg:block" />
      <FoliageCorner side="right" className="-right-12 -bottom-10 hidden opacity-50 lg:block" />

      <div className="a2-container relative z-10 pb-8 pt-14 sm:pt-16">
        {/* `auto-fit` + `minmax(12rem, …)` rather than four fixed fractions.
            Fixed columns are sized by the *viewport*, so when the user enlarges
            their text the words grow inside columns that did not — the Focus Area
            links and the whole newsletter field spilled past the footer's right
            edge (caught by the new `zoom` gate at 200% and 300%). Letting the
            columns size to their content means the footer reflows to one, two or
            four columns according to what actually fits. */}
        <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))] lg:gap-8">
          {/* ── zone 1: brand ─────────────────────────────────────────────── */}
          <div className="text-center lg:text-left">
            <Link href="/" aria-label={`${site.name} — home`} className="inline-flex">
              <Logo onDark />
            </Link>
            <p className="mx-auto mt-5 max-w-[30ch] text-pretty font-sans text-note leading-relaxed text-cream/72 lg:mx-0">
              {footer.mission}
            </p>

            <ul className="mt-6 flex items-center justify-center gap-3 lg:justify-start">
              {footer.social.map((s) => {
                const Glyph = socialIcons[s.icon as keyof typeof socialIcons];
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="grid h-11 w-11 place-items-center rounded-full border border-cream/25 text-cream transition-colors duration-200 hover:border-cream hover:bg-cream hover:text-forest-deep"
                    >
                      <span className="sr-only">{`${site.name} on ${s.label}`}</span>
                      <Glyph size={17} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── zone 2 + 3: link columns ───────────────────────────────────── */}
          <nav aria-labelledby="footer-quick" className="lg:border-l lg:border-cream/15 lg:pl-8">
            <h2
              id="footer-quick"
              className="font-sans text-ui font-semibold text-cream"
            >
              {footer.quickLinks.heading}
            </h2>
            <ul className="mt-3 flex flex-col">
              {footer.quickLinks.items.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-9 items-center font-sans text-note text-cream/72 transition-colors hover:text-cream"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-focus" className="lg:border-l lg:border-cream/15 lg:pl-8">
            <h2
              id="footer-focus"
              className="font-sans text-ui font-semibold text-cream"
            >
              {footer.focusLinks.heading}
            </h2>
            <ul className="mt-3 flex flex-col">
              {footer.focusLinks.items.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-9 items-center font-sans text-note text-cream/72 transition-colors hover:text-cream"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── zone 4: newsletter ────────────────────────────────────────── */}
          <div className="lg:border-l lg:border-cream/15 lg:pl-8">
            <h2 className="font-sans text-ui font-semibold text-cream">
              {footer.newsletter.heading}
            </h2>
            <p className="mt-2 max-w-[32ch] font-sans text-note leading-relaxed text-cream/72">
              {footer.newsletter.note}
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* ── legal bar ─────────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-3 border-t border-cream/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {footer.legal.map((l, i) => (
              <li key={l.href} className="flex items-center gap-4">
                <Link
                  href={l.href}
                  className="inline-flex min-h-9 items-center font-sans text-micro text-cream/65 transition-colors hover:text-cream"
                >
                  {l.label}
                </Link>
                {i < footer.legal.length - 1 && (
                  <span aria-hidden className="h-3 w-px bg-cream/20" />
                )}
              </li>
            ))}
          </ul>

          <p className="font-sans text-micro text-cream/60">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
