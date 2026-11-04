# Otto: motion research (Apple primary sources → Otto, Expo/RN)

Compiled 2026-11-03. Baseline: Liquid Glass (iOS 26), current HIG (iOS/iPadOS 27 cycle, HIG updated through Oct 28 2026), WWDC18–WWDC26.
Otto stack checked in `node_modules`: Expo 54, react-native 0.81.5, react-native-reanimated **4.1.7**, expo-haptics 15, expo-router 6 (ships `NativeTabs` with `minimizeBehavior`), react-native-screens 4.16 (`formSheet` with detents), gesture-handler 2.28. **Not installed** (but available for SDK 54): `expo-glass-effect` (GlassView/GlassContainer, `isInteractive`, `regular|clear`), `expo-symbols` (SDK 54 effects: `bounce | pulse | scale` + variable color only).

Legend. **Otto status**: HAVE = shipped; PARTIAL = some of it; ADD = could add; SYSTEM = free if Otto uses the native component; N/A = not right for Otto. "RM" = Reduce Motion. Quotes are ≤15 words with source tag in brackets (tags resolve in §5). Anything not read from an Apple page, transcript, or installed source is marked *(unverified)*.

---

## 0. Otto's current motion inventory (what exists today)

**The system.** `src/shared/theme/tokens.ts` holds 5 springs (`gentle`, `snappy`, `pop`, `sheet`, `press`, all mass/stiffness/damping) and 6 durations (`sweep 500`, `fade 200`, `enter 260`, `exit 180`, `emphasis 420`, `celebrate 900`). `src/shared/motion.ts` is the only consumer and holds the curves (`enter` = out-cubic, `exit` = in-cubic, `emphasis` = inOut-cubic). It exposes 6 hooks, all RM-aware: `usePressSpring` (scale 0.97, RM → opacity dip), `usePressPop` (one-shot 0.88 dip on press-in for the raised ＋), `useBreathe` (OttoIdle ±1.5% scale, −2px, optional ±1.2° sway, 4.2 s loop), `usePop` (PawMark 1→1.25→1), `useEntranceHop` (mascot mount pop + hop), and `useCountUp` (rAF ease-out-cubic number, used by Ring). `src/shared/haptics.ts` wraps `select`, `impact('light'|'medium')`, `notify(success|warning|error)`, plus `alarm` (an RN `Vibration` pattern for the cook timer). `src/shared/sound.ts` has 5 events (`save`, `send`, `stepDone`, `allDone`, `gentleError`) with 3 off-ramps: silent switch, Sounds toggle, and RM muting celebrations. `docs/reference/contracts/motion.md` covers the haptic map, sound map, moment registry (cook complete > list done > first save / week planned) and a guard test against raw `Haptics.*` and inline configs.

**Where motion shows up** (grep of `src/`):
- **Press feedback:** Bounceable, PawMark, TabBarCreateButton.
- **Mascot:** OttoIdle (breathe, entrance hop).
- **Gestures:** HoldToRemoveRow (Gesture.Pan + withSpring/withTiming: hold to arm, then remove).
- **Cook:** StepCard (step enter = timing `enter`, opacity + 12px translateX, no gesture velocity).
- **Recipe detail:** ParallaxHero (core RN `Animated` interpolate: 0.5× parallax plus overscroll scale, clamped, static under RM).
- **Toast:** the only Reanimated layout animation (`FadeIn/FadeOut`).
- **Ring:** count-up.
- **Haptics:** about 70 call sites, mostly `select` on chips, tabs and check-offs. `impact('light')` on commits, `notify('success')` on flow completions (cook done, list done, week built, first save).
- **Sound:** cook, shopping, plan, chat, toast, saved.

**Navigation.**
- Root `Stack` uses `animation: 'slide_from_right'`. It is a native stack, so iOS uses UIKit's push, which is interruptible on iOS 26.
- Back is the left-edge swipe only. Cook has no swipe-back because its pager owns horizontal pans.
- Tabs use the JS `Tabs` from expo-router with a custom cream background and a top border, so the tab bar does **not** get Liquid Glass or minimize-on-scroll.
- `tabPress` fires `haptics.select()`.

**Not present:** skeleton or shimmer loading (only `ActivityIndicator`), SF Symbol animation, Liquid Glass, zoom transitions, Live Activities, widgets, layout or list animations (insert, remove, reorder), numeric text rolls (Ring uses a count-up), and gesture velocity hand-off into springs (except HoldToRemoveRow).

**Spring audit: Otto tokens expressed in Apple's terms.** Conversion uses ζ = c / (2√(km)), Apple duration = 2π/√(k/m), bounce = 1 − ζ:

| Otto token | m / k / c | ζ | Apple-equivalent duration | Apple-equivalent bounce | Overshoot of travel | ~settle (0.1%) |
|---|---|---|---|---|---|---|
| `gentle` | 1 / 120 / 18 | 0.82 | 0.57 s | 0.18 | 1% | 0.77 s |
| `snappy` | 0.8 / 220 / 15 | 0.57 | 0.38 s | **0.43** | 12% | 0.74 s |
| `pop` | 0.7 / 320 / 12 | 0.40 | 0.29 s | **0.60** | 25% | 0.81 s |
| `sheet` | 1 / 260 / 22 | 0.68 | 0.39 s | 0.32 | 5% | 0.63 s |
| `press` | 0.25 / 1000 / 15 | 0.47 | 0.10 s | **0.53** | 18% of travel (≈2% in scale units on a 0.12 dip) | 0.23 s |

Apple's guidance: "be cautious about using values higher than around 0.4" [WWDC23-10158]. When unsure, use bounce 0. Otto's `snappy` (named like Apple's 0.15 preset) is closer to Apple's *bouncy* or beyond, and `pop` is well past the caution line. That is defensible for the mascot as a brand flourish, but not for UI chrome. See §4.

---

## 1. Apple's motion principles (paraphrased; short quotes ≤15 words)

1. **Purposeful, never decorative.** Add motion to support the experience, not for its own sake. Gratuitous animation distracts and can make people physically uncomfortable. "Don't add motion for the sake of adding motion." [HIG-Motion] WWDC26 restates it: delight "isn't by adding confetti or tacking on extra flourishes" [WWDC26-250]. The current HIG Design Principles add: "Don't mistake delight for decoration." [HIG-Principles]
2. **Motion is optional, never the only channel.** Back visual feedback with haptics and audio so that people who can't or won't see motion still get the message [HIG-Motion]. Combine color, text, sound and haptics for feedback [HIG-Feedback].
3. **Realistic and consistent with the gesture.** Feedback motion should follow the gesture and people's expectations. Something revealed by sliding down shouldn't dismiss sideways [HIG-Motion]. Keep a consistent offscreen path, so an element leaves the way it came: "spatial consistency" [WWDC18-803].
4. **Brief and precise.** Brief, tightly tied feedback "tends to feel lightweight and unobtrusive" [HIG-Motion].
5. **Don't animate frequent interactions.** System controls already animate subtly. Avoid making people watch custom motion on every repeat [HIG-Motion].
6. **Interruptible; never make people wait.** "Don't make people wait for an animation to complete" [HIG-Motion]. Interfaces should allow "constant redirection and interruption" [WWDC18-803]. iOS 18 made the zoom transition always interactive, and iOS 26 made the standard push interruptible too: you can swipe back or scroll while it is still settling [WWDC25-284]. Engineering rule: "Be ready for a new transition to start at any time." [WWDC24-10145]
7. **Respond instantly.** "Everything needs to respond instantly." [WWDC18-803] Highlight on touch-down and confirm on touch-up. Allow cancelling by dragging off [WWDC18-803]. WWDC26 lists "responsive animations that feel fluid and provide immediate, natural feedback" as an ingredient of craft [WWDC26-250].
8. **Continuity of position *and velocity* → springs.** Animations need continuous position and velocity. Only springs keep that when starting from a gesture's velocity or when retargeted mid-flight [WWDC23-10158]. Linear is for things like spinners, not movement [WWDC23-10158].
9. **Springs need not bounce.** Start at 100% damping (bounce 0). Add bounce only when the gesture driving the motion had momentum, or as a functional hint [WWDC18-803; WWDC23-10158]. Example: Now Playing is presented with no overshoot when tapped, but a swipe-to-dismiss gets 80% damping [WWDC18-803].
10. **Project momentum.** When a drag ends, pick the destination from the gesture's velocity and the scroll deceleration rate (PiP corners). Don't use the last position [WWDC18-803].
11. **One-to-one tracking, soft boundaries.** Content stays attached to the finger. Edges rubber-band instead of hitting a wall. Hand-offs between behaviours are smooth [WWDC18-803].
12. **Hint in the direction of the gesture.** Elements grow toward their final state as you press (Control Center modules). Hinting teaches the gesture [WWDC18-803].
13. **Behaviour over canned animation; a family of behaviours.** Think of motion as a conversation with the object. Keep the same feel across scrolling, tapping to the top, and so on, so learning one teaches the others [WWDC18-803].
14. **Harmony of motion, sound and haptics.** "Things should feel the way they look, the way they sound." [WWDC19-810] Match haptic intensity and sharpness to the animation [HIG-Haptics]. The three principles are causality, harmony and utility [WWDC19-810; WWDC21-10278].
15. **Consistency of character.** Choose spring character to match the app's personality (serious or playful, relaxed or fast-paced) and keep it consistent [WWDC23-10158]. Pick the emotion first, then design for it [HIG-Principles; WWDC26-250].
16. **Continuity from source.** Presentations should spring from the control that caused them: sheets, menus, alerts and popovers morph out of the tapped glass button [WWDC25-356; WWDC25-323]. Use zoom transitions from large cells to keep the same UI on screen across the change [WWDC24-10145].
17. **Respect Reduce Motion.** Reduce automatic and repetitive animation (zooming, scaling, peripheral motion). Specifically [HIG-Accessibility]:
    - tighten springs
    - track gestures directly
    - avoid z-axis depth animation
    - replace x/y/z transitions with fades
    - avoid animating into or out of blurs
18. **Liquid Glass motion is part of the material.** "Both the visuals AND motion of Liquid Glass were designed as one." [WWDC25-219] Glass materializes rather than fading, flexes and lights up on touch, and morphs between contexts. It responds with more emphasis to direct touch than to a trackpad [HIG-Motion].
19. **Animate updates on glanceable surfaces, briefly.** Live Activities and widgets animate updates for **up to 2 seconds** [HIG-LiveActivities; HIG-Widgets].
20. **Haptics: system meanings, consistent, sparing, short, optional.** Use system patterns for their documented meaning. Keep a cause-effect link. Avoid overuse: the best haptic is "one that people may not be conscious of" [HIG-Haptics].

---

## 2. The complete catalog

Columns: **Name · What · Apple guidance · Specs · iOS API · RM alternative · Haptic pairing · Otto · RN implementation · Otto idea**.
Abbreviations in the RN column: R = react-native-reanimated 4.1, GH = gesture-handler, EH = expo-haptics, `haptics.*` = Otto's wrapper.

### A. Springs and timing curves (13)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Smooth spring | Critically damped, long gentle tail | Default choice when unsure; most versatile [10158] | duration 0.5 s, bounce 0 [docs: `.smooth`, defaults 0.5] | `Animation.smooth`, `.smooth(duration:extraBounce:)`, `Spring.smooth` | Same spring (no overshoot already) or a fade | none | ADD (no bounce-0 token) | `withSpring(v,{mass:1,stiffness:157.9,damping:25.13})` | Default for layout moves, sheet content, card expand |
| A2 | Snappy spring | Small bounce, brisk tail | Small bounce (~15%) "doesn't feel very bouncy yet" but is brisker [10158] | 0.5 s; bounce small (≈0.15 *(exact constant unverified)*) | `.snappy`, `.snappy(duration:extraBounce:)` | Tighten to bounce 0 | none / select | PARTIAL (Otto `snappy` is actually ≈0.43) | `{mass:1,stiffness:157.9,damping:21.36}` | Press scale, chip select, toggles |
| A3 | Bouncy spring | Noticeable bounce | ~30% feels bouncy; cap ≈0.4 for UI [10158] | 0.5 s; bounce ≈0.3 *(exact unverified)* | `.bouncy`, `.bouncy(duration:extraBounce:)` | Bounce 0 | impact light on land | PARTIAL (`pop` 0.60 is over cap) | `{mass:1,stiffness:157.9,damping:17.59}` | Paw save pop, plan item landing |
| A4 | Custom spring (duration + bounce) | Two perceptual params | Set duration for pace first, then bounce for character [10158] | bounce −1…1. Mapping: k = (2π/d)², c = (1−b)·4π/d, m = 1 (b ≥ 0) [10158 equations; verified vs docs example 0.5/0.3 → 157.9/17.6] | `.spring(duration:bounce:)`, `Spring(duration:bounce:)`, UIKit `UIView.animate(springDuration:bounce:)` | Use b = 0 | per use | ADD helper | `appleSpring(d,b)` helper → physics config (see §4). **Don't** use R's `{duration,dampingRatio}`: R's `duration` is "perceptual… actual duration is 1.5 times", solved by an energy threshold, so it does not equal Apple's duration (R source) | Single source for all springs |
| A5 | Interactive spring | Low-response spring for finger-following | Each drag event retargets; velocity carries into release [10145] | response 0.15, dampingFraction 0.86, blend 0.25 [docs] | `.interactiveSpring()` | Direct 1:1 tracking (no spring) | none | ADD | During pan: set value directly (1:1); on end `withSpring(target,{velocity:e.velocityX, ...})`; interactive config ≈ `{mass:1,stiffness:1754.6,damping:72.05}` | Cook pager, drag-to-remove row, sheet drag |
| A6 | SwiftUI default animation | What `withAnimation` uses | Springs are the default since iOS 17 [10158] | response 0.55, damping 1.0 [docs] (pre-iOS 17: easeInOut) | `Animation.default` | n/a | n/a | n/a | `{mass:1,stiffness:130.5,damping:22.85}` | Fallback token |
| A7 | Legacy spring() | Persistent spring that retargets keeping velocity | Mixed springs replace each other, preserving velocity [docs] | response 0.5, ζ 0.825 [docs] | `.spring(response:dampingFraction:blendDuration:)` | n/a | n/a | n/a | `{mass:1,stiffness:157.9,damping:20.73}` | (reference) |
| A8 | Ease in/out (Bezier) | Curve + duration | Continuous for static starts; can't carry gesture velocity (jerks) [10158] | duration-based | `.easeInOut(duration:)`, `UIView.animate` curves | fade | n/a | HAVE (`easings.*`) | `withTiming(v,{duration,easing})` | Keep for opacity and color only |
| A9 | Linear | Constant speed | Only for things like spinners; non-physical for movement [10158] | — | `.linear` | stop | n/a | HAVE (breathe uses sin, fine) | `Easing.linear` | Spinner, progress sweep |
| A10 | Retarget / interruption | New target mid-flight keeps velocity | Makes interruptions "feel smooth and natural" [10158] | automatic with springs | any spring | — | — | PARTIAL (R springs retarget by default) | Assign new `withSpring` on the same shared value; never wait for completion | Rapid ＋ taps, fast step paging |
| A11 | Perceptual-duration completion | Fire follow-ups when it *looks* done | Don't wait for settling duration for user-facing changes [10158] | settling ≠ duration | `withAnimation(_:completionCriteria:)` | — | haptic at visual landing | ADD | `withSpring(..., (finished)=>…)` fires late. Instead schedule at ≈duration with `withDelay`, or use R `energyThreshold` | Fire the success haptic when the check *lands*, not 300 ms later |
| A12 | Phase animator | Steps through states, loops or on trigger | Great for repeating and event-driven multi-step [10157] | per-phase animation | `.phaseAnimator(_:trigger:)` | Show the final phase | optional per phase | PARTIAL (breathe is a 2-phase loop) | `withSequence(...)` / `withRepeat` | Otto "nod" on list done |
| A13 | Keyframe animator | Independent tracks with keyframes | Complex choreography; content updates every frame [10157, docs] | Linear/Spring/Cubic/Move keyframes | `.keyframeAnimator` | Static final frame | sync haptic to a keyframe | ADD | `withSequence`+`withDelay` per property, or R CSS keyframes `animationName` (R4) | Cook-complete Otto celebration beat |

### B. Navigation and presentation transitions (12)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| B1 | Push (slide) | Standard drill-in | Keep tab bar visible on push [HIG-TabBars]. iOS 26 push is interruptible: swipe back or scroll mid-transition [284] | system curve | `NavigationStack`, `UINavigationController` | System cross-fade when RM + Prefer Cross-Fade is on | none | SYSTEM/HAVE (native stack `slide_from_right`) | Keep native. Don't block taps "while transitioning" [10145] | ✓ |
| B2 | Back swipe (edge and content) | Interactive pop | iOS 26 adds content-area backswipe. Custom gestures must set failure requirements on `interactiveContentPopGestureRecognizer` [284] | — | UIKit | tracks 1:1 | none | HAVE (edge only; full-screen disabled on purpose) | `fullScreenGestureEnabled` (screens) | Consider re-enabling full-width back on short pages only |
| B3 | Zoom transition | Tapped cell morphs into the destination, drag to dismiss anytime | Use from large cells to increase continuity [10145]. Recipe-app example: Gentler Streak and recipe comments [WWDC26-251] | iOS 18+, continuously interactive | `.navigationTransition(.zoom(sourceID:in:))` + `.matchedTransitionSource`; UIKit `preferredTransition = .zoom` | Cross-fade | none | ADD | Not in react-native-screens 4.16 *(unverified; check screens changelog)*. Fallback: shared-element-like with R (`sharedTransitionTag` is experimental in R) or a native module | Recipe card → detail (hero photo), plan day → day detail |
| B4 | Sheet + detents | Scoped task at medium/large/custom height | Medium for progressive disclosure. Grabber on resizable sheets. Swipe-down dismiss [HIG-Sheets] | 2 system detents (medium ≈ half, large) | `.presentationDetents`, `UISheetPresentationController` | System | select on detent change *(optional)* | PARTIAL (custom sheets: FilterSheet, AddSheet, cook sheets) | `presentation:'formSheet'`, `sheetAllowedDetents`, `sheetGrabberVisible` (screens 4.16) | Filters and "Add to plan" as native formSheets |
| B5 | Sheet glass → opaque | Partial sheets inset with glass; at full height they become opaque and anchor to the edges | Remove custom `presentationBackground` to let the material work [323] | iOS 26 | automatic | System | — | ADD (comes with B4) | Native formSheet on iOS 26 | Free polish |
| B6 | Morph from button | Sheet, menu, popover, alert or action sheet grows out of its source glass button | "Springs from the action itself" [356]. Dialogs morph automatically [323] | iOS 26 | zoom transition with toolbar item as source; UIKit `.zoom` + `sourceItem` | Fade | — | ADD | Native menus (`@react-native-menu/menu` or expo `ContextMenu` in @expo/ui *(unverified API)*), native action sheets | Recipe "…" menu, delete confirm |
| B7 | Full-screen cover | Immersive or multistep modal | For video, camera, multistep editing, not simple forms [HIG-Modality] | — | `.fullScreenCover`, `.fullScreen` | Fade | — | HAVE-ish (cook is a pushed screen) | `presentation:'fullScreenModal'` | Cook mode as full-screen cover (`going-full-screen` HIG) |
| B8 | Modal dismiss gesture + guard | Swipe down; confirm if unsaved | Confirm with an action sheet if edits would be lost [HIG-Sheets/Modality] | — | `interactiveDismissDisabled`, `presentationControllerDidAttemptToDismiss` | — | warning on arm | PARTIAL | `usePreventRemove` (react-navigation) | Recipe editor |
| B9 | Tab switch | Instant section change, state preserved | Tabs navigate, never act [HIG-TabBars] | system: no slide | `TabView` | — | select (system plays none; Otto adds select) | HAVE (JS Tabs) | `NativeTabs` from expo-router | Adopt NativeTabs (gets glass, minimize, scroll-to-top) |
| B10 | Large title collapse | Large title shrinks to inline on scroll | Use large title that collapses on scroll [HIG-Toolbars]. iOS 26 large titles scroll with content [284] | — | `prefersLargeTitles` | System | — | N/A (headerShown false) | native header `headerLargeTitle` | Cookbook and Discover titles |
| B11 | Nav bar minimize on scroll (iOS 27) | Navigation bar moves out of the way while scrolling | New in iOS 27 SwiftUI [WWDC26-269] | `.toolbarMinimizeBehavior(.onScrollDown, for: .navigationBar)` *(signature from transcript; doc page 404)* | SwiftUI | System | — | ADD later | needs native header support *(unverified in RN)* | Long recipe pages |
| B12 | Interruptible transitions (eng. rule) | Push/pop can start at any time | Don't special-case "in transition"; keep transition state minimal [10145] | — | — | — | — | PARTIAL | Avoid `isTransitioning` guards in onPress | Audit ＋ and cook "Next" |

### C. Liquid Glass behaviours (13)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Lensing | Bends and concentrates light instead of scattering it | The primary way glass defines itself [219] | Regular (adaptive) vs Clear (needs dim, 35% dark over bright media) [HIG-Materials; 219] | `.glassEffect(.regular/.clear)` | Reduce Transparency → frostier [219] | — | ADD | `expo-glass-effect` `<GlassView glassEffectStyle>` (not installed) | Floating cook controls over the step photo (clear + dim) |
| C2 | Materialize / dematerialize | Appears by modulating lensing, not opacity | "Instead of fading, Liquid Glass objects materialize" [219]. Set the effect, not alpha [284] | — | set/remove `UIGlassEffect`; `GlassEffectTransition.materialize` [docs] | System | — | ADD | Mount/unmount GlassView (native handles it). Don't wrap glass in an opacity fade | Timer pill appearing in cook |
| C3 | Interactive flex | Scales, bounces, shimmers on touch | Use `.interactive()` for custom controls on iOS [323] | — | `Glass.interactive()`, UIKit `isInteractive` | Elastic properties disabled under RM [219] | system | ADD | `<GlassView isInteractive>` | ＋ button as interactive glass |
| C4 | Illuminate from within | Glow starts under the fingertip and spreads to nearby glass | Feedback on interaction [356/219 section on highlights] | — | automatic | — | — | ADD | comes with C3 | — |
| C5 | Lift into glass | Content-layer controls (slider, toggle) take on glass only while active | Exception to "no glass in content layer" [HIG-Materials; 219] | — | system Slider/Toggle | — | system | SYSTEM | Native `Switch` gets it | Servings stepper as native slider? |
| C6 | Morphing (container + ID) | Glass shapes blend and morph between states | Group in `GlassEffectContainer`; glass can't sample glass [323] | `spacing` sets when blending starts [docs] | `GlassEffectContainer(spacing:)`, `.glassEffectID(_:in:)`; UIKit `UIGlassContainerEffect` | Cross-fade | — | ADD | `expo-glass-effect` `<GlassContainer spacing>`; ID morphing not exposed *(unverified)* → @expo/ui SwiftUI | Cook bottom bar: "Next" splits into "Back/Next" |
| C7 | Merge / split | Overlapping glass becomes one shape; split by stacking then animating apart [284] | — | — | UIKit container | fade | — | ADD | same | Timer chips merging into one "2 timers" pill |
| C8 | Tab bar minimize on scroll | Bar shrinks while scrolling down, re-expands on the reverse | Use with a bottom accessory [HIG-TabBars; 323; 284] | `.onScrollDown/.onScrollUp/.automatic/.never` | `.tabBarMinimizeBehavior`, `tabViewBottomAccessory` | System | — | ADD | **Installed**: expo-router `NativeTabs minimizeBehavior="onScrollDown"` | Discover feed. Accessory = "Cooking now: Step 3 · 4:12" |
| C9 | Scroll edge effect | Content dissolves under floating bars; dims under dark content | Functional, not decorative; one per view [HIG-ScrollViews; 219] | styles automatic / soft / hard | `.scrollEdgeEffectStyle(_:for:)`; UIKit `ScrollEdgeElementContainerInteraction` | System | — | ADD | Native headers/tabs get it; custom overlays don't *(unverified)* | Replace custom cream bar plus border |
| C10 | Adaptive light/dark flip | Small glass (bars) flips with the background; large (menus, sidebars) doesn't | [219] | — | automatic | — | — | SYSTEM | — | — |
| C11 | Thickening on expand | When glass grows (menu from button) it looks thicker: deeper shadow, more lensing | [219] | — | automatic | — | — | SYSTEM | — | — |
| C12 | Glass tint transitions | Tint one primary action. Tint and content colour animate together | Tint only primary actions, not everything [219; 284] | — | `Glass.tint(_:)`, `UIGlassEffect.tintColor` | — | — | ADD | `<GlassView tintColor={colors.terracotta}>` | "Start cooking" as the single tinted action |
| C13 | Background extension | Mirrored and blurred copies extend a hero under sidebars or insets | Use with discretion, single instance [docs] | — | `.backgroundExtensionEffect()` | — | — | N/A (iPhone) | — | iPad later |

### D. Scroll-driven motion (13)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| D1 | Rubber-banding | Soft resistance past edges | Shows you reached the edge, so it doesn't feel frozen [803]. Custom scrolling must keep it [HIG-ScrollViews] | — | built-in | keep (direct tracking) | none | SYSTEM | Native ScrollView. For custom pans: `offset = limit + (x−limit)*0.55` style damping *(curve unverified)* | Cook pager ends |
| D2 | Momentum / deceleration | Coasting after a flick | Consistent friction makes it predictable [803] | `DecelerationRate.normal` / `.fast` (UIKit) | `UIScrollView.decelerationRate` | keep | none | SYSTEM | `withDecay({velocity, deceleration:0.998})` (R) | Horizontal recipe carousels |
| D3 | Momentum projection | Choose the end target from velocity | Project momentum for thrown objects [803] | `project(v,d) = (v/1000)·d/(1−d)` *(slide code; not in transcript text)* | — | — | impact on snap | ADD | worklet `project()` on GH `onEnd` → `withSpring(nearestSnap)` | Flick a recipe into a day slot |
| D4 | Paging | Page-by-page | Page = view size minus an overlap unit; hide the indicator if there's a page control [HIG-ScrollViews] | — | `.scrollTargetBehavior(.paging)` | keep | select per page | PARTIAL (cook pager custom) | `pagingEnabled` or GH pan + spring | Cook steps |
| D5 | View-aligned snapping | Settle on item boundaries | [docs ScrollTargetBehavior] | `.viewAligned` | `.scrollTargetBehavior(.viewAligned)` | keep | optional select | ADD | `snapToInterval`, `decelerationRate="fast"` | Week-day strip |
| D6 | scrollTransition | Per-item effect by visibility phase | "Great way to build interesting, unique scroll experiences" [10151] | phases identity/topLeading/bottomTrailing; `.interactive` default | `.scrollTransition` | Disable effect | none | ADD | `useAnimatedScrollHandler` + per-item `interpolate` (R) | Discover cards scale 0.96→1 as they enter |
| D7 | Position-based visual effect | Hue, scale or blur by on-screen position | Performant, good for scroll views [10151] | — | `.visualEffect` | Disable; avoid blur under RM [HIG-A11y] | none | ADD | R `useScrollViewOffset` / `useScrollOffset` + interpolate | Subtle header fade |
| D8 | Parallax hero | Image moves slower than content; stretches on overscroll | Classic depth; z-depth is an RM concern [HIG-A11y] | ~0.5× | scrollTransition / custom | Static image | none | HAVE (ParallaxHero, RM static) | RN Animated (repo rule) | ✓; add overscroll haptic? no |
| D9 | Sticky / pinned headers | Section headers pin | Automatic edge effect keeps pinned headers legible [HIG-ScrollViews] | — | `pinnedViews`, List sections | — | none | ADD? | `stickyHeaderIndices` | Shopping list aisle headers |
| D10 | Pull to refresh | Spinner revealed by overscroll | Prefer showing freshness inline [HIG-Feedback] | — | `.refreshable`, `UIRefreshControl` | System | system | ADD | `RefreshControl` | Discover "fresh picks" with Otto peeking *(custom, careful)* |
| D11 | Scroll to top | Status-bar or tab re-tap scrolls up with an elastic behaviour | Same feel as scrolling [803] | — | system | — | — | PARTIAL | `useScrollToTop` (react-navigation); NativeTabs does it | ✓ |
| D12 | Auto-scroll to reveal | Scroll just enough to show a new selection | Only as much as needed [HIG-ScrollViews] | — | `ScrollViewReader.scrollTo` | Jump without animation | — | PARTIAL | `scrollTo({animated: !reduced})` | Cook step list, chat newest message |
| D13 | Brand mark fades on scroll | Logo only on home, fades as you scroll | NYT Cooking example [WWDC26-251] | — | — | Instant | — | ADD | interpolate opacity from scrollY | Otto wordmark/mascot on Discover top |

### E. Content and layout transitions (13)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Numeric text roll | Digits roll up or down | Count numbers in Live Activities with numeric transitions [10194; HIG-LA] | `countsDown:` | `.contentTransition(.numericText())` | Opacity swap | none (select if user-driven) | PARTIAL (`useCountUp` counts, doesn't roll) | Per-digit column `translateY` with R springs, or plain text swap | Servings stepper, calories, plan count |
| E2 | Opacity content transition | Cross-fade content in place | Content transitions apply only within an Animation [docs] | — | `.contentTransition(.opacity)` | itself | — | ADD | `FadeIn/FadeOut` entering on keyed child | Swap ingredient amounts on servings change |
| E3 | Interpolate | Morph text weight or shape where possible | [docs] | — | `.interpolate` | opacity | — | N/A | — | — |
| E4 | Matched geometry | Element moves between containers | Spatial continuity [803] | — | `matchedGeometryEffect` | Cross-fade | — | ADD | R `sharedTransitionTag` (experimental), or manual measure + absolute overlay | Recipe thumb → plan slot fly-in |
| E5 | Insertion/removal transitions | opacity, scale, move(edge), push(from), offset, combined, asymmetric | A good transition "fits naturally… not tacked on" [10151] | — | `.transition(...)` | Fade only (replace x/y/z with fades [HIG-A11y]) | — | PARTIAL (Toast fades) | R `entering={FadeInDown.springify()}`, `exiting`, `.reduceMotion(ReduceMotion.System)` | Shopping row remove, toast |
| E6 | Blur replace | Blur out/in while swapping | Avoid animating into/out of blurs under RM [HIG-A11y] | — | `.blurReplace` | Fade | — | ADD (sparingly) | blur needs Skia or expo-blur; skip | Avoid |
| E7 | List insert/remove/reorder | Rows animate to new positions | Animate existing elements to new positions; avoid overlaps (fade the rest) [HIG-LA; 10194] | — | `List` animations | Instant + fade | select on reorder drop | ADD | R `itemLayoutAnimation={LinearTransition.springify()}` on `Animated.FlatList` | Shopping check-off moves to "In basket"; plan reorder |
| E8 | Layout animation | Size and position changes animate | Springs for layout [10158] | — | implicit in SwiftUI | Instant | — | ADD | R `layout={LinearTransition}` (repo note: layout anims break web) | Expand ingredient group |
| E9 | Custom Transition | Your own phase-based transition | [10151] | — | `Transition` protocol | Fade | — | ADD | R custom entering worklet (`withInitialValues`) | Otto-only flourish |
| E10 | TextRenderer | Per-line or glyph text animation | Emphasize what matters, avoid sameness [10151] | iOS 18 | `TextRenderer`, `TextAttribute` | Plain fade | — | ADD (rare) | Split words → staggered `FadeIn.delay(i*30)` | Otto's reply bubble words in |
| E11 | Mesh gradient animation | Animated colour field | Decorative or signals change [10151] | iOS 18 | `MeshGradient` | Static | — | N/A | Skia | Skip (not Otto's tone) |
| E12 | Shaders | GPU colour/distortion/layer effects, time-driven | "Small visual effect could make a big difference" [WWDC26-322] | iOS 17+ | `.colorEffect/.distortionEffect/.layerEffect` | Disable | — | N/A | Skia RuntimeEffect | Skip |
| E13 | Image fade-in | Images fade into reserved frames | Reserve space; fade in as loaded [HIG-Loading digest] | — | AsyncImage transaction | Instant | — | PARTIAL? | `expo-image` `transition={200}` | Recipe photos |

### F. SF Symbol effects (15)

Behaviour classes: discrete, indefinite, transition, content transition [10258]. HIG: apply "judiciously", give each animation a clear purpose, match the app's tone [HIG-SFSymbols]. **RN note for all rows:** Otto uses vector-icon fonts (Ionicons-style `tabIcon('restaurant')`), not SF Symbols. `expo-symbols` (SDK 54) supports only `bounce`, `pulse`, `scale` and variable color. Wiggle, Breathe, Rotate, Replace and Draw need @expo/ui SwiftUI or a native module *(unverified)*, or a Reanimated imitation on an SVG or icon font.

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 | Appear | Symbol emerges (transition) | [HIG-SFSymbols] | SF Symbols 5 | `.symbolEffect(.appear)` / `.transition(.symbolEffect)` | Fade | — | ADD | R `ZoomIn.springify()` on icon | Check-mark appears |
| F2 | Disappear | Recedes out | same | 5 | `.disappear` | Fade | — | ADD | `ZoomOut` | — |
| F3 | Bounce | One-off elastic up/down (discrete) | Communicates an action occurred [HIG-SFSymbols]; "single bounce when added" [digest] | 5; up/down; by layer | `.symbolEffect(.bounce, value:)` | Skip motion, keep haptic | impact light | PARTIAL (PawMark pop ≈ bounce) | expo-symbols `animationSpec={{effect:{type:'bounce'}}}` or R scale sequence | Basket icon when an item is added to the list |
| F4 | Scale | Persistently scaled up/down (indefinite) | Attention to selection [HIG] | 5 | `.scale.up` | Static | — | ADD | R spring scale 1.15 held | Selected filter chip icon |
| F5 | Pulse | Opacity varies, ongoing activity | Play until a condition is met [HIG] | 5 | `.pulse` | Static | — | ADD | expo-symbols `pulse` / R opacity loop | "Otto is thinking" in chat |
| F6 | Variable colour | Layers light up cumulatively or iteratively, open or closed loop | Progress or ongoing activity [HIG] | 5 | `.variableColor.iterative` | Static | — | ADD | expo-symbols variableAnimationSpec | Timer running: `timer` or flame symbol |
| F7 | Replace (down-up, up-up, off-up) | Swap symbols with direction meaning | Down-up = state change; up-up = forward progress; off-up = next action [HIG] | 5 | `.contentTransition(.symbolEffect(.replace))` | Cross-fade | select | ADD | Keyed icon with R entering/exiting | play ↔ pause timer |
| F8 | Magic Replace | Smart morph between related symbols (slash, badge, enclosure) | Default replace; falls back to down-up if unrelated [HIG] | SF6; SF7 adds enclosure matching + Draw [337] | default replace | Cross-fade | select | ADD | not in expo-symbols | `heart` → `heart.fill` save; `bell` → `bell.slash` |
| F9 | Wiggle | Back-and-forth along an axis | Highlight an overlooked change or call to action [HIG; 10188] | SF6; directional angle | `.wiggle` | Static + colour | — | ADD (rare) | R `withSequence` rotate ±8° | "Start cooking" CTA nudge once after 10 s idle *(careful)* |
| F10 | Breathe | Opacity *and* size, living quality | Ongoing activity (recording) [HIG; 10188] | SF6 | `.breathe` | Static | — | PARTIAL (OttoIdle breathe is the same idea on art) | R loop (have `useBreathe`) | Live "cooking now" dot |
| F11 | Rotate | Whole or by-layer rotation | Shows a task is working, or imitates the object [HIG] | SF6; By Layer | `.rotate` | Static | — | ADD | R `withRepeat(withTiming(360, linear))` | Mixer or whisk icon while importing a recipe |
| F12 | Draw On | Draws along guide-point paths (handwriting) | Progress, or reinforcing meaning [HIG; 337] | SF7; By Layer (default), Whole Symbol, Individually | `.symbolEffect(.drawOn)` | Appear instantly | selection / success at end | ADD | SVG path `strokeDashoffset` with R (needs react-native-svg, not installed) | Ingredient check-off ✓ draws on |
| F13 | Draw Off | Undraws (optional reverse) | [337] | SF7 | `.drawOff` | Disappear | — | ADD | same | Un-check |
| F14 | Variable Draw (rendering) | Path drawn to a % over a dim copy | Progress like a download, temperature [337] | SF7 | `.symbolVariableValueMode(.draw)` *(API name unverified)* | static % | — | ADD | SVG dash % | Step progress on a "pan" glyph |
| F15 | Gradient rendering | Linear gradient from one colour (static) | Use at larger sizes for depth [337] | SF7 | `.symbolColorRenderingMode(.gradient)` *(name unverified)* | — | — | N/A | — | — |

### G. Gestures and direct manipulation (11)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 | Touch-down highlight, touch-up confirm | Highlight immediately; cancel by dragging off; extra hit margin | [803] | 44×44 pt default target [HIG-A11y] | Button styles | Opacity highlight | none | HAVE (Bounceable onPressIn; PressPop on press-in) | `Pressable` + `hitSlop` | ✓ (PressPop confirms on *press-in*. Fine since it navigates, but tap-cancel is lost) |
| G2 | One-to-one tracking | Content stays under the finger; relative grab point | "One-to-one tracking is extremely important." [803] | — | gestures | (is the RM technique) | — | PARTIAL | GH pan, set shared value directly (no spring while dragging) | Cook pager, HoldToRemoveRow |
| G3 | Hysteresis | Movement threshold before a swipe starts | "usually 10 points in iOS" [803] | 10 pt | — | — | — | ADD | GH `.activeOffsetX([-10,10])` | Pager vs vertical scroll conflicts |
| G4 | Velocity hand-off | Release continues at finger velocity | Springs take initial velocity [10158; 10145] | — | SwiftUI tracks automatically | Direct, no overshoot | impact soft on land | ADD (StepCard uses timing) | `withSpring(target,{...cfg, velocity: e.velocityX})` | Step swipe lands with a spring from release velocity |
| G5 | Momentum projection | see D3 | [803] | — | — | — | — | ADD | — | — |
| G6 | Hinting | Element grows toward its end state while pressed | [803] | — | — | Opacity | — | ADD | Press-in scale *up* 1.02 for things that expand | Recipe card that zooms open |
| G7 | Drag to dismiss | Pull a sheet or card down | Dismiss the way it came [HIG-Motion]; bounce if momentum (80% damping) [803] | ζ 0.8 on momentum dismiss | sheets | Fade | — | PARTIAL (native sheets) | GH pan + spring w/ velocity | Full-photo viewer |
| G8 | Long-press preview / context menu | Lift, preview, menu morphs from source | Context menus morph from the tapped action [WWDC26-251] | — | `.contextMenu(menuItems:preview:)` | System | system (impact) | ADD | native context menu lib *(unverified)* | Long-press recipe: Save / Add to plan / Share |
| G9 | Swipe actions | Reveal row actions | Coordinated across items in iOS 27 [WWDC26-269] | — | `.swipeActions`, `.swipeActionsContainer()` | System | select at threshold | PARTIAL (hold-to-remove instead) | GH `Swipeable`/`ReanimatedSwipeable` | Shopping row swipe to remove |
| G10 | Drag and drop lift | Item lifts, others make room | SwiftUI handles animation [WWDC26-269] | — | `.draggable/.dropDestination` | Fade | impact medium on lift, soft on drop | ADD | `react-native-reorderable-list` *(unverified)* or GH + R | Reorder meals across days |
| G11 | Hold to arm | Long press arms a destructive action | Continuous feedback during the gesture [803] | — | — | Fill progress without scale | impact medium at arm (Otto has it) | HAVE (HoldToRemoveRow) | ✓ | ✓ |

### H. Feedback micro-interactions (11)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| H1 | Button press scale | Slight shrink on touch | Standard elements already animate subtly; don't overdo frequent ones [HIG-Motion] | ~0.97 | `ButtonStyle` / glass interactive | Opacity dip | none (or select) | HAVE | `usePressSpring` | Switch spring to bounce ≤0.15 |
| H2 | Toggle / checkbox | State flip with knob or check | System toggles include haptics [HIG-Haptics] | — | `Toggle` | instant | system | HAVE (custom checks + select) | `Switch` native where possible | Ingredient check-off (see F12) |
| H3 | Success confirmation | Check + label + haptic together | Confirm significant tasks only; otherwise report failures [HIG-Feedback] | — | `.sensoryFeedback(.success)` | Static check + haptic | notification success | HAVE (moment registry) | `haptics.notify('success')` | ✓ |
| H4 | Error shake | Horizontal shake on invalid | Say what failed and why [HIG-Feedback]; not colour only [HIG-A11y] | ~3 cycles, short *(no Apple spec)* | custom | Colour + icon + text, no shake | notification error | ADD | R `withSequence(±8,±6,±3,0)` on translateX | Wrong password, invalid import URL |
| H5 | Like / save heart | Fill + bounce | "Quick checkmark bounce when saved" vs no confetti [digest] | — | `.symbolEffect(.bounce)` + Magic Replace | Fill, no scale | impact light (Otto: commit) | HAVE (PawMark pop) | ✓ | Retune pop to bounce ≤0.4 |
| H6 | Add-to-plan fly-in | Thumbnail flies into the destination tab or strip | Spatial continuity [803]; brief [HIG-Motion] | ≤ ~0.5 s | matchedGeometry / custom | Toast "Added to Tue" + badge pulse only | impact soft at landing | ADD | Measure source/target → absolute clone → R spring path | Recipe → week strip / Plan tab |
| H7 | Celebration / confetti | Particle burst | Delight isn't confetti [WWDC26-250]; don't repeat on every save [digest] | ≤ `celebrate` 900 ms | custom | Otto pose + haptic, no particles; RM mutes fanfare (Otto has this) | success | PARTIAL (registry exists) | Otto art swap + short burst (Skia or 8 Views) | Cook complete only |
| H8 | Toast / banner | Transient status | Avoid auto-dismissing critical info [HIG-A11y] | — | — | fade | per type | HAVE (fade) | ✓ | Add slide only when not RM |
| H9 | Badge / count bump | Count changes with a little pop | Badges only for critical info in tab bars [HIG-TabBars] | — | `.contentTransition(.numericText())` | swap | none | ADD | E1 + scale 1.1 | Shopping count on Plan |
| H10 | Empty-state invitation | One gentle beat | Motion only, no sound (Otto contract G6) | — | — | static | none | PARTIAL (OttoIdle) | ✓ | ✓ |
| H11 | Inline validation | Message appears near the field | Inline message, not a disabled button [HIG-Feedback] | — | — | fade | warning | ADD | `FadeInDown` | Recipe editor |

### I. Loading and progress (7)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| I1 | Placeholder / skeleton | Shapes where content will be | Show something immediately; replace as it arrives [HIG-Loading] | widgets: semi-opaque bars and circles [HIG-Widgets] | `.redacted(reason: .placeholder)` | Static skeleton | — | ADD | Static grey blocks with `creamDeep` | Discover and Cookbook first load |
| I2 | Shimmer | Moving highlight on the skeleton | Not in HIG; a "repetitive animation" to reduce under RM [HIG-A11y] | slow, low contrast | custom | **No shimmer** under RM | — | ADD (optional) | R translateX loop on a gradient (needs expo-linear-gradient) | Keep subtle or skip |
| I3 | Indeterminate spinner | Unknown duration | Use when duration unknown [HIG-Loading] | — | `ProgressView()` | System | — | HAVE | `ActivityIndicator` | Replace with Otto stir loop? (F11) |
| I4 | Determinate progress | Known duration, bar or ring | Use when known [HIG-Loading] | — | `ProgressView(value:)`, `Gauge` | Jump in steps | none | PARTIAL (Ring) | R width/strokeDashoffset | AI recipe import progress steps |
| I5 | Streaming text | Text appears as generated | Show progress; let people keep working [HIG-Loading; HIG-Gen AI *(page fetched, not quoted)*] | — | — | No caret blink | none | PARTIAL (chat) | Append chunks; fade new words (E10) | Ask-Otto replies |
| I6 | Worthwhile wait content | Tips during long waits | Don't repeat [HIG-Loading] | — | — | — | — | ADD | rotating tip | "Otto's tip" during plan generation |
| I7 | Launch screen | Static shell matching the first screen | Not a splash; no text; match light/dark [HIG-Launching] | — | storyboard / `UILaunchScreen` | — | — | HAVE? (verify it matches Discover) | expo splash config | Cream background only, no logo |

### J. Haptics, every type (18)

iOS generators: impact styles light / medium / heavy / soft / rigid ("mass of the objects in the collision"), plus `impactOccurred(intensity:)`, selection, notification success / warning / error [docs]. Category meanings [HIG-Haptics]:
- **Notification:** the outcome of a task.
- **Impact:** a physical metaphor ("a tap when a view snaps", "a thud" for heavy collisions).
- **Selection:** values changing.

SwiftUI `SensoryFeedback`: start, stop, alignment, decrease, increase, levelChange, selection, pathComplete, success, warning, error, impact, `impact(weight:intensity:)`, `impact(flexibility:intensity:)`, and new press/release/selection-of-control types [docs]. **expo-haptics** exposes `selectionAsync`, `impactAsync(Light|Medium|Heavy|Soft|Rigid)`, `notificationAsync(Success|Warning|Error)`, but **no intensity and no Core Haptics patterns** (installed types).

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Pairs with | Otto | RN (expo-haptics) | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| J1 | Selection | Light tick per value change | While values change [HIG] | — | `UISelectionFeedbackGenerator`, `.selection` | unaffected by RM; honour haptics off | pickers, chips, paging | HAVE (~45 sites) | `selectionAsync()` | Fewer: drop on plain navigation taps (frequency fatigue [HIG]) |
| J2 | Impact light | Small, light collision | Snap into place [HIG] | — | `.light` | — | commit, save | HAVE | `impactAsync(Light)` | ✓ |
| J3 | Impact medium | Moderate collision | — | — | `.medium` | — | pick-up, arm | HAVE | `impactAsync(Medium)` | ✓ |
| J4 | Impact heavy | Large, heavy collision | "Thud when two heavy objects collide" [HIG] | — | `.heavy` | — | rare, weighty | ADD (rare) | `impactAsync(Heavy)` | Maybe never. Reserve |
| J5 | Impact soft | Soft, compressible collision | — | — | `.soft` | — | landings, settle | ADD | `impactAsync(Soft)` | Card or item *lands* in plan (H6), sheet settles |
| J6 | Impact rigid | Rigid, crisp collision | — | — | `.rigid` | — | detents, boundaries | ADD | `impactAsync(Rigid)` | Step pager hitting a step boundary, timer dial detent |
| J7 | Impact intensity | 0–1 scaled impact | Match intensity to animation [HIG] | 0–1 | `impactOccurred(intensity:)`, `.impact(weight:intensity:)` | — | velocity-scaled | N/A in expo | needs native module | — |
| J8 | Success | Task completed | Outcome of a task [HIG]. Otto reserves it for flow completion (good) | — | `.success` | — | check + chime | HAVE | `notificationAsync(Success)` | ✓ |
| J9 | Warning | Produced a warning | — | — | `.warning` | — | arm destructive | HAVE | `notificationAsync(Warning)` | ✓ |
| J10 | Error | Failed | — | — | `.error` | — | shake + message | HAVE | `notificationAsync(Error)` | ✓ add to H4 |
| J11 | Start | Activity started (watch semantics: timers) | Start, then usually Stop [HIG watchOS list] | — | `.start` | — | timer start | ADD | approximate: `impactAsync(Rigid)` | Timer start |
| J12 | Stop | Activity stopped | [HIG] | — | `.stop` | — | timer stop | ADD | approximate: `impactAsync(Soft)` | Timer cancel |
| J13 | Increase / Decrease | Value crossed a significant threshold | [docs, HIG watch] | — | `.increase/.decrease` | — | thresholds | ADD | approximate with Light/Soft | Servings stepper at min/max |
| J14 | Alignment | Dragged item aligned | [HIG macOS table; docs] | — | `.alignment` | — | snapping | ADD | `selectionAsync()` at snap | Drag meal snaps to a day |
| J15 | Level change | Discrete pressure levels | [HIG macOS] | — | `.levelChange` | — | — | N/A | — | — |
| J16 | Path complete | Drawn path recognized | [docs] | — | `.pathComplete` | — | — | N/A | — | — |
| J17 | Custom Core Haptics | Transient or continuous events with sharpness and intensity, plus audio | Mainly games; non-game apps occasionally [HIG]. Long haptics dilute meaning [HIG] | AHAP; WWDC21 example: 500 ms visual, haptic synced | `CHHapticEngine` | — | sound-synced | PARTIAL (alarm via RN Vibration) | native module needed. RN `Vibration` on iOS can't shape intensity or length *(RN docs: fixed duration on iOS, unverified here)* | Timer-done pattern synced to `timer-alarm.wav` |
| J18 | System control haptics | Switches, sliders, pickers play haptics automatically [HIG] | — | — | native controls | — | — | PARTIAL | native `Switch`, native picker | Prefer native controls over custom ones that need manual haptics |

### K. Sound (5)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Pairs with | Otto | RN | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| K1 | Feedback sounds synced to haptics and animation | Short UI sounds | Harmony: synchronize sound with haptics [HIG-Haptics; 810]. Pair audio with haptics and visuals [HIG-A11y] | — | Core Haptics with audio, AVAudio | RM mutes celebrations (Otto) | haptic | HAVE (5 events) | expo-audio | Fire sound and haptic on the same frame as the visual landing (A11) |
| K2 | Audio session category | Respect the silent switch; mix with others | Non-essential sound = **Ambient** (mixes, obeys silent switch). Don't stop people's music needlessly [HIG-Audio] | Ambient / Solo ambient / Playback… | `AVAudioSession.Category` | — | — | PARTIAL (cook sets playsInSilentMode for alarm, which is global) | expo-audio `setAudioModeAsync({interruptionMode:'mixWithOthers'})` *(option name per expo-audio, unverified)* | People cook with music on. UI ticks must mix, not duck |
| K3 | Alert sounds | Notification / Live Activity alert sound | Alerting plays the standard notification sound [10194] | — | UNNotificationSound | — | — | PARTIAL (in-app alarm) | expo-notifications | Timer done when the app is backgrounded |
| K4 | System sounds | Keyboard clicks etc. | System-provided | — | AudioServices | — | — | SYSTEM | — | — |
| K5 | Alarm | The one loud sound with a job | Audio categories: Playback ignores the silent switch [HIG-Audio] | — | — | — | long haptic | HAVE | ✓ | Move to a notification sound when backgrounded |

### L. System surfaces (8)

| # | Name | What | Apple guidance | Specs | iOS API | RM alternative | Haptic | Otto | RN implementation | Otto idea |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 | Live Activity update animations | numericText, content-replace, scale/opacity/move; reposition rather than overlap | [HIG-LA; 10194] | **≤ 2 s**; none on reduced-luminance Always-On | ActivityKit + SwiftUI | system | alert = sound + light-up | ADD | Native widget extension target (e.g. `@bacons/apple-targets` *(unverified)*) or `expo-live-activity` (npm 0.4.2, third-party) | **Cook timer Live Activity** |
| L2 | Dynamic Island shape-shift | Compact ↔ expanded; expand instead of a push alert | Expand the island to present info rather than send a push [10194]. Keep concentric [HIG-LA] | compact must fit a 28 pt circle in limited width (Oct 2026) [HIG-LA] | `DynamicIsland{}` | system | — | ADD | same | Compact: 🍳 + "4:12"; expanded: step + timer + Next |
| L3 | Live timer text | System-driven countdown with no update pushes | Show live data in minimal ("4:32") [HIG-LA] | — | `Text(timerInterval:)` *(not fetched)* | — | — | ADD | in extension | Minimal view shows remaining time |
| L4 | Widget timeline transitions | Animate between entries | Animate updates up to 2 s; don't hide stale data behind placeholders [HIG-Widgets] | ≤ 2 s | WidgetKit `.contentTransition`, `.transition` *(not fetched)* | — | — | ADD | native target | "Tonight: Lemon pasta" widget, next meal rolls at 3 pm |
| L5 | Interactive widget controls | Buttons/toggles animate in place | Simple tasks only [HIG-Widgets] | — | App Intents buttons | — | — | ADD | native target | Check off a shopping item from a widget? (maybe later) |
| L6 | Notifications | System banner animation | Don't duplicate Live Activities with pushes [HIG-LA] | — | UNUserNotification | — | system | PARTIAL | expo-notifications | Timer done when backgrounded |
| L7 | App launch | Zoom from icon + launch screen hand-off; multiple springs and start times [10158] | Launch screen ≈ first screen [HIG-Launching] | — | system | System RM → fade | — | SYSTEM | splash config | Match the launch screen to Discover's empty shell |
| L8 | App icon | Layered Liquid Glass icon with specular response | Icon Composer 2 (June 2026) [whatsnew] | — | Icon Composer | — | — | ? | — | Layered otter icon *(out of scope)* |

### M. Accessibility motion settings (9)

| # | Setting | What it means | Apple guidance | iOS API | RN API | Otto status | Otto action |
|---|---|---|---|---|---|---|---|
| M1 | Reduce Motion | Cut automatic and repetitive motion | Tighten springs, track gestures directly, no z-depth, swap x/y/z for fades, no blur in/out [HIG-A11y]. Glass: fewer effects, no elastic properties [219]. "Avoid large animations, especially… the third dimension" [docs] | `accessibilityReduceMotion`, `UIAccessibility.isReduceMotionEnabled` | `useReducedMotion()` (R), `AccessibilityInfo.isReduceMotionEnabled`. **R 4 default `reduceMotion: ReduceMotion.System`** makes springs and timings jump to the end automatically (installed source) | HAVE (every hook branches; sound mutes celebrations) | Add RM to new rows; prefer *alternative* feedback (opacity, haptic) over nothing |
| M2 | Prefer Cross-Fade Transitions | Sub-option of RM: replace slides with cross-fades | — | `UIAccessibility.prefersCrossFadeTransitions` ("Reduce Motion and… Cross-Fade… enabled") [docs] | `AccessibilityInfo.prefersCrossFadeTransitions()` (RN 0.81 types) | ADD | Use for custom transitions: StepCard translateX → opacity only |
| M3 | Dim Flashing Lights | Reduce strobing in video | Video playback should respond [HIG-A11y] | `accessibilityDimFlashingLights` | none in RN *(unverified)* | N/A (VideoEmbed) | Don't autoplay flashy video |
| M4 | Animated images (auto-play) | Don't auto-play GIF/animated images when off | "Should not play automatically" when false [docs] | `accessibilityPlayAnimatedImages` | none in RN *(unverified)* → treat RM as proxy | ADD | Any animated otter (GIF/Lottie) → static when RM |
| M5 | Auto-play video previews | System toggle | Offer global opt-out [HIG-A11y] | `UIAccessibility.isVideoAutoplayEnabled` [docs] | none in RN *(unverified)* | N/A | Recipe videos: tap to play |
| M6 | Reduce Transparency | Glass frostier, obscures more [219] | — | `isReduceTransparencyEnabled` | `AccessibilityInfo.isReduceTransparencyEnabled()` | ADD (if glass adopted) | Glass components inherit; custom blur → solid cream |
| M7 | Increase Contrast | Glass mostly black/white with borders [219] | — | `accessibilityContrast` | `isHighTextContrastEnabled` (Android) / iOS via `isDarkerSystemColorsEnabled` *(mapping unverified)* | PARTIAL | — |
| M8 | Haptics / sounds off | Make haptics and sound optional [HIG-Haptics] | — | system setting | n/a (system mutes) | HAVE (Sounds toggle) | Consider a "Haptics" toggle next to Sounds |
| M9 | VoiceOver announcement pacing | Announce meaningful changes, throttled | WWDC26 custom controls: announce only if the value changed and ≥0.3 s passed [WWDC26-220] | `AccessibilityNotification.Announcement` | `AccessibilityInfo.announceForAccessibility` | ? | Timer ticks, step changes |

**Catalog entry count: 13 + 12 + 13 + 13 + 13 + 15 + 11 + 11 + 7 + 18 + 5 + 8 + 9 = 148.**

---

## 3. Above and beyond: signature moments for Otto (22)

Doctrine: **Tiimo-calm baseline, Duolingo-grade craft at earned moments** (Otto's contract) lines up with Apple: purposeful, brief, physics-true, interruptible, optional, harmonized. Each idea lists the guideline that backs it and its RM fallback. ★ = highest leverage.

1. ★ **Cook-mode step pager with real physics.** The swipe tracks 1:1 (G2) and needs 10 pt hysteresis to start (G3). On release, project momentum (D3), then spring to the step with release velocity (G4, A5→A1). Play a **rigid** tick at the step boundary (J6) and the `stepDone` wood-tap only when a step is *completed*, not on browsing. Rubber-band at the first and last steps (D1). *Backing:* WWDC18-803 (tracking, projection, rubber-band), WWDC23-10158 (velocity continuity). *RM:* same direct tracking, settle with bounce 0 and a cross-fade of step text, no translateX (M2).
2. ★ **Timer Live Activity + Dynamic Island.** Starting a cook timer starts one Live Activity that rotates through multiple timers [HIG-LA: one activity, not many]. The Minimal view shows live "4:12" (L3). The compact view snugs to the camera. Timer done expands the island with an alert instead of a push (L2). Updates use numericText (L1). End immediately when cooking ends, with a 15–30 min summary. *RM:* system-handled; no custom motion.
3. ★ **"Add to plan" fly-in.** The recipe thumbnail lifts slightly (hint, G6), flies along a smooth spring to the week strip or Plan tab, and lands with a **soft** impact (J5). The day cell does a 1-cycle numeric bump (E1/H9). Under 0.5 s. *Backing:* spatial continuity [803], brief [HIG-Motion]. *RM:* no flight. Day cell cross-fades to the new count; toast "Added to Tue"; same haptic.
4. ★ **Ingredient check-off that draws.** The checkbox ✓ draws on (F12-style SVG stroke, ~250 ms) with a **selection** tick (J1). The row dims and, on the shopping list, glides into "In basket" via a list layout spring (E7). The last item triggers the moment-registry "All in the basket" (success + `allDone`). *Backing:* SF Symbols 7 Draw "to reinforce meaning" [337]; HIG feedback. *RM:* instant ✓ and fade, no glide, haptic stays.
5. ★ **Plan reveal choreography** (week fully built / AI plan generated). Day cards enter staggered 40 ms apart with `smooth` springs (A1). Each card's meal count rolls (E1). Otto does one nod (A12). One success haptic at the *end* (A11), not per card. Total ≤ 900 ms (`celebrate`). Interruptible: scrolling or tapping cancels the stagger (A10). *Backing:* WWDC23 app-launch example of multiple springs with different start times [10158]; "don't make people wait" [HIG-Motion]. *RM:* all cards fade together in 200 ms, haptic stays.
6. **Recipe card → detail zoom.** Card photo becomes the ParallaxHero; drag down anywhere to shrink back (B3). *Backing:* zoom from large cells [10145]; recipe app praised for zoom [WWDC26-251]. *Implementation risk:* needs native zoom support. Fallback: keep the native push. *RM:* system cross-fade.
7. **Liquid Glass tab bar that minimizes on scroll, with a "Cooking now" accessory.** Swap JS `Tabs` → installed `NativeTabs` (`minimizeBehavior="onScrollDown"`). While a cook session is active, the bottom accessory shows "Step 3 · 4:12 ⏱" and collapses inline when minimized (C8). *Backing:* HIG Tab bars + WWDC25-323/284. *RM:* system.
8. **Servings stepper with rolling numbers and live ingredient math.** The number rolls up or down (E1, `countsDown` on decrement). Ingredient amounts cross-fade (E2). Selection tick per step (J1). Rigid "boundary" tap at min 1 / max 12 (J13→J6). *RM:* plain text swap.
9. **Nutrition count-up → numeric roll.** Keep `useCountUp` for the ring sweep, but make macro numbers *roll* once on first view only. Never on every revisit, per "avoid motion on frequent interactions" [HIG-Motion]. *RM:* final value (already handled).
10. **Save = Magic-Replace-style heart/paw.** Outline → filled with a bounce ≤0.3 (F3/F8) and a **light** impact. The first save ever gets the registry celebration (once). *Backing:* HIG digest Do/Don't ("quick checkmark bounce when saved", no confetti). *RM:* instant fill + haptic.
11. **Otto is alive, but calm.** Keep `useBreathe` (= SF "Breathe" semantics: "living quality" [HIG-SFSymbols]).
    - Add **gaze/attention**: Otto's eyes glance toward a newly inserted item, at most once per screen visit.
    - Add **contextual idle**: stirring loop while an AI request runs (F11 semantics, "task in progress").
    - Breathing stays ≤ a few % amplitude; never at 0.2 Hz-ish sustained wobble (a visionOS caution; good general hygiene).

    *RM:* static art (have).
12. **Cook complete = the one big moment.** Otto celebration pose swaps in with a `bouncy` (0.3) spring, then the `allDone` chime and success haptic on the same frame as the landing (K1, harmony [810]). A short particle burst (≤ 900 ms) of herb/steam bits, no confetti rain. Prompt "Snap your plate". *Backing:* WWDC21 shield example (visual 500 ms synced to haptic + audio). *RM:* pose fades in, haptic stays, sound muted (have).
13. **Error that teaches.** A wrong import URL shakes the field once (H4) with an **error** haptic and an inline message naming the fix. *Backing:* HIG Feedback "say so and explain why". *RM:* no shake; red icon + text + haptic.
14. **Glass cook controls over the step photo.** The bottom bar "Back · Next · Timers" is an interactive glass container (C3/C6). Starting a timer morphs a timer pill out of the Timers button (C6/B6). The ✓ on the last step tints terracotta (C12, the single tinted action). *Backing:* WWDC25-219/323. *RM:* system disables elasticity.
15. **Skeletons that match the layout** for Discover and Cookbook (I1). Static under RM (no shimmer). Images fade in at 200 ms with `expo-image transition` (E13). *Backing:* HIG Loading "show something as soon as possible".
16. **Week strip snapping.** Horizontal day strip snaps per day (D5) with a selection tick per day crossed (J1, throttled) and a scrollTransition scale on the centred day (D6). *RM:* no scale; snapping stays (it's functional).
17. **Long-press a recipe → native context menu with preview** (Save, Add to plan, Share) that morphs from the card (G8/B6). *Backing:* WWDC26-251 "context menus… morphing from the action that was tapped". *RM:* system.
18. **Drag a meal between days.** Lift (medium impact) → others make room with layout springs (E7) → alignment tick at each valid slot (J14 → selection) → soft impact on drop (J5). Projection picks the slot from flick velocity (D3). *RM:* lift without scale, items reflow with fades.
19. **Ask-Otto streaming reply.** Words fade in slightly staggered (E10), a pulse "thinking" dot (F5), and a `send` tick only. Not a celebration (contract). *RM:* text appears per chunk with no fade; no pulse.
20. **"Tonight's dinner" widget with timeline transitions.** At about 3 pm the entry rolls from lunch to dinner (L4, ≤ 2 s). Deep-links to the recipe. *Backing:* HIG Widgets (content that changes through the day; animate updates). *RM:* system.
21. **Discover header: Otto wordmark fades on scroll** (D13) and the floating glass bar gets a scroll edge effect instead of the cream bar plus border (C9). *Backing:* WWDC26-251 (NYT Cooking), HIG Scroll views. *RM:* opacity is fine (not motion).
22. **Haptic vocabulary upgrade.** Add `soft` (landings) and `rigid` (boundaries/detents) to `haptics.impact`, and remove `select` from pure navigation taps where the system wouldn't play one. *Backing:* HIG Haptics (consistency, avoid overuse, "people may not be conscious of, but miss"). No visual change.

---

## 4. Motion token proposal (Apple springs → Reanimated 4.1)

**Key implementation fact (from installed `react-native-reanimated/src/animation/spring/springConfigs.ts` + `springUtils.ts`):** R4's `{duration, dampingRatio}` mode treats `duration` as a *perceptual* duration whose real length is ×1.5, solved by bisection against `energyThreshold` (default 6e-9). That is **not** Apple's duration (which is the undamped period: k = (2π/d)²). For a faithful port, use **physics mode** `{mass, stiffness, damping}` built by a one-line helper:

```ts
// tokens.ts — Apple (duration, bounce) → Reanimated physics config (mass 1). bounce ≥ 0.
// k = (2π/d)², c = (1−bounce)·4π/d  [WWDC23-10158; matches Apple's Spring docs example 0.5/0.3 → 157.9/17.6]
const appleSpring = (d: number, bounce = 0) =>
  ({ mass: 1, stiffness: (2 * Math.PI / d) ** 2, damping: ((1 - bounce) * 4 * Math.PI) / d }) as const;
```
*(Unit assumption: R's physics mode uses seconds-based constants the same way Apple's `Spring(mass:stiffness:damping:)` does. R3's default `{mass 1, stiffness 100, damping 10}` equals Apple's docs example (→ 0.63 s, bounce 0.5). Confirm visually on device before mass migration.)*

### Proposed spring tokens

| Proposed token | Apple source | (duration, bounce) | R physics `{mass:1, stiffness, damping}` | Replaces Otto token | Use |
|---|---|---|---|---|---|
| `spring.smooth` | `.smooth` | 0.5, 0 | 157.9, 25.13 | `gentle` (0.57 s, 0.18) | Default for layout, sheets, list moves, page settle |
| `spring.snappy` | `.snappy` | 0.5, 0.15* | 157.9, 21.36 | `snappy` (0.38 s, **0.43**) | Chips, toggles, small state changes |
| `spring.bouncy` | `.bouncy` | 0.5, 0.3* | 157.9, 17.59 | `sheet` (0.39, 0.32) for non-native sheets | Landings after a gesture with momentum, save heart |
| `spring.press` | `.snappy(duration: 0.3)` | 0.3, 0.15 | 438.6, 35.6 | `press` (0.10 s, 0.53) | Press-in/out scale (still crisp; far less wobble). If 0.3 feels slow, use (0.25, 0.1) → 631.7, 45.24 |
| `spring.interactive` | `.interactiveSpring()` | response 0.15, ζ 0.86 | 1754.6, 72.05 | — (new) | Following a finger with lag smoothing (rarely; prefer direct 1:1) |
| `spring.release` | `.smooth` + gesture velocity | 0.4, 0 | 246.7, 31.42 (+ `velocity`) | — (new) | Pager / drag release (pass `velocity`); bounce 0.15–0.2 if the flick had momentum [803] |
| `spring.mascot` | `.bouncy(duration: 0.45, extraBounce: 0.1)` | 0.45, 0.4 | 195.0, 16.76 | `pop` (0.29 s, **0.60**) | Otto only, at Apple's 0.4 cap: a brand flourish, never chrome |
| `spring.default` | `Animation.default` | response 0.55, ζ 1 | 130.5, 22.85 | — | Fallback |

\*The preset bounce constants are qualitatively documented ("no bounce", "small", "higher") with default duration 0.5 s [docs]. The exact 0.15 / 0.3 values match WWDC23-10158's described levels but are *(unverified as exact constants)*.

**Reduce Motion rule for springs** [HIG-A11y: "tightening animation springs"]: under RM, map every token to `spring.smooth` with bounce 0, or skip and cross-fade for x/y/z moves (M2). The R4 default (`ReduceMotion.System`) jumps to the end. Otto's hooks already provide *alternatives*; keep that pattern.

### Durations (timing, for opacity, colour, sweeps)

Apple doesn't publish a timing table. Its guidance is springs for movement, Bezier or linear for non-physical properties and loops [10158], ≤ 2 s for Live Activity and widget updates [HIG-LA/Widgets], and "brief and precise" feedback [HIG-Motion]. Otto's current set is consistent with that. Keep it, with three notes:
- `fade 200`, `exit 180`, `enter 260`: keep for opacity/colour. **Stop using `enter` timing for movement** (StepCard translateX) → `spring.release`/`smooth`.
- `emphasis 420`, `sweep 500`: fine for count-up and ring.
- `celebrate 900`: keep as the *envelope budget*, not a curve. Add `systemSurface 2000` as a hard cap for Live Activity / widget animations.

### Haptic map: Apple → expo-haptics → Otto

| Event class | Apple type | expo-haptics call | Otto today | Proposal |
|---|---|---|---|---|
| Value changing: chip, segmented, picker detent, day crossed | selection | `selectionAsync()` | `haptics.select()` | Keep. **Stop** on plain navigation taps (tab press is fine, mirroring system pickers) |
| Commit / save / add | impact light | `impactAsync(Light)` | `impact('light')` | Keep |
| Pick-up / arm / lift | impact medium | `impactAsync(Medium)` | `impact('medium')` | Keep |
| Something **lands** / settles (fly-in, drop, sheet rest) | impact soft | `impactAsync(Soft)` | — | **Add** `impact('soft')` |
| Boundary / snap / step edge / detent / timer start | impact rigid | `impactAsync(Rigid)` | — | **Add** `impact('rigid')` |
| Weighty collision | impact heavy | `impactAsync(Heavy)` | — | Reserve (probably unused) |
| Flow completion | notification success | `notificationAsync(Success)` | `notify('success')` (reserved) | Keep the reservation |
| Recoverable attention | notification warning | `notificationAsync(Warning)` | `notify('warning')` | Keep |
| Failure | notification error | `notificationAsync(Error)` | `notify('error')` | Keep + pair with H4 shake |
| Timer start / stop | SensoryFeedback start / stop | approximate: Rigid / Soft | — | Add via the two new impacts |
| Threshold increase / decrease | increase / decrease | approximate: Light / Soft | — | Servings min/max |
| Alarm (timer done, foreground) | custom Core Haptics continuous | not available (RN `Vibration`) | `alarm()` | Keep; consider a Core Haptics pattern synced to the alarm WAV if a native module is ever added; background = notification sound |

Timing rule: fire the haptic on the frame the visual *lands* (A11), not on gesture start or animation completion. Pair intensity with motion: soft for gentle landings, rigid for crisp snaps [HIG-Haptics "match the intensity and sharpness"].

---

## 5. Sources

Fetched OK (primary). HIG via `…/tutorials/data/design/human-interface-guidelines/<slug>.json`; videos via `developer.apple.com/videos/play/…` transcript; docs via `…/tutorials/data/documentation/<path>.json`.

**HIG**
- [HIG-Motion] https://developer.apple.com/design/human-interface-guidelines/motion (Sep 9 2025 Liquid Glass update)
- [HIG-Haptics] https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- [HIG-Audio] https://developer.apple.com/design/human-interface-guidelines/playing-audio
- [HIG-SFSymbols] https://developer.apple.com/design/human-interface-guidelines/sf-symbols (Jul 28 2025 Draw/gradients)
- [HIG-Materials] https://developer.apple.com/design/human-interface-guidelines/materials
- [HIG-Feedback] https://developer.apple.com/design/human-interface-guidelines/feedback
- [HIG-Loading] https://developer.apple.com/design/human-interface-guidelines/loading
- [HIG-Launching] https://developer.apple.com/design/human-interface-guidelines/launching
- [HIG-A11y] https://developer.apple.com/design/human-interface-guidelines/accessibility
- [HIG-LA] https://developer.apple.com/design/human-interface-guidelines/live-activities (Oct 13 2026)
- [HIG-Widgets] https://developer.apple.com/design/human-interface-guidelines/widgets (Oct 13 2026)
- [HIG-ScrollViews] https://developer.apple.com/design/human-interface-guidelines/scroll-views (Jun 8 2026)
- [HIG-Sheets] https://developer.apple.com/design/human-interface-guidelines/sheets
- [HIG-Modality] https://developer.apple.com/design/human-interface-guidelines/modality
- [HIG-TabBars] https://developer.apple.com/design/human-interface-guidelines/tab-bars
- [HIG-Toolbars] https://developer.apple.com/design/human-interface-guidelines/toolbars
- going-full-screen: https://developer.apple.com/design/human-interface-guidelines/going-full-screen
- [HIG-Principles] https://developer.apple.com/design/human-interface-guidelines/design-principles (reintroduced Jun 8 2026)
- gestures: https://developer.apple.com/design/human-interface-guidelines/gestures
- generative-ai (fetched, not cited for specifics)
- [whatsnew] https://developer.apple.com/design/whats-new/

**WWDC** (transcripts parsed)
- [WWDC18-803] Designing Fluid Interfaces. https://developer.apple.com/videos/play/wwdc2018/803/
- [WWDC19-810] Designing Audio-Haptic Experiences. https://developer.apple.com/videos/play/wwdc2019/810/
- [WWDC21-10278] Practice audio haptic design. https://developer.apple.com/videos/play/wwdc2021/10278/
- [WWDC23-10156] Explore SwiftUI animation. https://developer.apple.com/videos/play/wwdc2023/10156/
- [WWDC23-10157] Wind your way through advanced animations in SwiftUI. https://developer.apple.com/videos/play/wwdc2023/10157/
- [WWDC23-10158] Animate with springs. https://developer.apple.com/videos/play/wwdc2023/10158/
- [WWDC23-10258] Animate symbols in your app. https://developer.apple.com/videos/play/wwdc2023/10258/
- WWDC23-10197 What's new in SF Symbols 5. https://developer.apple.com/videos/play/wwdc2023/10197/
- [WWDC23-10194] Design dynamic Live Activities. https://developer.apple.com/videos/play/wwdc2023/10194/
- [WWDC24-10188] What's new in SF Symbols 6. https://developer.apple.com/videos/play/wwdc2024/10188/
- [WWDC24-10145] Enhance your UI animations and transitions. https://developer.apple.com/videos/play/wwdc2024/10145/
- [WWDC24-10151] Create custom visual effects with SwiftUI. https://developer.apple.com/videos/play/wwdc2024/10151/
- [WWDC25-219] Meet Liquid Glass. https://developer.apple.com/videos/play/wwdc2025/219/
- [WWDC25-356] Get to know the new design system. https://developer.apple.com/videos/play/wwdc2025/356/
- [WWDC25-323] Build a SwiftUI app with the new design. https://developer.apple.com/videos/play/wwdc2025/323/
- [WWDC25-284] Build a UIKit app with the new design. https://developer.apple.com/videos/play/wwdc2025/284/
- [WWDC25-337] What's new in SF Symbols 7. https://developer.apple.com/videos/play/wwdc2025/337/

**WWDC26** (iOS 27 cycle). There is no dedicated animation or haptics session. Motion-relevant sessions:
- [WWDC26-250] Principles of great design. https://developer.apple.com/videos/play/wwdc2026/250/
- [WWDC26-251] Communicate your brand identity on iOS. https://developer.apple.com/videos/play/wwdc2026/251/
- [WWDC26-269] What's new in SwiftUI (toolbarMinimizeBehavior, swipeActionsContainer). https://developer.apple.com/videos/play/wwdc2026/269/
- [WWDC26-322] Compose advanced graphics effects with SwiftUI. https://developer.apple.com/videos/play/wwdc2026/322/
- [WWDC26-220] Refine accessibility for custom controls. https://developer.apple.com/videos/play/wwdc2026/220/
- WWDC26-223 Live Activities essentials. https://developer.apple.com/videos/play/wwdc2026/223/
- WWDC26-277 WidgetKit foundations. https://developer.apple.com/videos/play/wwdc2026/277/
- WWDC26-278, 321 (fetched; little motion content)

**Apple developer docs** [docs] (fetched JSON)
- **Animation presets:** `Animation.smooth/snappy/bouncy` (+ `duration:extraBounce:` defaults 0.5 / 0), `Animation.default` (response 0.55, damping 1.0), `interactiveSpring` (0.15 / 0.86 / 0.25), `spring(response:dampingFraction:)` (0.5 / 0.825).
- **Spring model:** `Spring`, with conversion example 0.5/0.3 ↔ 1 / 157.9 / 17.6.
- **Feedback:** `SensoryFeedback`, `sensoryFeedback(_:trigger:)`, `UIImpactFeedbackGenerator.FeedbackStyle`, `UINotificationFeedbackGenerator.FeedbackType`, `UISelectionFeedbackGenerator`.
- **Liquid Glass:** `Glass`, `Glass.interactive`, `glassEffect(_:in:)`, `glassEffectID`, `GlassEffectContainer`, `GlassEffectTransition` (identity / matchedGeometry / materialize).
- **Navigation, scroll and transitions:** `zoom(sourceID:in:)`, `navigationTransition`, `matchedTransitionSource`, `scrollTransition`, `scrollEdgeEffectStyle`, `tabBarMinimizeBehavior`, `ScrollTargetBehavior`, `UIScrollView.DecelerationRate`, `ContentTransition`, `numericText(countsDown:)`, `AnyTransition`.
- **Multi-step animation and effects:** `phaseAnimator`, `keyframeAnimator`, `symbolEffect(_:options:value:)`, `backgroundExtensionEffect`.
- **Accessibility settings:** `accessibilityReduceMotion`, `accessibilityPlayAnimatedImages`, `accessibilityDimFlashingLights`, `UIAccessibility.isReduceMotionEnabled / prefersCrossFadeTransitions / isVideoAutoplayEnabled`.

**Installed source (read locally)**
- react-native-reanimated 4.1.7 `springConfigs.ts`, `springUtils.ts` (perceptual duration ×1.5, energyThreshold, defaults, ReduceMotion.System).
- expo-haptics 15 types (5 impact styles, 3 notification types, no intensity).
- expo-router `NativeTabs` types (`minimizeBehavior` automatic / never / onScrollDown / onScrollUp).
- react-native-screens 4.16 (`formSheet`, detents).
- RN 0.81 `AccessibilityInfo` (`prefersCrossFadeTransitions`, `isReduceTransparencyEnabled`).
- expo GitHub sdk-54: expo-symbols `AnimationType = 'bounce'|'pulse'|'scale'`; expo-glass-effect `GlassStyle`, `isInteractive`, `tintColor`, `GlassContainer spacing`. npm registry for package existence.

**Failed / not available**
- Doc pages 404: `Animation.spring(duration:bounce:blendDuration:)`, `Symbols/BounceEffect`, `Symbols/DrawOnEffect` (symbol docs live under a different path), `toolbarMinimizeBehavior(_:for:)`.
- No WWDC26 session dedicated to animation, springs or haptics was found in the WWDC26 catalog (138 entries scanned).

**Unverified items (not confirmed from a primary source in this pass)**
- Exact bounce constants of `.snappy` (0.15) and `.bouncy` (0.3).
- The momentum-projection formula (shown on a WWDC18 slide; not in the transcript text).
- iOS rendering of `SensoryFeedback.start/stop/increase/decrease` on iPhone.
- Zoom-transition support in react-native-screens.
- @expo/ui / third-party context-menu and reorder APIs.
- expo-audio `interruptionMode` option name.
- RN `Vibration` iOS fixed-duration behaviour.
- SF Symbols 7 SwiftUI API names for variable draw and gradient.
- `Text(timerInterval:)` and WidgetKit transition API names.
- Rubber-band curve constants.
- RN APIs for Dim Flashing Lights and animated-image settings (none found).
- The Increase Contrast mapping in RN.
