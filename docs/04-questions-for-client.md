# Questions for the client (before Phase 1)

Short, decision-shaped. Each has a default so work never stalls waiting for an answer.

---

## A · Blocking (needed to start building)

**1. Photography — do you own the images in the mockup?**
- *(a)* We own licensed originals → send them, we start with real assets.
- *(b)* They're placeholders → I generate consent-safe stand-ins for the prototype (Indian, documentary
  style, no identifiable minors without release) and hand you a shot list for the real shoot.
- **Default if no answer:** (b).

**2. Are the defects in the mockup intentional?**
Four places have text sitting *behind* photographs (impact paragraph under the leaf, "stronger
communities" under the children, the stamp over the portrait, "FOUNDATION" under the hero).
I intend to fix the z-order so text is always readable.
- **Default:** fixed. Say so if you want it copied exactly.

**3. Fonts — do you own them?**
The display serif and the script are unidentified (likely licensed).
- *(a)* We own them → send files, we self-host.
- *(b)* Use stand-ins → **Newsreader** (serif) + **Parisienne** (script) + **Inter** (UI). Visually very
  close; swapping later is a one-line token change.
- **Default:** (b).

**4. Partners — permission status.**
The mockup shows Tata Trusts, HCL Foundation, Infosys, Reliance Foundation, Bharti, USAID and a
UN-style mark. Displaying a partner's logo needs written permission, and each must be current.
- *(a)* All confirmed → send the approved logo files (SVG) + the permission reference for each.
- *(b)* Not yet → we ship neutral text lockups ("Partner name") and swap in as permissions arrive.
- **Default:** (b). *Also worth verifying the USAID mark — its status changed in 2025 and an
  incorrect endorsement claim is a real risk for an NGO.*

**5. Scope — is this the whole site or the first page?**
The header implies six more pages (About, Our Work, Impact, Stories, Get Involved, Donate).
- **Default:** build the homepage to pixel fidelity first, then a component library that makes the
  other five pages 1–2 days each.

---

## B · Needed before Phase 3 (hero)

**6. Odia / English.**
The header shows `EN | ଓଡ଼ିଆ`. Is Odia live in this release?
- *(a)* Yes → we need translated copy + a decision on URLs (`/or/…`) and font pairing for Odia script.
- *(b)* Not yet → the switcher ships visually complete but disabled with a "coming soon" state, so it
  never looks broken.
- **Default:** (b), with `/or` routing designed for in Phase 2 so it isn't a rebuild later.

**7. Real numbers.**
`150K+ lives touched · 350+ communities · 120+ projects · 12+ years` and the testimonial attribution
("Community Member, Odisha") — are these accurate, and may we publish them with a date/source line?
An NGO's credibility rests on these being defensible.
- **Default:** placeholder, clearly flagged in the CMS, blocked from publishing until signed off.

**8. Hero video.**
"Watch Our Story" implies a video. Do you have one?
- *(a)* Yes → send a link/embed; we open a modal (no autoplay, captions mandatory).
- *(b)* No → the button scrolls to Stories, labelled "Read Our Stories".
- **Default:** (b).

---

## C · Useful, not blocking

**9. Newsletter provider** — which platform receives the "Stay Connected" signups (Mailchimp,
SendGrid, Brevo, other)? Until then it validates and shows a success state without submitting.

**10. Donation gateway** — Razorpay is the pragmatic choice for an Indian NGO (UPI + cards +
netbanking + recurring). Confirm, and whether one-time only or recurring from day one.

**11. Analytics & consent** — GA4 or Plausible? For EU/UK donors a consent banner is required; an
India-only audience still benefits from a plain-language cookie notice.

**12. Accessibility target** — I'm building to WCAG 2.2 AA (the mockup's eyebrow colour was corrected
to pass). Confirm if you need AAA anywhere, or a formal audit certificate for a CSR donor.

---

## What I do while waiting

Phase 1 (foundations: tokens, fonts, primitives) and Phase 2 (ornament system: torn edge, line-art,
foliage, stamp, script accent) don't depend on any answer above. Those two phases start now and cover
the highest-risk visual work.
