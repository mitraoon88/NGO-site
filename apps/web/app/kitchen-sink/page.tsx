import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag, Badge } from "@/components/ui/badge";
import { Card, CardMedia } from "@/components/ui/card";
import { ArrowChip } from "@/components/ui/arrow-chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Newsletter, TextField } from "@/components/ui/input";
import {
  IconArrowRight,
  IconBook,
  IconCalendar,
  IconCommunities,
  IconCommunity,
  IconDonate,
  IconFacebook,
  IconHealth,
  IconHeart,
  IconInstagram,
  IconLeaf,
  IconLeafSprig,
  IconLeaves,
  IconLinkedIn,
  IconLives,
  IconPartner,
  IconPlay,
  IconProjects,
  IconQuote,
  IconSearch,
  IconShield,
  IconSprout,
  IconVolunteer,
  IconYouTube,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Component sheet",
  alternates: { canonical: "/kitchen-sink" },
  robots: { index: false, follow: false },
};

/* ── colour data, with the measured contrast ratios from the analysis ────── */
const palette = [
  {
    name: "cream",
    hex: "#FBF7F0",
    note: "page background",
    fg: "#1C1C1A",
    swatch: "bg-cream",
  },
  {
    name: "cream-deep",
    hex: "#F6EFE3",
    note: "card surfaces",
    fg: "#1C1C1A",
    swatch: "bg-cream-deep",
  },
  {
    name: "sand",
    hex: "#E8DBC4",
    note: "rules, ornament",
    fg: "#1C1C1A",
    swatch: "bg-sand",
  },
  {
    name: "ink",
    hex: "#1C1C1A",
    note: "headings · 15.98:1",
    fg: "#FBF7F0",
    swatch: "bg-ink",
  },
  {
    name: "ink-soft",
    hex: "#3A3A38",
    note: "body · 10.67:1",
    fg: "#FBF7F0",
    swatch: "bg-ink-soft",
  },
  {
    name: "rust",
    hex: "#AB3D24",
    note: "action fill · 5.74:1",
    fg: "#FFFFFF",
    swatch: "bg-rust",
  },
  {
    name: "rust-text",
    hex: "#B23A26",
    note: "labels · 5.58:1",
    fg: "#FFFFFF",
    swatch: "bg-rust-text",
  },
  {
    name: "forest",
    hex: "#11231B",
    note: "impact band",
    fg: "#FBF7F0",
    swatch: "bg-forest",
  },
  {
    name: "forest-deep",
    hex: "#0E231D",
    note: "footer",
    fg: "#FBF7F0",
    swatch: "bg-forest-deep",
  },
  {
    name: "gold",
    hex: "#C9A961",
    note: "on forest · 7.29:1",
    fg: "#11231B",
    swatch: "bg-gold",
  },
  {
    name: "gold-deep",
    hex: "#A9853F",
    note: "icons on cream · decorative",
    fg: "#11231B",
    swatch: "bg-gold-deep",
  },
  {
    name: "peach",
    hex: "#E9A184",
    note: "soft accent · large text only",
    fg: "#11231B",
    swatch: "bg-peach",
  },
];

const typeScale = [
  {
    cls: "text-hero",
    label: "text-hero",
    spec: "clamp(3rem → 5.5rem) / 1.0 / −0.02em",
    sample: "People Planet",
  },
  {
    cls: "text-h2",
    label: "text-h2",
    spec: "clamp(2.25rem → 3.625rem) / 1.06",
    sample: "Real Change Real People",
  },
  {
    cls: "text-h2-sm",
    label: "text-h2-sm",
    spec: "clamp(1.9rem → 3rem) / 1.1",
    sample: "Be Part of the Change",
  },
  {
    cls: "text-h3",
    label: "text-h3",
    spec: "clamp(1.35rem → 1.5rem) / 1.25",
    sample: "Health & Wellbeing",
  },
  {
    cls: "text-stat",
    label: "text-stat",
    spec: "clamp(2.25rem → 3.125rem) / 1.0",
    sample: "150K+",
  },
  {
    cls: "text-lead",
    label: "text-lead",
    spec: "clamp(1rem → 1.125rem) / 1.7",
    sample: "A2 Foundation works with communities to create lasting change.",
  },
  {
    cls: "text-body",
    label: "text-body",
    spec: "16px / 1.7",
    sample: "Quality learning for every child and lifelong opportunities.",
  },
  {
    cls: "text-ui",
    label: "text-ui",
    spec: "14px / 1.55",
    sample: "Explore Our Impact",
  },
  {
    cls: "text-body-sm",
    label: "text-body-sm",
    spec: "15px / 1.65",
    sample: "A2 Foundation works with communities.",
  },
  {
    cls: "text-note",
    label: "text-note",
    spec: "13px / 1.55",
    sample: "Real stories. Real people. Real change.",
  },
  {
    cls: "text-eyebrow",
    label: "text-eyebrow",
    spec: "12px / 1 / 0.18em caps",
    sample: "Our Purpose",
  },
  {
    cls: "text-label",
    label: "text-label",
    spec: "12px / 1.4",
    sample: "Full name",
  },
  {
    cls: "text-micro",
    label: "text-micro",
    spec: "11px / 1.45",
    sample: "EDUCATION",
  },
  {
    cls: "text-nano",
    label: "text-nano",
    spec: "10px / 1.4 / 0.12em",
    sample: "12 SEP 2026",
  },
];

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

export default function KitchenSink() {
  return (
    <>
      <a href="#main-content" className="a2-skip">
        Skip to content
      </a>
      <main id="main-content" tabIndex={-1} className="bg-cream pb-24">
        {/* header */}
        <div className="border-b border-hair bg-cream-deep">
          <div className="a2-container flex flex-wrap items-center justify-between gap-6 py-6">
            <Logo />
            <div className="flex items-center gap-3">
              <Badge tone="rust">Phase 1</Badge>
              <p className="font-sans text-note text-ink-muted">
                Foundations &amp; primitives · review sheet
              </p>
            </div>
          </div>
        </div>

        <div className="a2-container">
          {/* ── page heading ────────────────────────────────────────────── */}
          <header className="max-w-copy pb-2 pt-14">
            <Eyebrow num="00">Phase 1 · review sheet</Eyebrow>
            <h1 className="mt-4 font-display text-h2 text-ink">
              Foundations <span className="italic text-rust-text">&amp;</span>{" "}
              primitives
            </h1>
            <p className="mt-4 font-sans text-body text-ink-soft">
              Every token, type step and component state in one page. Each
              swatch shows its measured contrast against the surface it actually
              sits on — nothing here is asserted without a number behind it.
            </p>
            <p className="mt-6 font-sans text-note text-ink-muted">
              Jump to:{" "}
              <a
                href="#colour"
                className="underline decoration-hair underline-offset-2 hover:text-rust-text"
              >
                colour
              </a>{" "}
              ·{" "}
              <a
                href="#type"
                className="underline decoration-hair underline-offset-2 hover:text-rust-text"
              >
                type
              </a>{" "}
              ·{" "}
              <a
                href="#controls"
                className="underline decoration-hair underline-offset-2 hover:text-rust-text"
              >
                controls
              </a>{" "}
              ·{" "}
              <a
                href="#surfaces"
                className="underline decoration-hair underline-offset-2 hover:text-rust-text"
              >
                surfaces
              </a>
            </p>
          </header>

          {/* ── palette ─────────────────────────────────────────────────── */}
          <Row
            id="colour"
            title="Colour"
            note="sampled from the mockup · contrast measured, not assumed"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {palette.map((c) => (
                <div
                  key={c.name}
                  className="overflow-hidden rounded-card border border-hair"
                >
                  <div
                    className={`flex h-20 items-end p-3 ${c.swatch}`}
                    style={{ color: c.fg }}
                  >
                    <span className="font-sans text-micro font-semibold uppercase tracking-[0.1em]">
                      {c.hex}
                    </span>
                  </div>
                  <div className="bg-cream px-3 py-2.5">
                    <p className="font-sans text-note font-semibold text-ink">
                      {c.name}
                    </p>
                    <p className="font-sans text-micro text-ink-muted">
                      {c.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-card border border-rust/25 bg-rust-wash p-4">
              <p className="font-sans text-[0.8125rem] leading-relaxed text-rust-text">
                <strong className="font-semibold">
                  Accessibility correction:
                </strong>{" "}
                the mockup&rsquo;s eyebrow terracotta measures 2.95:1 on cream
                (fails AA at 12px). We split it into{" "}
                <code className="rounded bg-white/60 px-1">rust</code> for fills
                and <code className="rounded bg-white/60 px-1">rust-text</code>{" "}
                (#B23A26, 5.58:1) for labels. Indistinguishable at a glance,
                defensible in an audit.
              </p>
            </div>
          </Row>

          {/* ── typography ──────────────────────────────────────────────── */}
          <Row
            id="type"
            title="Typography"
            note="Newsreader · Inter · Parisienne"
          >
            <div className="space-y-5">
              {typeScale.map((t) => (
                <div
                  key={t.label}
                  className="grid gap-2 border-b border-hair pb-5 sm:grid-cols-[160px_1fr] sm:gap-6"
                >
                  <div>
                    <p className="font-sans text-label font-semibold text-ink">
                      {t.label}
                    </p>
                    <p className="mt-0.5 font-sans text-micro leading-relaxed text-ink-muted">
                      {t.spec}
                    </p>
                  </div>
                  <p className={`font-display font-normal text-ink ${t.cls}`}>
                    {t.sample}
                  </p>
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:gap-6">
                <div>
                  <p className="font-sans text-label font-semibold text-ink">
                    font-script
                  </p>
                  <p className="mt-0.5 font-sans text-micro text-ink-muted">
                    Parisienne 40px · hero only
                  </p>
                </div>
                <p className="font-script text-[2.5rem] leading-none text-cream">
                  <span className="inline-block rounded-card bg-forest px-4 py-2">
                    Stronger Communities
                  </span>
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:gap-6">
                <div>
                  <p className="font-sans text-label font-semibold text-ink">
                    italic accent
                  </p>
                  <p className="mt-0.5 font-sans text-micro text-ink-muted">
                    used once per heading
                  </p>
                </div>
                <p className="font-display text-h2-sm text-ink">
                  …and sustainable{" "}
                  <em className="italic text-rust-text">Tomorrow.</em>
                </p>
              </div>
            </div>
          </Row>

          {/* ── buttons ─────────────────────────────────────────────────── */}
          <Row
            id="controls"
            title="Buttons"
            note="four treatments, no exceptions · 48px · 3px radius"
          >
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <p className="mb-3 font-sans text-micro uppercase tracking-[0.12em] text-ink-muted">
                    on cream
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="rust" withArrow>
                      Our Impact
                    </Button>
                    <ButtonLink
                      href="#"
                      variant="link"
                      className="font-semibold"
                    >
                      Read Story <IconArrowRight size={16} />
                    </ButtonLink>
                  </div>
                </div>
                <div>
                  <p className="mb-3 font-sans text-micro uppercase tracking-[0.12em] text-ink-muted">
                    sizes
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="rust" size="sm">
                      Small
                    </Button>
                    <Button variant="rust" size="md">
                      Medium
                    </Button>
                    <Button variant="rust" size="lg" withArrow>
                      Large
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="mb-3 font-sans text-micro uppercase tracking-[0.12em] text-ink-muted">
                    states
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="rust" disabled>
                      Disabled
                    </Button>
                    <button
                      className={buttonClass("rust", "md")}
                      aria-pressed="true"
                    >
                      Pressed
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-card bg-forest p-6">
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 font-sans text-micro uppercase tracking-[0.12em] text-cream/55">
                      on photography / dark
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="rust" withArrow>
                        Explore Our Impact
                      </Button>
                      <Button variant="outline-light">
                        Watch Our Story <IconPlay />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 font-sans text-micro uppercase tracking-[0.12em] text-cream/55">
                      cream action card (Get Involved)
                    </p>
                    <button className="group flex w-full items-center gap-4 rounded-btn bg-cream px-5 py-4 text-left transition-colors hover:bg-white">
                      <IconDonate
                        size={26}
                        className="shrink-0 text-rust-text"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-[0.9375rem] font-semibold text-ink">
                          Donate Now
                        </span>
                        <span className="block font-sans text-label text-ink-muted">
                          Support our mission
                        </span>
                      </span>
                      <IconArrowRight
                        size={18}
                        className="shrink-0 text-ink transition-transform duration-300 ease-a2 group-hover:translate-x-1"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Row>

          {/* ── eyebrows, tags, badges ──────────────────────────────────── */}
          <Row
            title="Eyebrow · Tag · Badge"
            note="the 01 | LABEL —— device opens every section"
          >
            <div className="space-y-6 rounded-card border border-hair bg-cream-deep p-6">
              <Eyebrow num="01">Our Purpose</Eyebrow>
              <Eyebrow num="03">Our Impact</Eyebrow>
              <Eyebrow>No numeral · no rule</Eyebrow>
              <div className="rounded-card bg-forest p-5">
                <Eyebrow num="06" onDark>
                  Get Involved
                </Eyebrow>
              </div>
              <div className="flex flex-wrap items-center gap-6 border-t border-hair pt-5">
                <Tag>Education</Tag>
                <Tag>Livelihoods</Tag>
                <Tag>Environment</Tag>
                <Badge tone="sand">12 Sep 2026</Badge>
                <Badge tone="rust">Most chosen</Badge>
                <Badge tone="outline">Outline</Badge>
              </div>
              <p className="font-sans text-note text-ink-muted">
                Tag has one colour only. Light accents (peach 7.73:1 on forest,
                gold-deep 3.05:1 on cream) read as decoration, not labels, so
                they never carry a category. Badge is the only pill in the
                system.
              </p>
            </div>
          </Row>

          {/* ── section heading ─────────────────────────────────────────── */}
          <Row
            title="SectionHeading"
            note="eyebrow + H2 + subline + optional trailing action"
          >
            <div className="space-y-10 rounded-card border border-hair bg-cream-deep p-6 sm:p-8">
              <SectionHeading
                num="02"
                eyebrow="Our Focus Areas"
                title="Integrated solutions for stronger communities"
                italicLast="and a healthier planet."
                subline="Four programmes, one operating principle: the community decides what changes first."
              />
              <SectionHeading
                num="04"
                eyebrow="Our Stories"
                title="Real stories. Real people."
                subline="First-person accounts from the districts where we work."
                action={
                  <div className="group flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-ink/25 text-ink/40">
                      <IconArrowRight size={16} className="rotate-180" />
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-ink/35 text-ink transition-colors group-hover:border-rust group-hover:bg-rust group-hover:text-white">
                      <IconArrowRight size={16} />
                    </span>
                  </div>
                }
              />
              <div className="rounded-card bg-forest p-6">
                <SectionHeading
                  num="03"
                  eyebrow="Our Impact"
                  title="Real Change Real People"
                  subline="From classrooms to communities, from livelihoods to our landscapes."
                  onDark
                />
              </div>
            </div>
          </Row>

          {/* ── cards ───────────────────────────────────────────────────── */}
          <Row
            id="surfaces"
            title="Cards"
            note="flat · photo · inline · paper · flat by design, no shadows"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* photo card = Focus Areas */}
              {[
                {
                  t: "Education",
                  c: "Quality learning for every child and lifelong opportunities.",
                  I: IconBook,
                },
                {
                  t: "Health & Wellbeing",
                  c: "Accessible healthcare for stronger communities.",
                  I: IconHealth,
                },
                {
                  t: "Livelihoods",
                  c: "Skills and opportunities for sustainable incomes.",
                  I: IconSprout,
                },
                {
                  t: "Environment",
                  c: "Conserving nature for future generations.",
                  I: IconLeaves,
                },
              ].map(({ t, c, I }) => (
                <Card key={t} variant="photo">
                  <CardMedia ratio="16/10">
                    <div className="grid h-full w-full place-items-center bg-sand/50">
                      <span className="font-sans text-nano uppercase tracking-[0.16em] text-ink-soft">
                        photo 16:10
                      </span>
                    </div>
                  </CardMedia>
                  <div className="p-5">
                    <I size={26} className="text-gold-deep" />
                    <h3 className="mt-4 font-display text-h3 font-normal text-ink">
                      {t}
                    </h3>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
                        {c}
                      </p>
                      <ArrowChip size="sm" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {/* inline card = Stories */}
              {[
                {
                  tag: "Education",
                  t: "A New Beginning for Ramesh",
                  c: "How education opened new possibilities for a brighter future.",
                },
                {
                  tag: "Livelihoods",
                  t: "From Struggles to Self-Reliance",
                  c: "A journey of resilience and new opportunities.",
                },
                {
                  tag: "Environment",
                  t: "Restoring Our Natural Heritage",
                  c: "Community-led conservation for a healthier tomorrow.",
                },
              ].map((s) => (
                <Card key={s.t} variant="inline" className="items-start">
                  <div className="h-[118px] w-[92px] shrink-0 overflow-hidden rounded-photo bg-sand/50">
                    <div className="grid h-full w-full place-items-center">
                      <span className="font-sans text-nano uppercase tracking-[0.12em] text-ink-soft">
                        4:5
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Tag>{s.tag}</Tag>
                    <h3 className="mt-2 font-display text-h4 font-normal leading-snug text-ink">
                      {s.t}
                    </h3>
                    <p className="mt-1.5 font-sans text-[0.75rem] leading-relaxed text-ink-soft">
                      {s.c}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 font-sans text-[0.75rem] font-semibold text-rust-text">
                      Read Story <IconArrowRight size={14} />
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {/* compact news card */}
              {[
                {
                  d: "12 Sep 2026",
                  t: "Building Climate-Resilient Communities in Odisha",
                },
                {
                  d: "05 Sep 2026",
                  t: "Expanding Education Access in Rural Areas",
                },
                {
                  d: "28 Aug 2026",
                  t: "Women-Led Enterprises Creating Local Impact",
                },
              ].map((n) => (
                <Card key={n.t} className="p-3">
                  <div className="flex items-center gap-4">
                    <div className="h-[62px] w-[96px] shrink-0 overflow-hidden rounded-photo bg-sand/50" />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-nano uppercase tracking-[0.12em] text-ink-soft">
                        {n.d}
                      </p>
                      <h3 className="mt-1 font-display text-body-sm font-normal leading-snug text-ink">
                        {n.t}
                      </h3>
                    </div>
                    <ArrowChip size="sm" />
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {/* paper frame = Purpose collage */}
              <Card variant="paper" className="p-2">
                <div className="grid aspect-[4/3] place-items-center rounded-[2px] bg-sand/50">
                  <span className="font-sans text-nano uppercase tracking-[0.16em] text-ink-soft">
                    landscape photo
                  </span>
                </div>
              </Card>
              <Card variant="paper" className="p-2">
                <div className="grid aspect-[4/3] place-items-center rounded-[2px] bg-sand/50">
                  <span className="font-sans text-nano uppercase tracking-[0.16em] text-ink-soft">
                    portrait photo
                  </span>
                </div>
              </Card>
              <Card className="flex flex-col justify-center bg-cream p-6 text-center">
                <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink">
                  Driven by people
                </p>
                <p className="mt-1 font-sans text-nano uppercase tracking-[0.16em] text-ink-soft">
                  Inspired by possibilities
                </p>
                <IconLeafSprig
                  size={30}
                  className="mx-auto mt-4 text-gold-deep"
                />
              </Card>
            </div>
          </Row>

          {/* ── form controls ───────────────────────────────────────────── */}
          <Row
            title="Inputs"
            note="cream field · 3px radius · rust focus · announced errors"
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-5 rounded-card border border-hair bg-cream-deep p-6">
                <TextField
                  label="Full name"
                  placeholder="As on your PAN"
                  hint="For your 80G receipt"
                />
                <TextField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                />
                <TextField
                  label="Phone"
                  placeholder="98765 43210"
                  optional
                  error="Enter a 10-digit Indian mobile number."
                  defaultValue="9876"
                />
              </div>

              <div className="space-y-8 rounded-card bg-forest p-6">
                <div>
                  <p className="mb-3 font-sans text-micro uppercase tracking-[0.12em] text-cream/55">
                    Newsletter — idle state
                  </p>
                  <Newsletter />
                </div>
                <div className="border-t border-cream/12 pt-6">
                  <p className="font-sans text-[0.8125rem] leading-relaxed text-cream/70">
                    The email field has no visible label — the footer design
                    carries none — so the accessible name comes from a
                    visually-hidden label and the placeholder is decorative
                    only. Submit an invalid address to see the error state; a
                    valid one shows the success message. Both are announced to
                    screen readers.
                  </p>
                </div>
              </div>
            </div>
          </Row>

          {/* ── icons ───────────────────────────────────────────────────── */}
          <Row title="Icons" note="1.5px line-art · currentColor · 24px box">
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-9">
              {[
                ["Community", IconCommunity],
                ["Leaf", IconLeaf],
                ["Heart", IconHeart],
                ["Shield", IconShield],
                ["Book", IconBook],
                ["Health", IconHealth],
                ["Sprout", IconSprout],
                ["Leaves", IconLeaves],
                ["Lives", IconLives],
                ["Communities", IconCommunities],
                ["Projects", IconProjects],
                ["Calendar", IconCalendar],
                ["Donate", IconDonate],
                ["Volunteer", IconVolunteer],
                ["Partner", IconPartner],
                ["Search", IconSearch],
                ["Facebook", IconFacebook],
                ["Instagram", IconInstagram],
                ["LinkedIn", IconLinkedIn],
                ["YouTube", IconYouTube],
              ].map(([name, I]) => {
                const Icon = I as React.ComponentType<{
                  size?: number;
                  className?: string;
                }>;
                return (
                  <div
                    key={name as string}
                    className="flex flex-col items-center gap-2 rounded-card border border-hair bg-cream-deep p-4"
                  >
                    <Icon size={26} className="text-gold-deep" />
                    <span className="font-sans text-nano text-ink-muted">
                      {name as string}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-8 rounded-card bg-forest p-6">
              <IconQuote size={40} className="text-gold" />
              <IconLeafSprig size={34} className="text-gold" />
              <IconCommunity size={30} className="text-gold" />
              <p className="font-display text-h4 italic text-cream/85">
                Icons flip to gold on forest — same components, parent sets the
                colour.
              </p>
            </div>
          </Row>

          {/* ── logo ────────────────────────────────────────────────────── */}
          <Row
            title="Logo"
            note="type lockup + inline leaf · compact variant for mobile"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-center rounded-card border border-hair bg-cream-deep p-10">
                <Logo />
              </div>
              <div className="flex items-center justify-center rounded-card bg-forest p-10">
                <Logo onDark />
              </div>
              <div className="flex flex-col items-center justify-center gap-6 rounded-card border border-hair bg-cream-deep p-10">
                <Logo compact />
                <span className="rounded-card bg-forest px-6 py-3">
                  <Logo compact onDark />
                </span>
              </div>
            </div>
          </Row>

          {/* ── reveal & motion ─────────────────────────────────────────── */}
          <Row
            title="Motion"
            note="600ms rise · 180ms colour · everything off under reduced-motion"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 120, 240].map((d) => (
                <Reveal key={d} delay={d}>
                  <div className="rounded-card border border-hair bg-cream-deep p-6">
                    <p className="font-sans text-[0.75rem] uppercase tracking-[0.12em] text-ink-muted">
                      reveal · {d}ms delay
                    </p>
                    <p className="mt-2 font-display text-h3 text-ink">
                      Scroll &amp; reload
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Row>

          {/* ── spacing tokens ──────────────────────────────────────────── */}
          <Row
            title="Spacing & shape"
            note="measured from the mockup, ×1.78 to 1440"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Container",
                  "max-w-page 1280px",
                  "88.6% of viewport → 1276px @1440",
                ],
                ["Gutter", "px-5 / 8 / 10", "20 → 40px"],
                ["Section", "py-16 / 20 / 24", "64 → 96px"],
                ["Radius", "btn 3 · card 4 · photo 3", "near-square by design"],
              ].map(([a, b, c]) => (
                <div
                  key={a}
                  className="rounded-card border border-hair bg-cream-deep p-5"
                >
                  <p className="font-sans text-micro uppercase tracking-[0.12em] text-ink-muted">
                    {a}
                  </p>
                  <p className="mt-2 font-display text-[1.0625rem] text-ink">
                    {b}
                  </p>
                  <p className="mt-1 font-sans text-label text-ink-muted">
                    {c}
                  </p>
                </div>
              ))}
            </div>
          </Row>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-hair pt-8">
            <Logo compact />
            <p className="font-sans text-label text-ink-muted">
              Phase 1 review sheet · everything on this page is driven by{" "}
              <code className="rounded bg-cream-deep px-1">
                brand/tokens.css
              </code>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
