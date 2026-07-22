# Contract — Shared UI + Design System (`src/shared/ui/` + `src/shared/theme/` + `shared/{motion,haptics,assets,bus}.ts`)

Status: **parity draft** · Owner: ui-systems + ui-motion. The law for the whole
feel layer. Values are exact from `V1_DESIGN_SPEC.md`. Founder signs at P0.

Semantic-ink rule (unchanged, load-bearing): **terracotta = computed/interactive,
ink = authored.** Components enforce it via role/variant — callers never pass hex.

---

## 1. Theme tokens (`shared/theme/tokens.ts`) — reconciled to v1

Light-only, plain module (not a context). The full set — v2 currently ships a
minimal subset; parity fills it in.

```ts
export const colors = {
  // accent / brand
  terracotta: '#C4562E',   // = v1 accent — computed + interactive ONLY
  accentSoft: '#F3D9CD',   // chip fills, selected tiles          (v2 MISSING → add)
  secondary:  '#8A5A3B',   // chestnut — step temps, minor marks  (v2 MISSING → add)
  gold:       '#E8B04B',   // ratings / streaks / celebration     (v2 MISSING → add)
  // ink (authored text)
  ink:        '#2A211B',   // ⚑ v2 drifted to #2A2320 — reconcile to v1
  inkSoft:    '#6E6055',   // ⚑ v2 drifted to #6B5F58 — reconcile
  // surfaces
  cream:      '#FAF4EA',   // ⚑ v2 drifted to #FAF5EC — reconcile (app bg)
  creamDeep:  '#F3E9DA',   // ⚑ v2 drifted to #F2E9DA — reconcile (raised/inset)
  white:      '#FFFFFF',
  border:     '#E8DECF',   // hairline — v2 has NO border token → add
  gray:       '#B9A895',   // disabled / muted                    (v2 MISSING → add)
  danger:     '#D64545',   // ⚑ v2 drifted to #B3402A — reconcile (destructive)
  success:    '#5A7A4F',   // v2-added; keep
}
// FIXED nutrition macro colors — never re-skinned (v2 MISSING → add)
export const macro = { protein: '#3B82F6', carbs: '#F0A020', fat: '#8B5CF6' }
// warm-ink overlays, never black (v2 MISSING → add)
export const overlay = {
  scrim: 'rgba(42,33,27,0.35)', scrimStrong: 'rgba(42,33,27,0.65)',
  textShadow: 'rgba(42,33,27,0.45)',
}

export const fonts = { display: 'Lora', body: 'system' }
// FULL type scale — v2 has only {display,body}; the rest is hardcoded per file → add
export const type = {
  display: { fontFamily: 'Lora_700Bold',     fontSize: 30, lineHeight: 34 },
  title:   { fontFamily: 'Lora_600SemiBold', fontSize: 22, lineHeight: 26 },
  body:    { fontSize: 15, lineHeight: 22 },
  label:   { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5,
             textTransform: 'uppercase', fontVariant: ['tabular-nums'] },
  step:    { fontSize: 24, lineHeight: 32 },
}
export const space = [0, 4, 8, 12, 16, 24, 32, 48] // index-addressed (v1 xs..xxl + 48)
export const radii = { card: 20, sheet: 24, button: 14, pill: 999, mascot: 24 }
//                          ⚑ v2 drifted card 20→16; button+mascot MISSING → add
export const shadow = {
  card:     { shadowColor: '#2A211B', shadowOffset: {width:0,height:2}, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 3 },
  featured: { shadowColor: '#2A211B', shadowOffset: {width:0,height:4}, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
}
```

⚑ = **drift flags**: five values (ink, inkSoft, cream, creamDeep, danger) and
`radii.card` drifted from v1 in the rebuild. **Default = reconcile to v1**
(this is a parity effort). Founder may veto any single one at P0 sign-off to
keep a deliberate v2 refinement; whatever is decided, `tokens.ts` is the ONE
source and no file hardcodes these.

---

## 2. Motion (`shared/theme/tokens.ts` constants + `shared/motion.ts` hooks)

```ts
// tokens.ts
export const spring = {
  gentle: { damping: 18, stiffness: 120, mass: 1   },
  snappy: { damping: 15, stiffness: 220, mass: 0.8 }, // press feedback → scale 0.97
  pop:    { damping: 12, stiffness: 320, mass: 0.7 }, // paw / OttoIdle signature
  sheet:  { damping: 22, stiffness: 260, mass: 1   },
}
export const timing = { sweep: 500, fade: 200 } // ring count-up (ease-out cubic), image/toast fade
```

`shared/motion.ts` exports reanimated hooks — the ONLY place a spring/timing
config is consumed; components never inline one:

```ts
usePressSpring(): { style, onPressIn, onPressOut }        // Bounceable core (spring.snappy → 0.97)
useBreathe(opts?): style                                  // OttoIdle loop (2100ms in/out sin, ±1.5%/−2px)
useCountUp(target: number|null, ms=timing.sweep): number  // Ring 0→value, ease-out cubic
```

**Reduced-motion is mandatory:** every hook checks `useReducedMotion()` and
degrades (press → opacity 0.85; breathe/countUp → static). A component that
animates without going through these hooks is a review failure.

---

## 3. Haptics (`shared/haptics.ts`)

One typed wrapper over `expo-haptics`; every call is fire-and-forget
(`.catch(()=>{})`), no-op on web. Sites are specified in `V1_DESIGN_SPEC.md §5`.

```ts
export const haptics = {
  select(): void            // selection tick — tabs, chips, steppers, toggles
  impact(w?: 'light'|'medium'): void
  notify(t: 'success'|'warning'|'error'): void
}
```

Raw `Haptics.*` calls in features are a review failure — go through `haptics`.

---

## 4. Assets (`shared/assets.ts` + `assets/`)

One typed registry maps every named asset to its `require()` — no scattered
`require` in components. Painted art lives in `assets/{mascot,food,actions,
onboarding,splash,brands,sounds}` (catalog + real dimensions in
`V1_DESIGN_SPEC.md §6`). Port the **wired** subset (~50), not the dead
sprite-sheets/dupes.

```ts
export type OttoName = 'happy'|'thinking'|'sad'|'excited'|'proud'|'sleepy'|'floating'|'hero'|'badge'
export type SceneName = 'cooking'|'empty'|'floating'|'loading'
export type ActionName = 'chop'|'mix'|'saute'|'simmer'|'bake'|'wait'|'season'|'pour'|'serve'|'cook'
export const ottoArt:   Record<OttoName, ImageSource>    // '-cut' matted variants
export const sceneArt:  Record<SceneName, ImageSource>
export const actionArt: Record<ActionName, ImageSource>
export const foodIcon:  (category: string) => ImageSource // 14 cat-*.webp, misc fallback
export const onboardingArt: Record<'collect'|'cook'|'plan', ImageSource> // 3 panels
export const splashArt: ImageSource                       // otto-splash.webp (animated via reanimated, NOT a video)
export const brandMark: Record<'google', ImageSource>     // Apple + Facebook are glyphs, not assets
export const paw = { filled, outline }
export const alarmSound: AudioSource                       // timer-alarm.wav
```

EVERY named asset the app renders has a registry entry here — including
onboarding, splash, and the Google mark. A raw `require()` at a call site is a
review failure (§7.2), so nothing is left out of the registry.

Fonts: load Lora (400/400i/600/700) at the app shell via `@expo-google-fonts/
lora` + `expo-font`; render gates on `fontsLoaded` (v1 pattern) — the serif
must actually load, not fall back to system.

---

## 5. Mascot (`shared/bus.ts` + the Otto primitives)

**OttoBus** (`shared/bus.ts`) — a tiny typed emitter. Event vocab: `'save'`
(more added by contract only). PawMark emits `'save'`; OttoIdle instances with
`reactTo="save"` hop.

**Expression → asset** and **animation configs** are exact in
`V1_DESIGN_SPEC.md §5` (breathe 2100ms sin, entrance `delay80 spring.pop`, hop
`timing(-8,140,out(quad))→spring.pop` restore 1400ms, tips 2600ms×6). Build to
those numbers.

---

## 6. Primitives (props — additive to the frozen 8)

```ts
// existing (upgraded)
Text     { children, role: 'display'|'title'|'body'|'label'|'caption'|'computed'|'step' } // full scale
Ring     { value: number|null, max?, label }   // count-up on mount; null → em-dash, never 0
PawMark  { saved: boolean, onToggle: () => void, size? }
             // PRESENTATIONAL ONLY — real paw art + pop (usePressSpring/pop) + a
             // save haptic on toggle. It does NOT own the save flow: shared/ui
             // must never import a feature. The FLOW (anon→sign-up wall, first-
             // save celebration, undo toast, offline rollback, bus.emit('save'))
             // lives in `features/cookbook/useSaveToggle(recipe)` — a hook that
             // legally imports shared (bus/haptics/storage/auth) and returns
             // { saved, toggle }; callers pass those to PawMark. This keeps the
             // dependency arrow features → shared, never the reverse.
OttoArt  { name: OttoName|SceneName, size? }   // real art via assets.ts
Toast    // useToast().show(message, kind, { ottoImage?, actionLabel?, onAction? }) — fade + Otto card
Sheet    { visible, onClose, title?, children } // spring.sheet present + gesture-to-dismiss
Button, SegmentBar, Input // unchanged

// new
Bounceable { children, onPress, onLongPress?, disabled? }   // usePressSpring; the ONLY press-feedback wrapper
OttoIdle   { name, reactTo?, sway?, size? }                 // breathing + hop reaction (own file)
OttoLoading{ message?, tips? }   OttoError { message?, onRetry? }   // OttoStates.tsx
Screen     { title?, onBack?, right?, children }            // 44×44 back/close header + safe-area
ErrorBoundary { children }                                  // top-level → recoverable OttoError
```

---

## 7. Rules

1. **Accessibility floor:** role + label on every interactive; hit target ≥44pt;
   reduced-motion honored via `shared/motion.ts`.
2. **One home:** motion configs → `motion.ts`; haptics → `haptics.ts`; asset
   requires → `assets.ts`; app events → `bus.ts`; tokens → `tokens.ts`. A raw
   spring/`Haptics.*`/`require()`/hex in a feature is a review failure.
3. **Web + native parity** — L3 on web, device screenshot for the feel layer;
   no caller-visible platform forks.
4. **Honesty law** — `Ring` and every nutrition primitive: null in → visible
   "no data", never a fabricated 0.
5. New variant/prop = `contract_gap` → amend here → owner implements → consumers
   re-issue. Never grown ad hoc.
