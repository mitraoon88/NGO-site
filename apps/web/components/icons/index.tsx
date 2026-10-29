import type { SVGProps } from "react";

/**
 * Line-art icon set, hand-drawn to match the mockup's 1.5px botanical strokes.
 * All icons share a 24×24 box and use `currentColor`, so a parent sets the
 * colour — gold on dark, rust/gold-deep on cream, never a hard-coded value.
 *
 * Drawn deliberately thin and slightly irregular: the mockup's icons read as
 * pen sketches, not as a UI icon font.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── Values bar (03) ─────────────────────────────────────────────────────── */

/** Community First — two figures + a shared arc */
export const IconCommunity = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="7.5" r="2.6" />
    <circle cx="16.2" cy="9.2" r="2" />
    <path d="M3.6 19.5c0-3 2.4-5.2 5.4-5.2s5.4 2.2 5.4 5.2" />
    <path d="M14.6 14.7c2.6-.6 5.4 1.2 5.4 4.8" />
  </Base>
);

/** Sustainable Change — a leaf with a midrib */
export const IconLeaf = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 4c0 7.2-4.3 11.4-9.6 11.4-1.4 0-2.7-.3-3.7-.9C7.4 8.1 12.2 4 20 4Z" />
    <path d="M20 4C15.6 7.6 11.7 12.4 9.4 18.8" />
    <path d="M4 20c.9-1.9 1.9-3.4 3-4.7" />
  </Base>
);

/** Inclusive Growth — a heart made of two interlocking strokes */
export const IconHeart = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20.2c-1.1-1-4.4-3.3-6.3-6C4.4 12.4 4.6 9.5 6.6 8.2c1.9-1.2 4.3-.3 5.4 1.7 1.1-2 3.5-2.9 5.4-1.7 2 1.3 2.2 4.2.9 6-1.9 2.7-5.2 5-6.3 6Z" />
    <path d="M9.4 11.2c.6-.5 1.4-.5 2 0l.6.6.6-.6c.6-.5 1.4-.5 2 0" />
  </Base>
);

/** Transparent Action — a balance/seal mark */
export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5 19 6v5.6c0 4-2.8 7.4-7 8.9-4.2-1.5-7-4.9-7-8.9V6l7-2.5Z" />
    <path d="M9 12.2l2.1 2.1 4-4.3" />
  </Base>
);

/* ── Focus areas (05) ────────────────────────────────────────────────────── */

/** Education — open book */
export const IconBook = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 5.4c2.9-1 5.7-.7 8.5 1.1 2.8-1.8 5.6-2.1 8.5-1.1v12.4c-2.9-1-5.7-.7-8.5 1.1-2.8-1.8-5.6-2.1-8.5-1.1V5.4Z" />
    <path d="M12 6.5v12.3" />
  </Base>
);

/** Health & Wellbeing — heart with a pulse */
export const IconHealth = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20c-1.1-1-4.4-3.3-6.3-6C4.4 12.2 4.6 9.3 6.6 8c1.9-1.2 4.3-.3 5.4 1.7 1.1-2 3.5-2.9 5.4-1.7 2 1.3 2.2 4.2.9 6-1.9 2.7-5.2 5-6.3 6Z" />
    <path d="M8.6 12.4h2l1.1-2 1.4 3.4 1-1.4h1.4" />
  </Base>
);

/** Livelihoods — sprout from soil */
export const IconSprout = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20v-7.2" />
    <path d="M12 12.8C12 9.6 9.7 7 6.4 6.6c-.3 3.4 2 6.2 5.6 6.2Z" />
    <path d="M12 12.8c0-2.6 1.9-4.8 4.6-5.2.3 2.9-1.7 5.2-4.6 5.2Z" />
    <path d="M7.4 20h9.2" />
  </Base>
);

/** Environment — layered leaves */
export const IconLeaves = (p: IconProps) => (
  <Base {...p}>
    <path d="M18.6 4.4c0 5.4-3.2 8.6-7.2 8.6-1 0-2-.2-2.8-.7.5-4.8 4.1-7.9 10-7.9Z" />
    <path d="M18.6 4.4c-3.3 2.7-6.2 6.2-7.9 11" />
    <path d="M13.4 20c-3.6 0-6.2-2.2-6.8-5.4 2.4-.1 4.6.8 5.8 2.6.7 1 .9 1.9 1 2.8Z" />
    <path d="M5.4 20h13" />
  </Base>
);

/* ── Impact stats (06) ───────────────────────────────────────────────────── */

/** Lives touched — figures in a heart */
export const IconLives = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20.5c-1.2-1.1-4.8-3.6-6.8-6.4C3.6 11.6 4 8.4 6.2 7.1c1.9-1.1 4.2-.2 5.3 1.8 1.1-2 3.4-2.9 5.3-1.8 2.2 1.3 2.6 4.5 1 7-2 2.8-5.6 5.3-5.8 6.4Z" />
    <circle cx="12" cy="11.4" r="1.5" />
    <path d="M9.4 15.4c.5-1.2 1.4-1.9 2.6-1.9s2.1.7 2.6 1.9" />
  </Base>
);

/** Communities — three figures */
export const IconCommunities = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8.2" r="2.3" />
    <path d="M7.6 18.6c0-2.4 2-4.2 4.4-4.2s4.4 1.8 4.4 4.2" />
    <circle cx="5.6" cy="10.4" r="1.7" />
    <path d="M2.6 17.4c0-1.8 1.4-3.1 3-3.1" />
    <circle cx="18.4" cy="10.4" r="1.7" />
    <path d="M21.4 17.4c0-1.8-1.4-3.1-3-3.1" />
  </Base>
);

/** Projects implemented — hands + a sapling */
export const IconProjects = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 12.6V6.2" />
    <path d="M12 8.4C10.2 8.4 8.6 7.1 8.4 5c1.8 0 3.4 1.3 3.6 3.4Z" />
    <path d="M12 7.2c1.6 0 3-1.1 3.2-2.9-1.6 0-3 1.1-3.2 2.9Z" />
    <path d="M12 12.6c-2.6 0-4.6 1.6-4.6 4.2 0 1.6.9 3 2.4 3.8" />
    <path d="M12 12.6c2.6 0 4.6 1.6 4.6 4.2 0 1.6-.9 3-2.4 3.8" />
    <path d="M4.4 18.6c1.4 1.2 3 2 4.6 2.2M19.6 18.6c-1.4 1.2-3 2-4.6 2.2" />
  </Base>
);

/** Years of impact — calendar with a seal */
export const IconCalendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.6" y="5.4" width="16.8" height="14.4" rx="1.6" />
    <path d="M3.6 9.6h16.8M8.4 3.4v3.4M15.6 3.4v3.4" />
    <path d="M8.4 13.2h2.4v2.4H8.4zM13.2 13.2h2.4v2.4h-2.4z" />
  </Base>
);

/* ── Actions / utility (01, 08) ──────────────────────────────────────────── */

/** Donate — heart in a circle */
export const IconDonate = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 16.4c-.6-.6-2.6-1.9-3.7-3.4-1.1-1.4-.9-2.9.2-3.6 1-.7 2.3-.2 3 .9.7-1.1 2-1.6 3-.9 1.1.7 1.3 2.2.2 3.6-1.1 1.5-2.1 2.8-2.7 3.4Z" />
  </Base>
);

/** Volunteer — raised hand with a heart */
export const IconVolunteer = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 12.4V5.6a1.3 1.3 0 0 1 2.6 0v5.2M11.6 10.8V4.4a1.3 1.3 0 0 1 2.6 0v6.4M14.2 10.8V5.8a1.3 1.3 0 0 1 2.6 0v7.4" />
    <path d="M9 12.4 7.4 10a1.3 1.3 0 0 0-2.2 1.4l3.2 5.6c1 1.8 2.6 2.8 4.6 2.8h2.4c2.1 0 3.6-1.5 3.6-3.6v-3" />
    <path d="M13.4 20.4c.4-.5 1.9-1.4 2.7-2.5" />
  </Base>
);

/** Partner — two interlocking rings */
export const IconPartner = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9.4" cy="13.4" r="4.6" />
    <circle cx="14.6" cy="13.4" r="4.6" />
    <path d="M12 4.2c1.1-.9 3-.7 3.6.6.5 1.1-.1 2.3-1.2 2.8" />
  </Base>
);

/** Search */
export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="10.8" cy="10.8" r="6.4" />
    <path d="M15.6 15.6 20.4 20.4" />
  </Base>
);

/* ── Arrows ──────────────────────────────────────────────────────────────── */

export const IconArrowRight = ({ size = 20, ...p }: IconProps) => (
  <Base size={size} strokeWidth={1.6} {...p}>
    <path d="M4.5 12h15M13.4 6.2 19.2 12l-5.8 5.8" />
  </Base>
);

export const IconArrowUpRight = ({ size = 16, ...p }: IconProps) => (
  <Base size={size} strokeWidth={1.7} {...p}>
    <path d="M7 17 17 7M8.4 7H17v8.6" />
  </Base>
);

/** Play — the Watch Our Story button */
export const IconPlay = ({ size = 14, ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...p}
  >
    <path d="M3.6 1.8 12 7l-8.4 5.2z" />
  </svg>
);

/* ── Socials (footer) ────────────────────────────────────────────────────── */

export const IconFacebook = (p: IconProps) => (
  <Base {...p} strokeWidth={1.4}>
    <path d="M13.8 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.5V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.3v2.9h2.5V21" />
  </Base>
);

export const IconInstagram = (p: IconProps) => (
  <Base {...p} strokeWidth={1.4}>
    <rect x="4" y="4" width="16" height="16" rx="4.4" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.6" cy="7.4" r=".9" fill="currentColor" stroke="none" />
  </Base>
);

export const IconLinkedIn = (p: IconProps) => (
  <Base {...p} strokeWidth={1.4}>
    <rect x="4" y="4" width="16" height="16" rx="2.4" />
    <path d="M8 10.6V16M8 8.1v.1M11.6 16v-3.1c0-1.2.8-2 1.9-2s1.9.8 1.9 2V16" />
  </Base>
);

export const IconYouTube = (p: IconProps) => (
  <Base {...p} strokeWidth={1.4}>
    <rect x="3" y="6" width="18" height="12" rx="3.4" />
    <path d="M10.6 9.6 14.4 12l-3.8 2.4z" fill="currentColor" stroke="none" />
  </Base>
);

/* ── Misc ────────────────────────────────────────────────────────────────── */

/** Leaf sprig used beside the script accent and in the "DRIVEN BY PEOPLE" card */
export const IconLeafSprig = ({ size = 28, ...p }: IconProps) => (
  <Base size={size} strokeWidth={1.2} {...p}>
    <path d="M6 21c1.6-4.4 4.2-7.6 8-9.6" />
    <path d="M12.2 8.6c2.2-2.4 5-3.4 8-3-.2 3.4-2.6 5.8-6 5.8-1.4 0-2.6-.5-3.4-1.3.3-.6.8-1.1 1.4-1.5Z" />
    <path d="M8.4 15.4c-2.6-.6-4.4-2.4-4.8-5.2 2.8.1 4.8 1.8 5.2 4.4" />
  </Base>
);

/** Hand-drawn quotation mark */
export const IconQuote = ({ size = 40, ...p }: IconProps) => (
  <svg
    width={size}
    height={size * 0.72}
    viewBox="0 0 40 29"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...p}
  >
    <path d="M0 29V16.6C0 7.6 4.6 1.7 13.4 0l1.7 4.3c-4.6 1.4-7 4.2-7.2 8.3h7.2V29H0Zm24.9 0V16.6C24.9 7.6 29.5 1.7 38.3 0L40 4.3c-4.6 1.4-7 4.2-7.2 8.3H40V29H24.9Z" />
  </svg>
);
