import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArrowChip } from "@/components/ui/arrow-chip";
import { IconArrowRight } from "@/components/icons";
import { news } from "@/content/home";

/**
 * News — the compact three-up that closes the page before the footer.
 *
 * Denser than Stories on purpose: a 96×62 thumb, a 12px caps date, a two-line
 * serif title, and an encircled arrow. The whole card is one link.
 *
 * **The date is a `<time>` element with a machine-readable `datetime`**, and the
 * human label is formatted at render with `Intl.DateTimeFormat` pinned to
 * `en-IN` — so the visible string is "12 Sep 2026" for a reader and
 * `2026-09-12` for a crawler or a screen reader, from one source of truth.
 */
const fmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function News() {
  return (
    <section aria-labelledby="news-title" className="bg-cream">
      <div className="a2-container a2-section">
        {/* Eyebrow → subline → cards, with "View All" on the eyebrow's baseline.
            No display heading in this band, so the `<h2>` is for the outline. */}
        <h2 id="news-title" className="sr-only">
          {news.eyebrow}
        </h2>
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-copy">
            <Eyebrow num={news.num}>{news.eyebrow}</Eyebrow>
            <p className="mt-2 font-sans text-note text-ink-soft">{news.subline}</p>
          </div>
          <Link
            href={news.cta.href}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 font-sans text-note font-semibold text-ink transition-colors hover:text-rust-text"
          >
            {news.cta.label}
            <IconArrowRight size={15} />
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {news.items.map((item) => (
            <li key={item.title}>
              <article className="group h-full rounded-card border border-hair bg-cream-deep transition-colors duration-300 ease-a2 hover:border-ink/20">
                <Link
                  href={item.href}
                  className="flex h-full gap-4 overflow-hidden rounded-card focus-visible:outline-none"
                >
                  <div className="relative w-[104px] shrink-0 bg-sand/40">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      width={300}
                      height={195}
                      sizes="104px"
                      className="h-full w-full object-cover transition-transform duration-700 ease-a2 group-hover:scale-[1.05]"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col py-3.5 pr-3.5">
                    <time
                      dateTime={item.date}
                      className="font-sans text-micro uppercase tracking-[0.12em] text-ink-muted"
                    >
                      {fmt.format(new Date(item.date))}
                    </time>

                    <h3 className="mt-2 font-display text-h4 font-normal leading-snug tracking-[-0.01em] text-ink">
                      {item.title}
                    </h3>

                    <div className="mt-auto flex justify-end pt-3">
                      <ArrowChip size="sm" />
                    </div>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
