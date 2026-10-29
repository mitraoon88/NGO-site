import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconArrowRight } from "@/components/icons";
import { IconOrnament, type IconName } from "@/components/ui/icon-ornament";
import { involved } from "@/content/home";

/**
 * GetInvolved — the conversion act, on a photograph.
 *
 * The mockup's clearest hierarchy statement is that the three actions are *cream
 * cards on a dark photograph*: no other treatment on the page looks like them, so
 * they are unmistakable as the next step. That is reproduced exactly.
 *
 * Two build corrections against the mockup:
 *   1. The body copy runs into the children in the photograph; here the scrim is
 *      a measured left-to-right gradient so the copy stays above 4.5:1 and the
 *      photograph keeps its faces visible on the right.
 *   2. The three buttons are links to anchored routes (`/get-involved#donate`),
 *      not buttons — nothing on this page performs an action in place, so a
 *      `<button>` would promise behaviour the page does not have.
 */
export function GetInvolved() {
  return (
    <section
      aria-labelledby="involved-title"
      className="a2-relative overflow-hidden bg-forest-deep"
    >
      <div className="absolute inset-0">
        <Image
          src={involved.image.src}
          alt={involved.image.alt}
          width={involved.image.width}
          height={involved.image.height}
          sizes="100vw"
          className="h-full w-full object-cover object-[45%_center]"
        />
        <div aria-hidden className="a2-scrim-involved absolute inset-0" />
      </div>

      <div className="a2-container a2-section relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
          <div className="max-w-[30rem]">
            <Eyebrow num={involved.num} onDark>
              {involved.eyebrow}
            </Eyebrow>

            <h2
              id="involved-title"
              className="mt-5 font-display text-h2 font-normal leading-[1.04] tracking-[-0.02em] text-cream"
            >
              {involved.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <p className="mt-5 max-w-[36ch] text-pretty font-sans text-body leading-relaxed text-cream/85">
              {involved.body}
            </p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {involved.actions.map((action) => (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className="group flex items-center gap-3.5 rounded-card bg-cream px-4 py-3.5 transition-colors duration-200 ease-a2 hover:bg-white focus-visible:outline-none"
                >
                  <IconOrnament
                    name={action.icon as IconName}
                    size={28}
                    className="text-rust"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-ui font-semibold text-ink">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block font-sans text-note text-ink-muted">
                      {action.sublabel}
                    </span>
                  </span>
                  <IconArrowRight
                    size={17}
                    className="shrink-0 text-ink transition-transform duration-300 ease-a2 group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
