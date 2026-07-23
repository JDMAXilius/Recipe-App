# Otto — 1:1 Redesign Brief · Context-Engineering & Prompt Pack (Fable 5 + Mobbin)

> **Purpose.** A single, self-contained brief a design agent uses to remake and redesign
> **every screen** of Otto — recipes + meal plans — to **awards-caliber** quality: an
> **Apple Design Award** contender and **App Store "App of the Year"** nominee.
> **Model:** run the creative work on **Fable 5** (`claude-fable-5`). **References:** ground every
> surface in **Mobbin**. **Rule:** redesign 1:1 — same features, same information, dramatically
> better craft. We add polish and coherence, never invented functionality.

> This doc is the *context you engineer into the model before you ask for pixels.* Read it top to
> bottom once, then work screen-by-screen with the prompt scaffold in §9. Companion docs:
> `SCREEN_MAP.md` (screen inventory), `DESIGN_SYSTEM.md` (tokens), `MASCOT.md` (Otto), the
> honesty rules in `SCREEN_DECISION_PROMPT.md`, and `REDESIGN_NOTES.md` (decision log — append to it).

---

## 0 · The bar — what "award-winning" means, concretely

We are not chasing "pretty." Apple's juries reward **craft in service of a clear purpose**. Design
every screen so it could be defended against these six **Apple Design Award** pillars — write the
one-line defense in the screen's REDESIGN_NOTES entry:

| Pillar | What it demands of Otto | Otto's angle |
|---|---|---|
| **Inclusivity** | Works for everyone: Dynamic Type, VoiceOver, contrast, one-handed reach, motion-reduce. | Every tappable ≥44pt + a11y label; kitchen-distance cook mode; `prefers-reduced-motion` fallback for every animation. |
| **Delight & Fun** | Moments that make someone smile without slowing them down. | Otto the otter at emotional beats **only**; the **paw-pop** save; warm serif voice. |
| **Interaction** | Gestures and flows that feel obvious and instant. | Chat-first create; swipe cook mode; one-tap plan→shopping-list; nothing animates on scroll. |
| **Social Impact** | Genuine value in people's lives. | Honest nutrition (no fear, no fake precision); cook-what-you-have; keeps the recipes people love in one place. |
| **Visuals & Graphics** | A distinctive, coherent visual system. | One warm cream world, terracotta accent, painted Otto art + food icons, Lora display serif. |
| **Innovation** | A fresh take on a crowded space. | Otto as a **conversational cooking companion** that talks recipes into being — not another grid of cards. |

**App of the Year framing:** the story a jury can tell in one sentence — *"Otto turns 'what do I cook
tonight' into a warm conversation that ends in a real recipe, a plan, and a shopping list."* Every
redesigned screen must move that sentence forward. If a screen doesn't, cut or simplify it.

**Non-negotiable craft floor (auto-fail if missed):**
- One warm cream system, zero hardcoded colors — tokens only (§6).
- One **signature motion moment per screen**, never more. Nothing animates on scroll.
- Type hierarchy legible at a glance; Lora for display, system for body; never Lora for body.
- Every state designed: loading, empty, error, offline, success — not just the happy path (§ screens I1–I5).
- Honesty laws (§7) hold on every surface. A beautiful screen that fakes data fails the review.

---

## 1 · How to run this (the operating loop)

For **each** screen, in order:

1. **Load context** — this doc (§3–§7) + the screen's row in `SCREEN_MAP.md` + its current
   implementation in `mobile/app/…`. Never redesign blind to what ships today.
2. **Mobbin research** (§8) — pull 8–16 references for the screen's *pattern* (not the domain).
   Extract **principles**, not pixels. Cite `mobbin_url`s in the notes.
3. **Design on Fable 5** (§9 scaffold) — produce: layout rationale → the redesigned screen
   (component spec in tokens) → the one signature motion → copy in Otto's voice → the a11y pass.
4. **Verify twice** — web (Expo :8081, mobile viewport) **and** iOS sim (`iPhone 17 Pro Max`,
   dev build `com.otto.recipes`). Screenshot every state. Compare against the reference principles.
5. **Adversarial QA** — a fresh read-only pass: "what's fake, dead, off-token, or inaccessible here?"
   Fix P1s before moving on.
6. **Log the decision** in `REDESIGN_NOTES.md` (continue the A/B/C/P numbering) with the ADA
   one-line defense from §0. Rejected directions get logged too, so we never re-litigate.

**Cadence:** small commits, push to `main` often (fast-forward; a co-pilot session also pushes —
always `git fetch && git pull --rebase` first). Figma sync: mirror shipped screens into the master
board (`mM0uWkHod9rL1Ff1VJ64Au`) in DS style — see `docs/figma/` build scripts.

**Why Fable 5:** it's the creative-tier Claude 5 model — use it for visual direction, layout
ideation, microcopy, and naming. Keep the **build** deterministic (RN/JSX), the **taste** on Fable 5.

---

## 2 · Who Otto is for, and the emotional job

**The person:** a home cook — not a chef — who has recipes scattered across screenshots, links,
and memory, and who hits the same wall most nights: *"what do I actually cook?"* They want to feel
**capable and cared-for**, not lectured or upsold.

**The emotional arc we design for:** *overwhelmed → "oh, Otto's got this" → proud plate on the table.*
Otto is the competent, warm friend in the kitchen — never a nag, never a salesman, never a
calorie cop. Design decisions serve that feeling first; features second.

**The voice:** warm, plain, a little playful. Short. Texting a friend who cooks, not writing an
essay. Honest to a fault. (Founder rule: repeated hedging reads as anxiety — say the caveat **once**,
well.)

---

## 3 · What Otto is (product truth — the one-paragraph context)

Otto is a **light-only, mascot-fronted recipe + meal-plan app** (Expo/React Native, JS only). You
**discover** recipes (TheMealDB), **create** them by chatting with Otto (Claude-written, always
reviewed before saving) or **import** them (link / photo / paste / write-your-own), keep them in
your **Cookbook**, **cook** them hands-free in Cook Mode, see an **honest nutrition estimate**
(USDA FoodData Central per-ingredient + a Claude matcher), **plan** the week as "Otto's week", and
one-tap a **shopping list** (aisle-grouped, collaborative). Otto the otter appears at emotional
beats; the paw is the save mark. Backend: Express + Drizzle + Supabase (Auth/RLS), Railway. AI:
Claude API (Opus for generation/vision, Haiku for classify/extract), dormant without keys.

---

## 4 · Core features (redesign all nine — nothing added, nothing dropped)

| # | Feature | What it does today | Primary screen(s) |
|---|---|---|---|
| 1 | **Discover** | Fast "what do I cook now": greeting, search, Otto's pick (date-seeded, explainable), category tiles, grid. | C1–C4 |
| 2 | **Chat with Otto (create)** | The ＋ tab: describe a dish → Otto writes a real recipe (rarely asks), inline card → review editor. Speak-or-type bar. | ＋ tab |
| 3 | **Import** | Bring in an existing recipe: paste a link (JSON-LD), snap a photo (vision), paste text, or write it yourself. Always reviewed. | Import sheet, E2–E5 |
| 4 | **Cookbook** | Saved (from Discover) + My recipes (created/imported); collections later. | F1–F2 |
| 5 | **Recipe detail** | Hero, honest source attribution, serving stepper + US/Metric, structured ingredients (add-to-list), steps, nutrition card, cook/plan/save. | D1 |
| 6 | **Cook mode** | Hands-free, one step at a time, keep-awake, per-step ingredients, timer chips, serving reminder. | D2 |
| 7 | **Nutrition** | Per-serving estimate: calorie ring + one macro bar + legend. Card and detail **agree**. Marked `~` when it's a category estimate. | D1 NutritionCard |
| 8 | **Meal plan** | "Otto's week" 7-day grid; assign recipes; generate shopping list. | G1 |
| 9 | **Shopping list** | Auto-built from a recipe or the week; aisle-grouped, quantities merged, checkable, shareable, collaborative. | G2 |

> **Current tab bar (post-redesign):** `Discover · Cookbook · ＋ (Chat with Otto) · Plan · Account`.
> The raised terracotta ＋ opens the chat (tab bar stays; no top X). Imports moved to a header
> action on the chat. (Supersedes the "＋Add opens a menu" note in `SCREEN_MAP.md §E1`.)

---

## 5 · Full screen inventory (redesign 1:1 — 28 v1 + 2 membership + states)

Grouped as the app is built. Redesign each; keep the information, elevate the craft. Full content
breakdowns live in `SCREEN_MAP.md` — this is the checklist.

- **A · Launch & Auth (4):** A1 Splash · A2 Onboarding (see B) · A3 Sign up · A4 Sign in
  *(real OAuth: Apple + Google + Facebook, Apple first per App Store 4.8).*
- **B · Onboarding (3):** B1 "Every recipe you love — in one place" · B2 "Cook it right, every time" ·
  B3 "Plan the week, shop in one tap". No quiz. Three painted promises. Ends in Discover.
- **C · Discover (4):** C1 Home · C2 Search · C3 Filter sheet · C4 By-ingredient ("cook with what you have").
- **D · Recipe (2):** D1 Recipe detail · D2 Cook mode.
- **E · Create / Import (5):** ＋ **Chat with Otto** (create) · Import sheet + E2 URL · E3 Photo ·
  E4 Video/IG (share-sheet in) · E5 Manual editor. *(All AI/import drafts land on the review editor
  before save.)*
- **F · Cookbook (2):** F1 Cookbook (Saved / My recipes) · F2 Empty state.
- **G · Plan + Shopping (2):** G1 Planner ("Otto's week") · G2 Shopping list (aisle-grouped, collaborative).
- **H · Account (4):** H1 Account home · H2 Membership/paywall (Otto Club) · H3 Connected accounts ·
  H4 Confirm dialogs (delete never buried).
- **I · Supporting states (5):** I1 Celebration · I2 Error/offline · I3 Generic empty · I4 Search-empty ·
  I5 Loading (Otto shimmer, no OS spinner).

**Every screen ships all its states** (loading / empty / error / success). A screen without its
empty and error states designed is not done.

---

## 6 · Design system (LOCKED — tokens only, zero hardcoded values)

Pull via `useTheme()`; source of truth `mobile/constants/{colors,tokens}.js` + `DESIGN_SYSTEM.md`
Part B. **Light only** — `ThemeContext` is locked; do not design a dark mode.

**Color (semantic).** Terracotta = computed/interactive ink; warm ink = authored content.
- `accent #C4562E` (terracotta apron — CTAs, active, computed) · `accentSoft #F3D9CD` (selected, soft fills)
- `secondary #8A5A3B` · `gold #E8B04B` (celebration/streak)
- `bg #FAF4EA` (cream world) · `surface #FFFFFF` · `surfaceWarm #F3E9DA` (grouped rows/wells)
- `ink #2A211B` (authored text) · `inkSoft #6E6055` (secondary) · `border #E8DECF` · `gray #B9A895` (disabled)
- `destructive #D64545` (delete/sign-out)
- **Nutrition (fixed, never re-skinned):** protein `#3B82F6` · carbs `#F0A020` · fat `#8B5CF6`.

**Type.** Lora = display voice **only**; body/labels are the system face. Never Lora for body.
- `display` Lora Bold 30/34 — recipe titles, greetings · `title` Lora SemiBold 22/26 — screen/section titles
- `body` System 15/22 · `label` System Semibold 13 — buttons/chips/tabs · `caption` System Medium 12 +0.5 UPPER tabular — stat labels · `step` System 24/32 — cook-mode kitchen distance

**Spacing:** 4 · 8 · 12 · 16 · 24 · 32.  **Radius:** card 20 · sheet 24 · button 14 · pill 999 · mascot 24.
**Overlay:** warm-ink scrims, never pure black.

**Motion — named springs, not durations. One signature moment per screen.**
- `spring.gentle` entrances/layout · `spring.snappy` chips/steppers · **`spring.pop` + scale 1→1.25→1 — THE paw-pop on save (the signature)** · `spring.sheet` sheets/cook-mode.
- `timing.sweep 500ms` CalorieRing (once) · `timing.fade 200ms` crossfades/skeletons + reduced-motion fallback for **all**.
- Rules: interruptible · **nothing animates on scroll** · ≤3 staggered at 40ms · Reanimated *layout* animations break web — use RN `Animated` for fades.

**Otto (mascot) — `MASCOT.md`.** The otter chef. Expressions map to states: Happy (greeting),
Excited (first save), Thinking (searching/generating), Sleepy (cold-start), Sad (error/empty),
Proud (cook-mode finish). Scenes for full-bleed moments. **Paw = the save mark everywhere.** Otto
appears at emotional beats, **never crowding dense content**. Generate art via the locked hero
reference (see `otto-lead` asset pipeline); never squish a painting — native aspect ratios.

---

## 7 · Honesty laws (non-negotiable — a beautiful lie fails the review)

1. **Never fabricate data.** No fake ratings, cook times, social proof, "trending," or precision the
   source lacks.
2. **Nutrition honesty = the card and the detail screen AGREE.** Show the computed figure when there
   is one; show the same category estimate the detail falls back to when there isn't, marked with a
   bare `~`. One glyph carries the caveat; the qualifying sentence lives **once**, on the nutrition
   card. Do not hedge three ways — that reads as anxiety, not honesty.
3. **No dead or unwired UI.** A button that can't do its job doesn't ship. "Opens soon" states are
   honest; a dead link is not. **Never bury delete-account.**
4. **Attribution is immutable.** Imported recipes keep their source name + live link forever
   ("Imported from allrecipes.com" / "By you").
5. **No personalization we can't compute.** No "tailored just for you." Otto's pick is date-seeded
   and **explainable** ("From your saved shelf"), never fake ML.
6. **Cooking is never paywalled.** Otto Club gates create/import/plan/ask — never cooking a recipe.

---

## 8 · Mobbin research protocol (principles, not pixels)

For each screen, before designing, run a Mobbin pass (MCP `search_flows` / `search_screens` /
`search_sections`). Search the **interaction pattern**, not "recipe app":

- Chat-with-Otto → *conversational generation, clarifying-question chips, inline result card + accept*
  (e.g. AI chat, mad-libs prompt, assistant result cards).
- Discover → *fast home, single hero + reason chip, category tiles, search-doubles-as-filter*.
- Recipe detail → *hero + sticky action bar, structured spec rows, serving scaler*.
- Cook mode → *full-screen step player, large targets, timer, swipe*.
- Plan/Shopping → *week grid assignment, aisle-grouped checkable list, merge/collaborate*.
- Onboarding → *3-card feature trailer, no quiz*.
- Auth → *social-row-first sign-in, dismissible cloakroom*.

**Deliverable per screen:** 8–16 refs → a short comparison table (what each does well/badly) →
3–5 extracted principles → one synthesis paragraph. **Cite every `mobbin_url`.** Extract the
*idea* (why it works), then express it in Otto's warm cream system — never copy a competitor's look.

---

## 9 · The Fable 5 prompt scaffold (reusable, per screen)

Feed this to `claude-fable-5`, filling the brackets. It front-loads the context so the model designs
inside Otto's constraints instead of a generic aesthetic.

```
ROLE: You are Otto's lead product designer. You redesign ONE screen to Apple Design Award quality.

CONTEXT (do not violate):
- Product: [§3 one-paragraph truth]. Voice: warm, plain, playful, short, honest.
- Design system (LOCKED, tokens only): [paste §6 relevant tokens — colors, type, spacing, radius, motion].
- Honesty laws: [paste §7]. Light-only. Otto at emotional beats only. Paw = save.
- Award bar: defend this screen against the 6 ADA pillars (§0) in one line.

THE SCREEN: [name + id from §5]
- Job to be done: [one sentence].
- Current implementation: [paste the real content from SCREEN_MAP.md + the current mobile/app/… layout].
- Must keep (1:1): [every piece of information/functionality on it today].
- States to design: loading · empty · error · success (all that apply).

MOBBIN PRINCIPLES: [paste the 3–5 extracted principles + mobbin_urls from §8].

PRODUCE, in order:
1. Layout rationale — the hierarchy and why (what the eye hits first, second, third).
2. The redesigned screen — every element specified in tokens (color/type/spacing/radius),
   component by component, top → bottom, including each state.
3. The ONE signature motion moment (name the spring; nothing animates on scroll).
4. Copy — every string in Otto's voice; caveats said once.
5. Accessibility pass — Dynamic Type behavior, VoiceOver labels/order, contrast, ≥44pt targets,
   reduced-motion fallback.
6. ADA defense — one line: which pillar this screen wins and how.
7. Risks / cut list — what you removed and why (log to REDESIGN_NOTES.md).

CONSTRAINTS: JS/RN only (no dark mode, no web-breaking Reanimated layout anims). No invented data,
no fake ratings, no dead buttons, no personalization we can't compute. If a piece of the current
screen is dishonest or dead, flag it — don't beautify it.
```

**Then build** the spec in `mobile/app/…` with `useTheme()` tokens, verify on web + sim, screenshot
every state, run adversarial QA, and log the decision.

---

## 10 · Definition of done (per screen) & guardrails

**Done when:**
- [ ] Redesigned to spec; every 1:1 piece of information/function preserved.
- [ ] All states designed (loading/empty/error/success) — verified on **web + iOS sim**, screenshotted.
- [ ] Tokens only; zero hardcoded colors/spacing; light-only.
- [ ] Exactly one signature motion; nothing on scroll; reduced-motion fallback present.
- [ ] a11y: Dynamic Type ok, VoiceOver labeled + ordered, ≥44pt targets, contrast passes.
- [ ] Honesty laws hold; no fake data, no dead UI, attribution intact, nutrition card/detail agree.
- [ ] Mobbin refs cited; ADA one-line defense written; decision logged in `REDESIGN_NOTES.md`.
- [ ] Figma master board mirrored (DS style).

**Anti-patterns (auto-reject):**
- Two competing signature moments, or animation on scroll.
- Lora used for body text; hardcoded hex; a dark-mode variant.
- A new feature, facet, or stat the backend can't actually produce.
- Hedging the nutrition caveat more than once; burying delete-account; a decorative provider button
  that isn't wired.
- Copying a competitor's visual look instead of extracting the principle.

---

## 11 · Suggested sequence (highest award-leverage first)

1. **Chat with Otto (＋ create)** — the innovation story; the sentence a jury remembers. Nail it first.
2. **Discover / Home (C1)** — first impression; the "what do I cook now" payoff.
3. **Recipe detail (D1) + Nutrition** — the craft + honesty showcase.
4. **Cook mode (D2)** — the interaction/inclusivity showcase (kitchen distance, hands-free).
5. **Plan (G1) + Shopping list (G2)** — the "one-tap magic" story.
6. **Cookbook (F1/F2)** + **Onboarding (B1–B3)** — the coherent-world story.
7. **Auth (A3/A4) · Account (H1–H4) · Supporting states (I1–I5)** — the finish that separates
   good from award-winning (nobody nominates an app with a sloppy error state).

> Redesign in this order, one screen at a time, each through the full §1 loop. Depth over speed —
> an award is won on the screens most apps phone in.

---

*End — Otto 1:1 redesign brief. Pair each screen with `SCREEN_MAP.md` (content) + the §9 scaffold on
Fable 5 + a Mobbin pass. Log every decision in `REDESIGN_NOTES.md`.*
