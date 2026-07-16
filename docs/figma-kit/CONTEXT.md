# 📐 CONTEXT — the Master-Board methodology (reusable, app-agnostic)

> The reusable knowledge behind the board. This is *why* and *what*; `MASTER-PROMPT.md` is *how*.
> Nothing here is app-specific — all app specifics live in `APP-CONFIG.md`.

---

## 1. What a Master Board is (and why)
A **single Figma file that holds the entire product at a glance** — tokens, assets, components, the
app map, wireframes, full-length screens, flows, and store/brand collateral — instead of scattering
them across dozens of files. One place to *see* the whole app, review craft, and hand to build.

**Why it works:** it collapses "where's the source of truth?" into one artifact, makes drift visible,
and doubles as the design-to-code contract. It is a **mirror of the app**, kept 1:1 — not a sketchpad.

## 2. The 6-page anatomy
Each page has one job. Build in this order (later pages reuse earlier ones).

1. **Design System** — Foundations (color, type, spacing, radius, elevation/overlay, motion spec) +
   Assets (logo/mascot, icons, illustrations) + Components (every component as a real Figma component
   *with variants*). This page is the vocabulary every later page speaks.
2. **App Map · Wireframes · Screens** —
   - *App Map:* a route diagram grouped by the app's navigation (tabs/stacks), incl. entry + auth flows.
   - *Wireframes:* one low-fi grey wireframe per screen, uniform size, for structure at a glance.
   - *Screens:* the real hi-fi screens at device width, **full natural height (uncropped, top-to-bottom)**,
     grouped by flow. Unbuilt-but-planned screens appear as **labeled placeholders**.
3. **User Flows** — the 3–6 critical journeys as thumbnail strips with connectors + decision points
   (e.g. first-run → activation; the core create/consume loop; the money/upgrade path).
4. **App Store / Launch Kit** — the store marketing screenshots (device mockups + headlines) + any
   launch collateral. Even non-store apps benefit from a "hero moments" page.
5. **Brand & Voice** — logo/wordmark lockups, the voice with real copy examples per state, the
   "conventions we deliberately break," and the app-icon spec.
6. **Strategy Review (optional)** — a stakeholder deck (vision, goals, research, design concepts, Q&A).
   Include only if you need a pitch/summary artifact; skip for a pure design file.

> Scope dial: the minimum viable board is Pages 1–2. Add 3–6 as the product matures. `APP-CONFIG`
> chooses which pages to build.

## 3. Craft laws (Figma mechanics — apply on every page)
- **Figma Sections** carve each page into labeled zones (they show in layers + minimap → navigable).
- **Auto-layout on everything** → alignment + spacing are automatic and consistent.
- **Variables** for color/spacing/radius tokens; **text styles** for the type scale; **components +
  variants** for every component state. Define tokens once, reference everywhere.
- **8-pt spacing grid.** All gaps/padding are multiples of 4/8. Consistent gutters (≈64px between
  cards, ≈160–240px between Sections, ≈120px between screen frames).
- **One device width** for phone screens (commonly **393×852**, iPhone logical); **height is variable**
  and screens are **never clipped to the viewport** — show the whole scroll.
- **Low-fi ≠ hi-fi:** wireframes are grey boxes; screens use the real component library. Keep them
  visually distinct so no one mistakes a wireframe for a shipped design.
- **Honest placeholders:** a screen that should exist but isn't built gets an explicit
  `… — PLACEHOLDER` frame, not a fake mockup.
- **Cover + legend frame** at the top of each page: title, one-line purpose, a token/status legend,
  "last updated / built from repo @ main."

## 4. The naming system (predictable = usable)
Namespace every layer so the file is searchable and the layers panel reads like a table of contents:
- `DS/Color/*`, `DS/Type/*`, `DS/Spacing/*`, `DS/Radius/*`, `DS/Motion/*`
- `Asset/<Group>/*` (e.g. `Asset/Mascot/Happy`, `Asset/Icon/*`, `Asset/Onboarding/*`)
- `Comp/<Name>` with variant props (e.g. `Comp/Button` → `Style=Primary`)
- `Screen/<Area>/<Name>`, `WF/<Name>` (wireframes), `Map/Zone/*` + `Map/Node/*`
- `Alternative version — <Name>` for any superseded design (see §6).

## 5. Design & honesty laws (generalize per app)
The board must never show something the product can't truthfully do. Translate these into the app's
domain in `APP-CONFIG`:
- **State only true facts.** No invented ratings, counts, reviews, or personalization the app can't
  compute. Estimates are **labeled as estimates**.
- **One theme unless theming is a real feature.** Render the shipped theme; keep alternates as notes.
- **Mascot/illustration usage is scoped** (if the app has one): defined states, defined placements,
  never crowding dense content. If no mascot, the brand carries through type + color + illustration.
- **The board mirrors code.** Tokens come from the app's constants; screens come from the screen-map.
  If they disagree, the *code* wins and the board is corrected — never the reverse silently.

## 6. Lessons baked in (things that go wrong — pre-solved)
- **Archive alternates on ONE page.** Keeping "spec v1 / superseded" designs is good for provenance
  but doubles content if scattered. Put them all under a single `Alternates` section, clearly labeled,
  so the primary pages read as the shipped truth.
- **Full-length beats viewport crops.** Reviewers need to see the whole scroll; clipping hides the
  bottom half of long screens (detail, paywall, account).
- **Placeholders keep the set honest and complete** — an explicit gap is information; a fake mockup is
  a lie you'll ship against.
- **Re-sync, don't rebuild.** Treat the board as living: re-run the prompt to reconcile it 1:1 with the
  app after changes, rather than starting over.
- **Under-listed pages:** some Figma API surfaces list only the first page — always enumerate pages by
  the node IDs you actually built, and keep a page index in the file's cover.

## 7. Definition of done
Every page namespaced + sectioned + on the 8-pt grid; tokens are real Variables/styles; components are
real components with variants; screens are full-length; unbuilt screens are labeled placeholders;
nothing on the board violates the honesty laws; a cover/legend + page index exist. See `CHECKLIST.md`.
