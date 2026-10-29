/**
 * Homepage content — all of it.
 *
 * Every string on the homepage lives here, transcribed from the mockup. Phase 6
 * moves this file behind the WordPress REST API; nothing in `app/page.tsx` or the
 * section components assumes the data is local, so that swap is one module.
 *
 * Two things to know:
 *   1. `image` paths point at `/images/*` placeholders. The client's licensed
 *      photography replaces the files and these entries stay as they are.
 *   2. `href` values are real routes that Phase 5 will build. Until then they are
 *      intentionally valid links into a 404-free future rather than `#` stubs —
 *      a dead `#` is a keyboard trap and a lie about what the page offers.
 */

export type NavItem = { label: string; href: string };

export const site = {
  name: "A2 Foundation",
  tagline: "People · Planet · Possibility",
  mission:
    "Working with people and communities to build a more equitable, inclusive and sustainable tomorrow.",
  founded: 2014,
} as const;

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Our Work", href: "/our-work" },
  { label: "Impact", href: "/impact" },
  { label: "Stories", href: "/stories" },
  { label: "Get Involved", href: "/get-involved" },
];

export const hero = {
  eyebrow: "A brighter tomorrow",
  title: ["People", "Planet", "Possibility"],
  lead: "A2 Foundation works with communities to create lasting change through education, health, livelihoods and a sustainable environment.",
  primary: { label: "Our Impact", href: "/impact" },
  secondary: { label: "Watch Our Story", href: "/stories" },
  image: {
    src: "/images/hero-placeholder.jpg",
    alt: "Golden-hour light across a village path and mud wall in rural Odisha",
    width: 1400,
    height: 560,
  },
} as const;

/** The four principles that convert the hero's emotion into a method statement. */
export const values = [
  { icon: "community", label: "Community First", note: "People-led development" },
  { icon: "leaf", label: "Sustainable Change", note: "Long-term impact" },
  { icon: "heart", label: "Inclusive Growth", note: "No one left behind" },
  { icon: "shield", label: "Transparent Action", note: "Accountable and ethical" },
] as const;

export const purpose = {
  eyebrow: "Our Purpose",
  num: "01",
  title: ["Together for", "a more equitable", "and sustainable"],
  italicLast: "Tomorrow.",
  body: "We believe every individual, every community and every ecosystem has the power to shape a better tomorrow. Our work is rooted in compassion, collaboration and measurable action.",
  cta: { label: "Learn More About Us", href: "/about" },
  quote: "Real change begins when communities believe in their own potential.",
  quoteAttribution: "A2 Foundation",
  card: { line1: "Driven by People", line2: "Inspired by Possibilities" },
  images: {
    landscape: {
      src: "/images/ph-purpose.jpg",
      alt: "A village of tiled houses among coconut palms at sunset, beside green paddy",
      width: 1400,
      height: 933,
    },
    portrait: {
      src: "/images/ph-purpose-portrait.jpg",
      alt: "Daylight falling through a doorway onto a woven mat in a village home",
      width: 1120,
      height: 1400,
    },
  },
} as const;

export const focus = {
  eyebrow: "Our Focus Areas",
  num: "02",
  subline: "Integrated solutions for stronger communities and a healthier planet.",
  cards: [
    {
      title: "Education",
      icon: "book",
      body: "Quality learning for every child and lifelong opportunities.",
      href: "/our-work#education",
      image: {
        src: "/images/ph-focus-education.jpg",
        alt: "An empty village classroom with sunlight falling across wooden desks",
      },
    },
    {
      title: "Health & Wellbeing",
      icon: "health",
      body: "Accessible healthcare for stronger communities.",
      href: "/our-work#health",
      image: {
        src: "/images/ph-focus-health.jpg",
        alt: "A community health worker's kit laid out on a cloth",
      },
    },
    {
      title: "Livelihoods",
      icon: "sprout",
      body: "Skills and opportunities for sustainable incomes.",
      href: "/our-work#livelihoods",
      image: {
        src: "/images/ph-focus-livelihoods.jpg",
        alt: "A green paddy field with a basket and tools at its edge at golden hour",
      },
    },
    {
      title: "Environment",
      icon: "leaves",
      body: "Conserving nature for future generations.",
      href: "/our-work#environment",
      image: {
        src: "/images/ph-focus-environment.jpg",
        alt: "A wide river winding through forested hills seen from above",
      },
    },
  ],
} as const;

export const impact = {
  eyebrow: "Our Impact",
  num: "03",
  title: ["Real Change", "Real People"],
  body: "From classrooms to communities, from livelihoods to our environment — seamless efforts are core to creating measurable, lasting impact.",
  cta: { label: "Explore Our Impact", href: "/impact" },
  stats: [
    { icon: "lives", value: "150K+", label: "Lives Touched" },
    { icon: "communities", value: "350+", label: "Communities" },
    { icon: "projects", value: "120+", label: "Projects Implemented" },
    { icon: "calendar", value: "12+", label: "Years of Impact" },
  ],
  testimonial: {
    quote:
      "A2 Foundation has given our community hope and opportunities we never imagined possible.",
    attribution: "Community Member, Odisha",
  },
} as const;

export const stories = {
  eyebrow: "Our Stories",
  num: "04",
  subline: "Real stories. Real people. Real change.",
  items: [
    {
      tag: "Education",
      title: "A New Beginning for Ramesh",
      body: "How education opened new possibilities for a brighter future.",
      href: "/stories/a-new-beginning-for-ramesh",
      image: {
        src: "/images/ph-story-1.jpg",
        alt: "An open notebook and pencil on a wooden desk in a sunlit classroom",
      },
    },
    {
      tag: "Livelihoods",
      title: "From Struggles to Self-Reliance",
      body: "A journey of resilience and new opportunities.",
      href: "/stories/from-struggles-to-self-reliance",
      image: {
        src: "/images/ph-story-2.jpg",
        alt: "A hand-cranked sewing machine and folded fabrics in a small workshop",
      },
    },
    {
      tag: "Environment",
      title: "Restoring Our Natural Heritage",
      body: "Community-led conservation for a healthier tomorrow.",
      href: "/stories/restoring-our-natural-heritage",
      image: {
        src: "/images/ph-story-3.jpg",
        alt: "A river winding through green forested hills in morning mist",
      },
    },
  ],
} as const;

export const involved = {
  eyebrow: "Get Involved",
  num: "05",
  title: ["Be Part of", "the Change"],
  body: "Your support helps us create stronger communities, brighter opportunities and a more sustainable future.",
  image: {
    src: "/images/ph-involved.jpg",
    alt: "A meadow of tall dry grass glowing amber at sunset",
    width: 1400,
    height: 600,
  },
  actions: [
    {
      icon: "donate",
      label: "Donate Now",
      sublabel: "Support our mission",
      href: "/get-involved#donate",
    },
    {
      icon: "volunteer",
      label: "Volunteer",
      sublabel: "Give your time and skills",
      href: "/get-involved#volunteer",
    },
    {
      icon: "partner",
      label: "Partner With Us",
      sublabel: "Create greater impact together",
      href: "/get-involved#partner",
    },
  ],
} as const;

/**
 * Partners. The mockup shows real third-party marks (Tata Trusts, HCL, Infosys,
 * Reliance Foundation, Bharti, USAID, UN) — those may only be displayed with
 * written permission from each organisation, and each mark has a current official
 * form. Until the client supplies approved SVGs and confirms the relationships,
 * this renders as neutral name plates. Flagged in docs/09-phase-3-homepage.md.
 */
export const partners = {
  eyebrow: "Our Partners",
  num: "06",
  subline:
    "We are proud to collaborate with organisations, institutions and individuals who share our vision.",
  note: "Placeholder name plates — replace with approved partner marks.",
  items: [
    { name: "Tata Trusts" },
    { name: "HCL Foundation" },
    { name: "Infosys Foundation" },
    { name: "Reliance Foundation" },
    { name: "Bharti Foundation" },
    { name: "USAID" },
    { name: "UNDP" },
  ],
  more: { label: "and more", href: "/partners" },
} as const;

export const news = {
  eyebrow: "News & Insights",
  num: "07",
  subline: "Updates, perspectives and stories from our work.",
  cta: { label: "View All", href: "/news" },
  items: [
    {
      date: "2026-09-12",
      title: "Building Climate-Resilient Communities in Odisha",
      href: "/news/climate-resilient-communities",
      image: {
        src: "/images/ph-story-3.jpg",
        alt: "A river winding through green forested hills",
      },
    },
    {
      date: "2026-09-05",
      title: "Expanding Education Access in Rural Areas",
      href: "/news/expanding-education-access",
      image: {
        src: "/images/ph-story-1.jpg",
        alt: "An open notebook on a sunlit classroom desk",
      },
    },
    {
      date: "2026-08-28",
      title: "Women-Led Enterprises Creating Local Impact",
      href: "/news/women-led-enterprises",
      image: {
        src: "/images/ph-story-2.jpg",
        alt: "A sewing machine and folded fabrics in a small workshop",
      },
    },
  ],
} as const;

export const footer = {
  mission:
    "Working with people and communities to build a more equitable, inclusive and sustainable tomorrow.",
  quickLinks: {
    heading: "Quick Links",
    items: nav,
  },
  focusLinks: {
    heading: "Our Focus",
    items: [
      { label: "Education", href: "/our-work#education" },
      { label: "Health & Wellbeing", href: "/our-work#health" },
      { label: "Livelihoods", href: "/our-work#livelihoods" },
      { label: "Environment", href: "/our-work#environment" },
    ],
  },
  newsletter: {
    heading: "Stay Connected",
    note: "Subscribe to our newsletter for updates, stories and impact reports.",
    placeholder: "Enter your email",
    submit: "Subscribe",
  },
  social: [
    { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
    { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
    { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
    { label: "YouTube", href: "https://youtube.com", icon: "youtube" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Sitemap", href: "/sitemap" },
  ],
  copyright: "© 2026 A2 Foundation. All rights reserved.",
} as const;
