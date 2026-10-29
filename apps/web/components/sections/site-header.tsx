"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { buttonClass } from "@/components/ui/button";
import { IconSearch, IconArrowRight } from "@/components/icons";
import { nav } from "@/content/home";

/**
 * SiteHeader — sticky, transparent over the hero, solid cream on scroll.
 *
 * Three decisions worth stating, because each one is a way this component is
 * usually built wrong:
 *
 *  1. **The bar is 92px on desktop because the lockup is three lines.** The
 *     mockup's bar is 60 mock px (×1.78 ≈ 107); the wordmark, the FOUNDATION line
 *     and the tagline together need ~66px, so anything under ~88px clips the tag.
 *     92px it is — the closest round number to the measurement that actually fits.
 *     Mobile gets 64px and drops to the two-line lockup. The height is set on the
 *     bar itself, never as a magic padding sum.
 *
 *  2. **"Solid on scroll" is one class, not a state machine.** The previous
 *     instinct — track `scrollY` in state and swap ~8 classes — re-renders the
 *     header on every scroll frame and desynchronises from CSS transitions. A
 *     single `data-scrolled` attribute plus CSS does the same job with one paint.
 *     The attribute is set from a passive listener that only writes when the
 *     boolean actually flips.
 *
 *  3. **Cream, fixed, and no scroll state.** The mockup's bar is a solid paper
 *     strip with the photograph starting beneath it, so that is what this is. Two
 *     earlier passes got it wrong in opposite directions: `sticky` + transparent
 *     left the nav on the cream page at 1.02:1 (invisible), and `fixed` +
 *     transparent put the rust-and-forest logo on a dark photograph at 1.9:1.
 *     Cream fixes both, and once the colour is constant there is nothing for a
 *     scroll listener to do — so there is no listener. The hero reserves the
 *     bar's 108px with `pt`, because the bar is `fixed` and takes no space.
 *
 *  4. **The mobile sheet is a real disclosure.** It traps nothing (it is not a
 *     modal — it pushes the page, and the page stays usable), it closes on Escape
 *     and on route change, it returns focus to the trigger, and it is `inert`
 *     when closed so its links are not tab stops behind a hidden panel.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const navProbeRef = useRef<HTMLDivElement>(null);

  /**
   * Whether the bar can hold the full nav — decided by measuring, not by the
   * viewport width.
   *
   * The usual `lg:` breakpoint answers "is the viewport at least 1024px", but that
   * is not the question the header needs answered. It needs "does six links plus a
   * Donate button and a language switch fit between the logo and the right edge".
   * Those differ whenever the *text* changes size or language rather than the
   * window: at the 200% text size WCAG 1.4.4 requires, the nav needs ~1.5× the
   * room while a px breakpoint still calls the viewport "desktop" — the Donate
   * button was pushed off the right edge entirely. The same thing will happen the
   * day the nav is translated into Odia, whose labels are longer than the English
   * placeholders.
   *
   * So: render the full nav, measure it, and fall back to the compact header when
   * it genuinely does not fit. `wantsFull` keeps the intent (this is a desktop-ish
   * viewport) separate from `fits` (it has the room). */
  const [navFits, setNavFits] = useState(true);

  /**
   * Publish the bar's own height as `--a2-header-h`.
   *
   * The hero reserves space for this bar, and that reservation used to be the
   * constant `92px`. A constant is fine until the user enlarges their text: at
   * 200% the bar legitimately grows to two rows and 280px, and a hard-coded 92
   * left the headline *underneath* the bar.
   *
   * Measuring beats guessing here, and it also keeps working if the client's
   * final logo lockup is a different height — nothing to remember to update.
   */
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const apply = () =>
      document.documentElement.style.setProperty("--a2-header-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Measure the nav off a hidden clone, not off the real one.
   *
   * The first version measured the live nav and hid it when it did not fit — which
   * made it measure 0 wide, so it showed again, so it hid again. The header
   * oscillated forever and Playwright reported the menu button as "not stable"
   * (a genuinely useful symptom: a control that never stops moving is not
   * clickable for a human either).
   *
   * The clone below is always laid out, is `aria-hidden` and untabbable, and gives
   * a stable answer for the question that matters: how wide would the full nav be
   * at the user's current text size and language?
   */
  useEffect(() => {
    const bar = barRef.current;
    const probe = navProbeRef.current;
    if (!bar || !probe) return;

    const measure = () => {
      const kids = [...bar.children] as HTMLElement[];
      const navEl = kids.find((k) => k.tagName === "NAV");
      const logo = kids.find((k) => k.tagName === "A");
      const controls = kids.filter((k) => k !== navEl && k !== logo);
      const sideWidth =
        (logo?.getBoundingClientRect().width ?? 0) +
        controls.reduce((sum, k) => sum + k.getBoundingClientRect().width, 0);
      const gaps = 32; // the bar's gap-x-4, twice
      const available = bar.clientWidth - sideWidth - gaps;
      const needed = probe.firstElementChild?.getBoundingClientRect().width ?? 0;
      if (needed > 0) setNavFits(needed <= available + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, []);

  // Escape closes and returns focus; a click outside closes too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const panel = panelRef.current;
      const trigger = triggerRef.current;
      if (!panel || !trigger) return;
      const target = e.target as Node;
      if (!panel.contains(target) && !trigger.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <header className="a2-header fixed inset-x-0 top-0 z-50">

      {/* The nav's natural width, measured without the nav being visible.
          `position:absolute` keeps it out of the bar's layout; `visibility:hidden`
          and `aria-hidden` keep it out of the way of humans and AT; `w-max` makes
          it report exactly the width the real list would want. */}
      <div
        ref={navProbeRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 -z-10 w-max"
      >
        <ul className="flex items-center gap-x-5 text-ui font-medium xl:gap-x-7">
          {nav.map((item) => (
            <li key={item.href} className="whitespace-nowrap font-sans">
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* The bar is `min-h`, not a fixed height, and the nav is the only part that
          may shrink. That combination is what keeps the controls reachable when the
          text is enlarged: at 200% the bar grows to two rows, the nav wraps inside
          itself, and Donate / the language switch stay on the right edge instead of
          being pushed past it. Nothing here is clipped. */}
      <div
        ref={barRef}
        className={cn(
          "a2-container flex min-h-16 items-center justify-between gap-x-4 py-2",
          "hdr-lg:min-h-[92px] hdr-lg:py-0",
          // `justify-between` alone leaves three lone children centred in a single
          // row once the nav is hidden; two children pin to the edges like the mockup.
          !navFits && "hdr-lg:[&>*:last-child]:ml-auto"
        )}
      >
        {/* Logo — the lockup drops its tagline line on mobile so the bar stays 56px */}
        <Link
          href="/"
          aria-label={`${"A2 Foundation"} — home`}
          className="rounded-btn focus-visible:outline-none"
        >
          <Logo compact className={cn("hidden sm:inline-flex hdr-lg:hidden", !navFits && "hdr-lg:inline-flex")} />
          <Logo className={cn("hidden hdr-lg:inline-flex", !navFits && "hdr-lg:hidden")} />
          <Logo compact className="sm:hidden" />
        </Link>

        {/* ── desktop nav ─────────────────────────────────────────────────── */}
        <nav
          aria-label="Primary"
          className={cn(
            "hidden min-w-0 flex-1 justify-center hdr-lg:flex",
            // when it does not fit, the compact header and the menu button take over
            !navFits && "hdr-lg:hidden"
          )}
        >
          {/* `flex-wrap` is load-bearing, not cosmetic: an unwrapped row of six
              links at 200% text is wider than the space between the logo and the
              controls, and it used to *overflow* that box — links drew straight
              over the logo and the Donate button. Wrapping keeps every link inside
              the bar and lets the bar grow; the ResizeObserver above then tells the
              hero how tall it became. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 xl:gap-x-7">
            {nav.map((item) => {
              const active = item.href === "/";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "a2-navlink font-sans text-ui font-medium text-ink",
                      active && "a2-navlink--active"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── utilities ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="a2-iconbtn hidden sm:grid"
            aria-label="Search"
          >
            <IconSearch size={18} />
          </button>

          <Link
            href="/get-involved#donate"
            className={buttonClass("rust", "sm", "hidden sm:inline-flex")}
          >
            Donate Now
            <IconArrowRight size={15} />
          </Link>

          {/* Language switch. In the mockup the Odia label is a lighter weight and
              the divider a hairline; both are reproduced. The Odia glyphs are real
              type (Noto Sans Oriya is loaded in layout.tsx), not an image. */}
          <div className="hidden items-center gap-2 font-sans text-note md:flex">
            <span aria-current="true" className="a2-lang-on font-semibold">
              EN
            </span>
            <span aria-hidden className="a2-lang-divider h-3 w-px" />
            {/* 44px target, same as every other control in the bar: a bare
                text node measured 31×20, which is unhittable with a thumb. */}
            <button
              type="button"
              lang="or"
              className="a2-lang-off inline-flex min-h-11 items-center font-normal"
            >
              ଓଡ଼ିଆ
            </button>
          </div>

          {/* ── mobile trigger ────────────────────────────────────────────── */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="a2-mobile-nav"
            className={cn("a2-iconbtn hdr-lg:hidden", !navFits && "hdr-lg:grid")}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── mobile sheet ──────────────────────────────────────────────────── */}
      <div
        id="a2-mobile-nav"
        ref={panelRef}
        hidden={!open}
        /* The sheet is hidden at desktop only while the desktop nav is the one on
           screen. `hdr-lg:block` here would also override the `hidden` attribute
           that closes it, leaving an 800px-tall panel open. */
        className={cn("a2-sheet border-t border-hair", navFits && "hdr-lg:hidden")}
      >
        <nav aria-label="Primary mobile" className="a2-container py-3">
          <ul className="flex flex-col">
            {nav.map((item) => {
              const active = item.href === "/";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center font-sans text-ui font-medium text-ink",
                      active && "text-rust-text"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex items-center gap-3 border-t border-hair pt-3">
            <Link
              href="/get-involved#donate"
              onClick={() => setOpen(false)}
              className={buttonClass("rust", "sm", "flex-1")}
            >
              Donate Now
              <IconArrowRight size={15} />
            </Link>
            <div className="flex items-center gap-2 font-sans text-note">
              <span aria-current="true" className="font-semibold text-ink">
                EN
              </span>
              <span aria-hidden className="h-3 w-px bg-ink/20" />
              <button
                type="button"
                lang="or"
                className="a2-lang-off inline-flex min-h-11 items-center font-normal text-ink-soft"
              >
                ଓଡ଼ିଆ
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
