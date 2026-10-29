"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconArrowRight } from "@/components/icons";
import { FoliageSpray } from "@/components/ornaments/foliage";
import { stories } from "@/content/home";
import { cn } from "@/lib/cn";

/**
 * Stories — three-up editorial cards with a working carousel.
 *
 * **No card background.** In the mockup the column *is* the card: a portrait
 * thumb on the left, then tag / title / copy / "Read Story →" in a plain column.
 * Adding a surface would turn an editorial layout into a widget.
 *
 * **The arrows are real.** The mockup's two circles imply more than three
 * stories, so they cannot be decoration: they are buttons that move the track,
 * and they disable at the ends. Keyboard support is native horizontal scrolling
 * over a focusable, labelled region — the buttons are an accelerator, not the
 * only way through, so a swipe or shift-wheel also works.
 *
 * Accessibility notes:
 *   - one `<h3>` link per card; the tag is text, not a link, because the section
 *     has no tag archive yet (a link to nowhere is worse than plain text);
 *   - the arrow buttons carry real labels ("Previous stories" / "Next stories");
 *   - under `prefers-reduced-motion` the track jumps instead of gliding.
 */
export function Stories() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };

  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir * Math.round(el.clientWidth * 0.8),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <section
      aria-labelledby="stories-title"
      className="a2-relative overflow-hidden bg-cream"
    >
      <FoliageSpray className="pointer-events-none absolute -left-12 top-1/3 hidden w-[140px] text-foliage/35 lg:block" />

      <div className="a2-container a2-section relative z-10">
        {/* The band has no display heading in the mockup — eyebrow, one line of
            subline, then the cards, with the arrows on the eyebrow's baseline.
            The `<h2>` is for the outline only. */}
        <h2 id="stories-title" className="sr-only">
          {stories.eyebrow}
        </h2>
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-copy">
            <Eyebrow num={stories.num}>{stories.eyebrow}</Eyebrow>
            <p className="mt-2 font-sans text-note text-ink-soft">{stories.subline}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => nudge(-1)}
              disabled={atStart}
              aria-label="Previous stories"
              className={cn("a2-round-btn", atStart && "opacity-40")}
            >
              <IconArrowRight size={16} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              disabled={atEnd}
              aria-label="Next stories"
              className={cn("a2-round-btn", atEnd && "opacity-40")}
            >
              <IconArrowRight size={16} />
            </button>
          </div>
        </div>

        <ul
          ref={trackRef}
          onScroll={sync}
          tabIndex={0}
          aria-label="Stories carousel"
          className="a2-track mt-7 flex snap-x snap-mandatory gap-7 overflow-x-auto pb-2"
        >
          {stories.items.map((item) => (
            <li
              key={item.title}
              className="w-[86vw] shrink-0 snap-start sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]"
            >
              <article className="group flex gap-5">
                <div className="relative w-[38%] shrink-0 overflow-hidden rounded-photo bg-sand/40">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    width={560}
                    height={700}
                    sizes="(min-width: 1024px) 13vw, 34vw"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-a2 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="flex min-w-0 flex-col">
                  <p className="font-sans text-micro font-semibold uppercase tracking-[0.14em] text-rust-text">
                    {item.tag}
                  </p>

                  <h3 className="mt-2 font-display text-h4 font-normal leading-snug tracking-[-0.01em] text-ink">
                    <Link
                      href={item.href}
                      className="transition-colors duration-200 hover:text-rust-text"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p className="mt-2 font-sans text-note leading-relaxed text-ink-soft">
                    {item.body}
                  </p>

                  <Link
                    href={item.href}
                    className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 font-sans text-note font-semibold text-rust-text transition-colors hover:text-rust"
                  >
                    Read Story
                    <IconArrowRight
                      size={15}
                      className="transition-transform duration-300 ease-a2 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
