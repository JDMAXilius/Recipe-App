---
name: apple-gold-standard
description: Apple Human Interface Guidelines gold standard for designing, building or reviewing any iOS/iPadOS app (current to Liquid Glass / iOS 26 and the iOS 27 HIG cycle). Use whenever the task touches app UI or UX — screens, navigation, tab bars, toolbars, sheets, alerts, buttons, lists, forms, search, onboarding, sign-in, paywalls/subscriptions, permissions, notifications, widgets/Live Activities, accessibility, Dark Mode, typography, color, motion/animation/haptics, app flow maps, or App Store Review readiness — in SwiftUI, UIKit, React Native/Expo or Figma. Also use for "is this HIG-compliant", "review my app's UX", "design this screen the Apple way", "what animation should this be", "will this pass App Review".
---

# Apple gold standard

A packaged, paraphrased copy of Apple's Human Interface Guidelines (fetched 2026-11-03, iOS 27 cycle, Liquid Glass baseline), App Store Review Guidelines, a flow/scenario checklist, and a 148-entry motion catalog. The visual companion is the Figma file **"Apple Design Guidelines — Gold Standard"** (`jWn55Rq4u6cbukA2JeqOaI`): one page per HIG document with Apple's samples recreated, a component library, reference screens across app types (page 47), the standard app flow (48), the animated motion library (49) and a clickable prototype (50).

## How to use

1. **Find the documents that apply.** `references/HIG_INDEX.md` lists every document with a one-line summary, the Liquid Glass overview and the key numbers (hit targets, Dynamic Type table, contrast, icon sizes).
2. **Read the digest first** (`references/hig/<slug>.md`: best practices, iOS specifics, specs, do/don't), then the **full document** (`references/hig-full/<slug>.md`: every heading and paragraph in Apple's order, with Apple's sample images described as `[IMAGE: …]`) when you need detail or exact wording.
3. **Flows and scenarios:** `references/flows-and-scenarios.md` (canonical first-run order, Apple rules that shape a flow, the 23-scenario checklist). Proven app flows: `references/reference-app-flows.md`.
4. **Motion:** `references/motion-catalog.md` — principles, every animation family (springs, transitions, Liquid Glass, scroll, content, SF Symbol effects, gestures, feedback, loading, haptics, sound, system surfaces, accessibility), spring tokens for SwiftUI/Reanimated. Its §0 and §3–4 use the Otto app as a worked example; the catalog itself is generic.
5. **App Review:** `references/app-store-review-guidelines.txt` (full text). Search it for the rule number.
6. Paraphrase Apple; quote at most a short phrase. If a number isn't in these references, say it's unverified rather than guessing.

## Non-negotiables (check every design against these)

**Structure & navigation**
- Tab bar = navigation only, never an action. Keep it visible; don't hide or disable tabs (explain empty states); single-word labels; avoid a More overflow. On iOS 26+ it floats on Liquid Glass, search is a separate trailing tab, an accessory (e.g. mini player) is for persistent features, and it can minimize on scroll.
- Toolbars: group items by function, primary action separate and tinted, overflow in a More menu, no custom bar backgrounds; scroll edge effects replace hairlines.
- Push to go deeper; sheet for a short, simple task (medium/large detents; iOS 26 floats inset at medium); full-screen for multistep tasks or media; one modal at a time; confirm before discarding user input. Alerts sparingly, with clear verbs, destructive role marked.

**Liquid Glass**
- Glass is the control/navigation layer floating above content — never on content (cards, lists, backgrounds). No glass on glass. Regular glass by default; clear glass only over rich media, with a 35% dimming layer behind it over bright content. Tint sparingly (one primary action); brand color lives in the content layer. Concentric/capsule shapes. Reduce Transparency and Increase Contrast are handled by the system — don't fight them.

**Accessibility (always)**
- Hit targets ≥ 44×44 pt (minimum 28×28). Support Dynamic Type through AX sizes (default body 17 pt, minimum 11). Contrast ≥ 4.5:1 for text up to 17 pt, 3:1 at 18 pt+ or bold. VoiceOver labels, roles and hints on every control and meaningful image. Every animation has a Reduce Motion alternative (cross-fade, not just "off"). Don't convey meaning with color alone.

**First run, accounts, permissions, money**
- Launch screen looks like the first screen (no logo splash). Onboarding fast, optional, interactive; skipped once = never again. Restore state on relaunch.
- Ask for an account only when a feature needs it; offer Sign in with Apple at least as prominently as other logins (Review 4.8); in-app account deletion that really deletes (5.1.1(v)); apps without account features must work without login.
- Request permissions in context with a single-button primer; always provide a fallback when denied; never require push/location/tracking to use the app (5.1.1(iv), 4.5.4). Explicit consent before personal data goes to a third-party AI (5.1.2(i)).
- Paywall: say what people get, the billed amount most prominently, trial terms, Restore Purchases, working Terms + Privacy links, a clear close where a free tier exists; no bait-and-switch (3.1.1, 3.1.2). Never gate features behind ratings (3.2.2(x)); ask for ratings only after real engagement, via the system prompt.

**Motion & feedback**
- Motion is purposeful, brief and physics-based: springs for movement (start with bounce 0; be cautious above ~0.4), timing curves only for opacity/color. Every animation is interruptible and never blocks input. UI responses ≲ 0.5 s; celebrations are earned and rare. Haptics only for meaningful events, fired on the frame the visual lands, matched in intensity to the motion; prefer system components that play them for you.

## Review checklist (copy into the response when reviewing)
- [ ] Tabs navigate only; ≤ 5; labels; search tab; nothing hidden/disabled
- [ ] Correct presentation for each task (push / sheet / full screen / alert)
- [ ] Glass only on controls; no glass on glass; one tinted primary
- [ ] 44 pt targets; Dynamic Type to AX5 without truncation; contrast passes; VoiceOver complete
- [ ] Dark Mode and Increased Contrast look right
- [ ] Every motion has a Reduce Motion path; springs not canned curves; interruptible
- [ ] Permissions just-in-time with primer + denial fallback
- [ ] Sign in with Apple prominent; account deletion in app
- [ ] Paywall compliant (billed amount, trial, Restore, Terms, Privacy, close)
- [ ] All 23 scenarios in `flows-and-scenarios.md` have a designed state (offline, lapsed subscription, restore, deep link while signed out, empty states…)
- [ ] Loading shows content structure (skeletons), errors explain the fix
