"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/icons";
import { footer } from "@/content/home";

/**
 * NewsletterForm — the footer's inline subscribe.
 *
 * There is no backend yet (Phase 6 owns the WordPress side), so this form does
 * the part that can be done honestly: it validates, it announces, and it never
 * pretends a subscription happened. `onSubmit` is a stub whose only job is to
 * prove the states work — replace it with a fetch and the component is finished.
 *
 * Accessibility decisions, each one a thing these forms usually get wrong:
 *   - The error is `role="alert"` and the input gets `aria-invalid` +
 *     `aria-describedby`, so the message is announced *and* associated.
 *   - The success message is `role="status"` (polite). Using `alert` for success
 *     interrupts the reader for good news, which is the wrong priority.
 *   - `noValidate`: native browser bubbles are unstyleable, disappear on blur, and
 *     are not announced consistently. Validation is in the component.
 *   - The submit is a real 44px target, and the input is 44px tall so a thumb can
 *     hit it on mobile.
 */
export function NewsletterForm() {
  const id = useId();
  const inputId = `nl-${id.replace(/[:]/g, "")}`;
  const msgId = `${inputId}-msg`;

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    // deliberately permissive: refuses the obviously-wrong, never the unusual
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

    if (!valid) {
      setState("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setState("success");
    setMessage("Thank you — check your inbox to confirm.");
    setEmail("");
  };

  return (
    <form onSubmit={submit} noValidate className="mt-4">
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>

      <div className="flex">
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={footer.newsletter.placeholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle") {
              setState("idle");
              setMessage("");
            }
          }}
          aria-invalid={state === "error" || undefined}
          aria-describedby={message ? msgId : undefined}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-l-btn border border-r-0 bg-white px-3 font-sans text-note text-ink placeholder:text-ink-muted",
            "focus-visible:outline-none",
            state === "error" ? "border-rust" : "border-transparent"
          )}
        />
        <button
          type="submit"
          className="grid h-11 w-12 shrink-0 place-items-center rounded-r-btn bg-rust text-white transition-colors hover:bg-rust-hover"
        >
          <span className="sr-only">{footer.newsletter.submit}</span>
          <IconArrowRight size={16} />
        </button>
      </div>

      {message && (
        <p
          id={msgId}
          role={state === "error" ? "alert" : "status"}
          className={cn(
            "mt-2 font-sans text-note",
            state === "error" ? "text-peach" : "text-gold"
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}
