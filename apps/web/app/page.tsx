import type { Metadata } from "next";
import { SiteHeader } from "@/components/sections/site-header";
import { Hero } from "@/components/sections/hero";
import { ValuesBar } from "@/components/sections/values-bar";
import { Purpose } from "@/components/sections/purpose";
import { FocusAreas } from "@/components/sections/focus-areas";
import { Impact } from "@/components/sections/impact";
import { Stories } from "@/components/sections/stories";
import { GetInvolved } from "@/components/sections/get-involved";
import { Partners } from "@/components/sections/partners";
import { News } from "@/components/sections/news";
import { SiteFooter } from "@/components/sections/site-footer";

/**
 * The homepage — all eleven bands, in the mockup's order.
 *
 * Order is not cosmetic here: the page breathes in a three-beat cadence
 * (hero → impact → get involved are the dark "acts", the cream bands in between
 * are the reading), and the values bar exists to convert the hero's emotion into
 * a method statement *before* the first cream band. Reordering any of the eleven
 * breaks that argument.
 *
 * Server component by default. Only three things need the client:
 *   - SiteHeader (scroll state, mobile sheet)
 *   - Stories (carousel)
 *   - NewsletterForm (validation states)
 * Everything else — including all eleven sections' typography — ships as HTML.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "A2 Foundation — People · Planet · Possibility",
  description:
    "A2 Foundation works with communities in Odisha to create lasting change through education, health, livelihoods and a sustainable environment.",
};

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="a2-skip">
        Skip to content
      </a>

      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <Hero />
        <ValuesBar />
        <Purpose />
        <FocusAreas />
        <Impact />
        <Stories />
        <GetInvolved />
        <Partners />
        <News />
      </main>

      <SiteFooter />
    </>
  );
}
