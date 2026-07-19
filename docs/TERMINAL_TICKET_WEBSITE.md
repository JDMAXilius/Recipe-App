# 🎟️ Terminal Ticket — Stand up the Otto website (NEW repo)

> **Scope:** kick off the Otto marketing/legal website in a **separate new repo** (not this app repo).
> This ticket is the brief + the copy-list. The build itself happens in the new repo's own session.
> Two source docs already exist in THIS repo and are the authority:
> - **`docs/WEBSITE_ARCHITECTURE.md`** — the model (house-of-brands vs branded-house), Vercel layout, domains.
> - **`docs/WEBSITE_ASSET_MANIFEST.md`** — exactly which files/assets to copy over (Tier 1/2/skip) + the brand quick-reference (palette, fonts, voice).

## 0. Decide first (blocks the structure)
`WEBSITE_ARCHITECTURE.md` currently assumes **house of brands** (each app its own domain, hidden
studio parent). The founder's framing is **Otto = umbrella brand with 3 meal-plan products**
(Recipe & Meal Plans / **Lean** = weight-loss / **Bulky** = muscle-gain). That points at a **branded
house**:
- **Recommended:** one site `getotto.app`, three product pages (`/`, `/lean`, `/bulky`), shared brand + legal.
- Confirm with founder, then **update `WEBSITE_ARCHITECTURE.md`** to match the chosen model before building.

## 1. Create the new repo
- New repo (e.g. `otto-web`). **Do NOT fork this app repo** — copy only the manifest's Tier-1 files.
- Stack per architecture doc: **Next.js (app router), SSG, no DB**, deployed on **Vercel**.

## 2. Copy in (from `docs/WEBSITE_ASSET_MANIFEST.md` → Tier 1)
- **Legal:** `docs/legal/privacy-policy.html`, `terms-of-service.html` (+ `.md` sources) → become `/privacy`, `/terms`.
- **Design system:** `mobile/constants/colors.js`, `tokens.js` → port to CSS vars / Tailwind theme. Font = **Lora** (Google Font, reference not copy).
- **Brand assets:** `mobile/assets/splash/otto-splash.webp` (animated hero), `mobile/assets/mascot/otto-hero*.png`, `otto-scene-*.png`, `otto-*-cut.png`, `mobile/assets/onboarding/onboarding-{1,2,3}.png` (→ the 3 homepage value sections), `mobile/assets/images/{icon,favicon}.png`.
- **Copy source:** `docs/OTTO_PRD.md`, `otto-feature-definition.md`, `ONBOARDING_BRIEF.md`, `PRE_LAUNCH_CHECKLIST.md` (App Privacy answers + support-URL need).
- **Do NOT copy:** app source (`mobile/app`, `components`, `services`, `lib`), `backend/`, build config, tickets. (Full skip-list in the manifest.)

## 3. Minimum viable site (unblocks App Store submission)
The App Store submission needs live URLs. Ship these first:
- `/privacy` and `/terms` (from `docs/legal/*.html` — fill the `[PLACEHOLDERS]` first).
- `/support` (a simple contact page or mailto — App Store "Support URL").
- A homepage hero (Otto `.webp` + a headline mined from the PRD) is enough for v1; product pages for Lean/Bulky come as those apps exist.

## 4. Close the loop back to the app
Once `/privacy` + `/terms` are live, set in **this** repo:
`mobile/app/(tabs)/profile.jsx` → `PRIVACY_URL` / `TERMS_URL` = the hosted URLs (the in-app rows light
up automatically). This is P1 #5 in `TERMINAL_HANDOFF.md`.

## Done when
- [ ] Model decided; `WEBSITE_ARCHITECTURE.md` updated to match.
- [ ] New `otto-web` repo on Vercel with `/privacy`, `/terms`, `/support` live.
- [ ] `PRIVACY_URL` / `TERMS_URL` set in the app; App Store metadata can now cite them.
