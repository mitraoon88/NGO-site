"use client";

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/icons";

/**
 * TextField — cream input, 3px radius, hairline border, rust focus ring.
 * Errors are announced (`role="alert"` + aria-describedby) rather than only
 * coloured, because a red border tells a screen-reader user nothing.
 */
type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, className, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? `f-${autoId}`;
  const errId = `${inputId}-err`;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={inputId}
          className="font-sans text-label font-semibold uppercase tracking-[0.1em] text-ink-soft"
        >
          {label}
          {optional && <span className="ml-1.5 normal-case tracking-normal text-ink-muted">(optional)</span>}
        </label>
        {hint && <span className="text-micro text-ink-muted">{hint}</span>}
      </div>

      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errId : undefined}
        className={cn(
          "mt-2 h-12 w-full rounded-btn border bg-cream px-4 font-sans text-body-sm text-ink",
          "placeholder:text-ink-muted/70 transition-colors duration-200",
          // The ring is the global :focus-visible treatment (globals.css) with an
          // offset so it clears the border. No second ring style, no ring colour
          // that only exists in this file.
          "focus-visible:outline-offset-1",
          error ? "border-rust-text" : "border-hair hover:border-ink/20 focus:border-rust"
        )}
        {...props}
      />

      {error && (
        <p id={errId} role="alert" className="mt-1.5 font-sans text-label font-medium text-rust-text">
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Newsletter — inline email + rust submit, as measured in the footer
 * (white input, 3px radius, square rust button on the right edge).
 * Demonstrates the success / error / loading states that a static mockup can't.
 */
export function Newsletter({
  onSubmit,
  className,
}: {
  onSubmit?: (email: string) => Promise<void>;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setState("loading");
    try {
      await onSubmit?.(email);
      setState("done");
      setMessage("Thank you — check your inbox to confirm.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <label htmlFor="nl-email" className="sr-only">
        Email address
      </label>
      <div className="flex">
        <input
          id="nl-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="Enter your email"
          aria-invalid={state === "error"}
          aria-describedby={message ? "nl-msg" : undefined}
          className={cn(
            "h-12 w-full rounded-l-btn border border-r-0 bg-white px-4 font-sans text-ui text-ink",
            "placeholder:text-ink-muted/70 focus-visible:outline-offset-1",
            state === "error" ? "border-rust-text" : "border-hair"
          )}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          aria-label="Subscribe"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-r-btn bg-rust text-white transition-colors hover:bg-rust-hover disabled:opacity-50"
        >
          {state === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <IconArrowRight size={18} />
          )}
        </button>
      </div>
      {message && (
        <p
          id="nl-msg"
          role={state === "error" ? "alert" : "status"}
          className={cn(
            "mt-2 font-sans text-label",
            state === "error" ? "text-peach" : "text-gold"
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}
