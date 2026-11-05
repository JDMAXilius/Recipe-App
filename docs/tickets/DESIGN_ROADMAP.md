# Otto design roadmap — from Figma to the app

Status: planning only · nothing here is started or scheduled · written 2026-11-05 against main at `6c481def`
Companion to `PRODUCT_ROADMAP.md`. That roadmap says *what* ships and in which order. This one says how the UI/UX gets from Figma into the app at the right quality: tokens, components, assets, screens and design QA. **Juan will hand over the final Figma designs later**; this plan is built so that work can start before they arrive and absorb them cleanly when they do.

---

## 1. How the two roadmaps run together

**Design runs one release ahead of build** (the "dual-track" pattern). While the product track builds release N, the design track finishes release N+1 and marks its frames *Ready for dev*. The shared base comes first, because it doesn't depend on which final screens Juan picks: tokens, the component library, the asset pipeline and the QA loop.

```
              NOW                 NEXT                                         LATER
 Product   1.0.24 Safe ground → Foundations → 1.1 Tonight → 1.2 Ask Otto → 1.3 Everywhere → 1.4 Snap a dish
 Design    D0 Intake + base   → D1 Components + assets for 1.1 → D2 screens 1.1 → D3 AI cards (1.2) → D4 system surfaces (1.3)
                 ▲                      ▲                             ▲
           finals from Juan      components frozen            each release: design QA sign-off before build ends
```

**Which goes first:**
1. **Now, in parallel with 1.0.24:** D0, the design base. It touches no product logic and unblocks everything after it.
2. **During product Foundations:** D1, the components and assets the 1.1 screens need. Foundations has no screens, so this is the window to build the parts.
3. **Each release's screens are assembled only once two things exist:** that release's product foundations, and its frames marked Ready for dev. Never pixel-build a screen whose data layer is still moving.

## 2. Design gates

| Gate | What must be true | Before | Owner |
|---|---|---|---|
| DG-1 Finals received | Juan's final Figma screens are in `r9QxxN5qDQXjW473H7LKgM`. Differences from v3/v4 are logged: added, changed or removed, per screen | D1 component freeze | Juan hands over, Claude logs |
| DG-2 Tokens frozen | Colour, type, spacing, radius, elevation and motion tokens match between Figma variables and `src/shared/theme/tokens.ts`; the contrast test passes | D1 | Claude, Juan approves |
| DG-3 Ready for dev | Every frame for the release has every state drawn (default, loading, empty, error, offline, long text, AX5 text size). It is named with a stable screen ID and marked *Ready for dev* | Build of that release | Juan approves |
| DG-4 Design QA | Built screens match Figma within tolerance at default size and AX5, VoiceOver labels are present, and the `/polish` sweep has no P1s | Release | Claude runs, Juan signs off |

## 3. Tracks

### D0 — Intake and design base (NOW, alongside 1.0.24)

| ID | Work | Size | Notes |
|---|---|---|---|
| D0.1 | **Figma house rules.** Pages: Foundations · Components · Screens by release · Flow map · Handoff. Stable screen IDs (S-01…) shared by frame names, tickets and test names. One frame per state | S | The file already has v1–v4 pages and the flow map |
| D0.2 | **Intake of the finals (DG-1).** Compare Juan's finals with v3/v4 and the flow map; log each change; update the flow map cards where screens changed | M | Waits on Juan |
| D0.3 | **Token sync.** Figma variables ↔ `tokens.ts`, one direction (Figma is the source for values, code is the source for names). A script or test that fails on drift. Light only (ADR-0007) | M | Contrast test already exists (`tokens.contrast.test.mjs`) |
| D0.4 | **Component inventory.** Map every Figma component to a code primitive in `src/shared/ui` (18 today), with gaps listed. Code Connect only if the Figma plan supports it | S | Primitives: Button, Text, Input, Sheet, Toast, Screen, SegmentBar, Ring, PawMark, OttoArt, OttoStates, TextLink, OfflineBanner… |
| D0.5 | **Asset pipeline.** Export rules (WebP at @2x and @3x, sRGB, max sizes), naming (`food/cat-*`, `mascot/otto-*-cut`, `actions/otto-*`), a manifest kept in step with `src/shared/assets.ts` (58 entries), an app-size budget, and the mascot rules (one Otto per screen, never over food photos, never stretched) | M | 61 assets in `assets/` today; Figma Assets page `1:9` holds the same set plus new ones (`app-icon`, extra categories) |
| D0.6 | **Visual QA loop.** The web build plus Playwright screenshots per screen and state, compared with Figma exports. Same harness as the flow-map screens | M | Becomes DG-4's tool |
| D0.7 | **Retire stale design asks.** T09's "dark mode for key screens" is dropped (ADR-0007). T03's three onboarding paintings become heroes, not a carousel (Apple pass). Mark T01–T10 against what's now decided | S | `docs/redesign-2026-11/tickets/` |

## Design principle: minimal and free (Juan, 2026-11-05)
Otto does it first and you adjust after. Every screen has one primary action. Fixed steps and required choices give way to sensible defaults with an easy "switch this?" afterwards. Labels and settings are optional and arrive later. Prefer inline edits to forms, and a visible button behind every gesture.

### D1 — Components and assets for 1.1 (during product Foundations)

Built and tested in isolation (a component gallery route in the web build), before any screen uses them.

| ID | Component or asset | For | Notes |
|---|---|---|---|
| D1.1 | **Tab bar** with four tabs plus the Otto circle (otter face, active ring), both the NativeTabs and custom-bar versions until the SDK spike decides | R3.1 | Figma set `68:112` |
| D1.2 | **Tonight card**: big dish photo, sized-for line, `~` calories, Start cooking, Cooked it, Swap | R1.4, R3.2, R5.6 | Figma `v4 · Home · Tonight with Cooked it` |
| D1.3 | **Plan day row + dish actions**: tap opens the sheet; long-press menu; swipe shortcuts; every action also a visible button; Undo toast | R4.1, R4.2 | Calls the action layer (R0.9) |
| D1.4 | **Week strip** of real dates, tonight first | R4.1, R3.2 | |
| D1.5 | **Question screen** template: "Question n of 3", chips, Skip | R1.3 | |
| D1.6 | **Paywall parts**: plan rows, billed-amount line, dated trial terms, outcome screens (waiting, ended, restored) | R2.1–R2.6 | Figma `v4 · Paywall · Keep your week` |
| D1.7 | **Banners and states**: offline, payment problem, empty states with a first action, not found | R2.7, R8.3, S10, R5.5 | |
| D1.8 | **Native alert and sheet styles** for iOS 26: left-aligned alerts, sheets with a grabber | R9.2 | System UI where possible |
| D1.9 | **Asset batch 1**: Welcome hero painting, launch shell (no art), Otto tab face, empty-state scenes, category art for any new categories | R1.1, R1.2, R3.1 | From Figma `1:9` and `assets/` |
| D1.11 | **Snap any dish parts** (moved up from D5): camera and picker, "Otto sees" chips, the two questions, the recipe-from-photo card with `~` and a range, "closest Otto recipe", hide-numbers | R6.5 | Moment 1 (ADR-0013) |
| D1.12 | **Free day list**: items in any order, optional label chip (breakfast, lunch, dinner, snack, custom), add from anywhere, drag to reorder | R0.10, R4.1 | No fixed slots |
| D1.13 | **Image treatment**: user photo, catalogue photo, and the labelled painted illustration for AI recipes, with the label style | R0.15 | Never photoreal for generated images |
| D1.10 | **Motion and haptics** for these components (press, swap, Undo, Cooked it), using the motion tokens | M1–M8 | `TERMINAL_TICKET_MOTION.md` |

### D2 — Screens for 1.1 (with the 1.1 build)
Welcome, the three questions, the Tonight-first reveal, Save your plan, paywall and outcomes, You're all set, the reminders primer, Home, Plan, Cookbook, Account, Search and every state. Assembled from D1 parts only; a screen that needs a new part goes back to D1 first. Ends with DG-4.

### D3 — Agent UI for 1.2 (designed during 1.1 build)
| ID | Design | Notes |
|---|---|---|
| D3.1 | Answer cards: week, recipe, list change, action receipt ("Otto moved Thursday's salmon to Friday · Undo"), suggestion | Built from D1 parts so AI output looks like Otto, not chat |
| D3.2 | "Otto did" activity log with Undo; Stop; Report a response | Guideline 1.2 |
| D3.3 | Voice states: listening, transcribing, speaking; mic denied with Open Settings | S3 |
| D3.4 | Consent moments for text, voice and photo; Privacy & data rows | ADR-0006 |
| D3.5 | Otto's voice and mascot states for thinking, acting, done, couldn't | `05_BRAND_AND_VOICE.md`, `MASCOT.md` |

### D4 — System surfaces for 1.3 (designed during 1.2 build)
Tonight widget (small, medium, Lock Screen, StandBy), cook-timer Live Activity and Dynamic Island, notification layouts with "Cooked it" and "Swap", the Siri snippet, calendar event text, Control Center control. Drawn at Apple's template sizes; these need Swift targets, so the designs must respect WidgetKit limits. **Light only applies here too (ADR-0007):** iOS shows widgets and Live Activities on dark Lock Screens and in tinted or clear Home Screen modes regardless of the app's setting, so each surface is designed in Otto's cream style with its own background, forced to the light colour scheme in code, and checked for legibility in tinted and clear modes. The app icon gets a deliberate dark and tinted variant (G17) so iOS doesn't auto-generate one.

### D5 — moved
The camera work is now D1.11 (Snap any dish is moment 1 in 1.1, ADR-0013).

### Ongoing
- Apple polish from the gaps ticket: layered app icon (G17), type scale (G19), large titles (G20), context menus (G21), iPad (G23).
- Every release: regenerate the flow-map screens from Figma, run `/polish`, an AX5 and VoiceOver walk, and update `DESIGN_SYSTEM.md`'s Status line.

## 4. Risks

| Risk | Mitigation |
|---|---|
| Finals arrive late | D0.3–D0.6 and most of D1 don't depend on them; screen assembly (D2) waits |
| Finals differ a lot from v3/v4 | D0.2 logs the changes; components absorb most of them; the flow map is updated before any build |
| Figma and code drift apart | Token sync test (D0.3), screen IDs (D0.1), the visual QA loop (D0.6) |
| Native surfaces look web-like | D4 is drawn at Apple's widget and Live Activity templates; system alerts and sheets are used, not imitated |
| Asset weight bloats the app | D0.5 budget and WebP at @2x/@3x only |

## Log
<!-- append: date, change -->
- 2026-11-05 · Written as the design companion to PRODUCT_ROADMAP. Planning only; waits on Juan's finals for DG-1.
- 2026-11-05 · Magic moments v2: camera parts moved into D1 (D1.11), free day list (D1.12), image treatment (D1.13), minimal-and-free principle; D5 folded in.
