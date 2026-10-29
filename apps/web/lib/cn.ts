import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import preset from "../../../brand/tailwind.preset";

/**
 * tailwind-merge must know every custom utility, or it silently deletes them.
 * The failure mode is nasty and invisible: `text-white` is dropped because
 * `text-h3` was assumed to be a colour, and a rust button ends up with ink
 * labels. So the lists below are DERIVED from the preset itself — adding a
 * token can never leave the merger out of date.
 */
const theme = (preset as { theme?: { extend?: Record<string, Record<string, unknown>> } })
  .theme?.extend ?? {};

const keys = (group: string): string[] => Object.keys(theme[group] ?? {});

const fontSizeKeys = keys("fontSize");       // hero, h2, h3, body, ui, …
const borderRadiusKeys = keys("borderRadius"); // btn, card, photo
const maxWidthKeys = keys("maxWidth");       // page, copy, copy-sm, measure
const shadowKeys = keys("boxShadow");        // card, menu

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: fontSizeKeys }],
      rounded: [{ rounded: borderRadiusKeys }],
      "max-w": [{ max: maxWidthKeys }],
      shadow: [{ shadow: shadowKeys }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Exposed for the token/merge parity test. */
export const mergeKeys = {
  fontSize: fontSizeKeys,
  borderRadius: borderRadiusKeys,
  maxWidth: maxWidthKeys,
  boxShadow: shadowKeys,
};
