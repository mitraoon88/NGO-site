import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sitesectionMetadata } from "./route-list";
import { Logo } from "@/components/ui/logo";
import { buttonClass } from "@/components/ui/button";
import { IconArrowRight } from "@/components/icons";

/**
 * Interim route shells for every destination the homepage links to.
 *
 * **Why these exist in Phase 3.** The homepage's nav, cards and footer all point
 * at real routes (`/about`, `/our-work#education`, `/stories/…`). Two things go
 * wrong if those routes are missing:
 *
 *   1. Next prefetches every `<Link>` in view, so five 404s land in the network
 *      log — which is a failed gate, and a real error a user could hit by
 *      clicking before the page settles.
 *   2. A nav that 404s is a broken promise: it tells the visitor the site has
 *      five pages and then proves it does not.
 *
 * So each known destination renders a real, accessible page that states plainly
 * that it is not built yet, links back home, and is `noindex` so it never enters
 * search results as thin content. Phase 5 replaces these bodies with the real
 * pages; the routes, metadata and noindex behaviour stay.
 *
 * `dynamicParams = false` + an explicit slug list means anything *not* in the
 * list still 404s properly — the shell must not become a catch-all that swallows
 * typos into a fake page.
 */

export const dynamicParams = false;

type Params = { slug: string[] };

export function generateStaticParams(): Params[] {
  return sitesectionMetadata.map((s) => ({ slug: s.path.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = sitesectionMetadata.find((s) => s.path === slug.join("/"));
  if (!entry) return {};
  return {
    title: entry.title,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${entry.path}` },
  };
}

export default async function RouteShell({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const path = slug.join("/");
  const entry = sitesectionMetadata.find((s) => s.path === path);
  if (!entry) notFound();

  return (
    <>
      <a href="#main-content" className="a2-skip">
        Skip to content
      </a>

      <header className="border-b border-hair bg-cream">
        <div className="a2-container flex h-14 items-center lg:h-[60px]">
          <Link href="/" aria-label="A2 Foundation — home">
            <Logo />
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="bg-cream">
        <div className="a2-container flex min-h-[70svh] flex-col justify-center py-20">
          <p className="font-sans text-eyebrow font-semibold uppercase tracking-[0.18em] text-rust-text">
            Phase 5 · page not built yet
          </p>

          <h1 className="mt-5 max-w-[24ch] font-display text-h1 font-normal leading-[1.02] tracking-[-0.02em] text-ink">
            {entry.title}
          </h1>

          <p className="mt-6 max-w-[52ch] text-pretty font-sans text-lead leading-relaxed text-ink-soft">
            This destination is linked from the homepage and its route is in place,
            but the page itself arrives in Phase 5. Nothing is missing from the
            homepage — this shell exists so that no link on the site leads
            anywhere that does not answer.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className={buttonClass("rust", "md")}>
              Back to the homepage
              <IconArrowRight size={16} className="rotate-180" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
