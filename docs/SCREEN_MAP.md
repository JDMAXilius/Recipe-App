# 🗺️ Otto — Full Screen Map & Content Breakdown

> Every screen in the app, with the content on it, top → bottom. This is the build
> checklist for the redesign. Grounded in `otto-v2-direction-and-structure.md` (tabs,
> features, membership), the DECISIONS LOG, and the honesty rules in
> `SCREEN_DECISION_PROMPT.md`. **Light-only. Otto is the face. Nutrition is an estimate.
> No fake ratings. No personalization we can't compute.**

**Legend:** 🟢 v1 (launch) · 🟣 membership (Otto Club) · 🔵 v2 fast-follow · 🦦 Otto beat (full character) · ⭑ honesty note

**Count:** 9 sections · **28 screens** for v1 + the 2 membership screens.
**Tab bar (v1):** `Discover · Cookbook · ＋Add · Account` — Plan inserts as a 5th slot when membership ships.

---

## A · Launch & Auth (4 screens)

### A1 · Splash / loader 🟢🦦 → full brief: `SPLASH_BRIEF.md`
The first frame. Warm, branded, fast. **Still now, Otto video as a fast-follow** (the first frame is always a still — see brief §2).
- Full-bleed cream background (`cream #FAF4EA`)
- Otto hero cutout, centered (painted welcome pose — video planned, still image for now)
- Wordmark "Otto" (Lora display) under the mascot
- Quiet loading shimmer — no spinner chrome
- Auto-advances to onboarding (first run) or Discover (returning, session valid)

### A2 · Onboarding showcase 🟢🦦 → full brief: `ONBOARDING_BRIEF.md`
*(3-screen carousel — full breakdown in section B.)* Feature trailer, no questions.

### A3 · Sign up 🟢
Account is a **cloakroom** — only reached the first time someone saves/imports, never a hard wall on cooking.
- Back / dismiss (X) — dismissible; browsing stays anonymous
- Large framed Otto (sign-up gets the big pose, ~40% — §2.2)
- Headline + one reason-line: **"Pull up a stool."** / "Save recipes, plan dinners — Otto remembers."
- **Social sign-in — real OAuth (Supabase), each a full-width row with the brand icon:**
  -  **Continue with Apple** (black button, Apple brand mark)
  - <span>G</span> **Continue with Google** (white/outlined, Google "G")
  - **Continue with Facebook** (white/outlined, Facebook "f") — *optional, see note*
- "or" divider
- Email + password fields (Supabase Auth), inline "6+ characters" hint
- Primary button: **Join Otto's kitchen**
- Footer link: "Already have an account? Sign in"
- Legal microcopy: Privacy · Terms

### A4 · Sign in 🟢
- Back / dismiss (X)
- Small Otto vignette (returning users get less art — §2.2), headline does the warmth
- Headline: **"Back to the kitchen?"** / "Otto kept your place."
- **Same three social rows** (Apple · Google · Facebook) — real OAuth
- "or" divider
- Email + password
- Primary: **Sign in**
- "Forgot password?" link
- Footer: "New here? Create an account"

> **⚠️ Auth notes for the terminal (supersedes the old "no SSO rows" line in `MOBBIN_COMPARISON.md §2.2`):**
> - These are **real** providers wired in **Supabase Auth** (Apple + Google + Facebook OAuth), *not* decorative rows. Each must be configured in the Supabase dashboard and the native Expo config (`expo-apple-authentication` for Apple; `expo-auth-session`/native for Google; Facebook SDK for Meta). Do not add a provider button that isn't actually wired.
> - **App Store guideline 4.8:** offering Google/Facebook login on iOS *requires* also offering **Sign in with Apple** — we do, so keep Apple present and listed first.
> - **Recommendation:** Apple + Google cover ~95% of sign-ins and are the lightest to ship. **Facebook** adds the Meta SDK + app-review overhead and its login share is declining — include it per the founder's ask, but it's the one to cut first if launch scope tightens. Flagged, not decided.
> - Same three rows appear on **both** sign-up and sign-in (consistency); order is identical (Apple, Google, Facebook).

---

## B · Onboarding showcase (3 screens) 🟢🦦

The trailer. **No quiz** — three painted promises: **collect → cook → plan.** Swipeable,
skippable, 3 progress dots. Ends in Discover. Account is asked later, only on first save.
⭑ No "tailored just for you" wording — we don't personalize yet.

Shared chrome on every screen: painted Otto-style illustration (top ⅔) · headline (Lora) ·
one-line subhead · progress dots · **Continue** (last screen: **Start cooking**) · **Skip** (top-right).

### B1 · "Every recipe you love — in one place"
- **Illustration:** link / photo / video sources flowing into an Otto cookbook card
- **Subhead:** "Import from any site or video, or write your own — Otto keeps them all together."
- **Bundles:** Import · Create your own · Share

### B2 · "Cook it right, every time"
- **Illustration:** big numbered steps, a serving stepper (− 3 +), Otto tasting a pot
- **Subhead:** "Step-by-step cook mode, serving sizes that scale, and a nutrition estimate for every dish."
- **Bundles:** Cook Mode · Nutrition · serving scaling ⭑ nutrition shown as *estimate*, never a promise

### B3 · "Plan the week, shop in one tap" 🟣
- **Illustration:** Otto's week grid → a checkable shopping list
- **Subhead:** "Plan your meals and Otto builds the shopping list for you."
- **Bundles:** Meal Plan · Shopping list · Cookbook is where it all lives
- ⭑ **Membership-dependent.** If Plan isn't in the launch build, drop B3 → 2-screen onboarding (collect → cook) and add it back when Plan ships.

---

## C · Discover tab (4 screens) 🟢

### C1 · Discover / Home 🦦
*Answer "what do I cook right now" fast — then search, browse, or add my own.*
(4 lean modules — from the Discover worked example in `SCREEN_DECISION_PROMPT.md`.)
- **Greeting + Otto stamp** — "What's cooking?"
- **Search field** (one field, doubles as "what's in your kitchen" → by-ingredient) ⭑ this tab absorbed Search (3-tab decision)
- **Otto's pick** — single hero recipe + reason chip ("From your saved shelf") ⭑ date-seeded + explainable, no fake ML
- **Category tiles** — Otto painted food icons, real TheMealDB categories
- **Recipe grid** — the browse payoff
- ❌ cut: "Tonight" framing, cuisine rail, recently-viewed, quizzes (see rejection list in the decision prompt)
- 🔎 **Social/community direction** (showcase users, re-feature the best, ratings + comments) is deep-thought in `DISCOVER_SOCIAL_EXPLORATION.md` — **v1 seeds author attribution + a visibility flag only; the public feed is Phase 2** (moderation + cold-start make it a subsystem, not a launch add-on).

### C2 · Search (active) 🟢
- Search bar (focused) + cancel
- Recent searches (device-local) / suggested categories before typing
- Live results grid as you type
- Filter entry (opens C3)
- Empty/no-results → see I4

### C3 · Filter sheet 🟢
Bottom sheet. Where *cuisine* lives (kept off Home).
- Category chips · Cuisine/Area chips · (later: time, diet)
- "Clear all" · **Apply** (shows result count)
- ⭑ only filters TheMealDB actually supports — no fake facets

### C4 · By-ingredient search 🟢
"Cook with what you have" — the free hook.
- Ingredient input with add-as-chips
- Chosen ingredients row (removable)
- **Find recipes** → results grid
- Empty prompt: Otto holding a basket, "Tell Otto what's in your kitchen."

---

## D · Recipe (2 screens) 🟢

### D1 · Recipe detail
Top → bottom:
- Hero photo + back · **paw-save** · **Share** · overflow (**Edit / Delete** — only if it's the user's own) 🟢
- Title + category/area
- **Source attribution** — "Imported from allrecipes.com" / "By you" ⭑ honest provenance
- **Serving stepper + US/Metric** — scales structured ingredient amounts 🔵
- **Ingredients** — structured rows, tinted quantities, **"Add to shopping list"** 🟣
- Video row (TheMealDB YouTube, or the user's own)
- **Numbered steps**
- **NutritionCard** — calorie ring + one segmented macro bar + legend, footnote "Otto's estimate… a guide, not a guarantee." ⭑
- Bottom bar: **Save** · **Start cooking** · **Add to plan** 🟣

### D2 · Cook mode 🟢🦦
Hands-free, one step at a time. Keep-awake on.
- Step counter (Step 3 of 8) + progress
- Big current-step text (kitchen-distance legible)
- This step's ingredients inline
- Serving reminder chip
- Timer chip when a step names a duration
- Prev / Next (large targets) · swipe
- Finish → celebration (I1)

---

## E · ＋Add / Create (5 screens) 🟢

### E1 · Add menu (sheet)
The center **＋Add** tab. Four entries:
- **Paste a link** → E2
- **Scan a photo** → E3
- **From a video / Instagram** → E4
- **Write it yourself** → E5
- Otto peeking, one line: "What are we adding?"

### E2 · Import from URL → review
- URL field + paste button
- Parsing state (Otto reading, ~2s) — `recipe-scrapers`, LLM fallback
- **Review & edit:** pulled title, photo, ingredients, steps, time, servings, category — all editable ⭑ user confirms before save (extraction isn't perfect)
- **Save to Cookbook**

### E3 · Scan a photo → review
- Camera / photo-library picker (cookbook page, handwritten card)
- OCR + LLM structuring state
- Same **review & edit** form as E2 ⭑
- **Save to Cookbook**

### E4 · From a video / Instagram → review
- Reached via the iOS **share sheet** (user shares a post *to* Otto) ⭑ user-initiated only — no scraping arbitrary accounts
- Caption + transcript extraction state
- **Review & edit** form ⭑
- **Save to Cookbook**

### E5 · Manual editor
- Title
- Photo (add/replace)
- Ingredients — structured rows (qty · unit · item), add/reorder/delete
- Steps — numbered, add/reorder/delete
- Time · Servings · Category
- **Save to Cookbook**

---

## F · Cookbook tab (2 screens) 🟢

### F1 · Cookbook 🦦
- Header + Otto paw
- Two segments: **Saved** (from Discover) · **My recipes** (created/imported)
- Collections chip row — "All · … · ＋ New" 🟣 (membership, later)
- Recipe grid
- Search-within (if the shelf is large)

### F2 · Cookbook empty state 🦦
- Otto with an open blank book
- "Your cookbook's empty — let's fix that."
- Two buttons: **Browse recipes** (→ Discover) · **Add your own** (→ E1)

---

## G · Plan + Shopping (2 screens) 🟣 membership fast-follow

### G1 · Planner
- "Otto's week" — 7-day grid
- Assign saved/own recipes to days (tap a day → pick)
- Per-day recipe chips
- **Generate shopping list** → G2

### G2 · Shopping list
- Auto-built from a recipe or the week's plan ⭑ generated from real ingredients
- Grouped by aisle
- Checkable rows (check off in-store)
- Quantities merged across recipes
- Share / clear-checked

---

## H · Account tab (4 screens) 🟢

### H1 · Account home 🦦
~8–9 rows. **No theme switcher** (D2 — light only).
- Identity — Otto bust + email
- **Membership card** — "Join Otto Club — 5 days free" ↔ collapses to **Manage / Restore** when subscribed 🟣
- **My recipes** — count + shortcut to created/imported
- **Connected accounts** — Instagram (share now; pull-in later) 🔵
- Preferences — **Units (US / Metric)** ⭑ the one setting the old quiz was going to ask; ask it here, once
- Support — Contact us · Rate the app
- Legal — Privacy · Terms · version
- **Sign out** · **Delete account** (red, confirm)

### H2 · Membership / paywall 🟣🦦
- Otto Club hero (Otto in chef whites)
- What it unlocks: create/import · Plan + shopping list · Ask Otto · unlimited saves + collections ⭑ never paywalls *cooking a recipe*
- **5-day free trial** intro offer, single tier
- Price + auto-renew disclosure (App Store compliant)
- **Start free trial** · Restore purchases · Terms

### H3 · Connected accounts 🔵
- Instagram row — **Share out** now (share sheet); **Connect** (pull-in your own photos) later
- ⭑ only your own authorized account — no arbitrary accounts

### H4 · Confirm dialogs 🟢
- Sign out · Delete account (destructive, `#D64545`, double-confirm) · Cancel membership · Discard unsaved edits

---

## I · Supporting states (5 screens) 🟢🦦

### I1 · Celebration
- Finished cook mode → Otto cheering, confetti in tokens
- "Nice work! Save it, share it, or plan it again." → Save · Share · Add to plan

### I2 · Error / offline
- Otto with an unplugged mixer, calm not alarming
- "Otto lost the connection." · **Try again**

### I3 · Generic empty
- Reusable Otto empty template (shelf, search, plan) — illustration + line + one action

### I4 · Search-empty
- Otto looking under a lid
- "Nothing for '{query}'." · suggest categories · clear search

### I5 · Loading
- Inline Otto shimmer / skeletons (grid, detail) — no OS spinner

---

## Where each of your 9 features lives (traceability)

| Feature | Primary home | Also surfaces |
|---|---|---|
| Import | E2 · E4 | B1, C1 add-entry |
| Create your own | E5 | B1, D1 (Edit) |
| Share | D1 share · I1 | B1 |
| Your photos (IG pull-in) 🔵 | H3 | — later phase |
| Meal Plan 🟣 | G1 | D1 "Add to plan", B3 |
| Cookbook | F1 | onboarding end, H1 shortcut |
| Shopping list 🟣 | G2 | D1 ingredient action |
| Nutrition | D1 NutritionCard | B2 |
| Cook mode | D2 | B2, D1 "Start cooking" |

---

*End — Otto full screen map. Pair with `SCREEN_DECISION_PROMPT.md` to build any single screen.*
