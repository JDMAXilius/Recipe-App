# Otto v1 — Build-Ready Design Spec (for v2 parity)

Component-level, pixel/token/timing-exact spec of the **v1 app** (audited at
`/tmp/otto-v1`), with the precise **v2 delta** for each. Companion to
`docs/V2_PARITY_GAPS.md` (that doc = *what's* missing; this doc = exactly *how*
each piece looks, moves, and behaves so v2 can rebuild it faithfully).

Assembled from a 6-way deep analysis: (1) design tokens · (2) RecipeCard +
Discover · (3) NutritionCard + recipe detail · (4) tab bar + navigation + app
flow · (5) mascot + animation + interaction catalog · (6) asset catalog +
remaining screens.

Status: sections filled as each analyzer lands.

---

## 1. Design tokens (foundation)

v1 splits its foundation across `constants/tokens.js` (non-color: spacing,
radii, type, spring, timing), `constants/colors.js` (a 4-niche × light/dark
generator), and `context/ThemeContext.jsx` (ships **base/light only** —
`isDark:false`, no switching/persistence). v2 (`src/shared/theme/tokens.ts`) is
a flat light-only module that collapses most of this to a minimal set.

### Colors (v1 base/light — the only set shipped)

| Role | v1 key(s) | Hex |
|---|---|---|
| Accent / terracotta | primary = accent | `#C4562E` |
| Accent soft | accentSoft | `#F3D9CD` |
| Secondary (chestnut) | secondary | `#8A5A3B` |
| Gold (ratings/streaks) | gold | `#E8B04B` |
| App background | background = bg | `#FAF4EA` |
| Card / surface | card = surface = white | `#FFFFFF` |
| Surface warm | surfaceWarm | `#F3E9DA` |
| Ink (text) | text = ink | `#2A211B` |
| Ink soft | textLight = inkSoft | `#6E6055` |
| Border (hairline) | border | `#E8DECF` |
| Gray (disabled) | gray | `#B9A895` |
| Shadow | shadow | `#2A211B` |
| Destructive | destructive | `#D64545` |

**Nutrition macro colors (FIXED, never re-skinned):** protein `#3B82F6` (blue),
carbs `#F0A020` (amber), fat `#8B5CF6` (purple).
**Overlays (warm ink, never black):** scrim `rgba(42,33,27,0.35)`, scrimStrong
`rgba(42,33,27,0.65)`, textShadow `rgba(42,33,27,0.45)`.
Niche accents (unshipped): lean `#10B3A3`, keto `#2E8B4E`, bulk `#F5793B`; a full
dark set exists in code but is unreachable.

### Typography

Display face = **Lora** (`@expo-google-fonts/lora`), loaded in `_layout.jsx` via
`useFonts({Lora_400Regular, _Italic, _600SemiBold, _700Bold})`, render gated on
`fontsLoaded`. Body/label/caption = system font.

| Role | family | size | lineHeight | weight | tracking | extra |
|---|---|--:|--:|---|--:|---|
| display | Lora_700Bold | 30 | 34 | (bold) | — | — |
| title | Lora_600SemiBold | 22 | 26 | (semi) | — | — |
| body | system | 15 | 22 | — | — | — |
| label | system | 13 | — | 600 | — | — |
| caption | system | 12 | — | 500 | 0.5 | UPPERCASE, tabular-nums |
| step | system | 24 | 32 | — | — | cook step number |

Call-site overrides (not tokenized): greeting display@26/32, empty-prompt
display@22/30, result-title display@20/26, card-title body+w700/lh20,
chip/measure body@13+w700+accent, tonight-label caption@10, badge/stamp
caption@10. Rule: **terracotta = computed/interactive, ink = authored**.

### Spacing · Radii · Borders

SPACING(px): xs`4` sm`8` md`12` lg`16` xl`24` xxl`32` (half-steps inline: 10, 6).
RADIUS(px): card`20` sheet`24` button`14` pill`999` mascot`24` (inline: thumb`10`,
dot`3–4`, input pill`28`). Border widths: `1` default, `1.5` clarify chips, `2`
selected category ring. No named shadow token — inline, colored by `shadow`.

Shadow tiers: **featured** `{offset 0/4, opacity 0.12, radius 12, elevation 6}`;
**card** `{0/2, 0.08, 8, 3}`. Text-shadow (featured title) `{textShadow, 0/2, 4}`.

### Motion

SPRING (reanimated): gentle`{18,120,1}` · snappy`{15,220,0.8}` (press→scale 0.97)
· pop`{12,320,0.7}` (paw/OttoIdle signature) · sheet`{22,260,1}`.
TIMING(ms): sweep`500` (CalorieRing, ease-out) · fade`200` (OttoIdle image).
Inline easings: OttoIdle breathe `withTiming(1,{2100, Easing.inOut(sin)})`,
reaction dip `{140, Easing.out(quad)}`, entrance `withDelay(80,…)`.
**Reduced motion honored everywhere** via `useReducedMotion()` — springs guarded,
degrade to opacity dip 0.85 / static.

Layout constants: hitSlop `{10}` header / `{8}` in-row; search+filter 48×48;
category tile 76×76; card image 5:4 (`cardWidth*0.8`); icons commonly 18/20.

### v2 DELTA (vs v1 base/light)

- **Colors drifted, not just renamed:** ink `#2A211B`→`#2A2320`, cream/bg
  `#FAF4EA`→`#FAF5EC`, creamDeep/surfaceWarm `#F3E9DA`→`#F2E9DA`, danger/destructive
  `#D64545`→`#B3402A`. terracotta keeps `#C4562E`. `success #5A7A4F` is new.
- **Dropped colors:** accentSoft, secondary, gold, **border** (no border token at
  all), gray, shadow, **all nutrition macro colors**, all overlay/scrim/textShadow,
  every niche + dark set. v2 hardcodes borders/scrims/macro colors at call sites.
- **Typography:** v2 has only `{display:'Lora', body:'system'}` — **entire type
  scale dropped** (6 roles + all sizes/weights/lh/tracking/tabular/uppercase);
  hardcoded per component. No Lora weight mapping.
- **Spacing:** v2 `space=[0,4,8,12,16,24,32,48]` (index array); adds 48 + 0.
- **Radii:** v2 `{card:16, sheet:24, pill:999}` — **card changed 20→16**; button(14)
  + mascot(24) dropped.
- **Motion: entirely absent** — no spring configs, no timings, no easings, no
  reduced-motion handling tokenized.

---

## 2. RecipeCard + Discover

### RecipeCard (v1 — `components/RecipeCard.jsx` + `home.styles.js`)

- **Grid:** col width `(screenW − 48)/2` (≈171pt @390); 2 cols, gutter 16. Card:
  `bg:surface radius:20 marginBottom:16 overflow:hidden`, shadow `{0/2,0.08,8,3}`.
  Image container `height = cardWidth*0.8` (**5:4**), placeholder `surfaceWarm`.
- **Image:** expo-image, `contentFit:cover`, **transition 300ms**.
- **Calorie badge** (top-right pill, abs `top8 right8`, row gap5, `bg:surface`
  radius:pill padH10 padV4): `calorieDot` 6×6 r3 `accent` + text caption@10 ink
  `{computed?'':'~'}{kcal} cal`. Data: own recipes use `recipe.nutrition`; seeds
  use `useNutrition()` **batched** context (one request for all on-screen cards,
  session cache keyed by id); falls back to `getNutritionEstimate(category)`.
  `~` = estimate/loading, no prefix = computed. Matches detail figure exactly.
- **Macro dots** (below image, content padH12 padV12 gap8): 3× 7×7 r3.5 in order
  protein→carbs→fat (`#3B82F6/#F0A020/#8B5CF6`). Decorative, no values.
- **Corner stamp — exactly ONE** (abs `bottom8 right8`): (1) **Paw** for seeds =
  PawMark 36×36 circle `bg:surface` shadow, 22×22 `paw-outline/paw-filled.png`;
  (2) **"By you"** (source=manual) pill `bg:accent`, text white caption@10;
  (3) **Imported** pill `bg:surface`, `link` icon 11 accent + sourceName accent.
- **Press:** whole card `Bounceable` → `withSpring(0.97, snappy)` in/out; reduced
  motion → `opacity 0.85` pressed. Tap → `/recipe/{id}`.
- **Save wiring:** PawMark → `useSaved()`. Anon user → toast + `/(auth)/sign-up`.
  Save → `Haptics.Success` + `ottoBus.emit("save")` + paw-pop
  `withSequence(spring 1.25, spring 1, pop)`; **first-ever save** → Excited-Otto
  toast (3500ms, `otto-excited-cut.png`). Unsave → `Haptics.Light` + Undo toast.
  Fail → `Haptics.Error`. (30-MIN chip deliberately omitted — no honest cookTime.)

**v2 delta:** card is not a shadowed surface (transparent, title *below* a rounded
image, `bg:creamDeep`); plain RN `<Image>` no fade; **calorie badge, macro dots,
By-you/imported stamps all ABSENT**; Bounceable→plain Pressable; PawMark = 🐾
emoji glyph, seed-id-gated, **no pop/haptics/ottoBus/first-save/anon-gate**;
title regular not w700.

### Discover (v1 — `app/(tabs)/index.jsx` + `home.styles.js`)

Outer ScrollView; grid = nested non-scroll FlatList numColumns2. Section order:
1. **Greeting** (row, padH16 padTop12 padBot8): display@26/32 by hour + **OttoIdle
   64×64** (`otto-happy-cut.png`, react `otto-excited-cut.png`, `reactTo:"save"`).
2. **Search + Filter** (row gap8 padH16 padBot16): filter btn 48×48 pill `bg:surface`
   border, `options-outline` 20 + `filterActiveDot` 8×8 accent when area set;
   search pill flex1 48h, `search-outline` 18, placeholder "What are we cooking
   today?", debounce 300ms, **clear ×** when text.
3. **Tonight band** (browse only): row `bg:surfaceWarm border accent radius:20`,
   thumb 44×44, "WHAT'S COOKING TONIGHT?" caption@10 accent + title + chevron →
   `/recipe/{id}`.
4. **Ask Otto card:** Bounceable, `bg:surface border radius:20`, Otto 48×48
   (`otto-happy-cut`), "Ask Otto" + subtitle, 34×34 accent go-button → `/create`.
5. **Otto's pick** (Bounceable): card radius:20 shadow `{0/4,0.12,12,6}`, image
   **height 240** `contentFit:cover transition 500`, `OVERLAY.scrim` overlay,
   badge `bg:surface` "Otto's pick" accent (top), title white display + textShadow
   + meta row (location/restaurant icons 14 white) at bottom. Pref-aware pick.
6. **Category tiles** (`CategoryFilter.jsx`): h-scroll gap12; tile 76×76 radius:20
   `bg:surfaceWarm` border2 transparent (selected → `accentSoft` fill + accent
   border); image 68×68 **`getFoodIcon()` painted webp** (`cat-*.webp`); label@12
   inkSoft (sel→accent); "Misc" remap; each Bounceable + `Haptics.selection` on tap.
7. **Grid** (padH16 mt8): header title + count.
**States:** cold-load **OttoLoading** (`otto-sleepy-cut` 180, rotating 6 tips
2600ms); **OttoError** (`otto-sad-cut` 180 + retry); empty-search `otto-thinking-cut`
120; empty-browse `otto-sad-cut` 120; **pull-to-refresh** RefreshControl(accent).

**v2 delta:** single FlatList + ListHeaderComponent (perf fix). Greeting display@28
**no Otto**; search pill has **no clear × and no filter button/FilterSheet**;
Otto's-pick is plain Pressable, image `16/9`, **text below image, no scrim/overlay/
icons/fade**; tiles **96×72 using TheMealDB photo thumbs not painted art**, ring
selection, **no haptic/Bounceable**; **Tonight band + Ask Otto ABSENT**; all
loading/error/empty **collapse to one caption line — every Otto state gone**;
**no pull-to-refresh**.

### FilterSheet (v1 — `components/FilterSheet.jsx`)

Modal slide-up: backdrop `scrim`; sheet `bg:surface radius(top):24 padH16 maxH80%`;
grab handle 40×4; "Filters" title; **Category** then **Cuisine** chip groups
(chip `bg:surfaceWarm radius:pill padH16 padV10`, selected `bg:accent` white,
single-select); cuisine **priority-ordered** (30 well-stocked first); footer
"Clear all" + **live-count** "Show N recipes" (client-side intersection,
debounced); open → `Haptics.Light`, select → `Haptics.selection`. (SORT omitted.)
**v2 delta: does not exist — no filter surface at all.**

### VideoEmbed

v1: platform-split; **native** `react-native-youtube-iframe` inline in-app;
**web** `<iframe autoplay inline>`. **v2 delta:** dep-free single file; web iframe
kept; **native REGRESSED to `Linking.openURL` — leaves the app**; adds a "See it
made" thumbnail + play button; responsive sizing.

---

## 3. NutritionCard + Recipe detail

### CalorieRing

**v1** (`components/nutrition/CalorieRing.jsx`): bordered View circle, no SVG.
Props `{kcal, label="per serving", size=66}` (card passes `label="est. kcal"`).
`size 66 · borderRadius 33 · borderWidth 4 · borderColor accent · bg surface`.
Number: ink, `fontSize size*0.26 (~17) · w800 · letterSpacing −0.5 · tabular`.
Label below: UPPER `8px · w700 · +0.5 · inkSoft`. **Count-up:** rAF over
`TIMING.sweep 500ms`, ease `1−(1−t)³`, preserves leading `~`; skipped under
reduced-motion / non-numeric (static). No null path (always gets a number).
**v2** (`CalorieRing.tsx`→`Ring.tsx`): `size 96 · r48 · border 8`; border
terracotta / `creamDeep` when null. Number `Lora 24 · w600`, `formatCount` →
int or **em-dash** when null. Label `role="caption"` "kcal", no `/max`.
**DELTA:** 66→96, border 4→8, number 17/w800/tabular→24/Lora/w600, label
"est. kcal"→"kcal"; **count-up + `~` prefix DELETED** (static); null→em-dash added.

### NutritionCard

**v1** (`components/nutrition/NutritionCard.jsx`): card `border1 · r20 · p16 ·
gap12 · bg surface · border`. `mult = scope==="recipe" ? servings : 1`. **Scope
TOGGLE** `per serving ◦ whole recipe` (◦ 11px sep), inactive `13/w600 inkSoft
op0.55`, active accent, `Haptics.selection` on change, **default `scope="recipe"`**.
Scope sentence `12 inkSoft mt−6`. Top row `gap14`: CalorieRing + `barArea flex1
gap10`. **Segmented macro bar:** one bar `h10 · r999 · bg surfaceWarm`, 3 segments
`flex:max(cals,1)` (calorie-proportioned), colors protein-blue/carbs-amber/fat-
purple. **3-col legend:** 7×7 r3.5 dot + grams `14/w700 tabular ink` + label
`11/w600 inkSoft` + `10 tabular inkSoft` "{pct}% of cals". **Footnote** (11/15
inkSoft) — 3 variants (no-computed / low-confidence / normal).
**v2** (`NutritionCard.tsx`): prop `{recipe}`, self-fetches `useNutrition`.
**No card chrome** — bare `View gap:space[3]=12`. Row `gap space[4]=16`:
CalorieRing + `flex1` row of 3 macro columns; each `role="computed"`
{g}g (terracotta, em-dash if null) + `role="caption"` label. Caption =
`isLoading?"Estimating…":estimateCaption(kind)`.
**DELTA:** **scope toggle DELETED** (per-serving only, no ×servings, no scope
sentence, no basis_grams); **segmented bar DELETED**; **%-of-cals column
DELETED**; **card chrome DELETED**; macro grams `14/w700 ink`→`16/w600
terracotta`; null "none" + loading states ADDED; fetch moved into the card;
3 footnote strings verbatim + 4th "none" added.

### Recipe detail — section order + tokens

**v1** (`app/recipe/[id].jsx`) top→bottom:
1. **Hero** photo-only `height winW*0.85`, cover, `surfaceWarm` bg.
2. **Hero action cluster** abs `top12 · L/R16`, space-between. Back left;
   right cluster gap8: share + (edit own / **PawMark** seed). Each `44×44 ·
   r-pill · surface · shadow{.15,6,y2,e3}`. Back `arrow-back 22`, share
   `share-outline 20`, edit `pencil 20`, paw size26. **Share tap; long-press
   → share painted ShareCard image** (`Haptics.Medium`).
3. **Title block** `px16 pt24`: eyebrow caption accent UPPER +1.2 `category ·
   area`; title `display Lora 30/34 ink`.
4. **Attribution (3 variants)** `row gap8 mt12`: imported → `link` chip
   (22×22 r11 accentSoft) + "From {name}" + `open-outline` (tap→Linking);
   manual → `person` + "By you — from your kitchen"; seed → `otto-badge.png`
   + "From Otto's kitchen".
5. **Meta row** `mt16 py12 borderT+B 1`: servings · ingredients · steps, each
   value `body w700 tabular` + label `13 inkSoft`, `1×18` dividers.
6. **Content** (`px16 mb24` each). Order **Nutrition → Ingredients → Video →
   Method → Related.**
   - Ingredients: **serves band** + **reset chip** "×{n} · Reset" (only when
     scaled) + steppers `32×32 r10 surfaceWarm` (`Haptics.selection`, clamp
     1–24). Rows: measure `body w700 accent tabular minWidth84` + trailing
     **weight** `w600 inkSoft` (weight-first) + name `body ink flex1`.
   - Method: `stepIndicator 32×32 r-pill accentSoft` + num; step `body 16/24`
     with **segmentStep** tint (duration→`◷` accent chip, temp→secondary) +
     **"uses:" line** (12 inkSoft, ≤3 matched scaled ingredients) + **per-step
     play** `28×28` → `/recipe/cook/{id}?step=&servings=`.
   - Related: caption "Other {category} dishes…" + up-to-4 RecipeCards.
7. **Pinned bar** abs `row gap12 · px16 py8 · borderT1 · paddingBottom
   max(insets.bottom,16)`: **planButton 54×54 r-button border1.5 accent**
   (calendar) + **cookButton** Bounceable flex1 `h54 r-button accent` (flame +
   "Start cooking" / "Add steps to cook this").

**v2** (`RecipeDetailScreen.tsx`) DELTA:
- Hero `height winW*0.85`→**fixed 280** (`creamDeep`); missing→160.
- **Hero cluster GUTTED** — only PawMark for seeds; **no back / share / edit /
  long-press-card / per-button shadow**.
- Attribution → **single plain `From {sourceName}`** (no icon/link/variants).
- Meta row loses border frame + dividers.
- Section order inserts **Share section before Related**.
- Ingredients: **Metric/US SegmentBar now inline** (`width160`); **reset chip
  + ×scale DELETED**; steppers `32×32 r10`→**44×44 r22 white, no haptic**;
  weight-first trailing-gram gone (`role="computed" minWidth88`).
- **Method GUTTED** — duration/temp tint, "uses:" line, per-step play all
  DELETED; indicator `32×32 accentSoft`→`28×28 r14 creamDeep`.
- Video: in-app both platforms → **native opens YouTube externally**.
- Related loses caption.
- **Bottom bar** → **single "Add to Otto's week" Button; no cook/plan/edit
  entry; NO safe-area inset**.

---

## 4. Tab bar + Navigation + App flow

### Bottom tab bar

**v1** (`app/(tabs)/_layout.jsx`) — `Discover · Cookbook · ＋ · Plan · Account`:

| Slot | Route | Label | Icon | Active/Inactive |
|---|---|---|---|---|
| 1 | index | Discover | Ionicons `restaurant(-outline)` | accent / inkSoft |
| 2 | cookbook | Cookbook | **paw PNG** `paw-filled/outline.png` tinted | accent / inkSoft |
| 3 | create | "" | **raised ＋** 58×58 r29 `accent` disc, 3px surface ring, `marginTop −26`, shadow, white `add 30` | — |
| 4 | plan | Plan | Ionicons `calendar(-outline)` | accent / inkSoft |
| 5 | profile | Account | Ionicons `person(-outline)` | accent / inkSoft |

Bar `height 50+max(inset,8) · paddingBottom max(inset,8) · pt4 · bg surface ·
borderTop1 border`. Labels `12/w600`. Haptics: `tabPress→selection` global +
`Light` on ＋. **Glyph PNGs (`tab-discover/plan/account.png`) exist but UNUSED**
(only the paw is custom; rest Ionicons).

**v2** (`app/(tabs)/_layout.tsx`) DELTA: **NO icons at all** (only `title`, no
`tabBarIcon`); **no raised ＋** (create is an ordinary tab); labels changed
**Plan→Week, Account→You, ＋→Create**; **create = recipe editor, not chat**;
tabBarStyle only `bg:cream` (no height/inset/border); **no haptics, no
screenListeners, no auth guard**.

### App shell

**v1** `_layout.jsx`: `GestureHandlerRootView → ThemeProvider → AuthProvider →
NutritionProvider → SavedProvider → ToastProvider → SafeScreen → Stack
(fullScreenGestureEnabled; cook+onboarding opt out)` + **AnimatedSplash overlay**
until `splashDone`; **fonts gate** (`useFonts` Lora, `return null` until loaded);
**share-intent** `useShareIntentSafe → /add?url`. Scheme `otto`.
**v2** `_layout.tsx`: `SafeAreaProvider → QueryClientProvider → AuthProvider →
Stack + ToastHost`. **Dropped:** GestureHandlerRootView, ThemeProvider,
Nutrition/SavedProvider, SafeScreen, AnimatedSplash+gate, **font loading (no
Lora)**, share-intent, `fullScreenGestureEnabled`. **Changed:** `add` push→modal.

### Screen headers

**v1** `ScreenHeader.jsx`: shared pushed-screen header — 44×44 r-pill
`surfaceWarm` back/close (Ionicons 22) + centered `title` + right slot/spacer.
`SafeScreen.jsx`: `paddingTop insets.top · bg background` wrapping the app.
**v2:** ScreenHeader → feature-private `profile/components/Frame` (`Screen`) —
**"‹ Back" text**, no circle/icon/right slot, used only by 5 settings screens.
SafeScreen → **no equivalent** (only root `SafeAreaProvider`; per-screen padding;
the app-wide top-inset is gone).

### App flow — v2 broken/missing (vs the fully-wired v1 graph)

- **Cook unreachable** — `recipe/cook/[id]`+CookScreen exist; RecipeDetailScreen
  has **no button** to it (nor to `/recipe/edit`).
- **Onboarding absent** — no route, no source, no first-run gate.
- **Guest/anonymous entry absent from routing** — `is_anonymous` known in the
  data layer; no redirect/claim flow, no `(auth)` guard.
- **Auth gating absent at tabs** — unauthed users are NOT redirected to sign-in
  (v1 did); `(auth)/_layout` no longer redirects signed-in users away.
- **Create tab repurposed** — recipe editor, not "Chat with Otto"; `/chats` +
  `?chat` gone; **Discover→Create edge gone** (no AskOtto).
- **Deep links dropped:** `?segment ?cooked ?chat ?url(share-intent) ?build`.
- **`add` push→modal.**

---

## 5. Mascot + Animation + Interaction catalog

### Mascot system

Expression→asset (`assets/mascot/*.png`; `-cut` = matted, used in OttoIdle):
happy `otto-happy-cut` (home hero, journal, household, plan, create, add, cook
prep, AskOtto), excited `otto-excited-cut` (**reaction only** — home react,
first-save toast), proud `otto-proud-cut` (cook finish), sad `otto-sad-cut`
(OttoError, empties), sleepy `otto-sleepy-cut` (OttoLoading), thinking
`otto-thinking-cut`, floating `otto-floating-cut` (club/profile), hero
`otto-hero(-alt).png` (auth), badge `otto-badge.png` (detail/profile), scenes
`otto-scene-cooking/empty/floating/loading.png`, splash `otto-splash.webp`,
onboarding `onboarding-1-collect/-2-cook/-3-plan.png`, actions `ACTION_ART`.

**OttoIdle** (`OttoIdle.jsx`): **breathe** `withRepeat(withSequence(2100↑,2100↓),
-1, Easing.inOut(sin))` → scale ±1.5%, translateY −2, rotate ±1.2° (if sway),
~4.2s/breath. **Entrance** `withDelay(80, withSpring(pop))`. **Hop-on-"save"**
(ottoBus): swap to reactionSource, `hop withSequence(timing(-8,140,out(quad)),
spring(pop))`, restore @**1400ms**, one-at-a-time guard. Reduced-motion → static.
**OttoLoading**: sleepy Otto (breathing) + "Warming up the kitchen…" + rotating
tip (**6 tips, 2600ms**). **OttoError**: static `otto-sad-cut` + "We dropped the
pan." + optional "Try again".

### Animation catalog

| Site | Trigger | Config | Reduced-motion |
|---|---|---|---|
| OttoIdle breathe | loop | `2100↑/2100↓ inOut(sin)`, ±1.5%/−2px/±1.2° | static |
| OttoIdle entrance | mount | `delay80 spring(pop)` | starts at 1 |
| OttoIdle hop | ottoBus save | `timing(-8,140,out(quad))→spring(pop)`, restore 1400ms | skipped |
| Bounceable press | pressIn/out | `spring(0.97, snappy)` ↔ `spring(1, snappy)` | opacity 0.85 |
| PawMark pop | save | `seq(spring(1.25,pop),spring(1,pop))` | skipped (haptic stays) |
| CalorieRing sweep | mount | rAF 500ms ease-out cubic | static |
| Cook step-advance | step change | `Animated.timing 220ms out(quad)` opacity+ty | not gated (runs) |
| Splash entrance | mount | fade `timing450` + rise `spring(fric7,tens60)` 0.94→1 | instant |
| Splash exit | 3000ms/tap | `timing350` fade-out | still fades |
| Toast | show/hide | `timing200 (fade) out(quad)` native driver | fine |
| Onboarding paging | CTA | `scrollTo animated:!reduce` | instant jump |

Steppers + FilterSheet: **haptic only, no animation**. `SPRING.sheet` token
defined but no live animated sheet site.

### Interaction / haptic catalog

`expo-haptics`, ~60 sites, all `.catch(()=>{})`. Key ones: PawMark save
**notification Success** / fail **Error** / unsave **Light** / Undo **selection**;
cook step nav **Medium**, timer done **Success + Vibration
[0,500,350,…]** (~4s, 5 pulses); tab `tabPress` **selection** + ＋ **Light**;
servings tick / category select / filter chip / share **selection**; import
actions **Light**; auth success **Success**; edit validation fail **Warning**.
Gestures: cook step **Pan** (`activeOffsetX[-24,24]`, ±60px threshold,
gesture-handler); detail **long-press** → share card (**Medium**); splash
**tap-skip**; progress-daub tap-to-jump; duration-token tap → timer.

### PawMark full spec (`PawMark.jsx`)

Art `paw-outline/filled.png`, 36×36 circle `surface` + shadow, hitSlop10,
`selected=saved`. Spring pop on save (skipped RM). **Anon → account wall**:
`is_anonymous` → toast "Want Otto to remember this kitchen? Pull up a stool." +
`/(auth)/sign-up`, no save. Offline `toggleSave→null` → **Error** haptic + "We
dropped the pan…" toast (state rolled back). Save success → **Success** haptic →
`ottoBus.emit("save")` (every OttoIdle hops) → pop → **first-ever save**
(`otto.firstSaveCelebrated.v1`) → Excited-Otto toast "First one saved…" 3500ms.
Unsave → **Light** + **Undo toast** (5000ms) → re-toggle + selection.

**v2 DELTA:** Otto art = **dashed placeholder box** (`OttoArt.tsx`); **OttoIdle,
ottoBus, Bounceable, AnimatedSplash, OttoLoading/Error, LoadingSpinner all
DO NOT EXIST**; **PawMark = 🐾 emoji** in a Pressable (no pop/haptics/ottoBus/
first-save/anon-wall/undo — only optimistic toggle + offline rollback survive in
`useSaved`); **zero `expo-haptics`** in `src/` (~60 sites gone); **no Vibration**;
cook swipe = **PanResponder** (no reanimated); step-advance/CalorieRing sweep/
Toast fade = **none**; reduced-motion handling moot (nothing to gate).

---

## 6. Asset catalog + remaining screens

### Asset catalog (real dimensions via `sips`; "used at" from `require()` grep)

**v2 has NO assets** — the v2 `mobile/assets/` holds only `.DS_Store`; `OttoArt`
renders a dashed cream box `otto:<name>`, `PawMark` a 🐾 emoji. Everything below
must be copied into a v2 `assets/` and wired.

| Path (`mobile/assets/`) | Depicts | Fmt | px | Used |
|---|---|---|--:|---|
| mascot/otto-happy-cut.png | idle smile (everywhere) | PNG | 784×816 | home hero, create, add, plan, household, journal, AskOtto, cook prep |
| mascot/otto-thinking-cut.png | pondering | PNG | 784×816 | cookbook/shopping/add loading, empties |
| mascot/otto-sad-cut.png | downcast — error/empty | PNG | 784×728 | OttoError, NoFavorites, cook error |
| mascot/otto-excited-cut.png | cheering — **save reaction** | PNG | 784×816 | home react, first-save toast, ShareCoach |
| mascot/otto-proud-cut.png | proud — cook finish | PNG | 784×728 | cook finish |
| mascot/otto-sleepy-cut.png | dozing — empties/loading | PNG | 784×728 | OttoLoading, cookbook/chats empty |
| mascot/otto-floating-cut.png | floating — paywall/profile | PNG | 900×582 | otto-club, profile |
| mascot/otto-hero.png (+ -alt) | large hero | PNG | 1856×2304 | auth screens (alt unused) |
| mascot/otto-badge.png | seal/credit | PNG | 512×512 | recipe detail, profile |
| mascot/paw-filled.png / paw-outline.png | paw glyphs (saved/unsaved) | PNG | 256×256 | tab bar (Cookbook), PawMark, ShareCard |
| mascot/otto-scene-{cooking,empty,floating,loading}.png | full scenes | PNG | ~1184×~750 | **unused** (available art) |
| mascot/otto-{expressions,scenes,turnaround}.png | **sprite sheets** (master) | PNG | ~2400–2752 | **unused** (source art) |
| mascot/otto-appicon-a/b.png | app-icon masters | PNG | 2048×2048 | **unused** |
| food/cat-*.webp (14) | painted category tiles | webp | 512×512 | `foodIcons.js` — all used |
| actions/otto-*.png (10: chop/mix/saute/simmer/bake/wait/season/pour/serve/cook) | cook-verb art | PNG | 512×512 | `stepAction.js` — all used |
| glyphs/tab-{discover,plan,account}.png | tab glyphs | PNG | 256×256 | **unused** (tabs use Ionicons) |
| onboarding/onboarding-{1-collect,2-cook,3-plan}.png | onboarding panels | PNG | 848×1264 | onboarding.jsx |
| splash/otto-splash.webp | matted lid-lift splash | webp | 720×1075 | AnimatedSplash |
| paper/pad-{top,mid,bot}.png | stationery pad slices | PNG | 720×~ | **unused** (shopping pad drawn w/ Views) |
| brands/google-g.png | Google mark | PNG | 288×288 | SocialAuthButtons |
| images/{icon,adaptive-icon,splash-icon}.png / favicon.png | app config icons | PNG | 1024²/64² | app.json |
| sounds/timer-alarm.wav | cook timer alarm | WAV mono 44.1k ~2s | — | cook `useAudioPlayer` |

Flags: `-cut` = matted cutout used in-app; non-cut twins are **unused** source
art. Actively-wired set to port first: the ~11 `-cut` mascots + `paw-*` +
`otto-badge`/`hero`/`floating-cut` + 14 `food/cat-*` + 10 `actions/` + splash +
3 onboarding + `google-g` + `timer-alarm.wav`.

### Remaining screen specs (v1 → v2 delta)

**Create — "Chat with Otto"** (`(tabs)/create.jsx`, 309 lines): ScreenHeader
(clock→/chats, download→/add), thread of you/Otto bubbles, clarify **chips**,
inline recipe cards ("Save to cookbook" + "Ask for a change"), thinking row,
multiline input (mic "coming soon" ↔ send). `UserRecipeAPI.chat()` modes
recipe/clarify, persists to `chatHistory`, `?chat=` reopen. **v2: dropped
entirely** — create tab re-exports `EditRecipeScreen`; no chat, no `/chats`.

**Add sheet** (`add.jsx`, 449 lines): ScreenHeader close; phases pick/parsing/
failed. **4-tile grid** (link/text/photo/write) + TikTok-IG ShareCoach row +
"Chat with Otto" card; clipboard link sniff; failed → sad-Otto + 3 recovery
CTAs. **v2** (`AddSheet.tsx`, 97): **2 modes only** (link + write), modal,
no grid/text/photo/clipboard/coach.

**Chats** (`chats.jsx`, 152): recent-chats list, sleepy-Otto empty, date groups
→ `/create?chat=`. **v2: does not exist.**

**Shopping** (`shopping.jsx`, 458): **printed stationery pad** chrome (Views),
people/share header actions, stale banner, removable source chips, aisle rules,
row check-off, custom extras, off-screen share card + snapshot link. **v2**
(`ShoppingScreen.tsx`, 208): aisle/check/custom/provenance kept; **dropped** pad
chrome, source chips, stale banner, all sharing, household entry, persistence.

**Plan** (`plan.jsx`, 402): day cards + per-day `+`, recipe-picker Modal
(own+saved), **swap** (shuffle via `pickPreferredMeal`), **leftovers** section,
thumbnails, flame cooked. **v2** (`PlanScreen.tsx`, 161): day cards/cooked/
remove/build-list kept; **dropped** picker Modal, swap, leftovers, thumbnails.

**Household** (`household.jsx`, 532): setup (name, seed-from-shopping, rejoin
history, join-by-link) + active (member avatars, "N to pick up", synced rows w/
attribution, put-away/leave). `CollabAPI` + unguessable token + 8s poll +
AsyncStorage. **v2** (`HouseholdScreen.tsx`, 145): local two-state shell only —
**all networking/tokens/polling/avatars/attribution/persistence dropped.**

**Journal** (`journal.jsx`, 108): 2-col plate-photo grid from `otto.journal.*`,
newest-first, tap→recipe. **v2** (`JournalScreen.tsx`, 27): **empty state only**
(happy-Otto + "No plates yet"), no grid, no store.

**Otto Club** (`otto-club.jsx`, 235): floating-Otto hero, 4 icon-chip benefits,
**3-node trial timeline** (unlock/reminder/charge, rail fades after charge),
price block (annual preselect, SAVE% badge, both-direction math), CTA + waitlist
+ "Notify me" + inline cancel card. Constants `YEAR 29.99 / MONTH 4.99 /
TRIAL 5`. **v2** (`OttoClubScreen.tsx`, 160): **identical pricing/honesty/math/
cancel card**; simplified — `✓` benefits (no chips), **2-card timeline** (no
reminder node), no hero art, no "Notify me" link.

---

*End of spec. Companion: `docs/V2_PARITY_GAPS.md` (feature-level what's-missing).
This doc = how each piece looks/moves/behaves, for faithful rebuild.*
