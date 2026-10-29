/**
 * Phase 2 — ornament & art system.
 *
 * Six primitives, all of them decoration: `aria-hidden`, `pointer-events-none`,
 * `currentColor`, and no meaning that is not also available as text. That is the
 * contract — the moment an ornament carries information it has to become a
 * component with a label and an audited contrast pair.
 *
 *   TornEdge        deckled paper edge, as an SVG mask      → hero / band joins
 *   FoliageSpray    long botanical branch, cropped by edge   → section margins
 *   LeafSprig       small 3-leaf cutting, never cropped      → script / cards
 *   CircleStamp     live text-on-path rubber stamp           → Purpose overlap
 *   ScriptAccent    Parisienne flourish, once per page       → hero
 *   OdishLineArt    pen-and-ink Odisha vignette (the mark)   → inside the tear
 */

export { TornEdge, TornEdgeWithArt } from "./torn-edge";
export { FoliageSpray, LeafSprig, FoliageCorner } from "./foliage";
export { CircleStamp } from "./circle-stamp";
export { ScriptAccent } from "./script-accent";
export { OdishLineArt, OdishLineArtCompact } from "./odisha-line-art";

export { OrnamentHero } from "./ornament-demo";
