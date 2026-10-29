import type { Metadata } from "next";
import Link from "next/link";
import {
  TornEdge,
  FoliageSpray,
  LeafSprig,
  CircleStamp,
  ScriptAccent,
  OdishLineArt,
  OdishLineArtCompact,
  OrnamentHero,
} from "@/components/ornaments";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconCommunities, IconHeart, IconLeaves, IconShield } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Ornament system",
  alternates: { canonical: "/ornaments" },
  robots: { index: false, follow: false },
};

/**
 * Phase 2 review surface.
 *
 * Order chosen for judgement, not for the code: first the composition (does the
 * band read as the mockup?), then each ornament alone at real size with its
 * placement rules and its contrast pair, then the responsive behaviour.
 */

function Row({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-hair py-10">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-h3 font-normal text-ink">{title}</h2>
        {note && <p className="font-sans text-note text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Specimen frame: a titled plate with a fixed-height stage so ornaments of very
 *  different aspect ratios can be compared side by side. */
function Plate({
  label,
  spec,
  children,
  tone = "cream",
  tall = false,
}: {
  label: string;
  spec: string;
  children: React.ReactNode;
  tone?: "cream" | "forest" | "sand";
  tall?: boolean;
}) {
  const surfaces = {
    cream: "bg-cream-deep border-hair",
    forest: "bg-forest border-forest",
    sand: "bg-sand border-sand",
  } as const;
  return (
    <figure className="overflow-hidden rounded-card border border-hair">
      <div
        className={`relative flex items-center justify-center overflow-hidden ${surfaces[tone]} ${
          tall ? "h-72" : "h-36"
        }`}
      >
        {children}
      </div>
      <figcaption className="bg-cream px-3 py-2.5">
        <p className="font-sans text-note font-semibold text-ink">{label}</p>
        <p className="mt-0.5 font-sans text-micro leading-relaxed text-ink-muted">{spec}</p>
      </figcaption>
    </figure>
  );
}

export default function OrnamentsPage() {
  return (
    <>
      <a href="#main-content" className="a2-skip">
        Skip to content
      </a>
      <main id="main-content" tabIndex={-1} className="bg-cream pb-24">
        {/* ── header ─────────────────────────────────────────────────────── */}
        <div className="border-b border-hair bg-cream-deep">
          <div className="a2-container flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <Badge tone="rust">Phase 2</Badge>
              <p className="font-sans text-note text-ink-muted">
                Ornament &amp; art system · review sheet
              </p>
            </div>
            <div className="flex items-center gap-4 font-sans text-note">
              <Link href="/kitchen-sink" className="text-ink-soft underline decoration-hair underline-offset-2 hover:text-rust-text">
                Phase 1 components
              </Link>
              <Link href="/" className="text-ink-soft underline decoration-hair underline-offset-2 hover:text-rust-text">
                Landing
              </Link>
            </div>
          </div>
        </div>

        {/* ── 1. the composition ─────────────────────────────────────────── */}
        <header className="a2-container max-w-copy pb-8 pt-14">
          <Eyebrow num="01">In composition</Eyebrow>
          <h1 className="mt-4 font-display text-h2 text-ink">
            Ornament <span className="italic text-rust-text">&amp;</span> art system
          </h1>
          <p className="mt-4 font-sans text-body leading-relaxed text-ink-soft">
            Six primitives, all decoration. Below is the mockup&rsquo;s hero assembled
            from nothing but Phase 1 components and these six — the tear, the Odisha
            vignette carried into it, the script flourish and the paper edge are the
            four devices that make the reference read as print rather than as a web page.
          </p>
          <p className="mt-6 font-sans text-note text-ink-muted">
            Photography is a flat forest field on purpose — Phase 2 is the ornament layer,
            and a grey box would hide the exact problems this sheet exists to show.
          </p>
        </header>

        <div className="border-y border-hair">
          <OrnamentHero />
        </div>

        {/* values bar that the tear reveals */}
        <div className="border-b border-hair bg-cream">
          <div className="a2-container grid grid-cols-2 gap-x-6 gap-y-5 py-7 lg:grid-cols-4">
            {[
              ["Community First", "People-led development", IconCommunities, "text-ochre"],
              ["Sustainable Change", "Long-term impact", IconLeaves, "text-ochre"],
              ["Inclusive Growth", "No one left behind", IconHeart, "text-rust"],
              ["Transparent Action", "Accountable and ethical", IconShield, "text-rust"],
            ].map(([t, d, Icon, ink]) => (
              <div key={t as string} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${ink}`} size={24} />
                <div>
                  <p className="font-sans text-micro font-semibold uppercase tracking-[0.12em] text-ink">
                    {t as string}
                  </p>
                  <p className="mt-0.5 font-sans text-note text-ink-soft">{d as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="a2-container">
          {/* ── 2. the tear ──────────────────────────────────────────────── */}
          <Row id="tear" title="TornEdge" note="a mask, not a decorative strip · 140-pull polyline deckle · level band or rising wedge">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["cream", "forest"] as const).map((tone) => (
                <Plate
                  key={tone}
                  label={`tone="${tone}"`}
                  spec="the colour that bleeds THROUGH the tear = the next section's surface"
                >
                  <div className="absolute inset-0 bg-forest" />
                  <div className="absolute inset-x-0 bottom-0">
                    <TornEdge tone={tone} />
                  </div>
                </Plate>
              ))}
            </div>
            <p className="mt-4 font-sans text-note leading-relaxed text-ink-muted">
              The deckle is a <span className="font-semibold text-ink-soft">polyline, not a curve</span>:
              140 straight pulls at a <span className="font-semibold text-ink-soft">0.69% of page width</span>,
              measured against the mockup&rsquo;s 0.74%, with high-frequency noise and a deep notch every
              29th pull. Smoothing the path is the single most common way this effect looks fake — it
              turns a tear into a scallop shell. A second path, offset 1.5 units and stroked 1px, draws
              the fibre shadow; that hairline is what makes the tear read as physical rather than as a
              cut-out. On the hero the same edge also carries the mockup&rsquo;s
              <span className="font-semibold text-ink-soft"> rising wedge</span> — 7.99% of the page width
              against the reference&rsquo;s 9.39%.
            </p>
          </Row>

          {/* ── 3. the mark ──────────────────────────────────────────────── */}
          <Row id="mark" title="OdishaLineArt" note="the signature vignette · ochre 4.61:1 on cream · mass at 0.73 of the width">
            <div className="rounded-card border border-hair bg-cream-deep p-6">
              {/* the plate gives the 1200×192 canvas a width; height follows the aspect */}
              <OdishLineArt className="h-auto w-full text-ochre" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="rounded-card border border-hair bg-cream-deep p-5">
                <p className="font-sans text-micro uppercase tracking-[0.12em] text-ink-muted">
                  compact — re-crops, never stretches
                </p>
                <OdishLineArtCompact className="mt-3 h-24 w-full max-w-sm text-ochre" />
              </div>
              <div className="rounded-card border border-hair bg-forest p-5">
                <p className="font-sans text-micro uppercase tracking-[0.12em] text-cream/70">
                  on forest (footer)
                </p>
                <OdishLineArtCompact className="mt-3 h-24 w-64 text-foliage/70" />
              </div>
            </div>
            <p className="mt-4 font-sans text-note leading-relaxed text-ink-muted">
              Composition follows the mockup, and is measured against it: the ink spans
              <span className="font-semibold text-ink-soft"> 88.8% of the page width</span> (reference
              91.7%), bleeds off the right edge, and its mass sits at
              <span className="font-semibold text-ink-soft"> 0.73 of the width</span> (reference 0.77) —
              the left third is deliberately bare, a single torn line and some scrub, because an evenly
              spread frieze is the one thing the reference is not. On the hero each motif is anchored to
              the tear itself, so the drawing grows as the sheet rises. Hatching is drawn as short
              strokes, not a raster texture, so it stays crisp at 3× and prints from vector.
            </p>
          </Row>

          {/* ── 4. foliage ───────────────────────────────────────────────── */}
          <Row id="foliage" title="Foliage" note="margin spray (cropped) vs leaf glyph (never cropped)">
            <div className="grid gap-4 sm:grid-cols-3">
              <Plate label="FoliageSpray" spec="margin ornament · 1.3px · always cropped by the edge" tall>
                <div className="absolute -left-4 -top-6 h-[130%]">
                  <FoliageSpray className="h-full w-24 text-foliage" />
                </div>
              </Plate>
              <Plate label="FoliageSpray · mirrored" spec="same path, -scale-x-100 · right margin" tall>
                <div className="absolute -right-4 -top-6 h-[130%]">
                  <FoliageSpray className="h-full w-24 -scale-x-100 text-foliage" />
                </div>
              </Plate>
              <Plate label="LeafSprig" spec="glyph · 1.5px · ochre · never cropped" tall>
                <LeafSprig className="h-20 w-20 text-ochre" />
              </Plate>
            </div>
          </Row>

          {/* ── 5. stamp ─────────────────────────────────────────────────── */}
          <Row id="stamp" title="CircleStamp" note="live text-on-path · decorative by default · optional label">
            <div className="grid gap-4 sm:grid-cols-3">
              <Plate label="ochre-soft" spec="default ink · faded die impression" tall>
                <CircleStamp className="h-32 w-32 text-ochre-soft" />
              </Plate>
              <Plate label="ochre" spec="stronger ink where the stamp must hold up" tone="sand" tall>
                <CircleStamp className="h-32 w-32 text-ochre" />
              </Plate>
              <Plate label="rotated + overlapping" spec="the mockup's placement: top-right, over the photo frame" tone="forest" tall>
                <div className="relative h-full w-full">
                  <div className="absolute left-1/2 top-1/2 h-40 w-52 -translate-x-1/2 -translate-y-1/2 rounded-photo border border-cream/20 bg-sand/25" />
                  <CircleStamp className="absolute right-3 top-2 h-24 w-24 rotate-[14deg] text-foliage" />
                </div>
              </Plate>
            </div>
            <p className="mt-4 font-sans text-note leading-relaxed text-ink-muted">
              The ring text is real SVG <code className="rounded bg-cream-deep px-1">textPath</code>,
              repeated to fill the circumference — so it stays crisp, translates with the site, and
              never needs an exported image. 48 tick marks form the die edge, every fourth one long.
            </p>
          </Row>

          {/* ── 6. script ────────────────────────────────────────────────── */}
          <Row id="script" title="ScriptAccent" note="Parisienne · once per page · never body copy">
            <div className="grid gap-4 sm:grid-cols-2">
              <Plate label='tone="light"' spec="on photography · cream + legibility scrim" tone="forest" tall>
                <ScriptAccent className="scale-[0.85]" />
              </Plate>
              <Plate label='tone="dark"' spec="on paper · rust-text" tall>
                <ScriptAccent tone="dark" className="scale-[0.85]" />
              </Plate>
            </div>
            <p className="mt-4 font-sans text-note leading-relaxed text-ink-muted">
              Four lines, indented progressively and rotated −6° as measured on the mockup. It is
              <span className="font-semibold text-ink-soft"> aria-hidden</span> because it repeats the
              headline — nothing is lost if a screen reader skips it. Sizes come from the
              <code className="mx-1 rounded bg-cream-deep px-1">script / script-sm / script-xs</code>
              type tokens.
            </p>
          </Row>

          {/* ── 7. responsive ────────────────────────────────────────────── */}
          <Row id="responsive" title="Behaviour at width" note="re-crop, never squash · tear scales, art re-crops">
            <div className="overflow-hidden rounded-card border border-hair">
              <div className="bg-forest">
                <div className="relative">
                  <div className="flex h-40 items-end justify-between px-5 pb-8">
                    <p className="font-display text-h3 text-cream">Tear + mark, narrow</p>
                    <ScriptAccent
                      lines={["Stronger", "Futures"]}
                      withLeaf={false}
                      className="scale-[0.5] opacity-90"
                    />
                  </div>
                  <OdishLineArtCompact className="absolute bottom-[0.4rem] right-0 h-[46px] w-[58%] text-ochre/85" />
                  <TornEdge tone="cream" />
                </div>
              </div>
              <div className="bg-cream">
                <div className="relative">
                  <div className="flex h-40 items-end justify-between px-5 pb-8">
                    <p className="font-display text-h3 text-ink">Tear + mark, wide</p>
                  </div>
                  <OdishLineArt className="absolute bottom-2 right-0 h-[74px] w-[58%] text-ochre/85" />
                  <TornEdge tone="forest-deep" edge="top" />
                </div>
              </div>
            </div>
            <p className="mt-4 font-sans text-note leading-relaxed text-ink-muted">
              The tear&rsquo;s height is <code className="rounded bg-cream-deep px-1">clamp(18px, 3.2vw, 34px)</code> —
              a 6px tear at 360px reads as a printing error, not paper. The landscape mark re-crops to
              the compact variant below <code className="rounded bg-cream-deep px-1">md</code>; it never
              changes aspect ratio.
            </p>
          </Row>

          {/* ── 8. rules ─────────────────────────────────────────────────── */}
          <Row id="rules" title="The ornament contract" note="what keeps decoration from becoming noise">
            <ol className="grid gap-3 sm:grid-cols-2">
              {[
                ["Decoration carries no meaning", "Every ornament is aria-hidden and pointer-events-none. If something must be read, it becomes a component with a label and a contrast pair."],
                ["Ink comes from a token", "ochre 4.61:1 (labels), ochre-soft, foliage, foliage-deep. No ornament may introduce a colour; `npm run check:tokens` fails the build."],
                ["One script per page", "The Parisienne accent is a signature, not a texture. Exactly one per page, never body copy."],
                ["Re-crop, never stretch", "Line-art swaps between landscape and compact variants and keeps its aspect ratio; only the tear may scale horizontally."],
                ["Motion is optional and cheap", "Ornaments are static. Nothing rotates, drifts or parallaxes — a 4.5:1 page that animates itself is still an annoying page."],
                ["Motion honours reduce", "Any future animated ornament must collapse to a static frame under prefers-reduced-motion, like Reveal does."],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-card border border-hair bg-cream-deep p-4">
                  <p className="font-sans text-note font-semibold text-ink">
                    {String(i + 1).padStart(2, "0")} · {t}
                  </p>
                  <p className="mt-1.5 font-sans text-label leading-relaxed text-ink-soft">{d}</p>
                </li>
              ))}
            </ol>
          </Row>
        </div>
      </main>
    </>
  );
}
