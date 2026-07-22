# Otto v2 — Parity Plan (v1 experience on the v2 architecture)

Status: **approved structure, execution not started** (founder locked 2026-07-22).
Restore full v1 product parity — assets, the feel layer, and every missing
feature — onto the clean v2 foundation, without re-introducing v1's sprawl and
**without sacrificing app quality**.

Companion docs (read the one you need):

| Doc | Role |
|---|---|
| `V2_PARITY_PLAN.md` (this) | The plan — goal tree, phases, gates, crew, live state |
| `V2_PARITY_GAPS.md` | The **what** — feature-level inventory of everything missing |
| `V1_DESIGN_SPEC.md` | The **how** — pixel/token/timing-exact build spec per surface |
| `contracts/*.md` | The law the crews build against (founder-signed at P0) |

---

## 1. Main goal and guardrails

**Bring v2 to full v1 feature + experience parity, then cut over.**

Non-negotiable guardrails:

- **Quality is never traded for file-count.** "Less is more" governs *code
  structure*, never the *product*. The rebuild's mistake — letting minimalism
  eat the mascot/motion/features — is the exact failure this plan reverses.
- **v2 stays green the whole way** — every phase keeps `tsc`, `lint`, and the
  test suite passing; the app boots on web at every merge (the Phase-D bar).
- **One home per concept.** New behavior slots into the feature or `shared/`
  system that owns it — never a second copy. The card-vs-detail drift stays
  structurally impossible.
- **Tokens before pixels.** The design foundation is reconciled to v1's real
  values first (Phase P0) so everything built on top is correct by construction.
- **Best-practice, correct from the first commit.** Advanced but not clever;
  boring over surprising; every non-trivial module leaves one runnable check.

Reference truth for values: `V1_DESIGN_SPEC.md` (exact hex/px/ms) and
`V1` source on `main` / `git show main:mobile/...` (never re-checkout `main`
into the working tree — use `git worktree` or `git show`).

---

## 2. Locked file structure (the target)

`+` new · `~` expanded. Every concern has exactly one home.

```
assets/            + fonts/lora · mascot · food · actions · onboarding · splash · brands · sounds
app/
├── _layout.tsx    ~ font gate + splash gate + share-intent + gesture root + ErrorBoundary
├── onboarding.tsx + first-run route
├── chats.tsx      + recent-chats route (chat is its OWN feature)
└── (tabs)/_layout.tsx  ~ real icons + raised ＋ Create + tab haptics + safe-area bar

src/shared/
├── theme/tokens.ts  ~ full v1 tokens (colors incl. macro/border/gold/scrim; full type scale;
│                      spacing; radii; motion spring/timing constants)
├── motion.ts        + reanimated hooks (usePressSpring/useBreathe/useCountUp), reduced-motion aware
├── haptics.ts       + one typed wrapper (selection/impact/notify)
├── assets.ts        + typed registry: mascot + food + actions + onboarding + splash + brand
├── bus.ts           + OttoBus event bus
├── storage.ts       + typed AsyncStorage keyspace (replaces scattered otto.*.v1)
└── ui/
    ├── ErrorBoundary.tsx  + top-level recoverable Otto-error (resilience)
    ├── Bounceable.tsx     + press-spring wrapper
    ├── OttoIdle.tsx       + living mascot: breathe + hop-on-save (own responsibility)
    ├── OttoStates.tsx     + OttoLoading (rotating tips) + OttoError (retry)
    ├── Screen.tsx         + header (44×44 back/close) + safe-area wrapper
    ├── OttoArt.tsx        ~ real art via assets.ts
    ├── PawMark.tsx        ~ real paw + pop + haptics + bus + first-save celebration
    ├── Ring.tsx           ~ count-up animation restored
    ├── Toast.tsx          ~ fade + Otto celebration card
    ├── Sheet.tsx          ~ spring present + gesture
    └── Text.tsx           ~ full role scale (display/title/body/label/caption/step)

src/features/
├── onboarding/     + 3 panels + first-run gate + guest entry
├── chat/           + Ask-Otto conversational create + history (its OWN feature)
├── notifications/  + reminder engine (needs plan data → a feature, NOT shared) +
│                     the screen moves here from profile; consumes usePlan()
├── recipes/        ~ FilterSheet · calorie badge · macro dots · Otto's-pick overlay ·
│                     mascot loading/error/empty · pull-to-refresh · in-app native video
├── cook/           ~ entry from detail · seed-recipe loading · timer sound+haptics+keep-awake ·
│                     live rescale · plate capture · cook-again rating
├── share/          ~ view-shot capture · ShareCoachSheet · ShoppingListShareCard ·
│                     native intent · wire create-link/copy actions
├── planner/        ~ recipe picker · swap · leftovers · household live-sync (existing collab RPCs)
├── import/         ~ text + photo import · photo upload (reuse generate-recipe modes)
├── cookbook/       ~ card calorie badges · stat-door deep links (?segment/?cooked)
├── profile/        ~ journal photo grid · name editing · persistence (Notifications screen → notifications/)
└── auth/           ~ native OAuth (Apple sheet, Google/FB) · session persistence · route guards

supabase/functions/generate-recipe/  ~ EXTEND with two modes (no NEW function file, but real work):
                     `parse-text` (transcribe pasted recipe, raise the 600-char cap, faithful-not-
                     inventive prompt) and `photo` (Claude vision on a base64 image). Chat mode
                     ({messages}) + household collab RPCs already exist and are reused as-is.

docs/contracts/
├── ui-components.md ~ + motion + mascot + haptics + assets doctrine + reconciled tokens
└── persistence.md   + AsyncStorage keyspace + session + query policy
```

Deliberate corrections vs the first draft (quality > file-count): **`chat/` is
its own feature** (distinct domain from import); **`OttoIdle` stays separate**
from `OttoStates` (single responsibility); **`ErrorBoundary` added** (resilience
neither v1 nor the draft had).

---

## 3. Dependencies to add (platform libs we genuinely need)

"Less is more" is our *code*, not avoiding the libraries the experience
requires. These are all v1's own deps (Expo-managed):

`react-native-reanimated` + `react-native-gesture-handler` (motion/gestures) ·
`expo-haptics` · `expo-image` · `@expo-google-fonts/lora` + `expo-font` ·
`@react-native-async-storage/async-storage` · `react-native-get-random-values` ·
`expo-image-picker` · `expo-audio` · `expo-keep-awake` · `expo-notifications` ·
`react-native-view-shot` · `react-native-youtube-iframe` **+ `react-native-webview`**
(its required peer; native-only — the web video path keeps v1's raw `<iframe>`
fork, so web boots clean) · `expo-web-browser` + `expo-apple-authentication` ·
`expo-share-intent`. Each is justified in the phase that introduces it — no dep
lands without a consumer.

**Install discipline (Expo 54 / RN 0.81 / New Arch):** every dep via
`npx expo install <pkg>` (SDK-pinned versions), NOT raw `npm install`; add the
`react-native-reanimated/plugin` to `babel.config.js` (P0, or the feel layer
silently no-ops). Splash is an **animated still** (`otto-splash.webp` +
reanimated), not a video — no video player dep.

---

## 4. Goal tree & phases

Ordered by dependency + **biggest-feel-first** (restore identity fastest).

```
PARITY GOAL
├── P0  Foundation — deps · tokens reconciled to v1 · motion/haptics/assets/bus/storage
│        primitives · contracts signed. Everything else builds on this.
├── P1  Feel layer — assets+fonts wired · Bounceable · OttoIdle · OttoArt (real) ·
│        PawMark (real: pop+haptics+bus+celebration) · Ring count-up · Toast · Otto states
├── P2  Persistence & entry — AsyncStorage keyspace · session persistence · onboarding +
│        first-run gate · guest/anonymous entry · auth guards · ErrorBoundary
├── P3  Reachability & core flows — cook entry+seed · FilterSheet · in-app native video ·
│        share actions wired · tab bar (icons + raised ＋) · calorie badges
├── P4  Rich features — chat (Ask-Otto) · import text/photo/upload · notifications engine ·
│        household live-sync · planner picker/swap/leftovers · journal photos · native OAuth ·
│        Otto's-pick pref-awareness · Tonight band
└── P5  Convergence — review swarm (5 critics → verify → fix → 2 dry rounds) · device QA · cutover
```

Atomicity rule (unchanged from the rebuild): a unit is a task when it has
**(a)** one owner directory, **(b)** a testable acceptance criterion, **(c)** all
inputs already exist. Fails (c) → it's a dependency, sequence it later.

## 5. Phase gates

| Gate | Exit condition | Checked by |
|---|---|---|
| **P0** Foundation | contracts founder-signed · tokens match `V1_DESIGN_SPEC` · motion/haptics/assets/storage primitives merged · tsc+lint+tests green · app boots | human + auto |
| **P1** Feel | assets render (no placeholders) · Bounceable/OttoIdle/PawMark/Ring animate on device · reduced-motion honored · web+native boot clean | terminal device check |
| **P2** Persistence | session survives restart · onboarding gate works · guest browsing works · ErrorBoundary catches | terminal device check |
| **P3** Reachability | cook reachable + cooks a seed · FilterSheet filters · share produces an image · tab bar correct | L3 + device |
| **P4** Features | each feature packet accepted (build → verify → merge) · every V2_PARITY_GAPS item closed or explicitly deferred with reason | auto + review |
| **P5** Converged | review loop dry ×2 → device QA → founder | human |

Every gate is an **artifact validation, never a schedule** — same kick-off law
as the rebuild.

---

## 6. Crew

Same crew as the rebuild, plus one specialist:

| Definition | Role in parity |
|---|---|
| **builder** | one feature/system per packet, its own folder |
| **verifier** | tsc · lint · tests · L3 · **device screenshot** — reports only |
| **critic** | adversarial review + refute (P5 swarm) |
| **scout** | reads v1 (via `git show`/worktree) to feed packets from the spec docs |
| **ui-systems** | `shared/ui` + tokens |
| **ui-motion** | **NEW** — motion/mascot/haptics/assets doctrine (the feel layer); owns `shared/motion.ts`, `bus.ts`, `assets.ts`, the animated primitives |
| **security-builder** | native OAuth, session persistence, share tokens |
| **engine-porter** | (idle — engine is done) |

Run in **waves by phase**, one writer per folder, each paired with a verifier;
P5 is the review swarm. Verification now includes a **device screenshot** in the
report-back (the feel layer can't be judged on web alone).

---

## 7. Live state (update last, every packet)

| Phase | Status |
|---|---|
| P0 Foundation | ☑ done — tokens/motion/haptics/assets/bus/storage/ErrorBoundary merged; tsc+lint+tests green; boots (web) |
| P1 Feel layer | ☑ done (`c7ff2136`) + P1.1 cleanup (`f9ec3c5c`). **Device-verified 2026-07-22** on the iOS dev build (iPhone 17 Pro Max sim): reanimated 4 runs natively (no crash), Lora + painted mascot/paw/tiles/action-art render, OttoIdle breathes |
| P2 Persistence & entry | ☑ done (`6e72486e`) — session persists (AsyncStorage), onboarding + first-run gate (pure `resolveRoute`, tested) + splash. **Auth REQUIRED (founder decision 2026-07-22):** guest/anonymous browsing removed — onboarding funnels to create-account or sign-in; the gate routes onboarded+no-session → sign-in. Anonymous sign-ins intentionally OFF |
| P3 Reachability | ☑ done (`88478a9d`) + dev-build setup (`095073c2`) + device fixes (`0de4be3a`). **Device-verified 2026-07-22:** cook prep→steps (action-art, temp highlights, ingredient chips), painted Discover, tab bar+raised ＋, nutrition ring, image **share sheet** (fixed a native async-import crash), in-app **WebView video renders** (fixed YouTube "153" config). Device-only pending: YouTube playback (sim shows "152"—sim WebKit limit) + FilterSheet tap-through (sim text-entry limit; logic unit-tested) |
| P4 Rich features | ◑ in progress. **Done:** planner picker/swap/leftovers (`a2a11a87`) · Ask-Otto chat (`0f38f198`) · AI/nutrition edge fns DEPLOYED + keys set (`0dfdc05d`: generate-recipe chat+AI, import-recipe URL, resolve-nutrition live-USDA — fixed the Atwater-energy bug) · client nutrition falls back to resolve-nutrition for table misses (`62a97571`). **Left:** Otto's-pick pref-awareness · Tonight band · notifications (expo-notifications) · journal photos (expo-image-picker) · vision/photo import · native OAuth (Apple signing — founder). Auth-required (guest removed 2026-07-22) |
| P5 Convergence | ☐ blocked on P4 |

Contracts: ☑ ui-components (expanded) · ☑ persistence — signed at P0.
Cutover PR (`rebuild/v2 → main`, `04aa4e28`-era) is **held** until parity — do
not merge; `main` keeps shipping v1.
