import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Card, CardMedia } from "@/components/ui/card";
import { ArrowChip } from "@/components/ui/arrow-chip";
import { IconOrnament, type IconName } from "@/components/ui/icon-ornament";
import { FoliageCorner } from "@/components/ornaments/foliage";
import { focus } from "@/content/home";

/**
 * FocusAreas — four "seamless" cards on the 4-column grid.
 *
 * The card is one link: the whole surface is clickable, and the arrow chip is
 * decorative so a screen reader hears a single target per card rather than a
 * title link plus an unlabelled arrow. `Card variant="photo"` gives the photo
 * flush corners and the cream body below — no shadow, because in this design
 * separation comes from the cream-deep fill against cream.
 *
 * At 1024 the grid is 2×2; at 390 it is a single column with the photo kept at
 * 16:10 so the crops stay identical at every width.
 */
export function FocusAreas() {
  return (
    <section
      aria-labelledby="focus-title"
      className="a2-relative overflow-hidden bg-cream"
    >
      <FoliageCorner side="right" className="-right-10 top-16 hidden opacity-60 lg:block" />

      <div className="a2-container a2-section relative z-10">
        {/* No visible heading in this band: the mockup goes eyebrow → subline →
            cards. The `<h2>` is screen-reader-only so the section still opens a
            level in the outline — a section with no heading at all is a hole a
            reader has no way to name. */}
        <h2 id="focus-title" className="sr-only">
          {focus.eyebrow}
        </h2>
        <Eyebrow num={focus.num}>{focus.eyebrow}</Eyebrow>
        <p className="mt-2 max-w-copy-sm text-pretty font-sans text-note leading-relaxed text-ink-soft">
          {focus.subline}
        </p>

        <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {focus.cards.map((card) => (
            <li key={card.title}>
              <Card
                variant="photo"
                className="h-full transition-transform duration-300 ease-a2 hover:-translate-y-1"
              >
                <Link
                  href={card.href}
                  className="flex h-full flex-col rounded-card focus-visible:outline-none"
                >
                  <CardMedia ratio="3/2">
                    <Image
                      src={card.image.src}
                      alt={card.image.alt}
                      width={700}
                      height={438}
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 92vw"
                      className="object-cover"
                    />
                  </CardMedia>

                  <div className="flex flex-1 flex-col p-4">
                    <IconOrnament
                      name={card.icon as IconName}
                      size={30}
                      className="text-gold-deep"
                    />

                    <h3 className="mt-3 font-display text-h3 font-normal leading-tight tracking-[-0.01em] text-ink">
                      {card.title}
                    </h3>

                    {/* body and chip share a baseline: the chip sits at the
                        paragraph's last line, right-aligned, exactly as in the
                        mockup — a chip pushed to the card's footer reads as a
                        separate action rather than as the card's own affordance. */}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <p className="text-pretty font-sans text-note leading-relaxed text-ink-soft">
                        {card.body}
                      </p>
                      <ArrowChip size="md" />
                    </div>
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
