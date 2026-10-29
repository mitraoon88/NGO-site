import { cn } from "@/lib/cn";
import {
  IconCommunity,
  IconLeaf,
  IconHeart,
  IconShield,
  IconBook,
  IconHealth,
  IconSprout,
  IconLeaves,
  IconLives,
  IconCommunities,
  IconProjects,
  IconCalendar,
  IconDonate,
  IconVolunteer,
  IconPartner,
} from "@/components/icons";

/**
 * The icon registry for content sections.
 *
 * Content files name an icon by string (`icon: "leaf"`), so the mapping from
 * content to component has to live in code — otherwise a writer could ask for an
 * icon that does not exist and only find out at render time in production. This
 * record is the single allow-list, and `resolveIcon` falls back loudly rather
 * than silently rendering nothing.
 */
export const icons = {
  // values bar
  community: IconCommunity,
  leaf: IconLeaf,
  heart: IconHeart,
  shield: IconShield,
  // focus areas
  book: IconBook,
  health: IconHealth,
  sprout: IconSprout,
  leaves: IconLeaves,
  // impact stats
  lives: IconLives,
  communities: IconCommunities,
  projects: IconProjects,
  calendar: IconCalendar,
  // get involved
  donate: IconDonate,
  volunteer: IconVolunteer,
  partner: IconPartner,
} as const;

export type IconName = keyof typeof icons;

/**
 * IconOrnament — a content-section icon.
 *
 * These are decorative companions to a label that is already in the DOM, so they
 * are always `aria-hidden`. The alternative — giving each an accessible name —
 * makes a screen reader announce "leaf, Sustainable Change", which is noise: the
 * icon carries no information the adjacent text does not.
 *
 * Colour comes from the caller via `currentColor`, and every size is a token
 * scale step rather than an arbitrary value.
 */
export function IconOrnament({
  name,
  className,
  size = 28,
  strokeWidth,
}: {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Glyph = icons[name];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0", className)}>
      <Glyph size={size} strokeWidth={strokeWidth} />
    </span>
  );
}
