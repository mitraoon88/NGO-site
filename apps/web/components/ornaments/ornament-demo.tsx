import {
  TornEdge,
  FoliageSpray,
  LeafSprig,
  CircleStamp,
  ScriptAccent,
  OdishLineArt,
  OdishLineArtCompact,
} from "./index";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";

/**
 * OrnamentHero — the Phase 2 proof surface.
 *
 * This is the mockup's hero band, assembled only from Phase 1 primitives + the six
 * Phase 2 ornaments, so the client can judge the ornament system in context rather
 * than on a swatch sheet. Photography is deliberately a flat `forest` field with a
 * soft vignette: Phase 2 is the *ornament* system, and Phase 4 brings the real
 * imagery. A grey placeholder photo would hide exactly the problems (tear against
 * a busy image, script legibility, stamp overlap) this demo exists to reveal.
 */
export function OrnamentHero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-cream">
      {/* photograph stand-in: forest field + warm vignette where the image will sit */}
      <div aria-hidden className="a2-hero-field absolute inset-0 -z-10" />
      {/* the photo's warm subject zone — kept as a token-tinted wash, not a fake image */}
      <div aria-hidden className="a2-hero-glow absolute inset-y-0 right-0 -z-10 w-2/3" />

      <div className="a2-container relative flex min-h-[540px] flex-col justify-center pb-24 pt-16 sm:min-h-[600px] sm:pb-28 sm:pt-20">
        <div className="max-w-[34rem]">
          <Eyebrow onDark>A Brighter Tomorrow</Eyebrow>
          <h2 className="mt-5 font-display text-hero font-normal leading-[0.98] tracking-[-0.02em] text-cream">
            People
            <br />
            Planet
            <br />
            Possibility
          </h2>
          <p className="mt-6 max-w-[30rem] text-pretty font-sans text-lead leading-relaxed text-cream/85">
            A2 Foundation works with communities to create lasting change through
            education, health, livelihoods and a sustainable environment.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="rust" withArrow>
              Our Impact
            </Button>
            <Button variant="outline-light">Watch Our Story</Button>
          </div>
        </div>

        {/* script accent — the only script on the page */}
        <ScriptAccent className="absolute right-2 top-24 hidden max-w-[15rem] sm:flex md:right-4 lg:right-10 lg:top-28 lg:max-w-[17rem]" />
      </div>

      {/* The bottom of the hero is a TORN SHEET, not a strip below one.
          In the mockup the photograph is torn away along a line that climbs toward
          the right, and the illustration is printed ON and ACROSS that torn edge —
          ink sits partly on the sheet, partly over the photograph, and the drawing
          grows taller as the sheet rises. So the vignette goes INSIDE the tear band:
          same box, same height, one composition. The band is 16vw: the wedge takes
          8.5vw of that (the reference's climb) and the rest is the ~4% of page width
          the ink is printed in. */}
      {/* the band needs its own height: every child in it is absolutely positioned,
            so `overflow-hidden` alone would collapse it to zero and the tear would
            vanish into the section below. */}
      {/* `bg-cream` is the sheet itself: the tear paints the photograph above the
            deckle, so the paper is whatever shows below it — without this the band
            is forest end to end and the illustration has nothing to be printed on. */}
      <div className="/* The band must be deep enough to hold the wedge AND the ink: at 34vw the
             wedge at the right-hand end used up all but ~6px of it and the drawing
             collapsed to hairlines. 46vw leaves roughly a fifth of the band as
             printed sheet on a 390px screen. */
      relative h-[46vw] overflow-hidden bg-cream md:h-[16vw]">
        <TornEdge tone="forest" rise className="h-full" />
        {/* 1060/150 of the band's height ≈ 92% of the page width — the reference's
            span. `-right-px` gives the 3px bleed past the edge; `right-0` would stop
            short of it. The canvas aspect means width alone fixes the height. */}
        {/* z-20: the tear band is z-10, so without a stacking order of its own the
              sheet paints straight over the ink and the drawing measures as absent. */}
        <OdishLineArt band className="absolute -bottom-px -right-px z-20 hidden h-auto w-[92%] text-ochre md:block" />
        <OdishLineArtCompact band className="absolute -bottom-px -right-px z-20 w-[96%] text-ochre md:hidden" />
      </div>
    </section>
  );
}
