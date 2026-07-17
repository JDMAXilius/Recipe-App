# Otto — App Design Document (ADD)

> The app-world equivalent of a game's GDD: one living document that holds the
> vision, the pillars, the feature set, the design system, and the technical
> shape of Otto in one place. Structured so each top-level section can become
> its own page/frame when imported into the Otto Figma project.
>
> **Status:** living document · **Last updated:** 2026-07-17 · **Owner:** JDMAXilius

---

## 1. Elevator pitch

**Otto is the quieter kind of cookbook** — a warm, calm home for the recipes
you actually cook. Save them, write them, or import them from a blog, a
TikTok, or an Instagram post; plan a loose week; turn that week into one tidy
shopping list your whole household can share; then cook hands-free, one step
at a time. No feed, no noise, no guilt — just an otter named Otto keeping the
stove warm.

---

## 2. Vision & philosophy

Most recipe apps are content platforms wearing a kitchen apron: infinite
feeds, ads between the ingredients, ten pop-ups before the method. Otto is the
opposite — a **personal cookbook**, not a magazine. It is opinionated about
calm. It remembers that the person holding the phone is often tired, hungry,
and standing in a kitchen at 6pm.

The whole product is built on a small set of **honesty laws**: never show a
number Otto didn't really compute, never ship a button that goes nowhere,
never quietly drop the source of a recipe someone else wrote. Warmth is the
surface; honesty is the spine.

---

## 3. Design pillars

The five decisions every feature is measured against.

1. **Calm over engagement.** No feed, no streak-shaming, no red badges
   demanding attention. Empty states are invitations, not failures. A
   two-dinner week looks finished, not neglected.
2. **Honesty, always.** Real data or nothing. If a capability isn't wired
   yet, the UI says so plainly rather than faking it. Imported recipes keep
   their source, credited and linked, on every screen and every share.
3. **Warmth you can feel.** A hand-painted Studio-Ghibli-adjacent otter, a
   terracotta-on-cream palette, a serif display face, soft springs, and copy
   written like a kind friend — never a corporate assistant.
4. **The kitchen is the context.** Big touch targets, legible-with-wet-hands
   type, hands-free cooking, one-tap "tonight." Design for the counter, not
   the couch.
5. **Yours, and portable.** Your recipes, your week, your list. Share by an
   unguessable link when you choose to; nothing is public by default; leaving
   deletes everything, for real.

---

## 4. Non-goals (what Otto deliberately isn't)

Naming the non-goals keeps the product from drifting into every-other-app.

- **Not a social network.** No profiles-to-follow, no likes, no comments, no
  public feed. Sharing is peer-to-peer via a link, not a broadcast.
- **Not a content mill.** Otto doesn't publish sponsored recipes or chase
  SEO. The community shelf is a browsable convenience, not the product.
- **Not a nutrition tracker / diet coach.** It shows honest per-recipe
  nutrition where it can compute it, but it doesn't count your day, scold
  your macros, or gamify weight.
- **Not a grocery-delivery storefront.** The shopping list is for *you and
  your household*, not a checkout funnel.
- **Not dark-mode-first or theme-heavy.** Otto is light, warm, and singular.
  A dark palette exists in tokens but the brand is one confident look.

---

## 5. Audience & personas

**Primary — "The weeknight cook."** Cooks 3–5 nights a week, saves recipes
from everywhere, forgets half of them, and dreads the "what's for dinner"
question. Wants dinner decided and a list built without friction.

**Secondary — "The household organizer."** Runs the family's food logistics.
Wants one shopping list everyone can add to, so the person at the store buys
the right things.

**Tertiary — "The recipe collector."** Screenshots and bookmarks recipes
compulsively across TikTok, Instagram, and blogs. Wants them all in one place,
readable, with the source kept.

---

## 6. Core feature set

The systems that make Otto Otto. Each is written as *what it is* → *why it
earns its place*.

### 6.1 Discover (Home)
A calm browse of a free community cookbook (TheMealDB), with a search bar, a
category filter, an "Otto's pick" featured card, and a "what's cooking
tonight?" band that surfaces the plan's payoff at dinnertime. Shaped by the
user's food preferences (see 6.8).
*Story:* "I want an idea for tonight without scrolling a feed."

### 6.2 Cookbook
The user's own shelf: recipes they saved from Discover, wrote themselves, or
imported. Segmented into cooked / saved / mine. This is the heart — the
personal library the rest of the app orbits.
*Story:* "Everything I actually cook, in one place I own."

### 6.3 Import
Three ways in, all landing on a "Check Otto's work" review screen:
- **From a link** — food blogs (deterministic JSON-LD), plus TikTok &
  Instagram posts (caption → recipe via LLM extraction).
- **From pasted text** — a DM, a note, an email; the words become a recipe.
- **By hand** — a clean manual editor.
Imported recipes keep their **source name + live link**, immutably, on the
recipe and every share.
*Story:* "I saw a recipe on TikTok and I want it in my cookbook, credited."

### 6.4 Plan (Otto's week)
A loose, guilt-free week of vertical day cards. No meal slots, no gray
scolding. Assign dishes from your cookbook, mark "cooked," and:
- **Leftovers** — a day can hold leftovers of an earlier dish (adds nothing
  to the shopping list).
- **Swap** — one tap trades a planned dinner for a fresh idea drawn from your
  food preferences.
- **Build my list** — one button turns the week into a shopping list.
*Story:* "Sketch a couple of dinners; don't make me fill every night."

### 6.5 Shopping list
A per-recipe-deduped list with summed quantities, provenance ("for Lemon
Chicken"), aisle sections, and whole-row check-off that never reorders
mid-store. Presented on a hand-generated **printed-notepad pad** that grows
with the list. Never silently rewritten — a banner asks before refreshing.
*Story:* "Turn my week into a list I can actually shop from."

### 6.6 Shared list ("Our list")
The household layer (S3). One unguessable link is the whole membership:
start a list (seeded from your open items), send the link, and everyone
who joins adds and checks the same list live. Each line shows who — "Maria
added," "Juan got it." Refreshes on focus and polls while open.
*Story:* "My partner's at the store — let me add to the list they're holding."

### 6.7 Cook mode
Full-screen, one step per page: a per-step ingredient strip (only what *this*
step needs), tappable inline timers with a floating countdown, a mise-en-place
with a servings scaler, and a guarded exit so you don't lose your place.
*Story:* "Walk me through it, hands-free, without me scrubbing a wall of text."

### 6.8 Food preferences
Diet (None / Vegetarian / Vegan — only what the data can honestly tag) and any
number of cuisines, saved explicitly. They shape **exactly two things**:
Otto's pick and where Discover starts. Search and filters stay fully
user-driven; your own recipes are never filtered.
*Story:* "Bias what Otto suggests toward how I actually eat."

### 6.9 Sharing (recipes & lists)
Every recipe and shopping list can become a read-only web page at an
unguessable link, with rich link previews (server-rendered OG meta) and an
honest "made with Otto" footer. Owner-revocable. Text-only fallback when a
link can't be minted.
*Story:* "Send my mum this recipe as a nice link, not a screenshot."

### 6.10 Reminders
Local, on-device, opt-in, default-off: a "tonight's dinner" nudge on planned
days (with the dish name) and a Sunday planning nudge. No push server, nothing
leaves the phone.
*Story:* "A gentle poke at 5pm about the thing I already planned."

### 6.11 Profile & account
Identity, membership (Otto Club, opening soon), kitchen stats, cooking
journal, food preferences, reminders, units, "little questions" (FAQ), tell a
friend, feedback/bug report, and honest exits (sign out / delete everything).

### 6.12 Otto Club (planned)
One simple membership for everything Otto can do. Fully framed in-app, gated
honestly as "opening soon." The free kitchen stays a real kitchen.

---

## 7. Information architecture

**Tab bar (5):** Discover · Cookbook · **＋ (Add)** · Plan · Profile

**Pushed / modal screens:** Recipe detail · Recipe editor · Cook mode ·
Shopping list · Our list (shared) · Food preferences · Reminders · Little
questions (FAQ) · Cooking journal · Otto Club · Onboarding · Auth (sign-in /
sign-up).

**Navigation model:** native stack with "drag-from-anywhere to go back"
gestures on every card; cook mode and onboarding opt out (guarded / paged).

---

## 8. Key user flows

1. **Weeknight rescue:** Discover → tap "Otto's pick" → Save → Plan (drop on
   tonight) → Build my list → Cook mode.
2. **Collector's capture:** TikTok → paste link on Add → review "Check Otto's
   work" → Save (source credited).
3. **Household run:** Shopping list → people icon → Start a shared list → send
   link → partner joins → both check items live.
4. **Sunday plan:** Sunday nudge → Plan → sketch 3 dinners (one via Swap) →
   Build my list.

---

## 9. Design system

Full reference: `docs/DESIGN_SYSTEM.md`. Summary for the doc:

**Palette (light).** Accent terracotta `#C4562E` (apron) · accent-soft
`#F3D9CD` · secondary chestnut `#8A5A3B` (fur) · gold `#E8B04B` (celebrations)
· background cream `#FAF4EA` (world) · surface `#FFFFFF` · surface-warm
`#F3E9DA` (belly) · ink `#2A211B` (warm, never pure black) · ink-soft
`#6E6055` · border `#E8DECF` · destructive `#D64545`. The palette is derived
from the mascot's own colors.

**Type.** Display / titles in **Lora** serif (700 / 600); body, labels,
captions in the platform system font. Scale: display 30/34, title 22/26, body
15/22, cook-step 24/32.

**Spacing.** 4 · 8 · 12 · 16 · 24 · 32. **Radius.** card 20, sheet 24, button
14, pill 999.

**Motion.** Reanimated springs — gentle, snappy, and the signature "paw-pop"
(damping 12 / stiffness 320) on saves and reactions. Reduced-motion swaps to
a 200ms fade.

**Mascot.** Otto the otter chef, hand-painted, in expressive states (happy,
excited, thinking, idle, sad) used as transparent cut-outs for empty states,
loading, and reactions — never as decoration for its own sake.

**Voice.** Warm, brief, a little witty; a kind friend, never a corporate
assistant. Empty states invite; errors reassure; nothing shames.

---

## 10. Technical architecture

**Mobile:** Expo SDK 53, React Native 0.79, expo-router v5, JavaScript/JSX
(no TypeScript). Theming via `useTheme()`; light-first. Local state via
AsyncStorage (shopping list, preferences, reminders, shared-list membership).

**Backend:** Node/Express + Drizzle ORM + Neon Postgres, deployed on Railway.
Zod-validated routes, rate limiting on costly endpoints, capability-URL
sharing (CSPRNG tokens, owner-revocable), server-rendered OG share pages.

**Auth:** Supabase Auth (email + Apple Sign-In on native).

**Integrations:** TheMealDB (free community recipes) · Anthropic API
(claude-haiku for caption/text recipe extraction) · TikTok/Instagram oEmbed
(keyless caption import) · Higgsfield (asset-generation pipeline for mascot &
textures).

**Data model (Postgres tables):** `recipes`, `favorites`, `plan_entries`,
`recipe_shares`, `list_shares`, `collab_lists`, `collab_items`,
`seed_nutrition`.

---

## 11. Feature status & roadmap

**Live in the codebase:** Discover, Cookbook, manual + blog import, Plan
(with leftovers & swap), Shopping list + printed pad, recipe & list sharing,
food preferences, reminders, cook-mode pack, profile suite (FAQ, tell-a-friend,
feedback/bug split), swipe-to-dismiss navigation.

**Built, gated on a founder action (honest "dormant" pattern):**
- *Share links & shared lists* → needs `drizzle-kit push` (creates the four
  share/collab tables).
- *TikTok/Instagram & paste-text import* → needs `ANTHROPIC_API_KEY` on the
  backend.
- *Apple Sign-In, share-to-Otto, painted share card, reminders delivery* →
  needs one iOS rebuild (`expo prebuild -p ios --clean`).

**Planned:** Otto Club membership · photo/video-frame import (reuses the
extraction pipeline) · Kitchen-Stories-style recipe-detail redesign · rate-app
(at store launch).

---

## 12. Success signals

Honest, calm metrics — not engagement-maxing:
- **Cooked count** per user per week (the real outcome).
- **Plan → list → cook** completion (does the loop close?).
- **Imports saved** (is the collector served?).
- **Shared-list adoption** per household (does the social layer stick?).
- **Retention without notification spam** (did calm keep them?).

---

## 13. Open questions

- How far should food preferences reach once richer recipe data (Spoonacular)
  lands — full diet list, allergen filtering?
- Should the shared list ever notify (push) on changes, or stay pull-only to
  keep its calm?
- Does the recipe-detail redesign adopt the Kitchen-Stories immersive layout,
  or a quieter Otto-native one?
- Otto Club: what's in, what's free, and what the price is.

---

*This document is meant to change as Otto does. Keep it honest, keep it warm,
keep it short enough that people actually read it.*
