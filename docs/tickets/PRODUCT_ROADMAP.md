# Otto product roadmap — one order of work

Status: planning only · nothing here is started or scheduled · written 2026-11-05 against main at `734081cb` (app 1.0.23, build 52)

This is the **order** of work. It merges the two plans that exist so far, plus every open ticket:
- **The rework** (`REWORK_ROADMAP.md`): the new flow, the paywall states, the tab bar, Plan by dates and the doors. It is the ticket catalogue (R-numbers).
- **The AI next level** (`docs/learning/reports/Otto AI agent research.md`): Otto AI that can do whatever you can do by hand, voice, photo to recipe, widgets and calendar. Its tickets were only "proposed" until now. They are added to the catalogue here as R0.9–R0.13, R6.5, R7.7 and R8.6, all marked *planned*.
- **The open tickets:** scenario gaps (S1–S11), Apple gaps still open (G17–G23), architecture findings (A1–A5, B1–B6) and motion (M1–M9).

It supersedes the "DRAFT, under discussion" section at the top of `ROADMAP.md`.

> **Updated 2026-11-05 (Juan): the magic moments changed** — see `docs/product/MAGIC_MOMENTS_V2.md` and ADR-0013 (Accepted). Moment 1 is now **Snap any dish** (photo → recipe), moved from 1.4 to 1.1. Moment 2 is **Otto plans your week**, the headline of 1.2. Meals become a free list with optional labels. "Tonight" stays as the Home card.

---

## 1. The idea in one picture

```
 NOW              NEXT                                   LATER
 1.0.24           Foundations      1.1.0              1.2.0                 1.3.0
 Safe ground  →   (no visible  →   Snap any dish  →   Otto plans        →   Otto
                  change)                             your week             everywhere
 fix what's       one action       magic moment 1     magic moment 2        widgets, Siri,
 risky, start     layer, prefs,    (photo → recipe,   (AI builds and        calendar, Live
 measuring        free lists,      honest numbers;    changes the week,     Activity
                  cook times,      new 4-tab app)     with Undo)
                  images
```

**The design track** runs beside this one, one release ahead: tokens, components, assets and screens from Figma are in `DESIGN_ROADMAP.md`. The design base (D0) starts now with 1.0.24. The 1.1 components (D1) are built during Foundations. Each release's screens wait for its frames to be marked *Ready for dev* (gate DG-3) and its design QA (DG-4).

Three rules shaped this order.

1. **Build each piece once.** The AI plan and the rework both need the same foundations. The action catalogue serves the dish-actions sheet, notification buttons, widgets, Siri and the agent. Preferences on the account serve the first-week reveal's allergy filter and the agent's hard limits. The atomic swap, the server-side shopping list and the durable rate limit are the rest. So they come first, together, before any surface that uses them.
2. **One magic moment per release, each measured before the next.** 1.1 proves "Snap any dish" (scan → saved recipe, and scan → trial). 1.2 proves "Otto plans your week" (an Otto-planned week with an item cooked). If a moment doesn't move its number, the next release waits. Building ahead is fine; releasing waits.
3. **Measure before changing anything.** The events table has to ship in 1.0.24, two weeks ahead of the new flow, or 1.1 has no baseline to compare against.

---

## 2. Decision gates (the founder's calls, in the order they're needed)

| Gate | Decision | Needed before | Recommendation | Record |
|---|---|---|---|---|
| G-1 | Retire the `canonicalize` function in production | 1.0.24 | Yes: it's live with no user check and spends OpenAI tokens | Findings A1 |
| G-2 | Privacy answers and policy name OpenAI, and add "product interaction" events | 1.0.24 | Yes, re-audit the truth table | `APP_PRIVACY_TRUTH_TABLE.md` |
| G-3 | Dictation on-device when the phone supports it | 1.0.24 | Yes: private, free, no new disclosure | AI plan decision 3 |
| G-4 | Value before the account | Foundations | Accept | ADR-0009 |
| G-5 | Preferences (with allergies) on the account | Foundations | Accept | ADR-0010 |
| G-6 | One action catalogue; AI writes run on the server with the user's token | Foundations | Accept | new ADR-0012 |
| G-7 | AI consent also recorded on the account | Foundations | Yes (covers Siri and widgets) | ADR-0006 amendment |
| G-8 | Expo SDK upgrade (NativeTabs, App Intents, widgets) | Foundations spike, then 1.1 | Spike first; upgrade if the spike passes | new ADR |
| G-9 | Plan days are a free list of items with an optional label (breakfast, lunch, dinner, snack, custom) | Foundations | Yes (Juan, 2026-11-05) | ADR-0013 |
| G-10 | Where "Snap any dish" sits: A) before the account with 3 device-limited scans, B) right after the trial starts, C) both doors on Welcome | Foundations | **Decided: A** (Juan, 2026-11-05), with DeviceCheck/App Attest on the scan endpoint | ADR-0013 |
| G-11 | AI-written recipes get images: catalogue match first, else a generated food image (amends the 2026-07-21 "no AI food photography presented as real" rule) | Foundations | **Decided: photorealistic generated images, tagged "AI image", never passed off as a real dish** (Juan, 2026-11-05; ADR-0014 replaces painted) | ADR-0013 |
| G-12 | Where cook times come from (the catalogue has none) | Foundations | Estimate once from the steps, store with `~`, spot-check a sample; never invent precise minutes | R0.14 |

---

## 3. Releases

Sizes are rough (S ≤ ½ day, M ≈ 1–2 days, L ≈ 3–5 days, per ticket) and assume one founder working with agents.

### Release 1.0.24 — Safe ground (NOW)

**Goal:** ship what main already has, close the risks, and start measuring. No new flow.

| Area | Work | Tickets |
|---|---|---|
| Ship main | Native build with the Apple-gap fixes G1–G14 (NetInfo needs a native build); device checks from the G log | Gold-standard log |
| Security | Retire `canonicalize`; secure invite codes and a join limit; a kitchen survives its creator's deletion; timeout on the RevenueCat webhook; RLS attack suite in CI | A1–A5 |
| Privacy | Sign-out and delete clear the device (chats, journal, prefs, consent); truth table and policy name OpenAI | S1, B4 (G-2) |
| Correctness | Regenerate database types; fix stale AI comments; import passes 402/429 through; `supabase/config.toml` for `verify_jwt` | B1, B2, B3, B5 |
| Small scenario fixes | Mic denied → Open Settings; sign-in errors explain the fix; household join errors and Leave confirm | S3, S5, S8 |
| Measure | `app_events` table + the onboarding and Home events; two weeks of baseline on today's flow | R0.8 |
| Voice | On-device dictation where supported (G-3) | AI plan |

**Done when:** TestFlight device checks pass, RLS suite is green in CI, and events have been flowing for 14 days.

### Foundations — one layer under both roadmaps (no visible change; ships inside 1.0.x builds or behind `flow_v2`)

**Goal:** the pieces every later release stands on. Three lanes can run side by side.

| Lane | Work | Tickets |
|---|---|---|
| Platform | SDK upgrade spike (NativeTabs trailing circle with a non-search screen; `expo-app-intents`; widget targets), then upgrade if it passes | G-8, R3.1 spike |
| Data (security seat) | Preferences with allergies on the account; atomic `put_in_plan` replaces swap + `meal` column; server-side shopping list for solo users and a `useShoppingList` hook; Postgres rate limiter and `requireClub` always on for AI; `agent_actions` table (undo + "Otto did" log) and account-level consent | R0.4, R0.5, R0.10, R0.11, R0.12, R0.13, S11 |
| Logic | Launch state machine; intent store; onboarding draft and claim; week builder with reviewed allergen tags on ingredient keys; `flow_v2` flag | R0.1, R0.2, R0.3, R0.6, R0.7 |
| Recipe model v2 | Yield and serving unit ("1 loaf · 10 slices"), grams per serving, nutrition ranges, origin and versions, forks with a parent pointer, `recipe_media` with provenance, cook events, plan item `kind`/`label`/`position`, a separate snap log; additive migration plus a one-time upload of phone-only data | proposed (X2 in `Otto three magic moments plan.md`) |
| AI groundwork | Cook-time estimates for the 795 recipes (`~`, reviewed sample); recipe image pipeline (user photo → catalogue match → photoreal generated image, tagged "AI image"); vision "identify and reconstruct" mode with a weighed calibration set; device-scoped scan limit (DeviceCheck), needed since G-10 = A | R0.14, R0.15, R6.5 (prep), R0.16 |
| Actions | `src/shared/actions`: every manual action defined once (schema, risk, where it runs, undo), plus a test that fails when a UI mutation has no action | R0.9 |

**Done when:** all pure-logic tests pass, every UI mutation has an action, RLS tests cover `profiles`, `agent_actions` and the server list, and the SDK decision is recorded.

### Release 1.1.0 — Snap any dish (NEXT · magic moment 1)

**Goal:** the new flow and the four-tab app, with the photo moment as the headline: snap any dish and Otto breaks it into a recipe with honest numbers.

| Area | Work | Tickets |
|---|---|---|
| **Snap any dish** | Camera → "Otto sees" chips → at most 2 questions → recipe with `~` nutrition and a range → Save · Add to a day · Cook. Closest catalogue recipe first; the user's photo is the image; hide-numbers setting; consent first | R6.5 |
| Getting in | Launch screen, Welcome (with the snap door per G-10), three questions, week preview, Save your plan, sign in | R1.1–R1.7 |
| Otto Club | "Keep your week" paywall (A/B with generic), every purchase outcome as a screen, You're all set, reminders primer, Club ended, grace banner, trial reminder | R2.1–R2.8, S6 |
| Tab bar | NativeTabs (or the custom bar from the spike): Home · Plan · Cookbook · Account + **Otto circle**; Home = Tonight + This week + Discover; Search from Discover; last tab restored | R3.1–R3.3, R3.5, R3.6 |
| Otto tab v1 | Today's chat moves into the Otto circle as a tab root, **now told the household, diet, allergies and this week**, and with Retry on failure. Still no writes: a recipe answer opens the review card | R3.4 (v1), S4, B6 |
| Plan | Week by dates, **each day a free list with optional labels**; dish actions sheet (tap, menu and swipe all call the action layer, with Undo); open day; "Otto plans my week" (deterministic); shopping in Plan; household share | R4.1–R4.6 |
| Cook | Mise en place; **Cooked it** on the Tonight card; "Dinner, done" | R5.1, R5.2, R5.4, R5.6 |
| Cookbook, Account | Segments, ＋ Add in the bar, camera primer; Membership with refund; Privacy & data; delete flow; sign out to Welcome | R6.1–R6.3, R7.1, R7.2, R7.4–R7.6 |
| Doors | Notification taps open the right screen, plus "Cooked it" / "Swap" buttons on the dinner reminder; offline launch check; What's new; empty states with a first action; not found | R8.2, R8.3, R8.4, S2, S7, S10, R5.5 |
| Polish | Apple pass on the new screens; type scale; back chevrons | R9.1–R9.3, G19, G20 |
| Release | Sandbox matrix, privacy answers, review notes, screenshots, regenerate `otto.html` | R10.1–R10.6 |

**Done when (the numbers that decide 1.2):** scan → saved recipe rate; scan → trial beats the 1.0.24 baseline; edits per scan (how often people fix what Otto saw); activation (one planned item cooked in the trial) is measured for two cohorts.

### Release 1.2.0 — Otto plans your week (NEXT · magic moment 2)

**Goal:** ask Otto for a week ("nothing over 30 minutes, tacos Friday") and it builds it from the catalogue or writes new recipes, with images. After that, Otto changes your plan, list, cookbook and reminders when you ask, by text or voice, with Undo.

| Area | Work | Tickets |
|---|---|---|
| Plan my week | `plan_week`: catalogue first (filters in code), new recipes only where nothing fits, each with an image from R0.15; time limits use R0.14 estimates; preview card, one tap commits | R0.9, R0.14, R0.15 |
| Agent | `otto-agent` Edge Function (Responses API, tool loop capped at 6 steps, user's token so RLS applies); the 17 tools from the action catalogue; answers as cards; "Otto did" log with Undo; Stop; Report a response (guideline 1.2) | R3.4 (agent) |
| Rules | Single reversible changes act then Undo; a whole week or a new recipe is a preview you tap; prefs and calendar confirm; allergies, diet, deletes, billing and household are never visible to the AI | AI plan |
| Voice | Dictation seeded with this week's recipe names; cook-mode voice ("next", "back", "timer 8 minutes") on the device; spoken replies with `expo-speech` in cook mode | R5.3 (voice part) |
| Suggestions | At most one suggestion card on Home, triggered by code from the catalogue, AI only when tapped; quiet by default | R4.x |
| Chats | Chats and journal follow the account, or say clearly they stay on this phone | S9 |
| Quality | ~100-request eval set in CI: end state correct, tool accuracy, injection resistance, **0 allergen violations** | AI plan |
| Measure | `otto_request_sent`, `otto_action_applied`, `otto_action_undone`, `suggestion_answered` added to the tracking plan | R0.8 |

**Done when:** the share of trials with a first kept Otto action (not undone within 10 minutes) is measured, the undo rate is stable, evals are green with zero allergen violations, and AI cost per subscriber is inside the estimate ($0.10–$1.00 a month).

### Release 1.3.0 — Otto everywhere (LATER)

**Goal:** Otto outside the app, cheapest surfaces first. Needs the SDK decision (G-8).

| Order | Work | Tickets |
|---|---|---|
| 1 | Calendar: "Subscribe in Calendar" feed of the plan (updates itself; Apple, Google, Outlook) and "Add tonight to Calendar" | R7.7 |
| 2 | Tonight widget, read-only (Home Screen, Lock Screen, StandBy) | R8.5 |
| 3 | Siri and Shortcuts: "What's for dinner", "Mark cooked", "Add to list", "Next step" | R8.6 |
| 4 | Cook-timer Live Activity with the current step | R5.3, M9 |
| 5 | Interactive widget buttons; Control Center control | R8.5 (v2) |
| + | Universal links for shared recipes and lists | R8.1 |

**Done when:** share of weekly actives using a surface, and whether surface users cook more planned dinners (the North Star).

### Release 1.4.0 — moved
"Snap a dish" moved into 1.1 as moment 1 (ADR-0013). Later photo work, if 1.1's numbers justify it: several photos of one dish, and portion help from a reference object.

### Ongoing lanes (pick up when a release has room)
- **Apple polish:** layered icon (G17), launch screen (G18, = R1.1), list gestures and context menus (G21, rides with R4.2), localization when a second language is planned (G22), iPad (G23).
- **Motion:** M1–M8 per `TERMINAL_TICKET_MOTION.md`; M7 is R3.1.
- **Docs freshness:** every release regenerates `otto.html`, updates `docs/architecture/` Status lines, and adds ADRs for new decisions.

---

## 4. Critical path

```
G-4/G-5/G-6 decisions ─┐
SDK spike (G-8) ───────┼─► Foundations ─► 1.1 build ─► 1.1 release ─► 2 weeks of data ─► 1.2 release ─► 1.3 ─► 1.4
1.0.24 + baseline ─────┘        │                                            ▲
                                └─► action catalogue + agent build ──────────┘ (can be built during 1.1, released after)
```

The long poles are **preferences on the account → week builder** (the allergy filter and the agent's limits wait on it) and **the vision calibration set → Snap any dish** (1.1's headline can't ship on unmeasured accuracy). The agent can be built while 1.1 is in review, but it is released only after 1.1's numbers are in.

## 5. What is deliberately not on this roadmap
AI before the account beyond the 3-scan Snap any dish demo (ADR-0013); realtime speech-to-speech; a custom wake word; EventKit two-way sync; a separate AI price tier; an Otto app inside ChatGPT; Dark Mode (ADR-0007); model-computed calories or accuracy claims. Reasons are in the AI plan, section "What not to build".

## 6. Risks to this order

| Risk | What it would change |
|---|---|
| The SDK spike fails (NativeTabs can't host the Otto circle, App Intents can't run on our SDK) | 1.1 uses a custom tab bar; 1.3 waits for an SDK upgrade or a hand-written Swift module |
| 1.1 doesn't beat the baseline | Revisit the reveal (questions, Tonight card) before releasing 1.2 |
| Allergen tags take longer than planned | The reveal ships with allergy questions but conservative filtering; the agent stays read-only on recipes until tags are reviewed |
| AI cost per subscriber above the estimate | Cheaper model for tool routing, tighter per-user limits, cached prompts |
| App Review on AI features (1.2, 5.1.2(i)) | Consent covers voice and photo; review notes point to it; Report a response is in from day one |

## Log
<!-- append: date, change -->
- 2026-11-05 · Written: merges REWORK_ROADMAP, the AI agent plan and the open S/G/A/B/M tickets into one release order. Planning only.
- 2026-11-05 · Magic moments v2 (Juan): Snap any dish moves to 1.1 as moment 1; Otto plans your week heads 1.2; free meal lists; recipe images; gates G-9 revised, G-10 revised, G-11 and G-12 added; 1.4 folded into 1.1.
- 2026-11-05 · G-11 changed by Juan: photorealistic generated images, tagged (ADR-0014).
