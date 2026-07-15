# 🧩 Screen Decision Prompt — how any screen gets decided & built

> **Why this exists.** Two failure modes kept appearing: (1) the agent fires *four open
> questions at once* (impossible to answer), and (2) *every good idea becomes its own rail*
> (screens bloat into a scroll of ten competing modules). This prompt fixes both: it forces a
> **lean recommended design**, a **module budget**, a **rejection list**, and **at most two real
> forks** — presented recommendation-first. Use it for every screen from here on.

**Status:** v1 (cloud co-pilot). Applies on top of `REDESIGN_PROMPT_PACK.md` + the DECISIONS LOG.

---

## The reusable prompt (fill in `{{SCREEN}}`)

```
You are the design lead deciding AND building {{SCREEN}}. Follow this exactly.

PRINCIPLES (non-negotiable)
- ONE JOB. State the screen's single job in one sentence (the messy-hands kitchen test).
  Every element is graded against it; if it doesn't serve the job, it doesn't ship.
- MODULE BUDGET. Max 5 primary modules on a scrolling screen, max 3 above the fold.
  A 6th module requires deleting one. "Every good idea becomes a rail" is the failure mode —
  refuse it out loud.
- LEAN DEFAULT. Design the smallest version that wins the job, then justify each addition.
- SHOW, DON'T ASK. Produce an ASCII wireframe (or a Figma mock + screenshot) of your
  RECOMMENDED design before you ask me anything.
- RECOMMEND, DON'T FORK-DUMP. Present ONE recommended design with rationale. Surface at most
  TWO genuine either/or decisions that actually need me — each recommendation-first, with a
  one-line trade-off. Never fire four open questions at once.
- HONESTY. No element may imply data we don't have (no real ratings, nutrition is an estimate,
  no personalization we can't compute). Deterministic + explainable > fake-smart.
- OTTO. Full character at emotional beats; marks/motifs elsewhere; never crowding dense content.
- TOKEN-PURE. Only design-system tokens; light-only.

PRODUCE, IN THIS ORDER
1. Job — one sentence.
2. Lean module list (≤5). Each: why it earns its slot (job + a Mobbin principle) + honesty note.
3. REJECTION LIST — every module considered and CUT, one-line reason each. Required: a screen
   with no cuts has no opinion.
4. ASCII wireframe of the recommended layout.
5. The ≤2 real forks for me — recommendation first, trade-off second.
6. Copy — real strings, no lorem.

Then wait for my answer on the ≤2 forks ONLY. If I don't respond within your autonomous window,
ship the recommended lean version and log the call in REDESIGN_NOTES.md.
```

### The 5 fixes it enforces
1. **Module budget (≤5 / ≤3 above fold)** — adding a rail now costs a rail. Kills the kitchen-sink.
2. **Recommend, don't fork-dump** — one recommended design + ≤2 real forks, not four open questions.
3. **Mandatory rejection list** — restraint becomes part of the process; a screen with no cuts has no opinion.
4. **Show-don't-ask** — you react to a wireframe, not abstract choices.
5. **Honesty clause** — stops "Tonight/planned", fake ratings, and un-computable personalization.

---

## Worked example — Discover (apply the prompt)

**1 · Job.** *Answer "what do I cook right now" fast — then let me search, browse, or add my own.*

**2 · Lean modules (≤5):**
| # | Module | Earns its slot | Honesty note |
|---|---|---|---|
| 1 | **Greeting + search / "by ingredient" pill** | This tab absorbed Search (3-tab decision); the intent path must be one tap. (Kitchen Stories, Yazio embed search.) | — |
| 2 | **Otto's pick** (single hero) | The decisive answer to "what do I cook." | Date-seeded + reason chip ("From your saved shelf") — deterministic, no fake ML. |
| 3 | **Category tiles** (Otto food icons) | Fast browse by craving; showcases the painted icon set. | Real TheMealDB categories only. |
| 4 | **Recipe grid** | The browse payoff. | — |
| 5 | *(borderline)* **"Add your own" entry** | Import/create is now core; one slim entry. | Cut if it makes the screen feel busy — Add is already a center tab. |

**3 · Rejection list (required):**
- ❌ **"Tonight" framing** — implies a meal-planner that's a membership fast-follow, not v1. Use "Otto's pick" until Plan ships.
- ❌ **"Around the world" cuisine rail** — a *second taxonomy* competing with category tiles; cuisine belongs in the Filter sheet.
- ❌ **"Recently viewed" recents rail** — noisy, half-duplicates Cookbook.
- ❌ **"From your kitchen" as a fixed rail** — only render it *conditionally* when the user actually has created recipes; not a default slot.
- ❌ **Skill/goal quizzes, editorial shelves, review quotes** — no data/content consumes them.

**4 · ASCII wireframe (recommended):**
```
┌──────────────────────────────┐
│ 🦦  What's cooking?          │  greeting (Otto stamp)
│ ⌕  Search or what's in your… │  search + by-ingredient (one field)
├──────────────────────────────┤
│  OTTO'S PICK                 │
│  [ big food photo ]          │  one hero; reason chip below
│  Creamy Tomato Rigatoni      │
│  ◦ from your saved shelf     │
├──────────────────────────────┤
│ (Beef)(Chicken)(Pasta)(…) →  │  category tiles — painted icons
├──────────────────────────────┤
│ ┌────────┐ ┌────────┐        │
│ │ card   │ │ card   │  …     │  recipe grid
│ └────────┘ └────────┘        │
└──────────────────────────────┘
```

**5 · The ≤2 real forks (recommendation-first):**
- **Fork A — "Add your own" on Discover?** *Recommend: cut it here* (keep Discover at 4 modules; the center **＋Add** tab already owns creation). Trade-off: a Discover entry raises import discoverability slightly, at the cost of a 5th module.
- **Fork B — a "Recently cooked" rail (below the grid)?** *Recommend: not in v1* — add it only once cook-mode completions exist to populate it (cooked, not viewed). Trade-off: adds re-find value, but it's empty until people cook.

**6 · Copy (real):**
- Greeting: **"What's cooking?"**
- Search placeholder: **"Search recipes, or what's in your kitchen"**
- Otto's-pick reason chips (rotate deterministically): **"From your saved shelf" · "Chicken tonight?" · "Quick — under 30 min" · "Otto's been meaning to try this"**

> Net Discover = **4 clean modules** answering one question, with two honest forks instead of four open ones.
