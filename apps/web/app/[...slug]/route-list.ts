/**
 * Every route the homepage links to, in one place.
 *
 * Kept as a plain module (no JSX) so both `generateStaticParams` and the
 * validation harness can import it without dragging React into a Node script.
 * Phase 5 deletes this file and its folder once the real pages exist — anything
 * still listed here is, by definition, a promise the site has not kept yet.
 */
export type RouteShell = { path: string; title: string };

export const sitesectionMetadata: RouteShell[] = [
  // primary navigation
  { path: "about", title: "About A2 Foundation" },
  { path: "our-work", title: "Our Work" },
  { path: "impact", title: "Our Impact" },
  { path: "stories", title: "Stories" },
  { path: "get-involved", title: "Get Involved" },
  // secondary destinations used by cards, partners and the legal bar
  { path: "partners", title: "Our Partners" },
  { path: "news", title: "News & Insights" },
  { path: "privacy", title: "Privacy Policy" },
  { path: "terms", title: "Terms of Use" },
  { path: "sitemap", title: "Sitemap" },
  // story and news detail pages
  { path: "stories/a-new-beginning-for-ramesh", title: "A New Beginning for Ramesh" },
  { path: "stories/from-struggles-to-self-reliance", title: "From Struggles to Self-Reliance" },
  { path: "stories/restoring-our-natural-heritage", title: "Restoring Our Natural Heritage" },
  { path: "news/climate-resilient-communities", title: "Building Climate-Resilient Communities in Odisha" },
  { path: "news/expanding-education-access", title: "Expanding Education Access in Rural Areas" },
  { path: "news/women-led-enterprises", title: "Women-Led Enterprises Creating Local Impact" },
];
