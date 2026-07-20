# Web Architecture — House of Brands (the Bending Spoons model)

> **Status:** decided direction, not yet built. Captured 2026-07-19 for when we build the web presence.
> **Chosen model:** **House of Brands** — a light corporate/studio hub on top, each app on its **own domain** with its own brand, plus one **unified support hub**. Modeled on Bending Spoons.

---

## 1. The decision, in one line

Otto is app #1 of a planned **portfolio**. So the web presence is built as a **house of brands**: the studio is the quiet parent; **each app is its own brand on its own domain**; a single support subdomain is the shared front door for help. This is the opposite of a "branded house" (one master brand with sub-products, e.g. *Google* Maps/Drive) — here the parent stays in the background and the apps are the stars.

**Why this fits us:**
- **Each app markets itself** — Otto's site sells Otto; it isn't diluted by an unrelated app #2.
- **Risk containment** — a problem with one app doesn't tarnish the others or the studio.
- **Flexibility** — launch a new app with its own identity without renaming anything.
- **Trade-off (accepted):** more brands = more marketing surface to maintain. Fine, because we grow into it one app at a time (see §5, phased rollout).

Brand-architecture background: [Semrush/Peralta on house-of-brands vs branded-house](https://peraltadesign.com/brand-architecture-explained-house-of-brands-vs-branded-house/), [Brand Vision 2025](https://www.brandvm.com/post/branded-house-vs-house-of-brands-2025).

---

## 2. Reference implementation — how Bending Spoons does it

Bending Spoons owns Evernote, Vimeo, WeTransfer, Meetup, Remini, Eventbrite, Komoot, StreamYard, Brightcove, AOL. Their web presence is the textbook house of brands:

**a) Corporate hub — `bendingspoons.com`** *(about the company, NOT the apps)*
- Sections: hero + tagline ("Impossible. Maybe."), **About**, **Careers** (prominent), **Events**, **Investor relations**, a **portfolio** section, and proprietary-tech/culture pages.
- The portfolio section **lists each owned app and links OUTWARD to that app's own domain** (e.g. Vimeo → `vimeo.com/...`, Evernote → `product.evernote.com`). It does **not** try to host the app experiences.
- Purpose: establish the company as a credible acquirer-operator + recruit talent + investor face. **Not** a place users go to use or learn the apps.
- Footer: privacy policy, cookie preferences, registration/VAT fine print.

**b) Each app keeps its own domain** — `evernote.com`, `vimeo.com`, etc. Own brand, own marketing site, own SEO, own legal. The parent is invisible to the everyday user.

**c) Unified support — `support.bendingspoons.com`**
- A **grid of ~25 app tiles** (logo + link). Each tile links to *that app's* dedicated support portal (Zendesk / custom).
- One central **"Can't find it? Contact us"** fallback form.
- Pattern: **central discovery hub, decentralized service** — users find their app, then drop into that app's own support world.

Sources: [bendingspoons.com](https://bendingspoons.com/), [support.bendingspoons.com](https://support.bendingspoons.com/), [Bending Spoons (Wikipedia)](https://en.wikipedia.org/wiki/Bending_Spoons).

---

## 3. The architecture for our studio

```
[STUDIO HUB]         studio.com            → about, portfolio (links out), careers-later, contact
   │
   ├── links out to ─► OTTO         ottosapp.com (TBD)   → Otto marketing + /privacy /terms /support
   ├── links out to ─► APP #2       app2domain.com      → its own site + legal
   │
[UNIFIED SUPPORT]    support.studio.com    → grid of app tiles, each → that app's support
```

- **Studio hub** (`studio.com`): thin. About the studio, a portfolio grid linking OUT to each app domain, a contact/careers page later. Built **after** Otto ships — not needed for launch.
- **Otto** (`ottosapp.com` or similar): Otto's own brand site. Hosts the **App-Store-required URLs**: `/privacy`, `/support`, and the in-app `/terms`. This is the ONE site we need for App Store submission.
- **Support** (`support.studio.com`): the Bending Spoons grid. Stand up when there are ≥2 apps; until then Otto's `/support` is enough.

**Naming note:** we're on an **Individual** Apple Developer account today, so "studio" is a **brand, not a legal entity** — no incorporation needed to own `ottosapp.com` or a studio domain. Pick a studio name when convenient; it doesn't block Otto.

---

## 4. How it maps to Vercel + this repo

- **Monorepo, one Vercel project per site.** Folders like `web-otto/`, `web-studio/`, `web-support/` in this repo; each imported as its own Vercel project with its own **Root Directory** and its own domain/subdomain.
- **Vercel Hobby limits:** ≤ **3 projects per repo**, 1 concurrent build — enough for hub + Otto + support. ([Vercel monorepos](https://vercel.com/docs/monorepos))
- **Domains:** a production domain maps to **one** Vercel project; subdomains map per-project cleanly. ~**$12/domain/yr**.
- **Railway is unaffected:** `backend/railway.json` already has `watchPatterns: ["backend/**"]`, so adding `web-*` folders won't trigger backend redeploys.
- **Stack:** Next.js (app router), static/SSG, no DB. Legal content already drafted in `docs/legal/` (`privacy-policy.html`, `terms-of-service.html`).

---

## 5. Phased rollout (don't overbuild)

- **Phase 0 — for App Store submission (only thing needed now):** Build **just the Otto site** at its own domain: landing + `/privacy` + `/terms` + `/support`. This unblocks the App Store's required Privacy + Support URLs. *No studio hub, no support subdomain yet.*
- **Phase 1 — when app #2 is real (or when we want a company face):** stand up the **studio hub** and the **`support.studio.com`** grid.
- **Phase 2 — as the portfolio grows:** full house of brands — each new app gets its own domain + its own support tile.

---

## 6. Legal & App Store implications

- Apple requires, **per app**: a **Privacy Policy URL** and a **Support URL**. → Otto's domain must serve `/privacy` and `/support` before we submit.
- **Terms/EULA** is linked in-app (and hosted on Otto's domain).
- In a house of brands, **each app carries its own privacy/terms** scoped to that app's data — cleaner and more accurate than one shared studio-wide policy. The studio hub can carry a short company-level privacy/cookie notice for the hub itself.

---

## 7. Open decisions (for when we build)

1. **Studio name + domain** (can defer — Otto ships without it).
2. **Otto's domain** — e.g. `ottosapp.com`, `ottocooks.com`, `heyotto.app`. Decide before submission (needed for privacy/support URLs).
3. Whether Phase 0 Otto site doubles as the temporary studio face until Phase 1.

**Next action when we build:** Phase 0 — scaffold `web-otto/` (Next.js) with landing + `/privacy` + `/terms` + `/support` from `docs/legal/`, deploy to Vercel, point Otto's domain at it, then wire `PRIVACY_URL`/`TERMS_URL` into `mobile/app/(tabs)/profile.jsx`.

Sources: [bendingspoons.com](https://bendingspoons.com/) · [support.bendingspoons.com](https://support.bendingspoons.com/) · [house of brands vs branded house](https://www.brandvm.com/post/branded-house-vs-house-of-brands-2025) · [Vercel monorepos](https://vercel.com/docs/monorepos) · [RevenueCat: app portfolio strategy](https://www.revenuecat.com/blog/growth/app-portfolio-vs-single-app/)
