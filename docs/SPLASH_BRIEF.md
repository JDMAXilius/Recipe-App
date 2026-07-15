# 🚀 Splash Brief — the launch moment (deep-think + art + video)

> The first frame of the app. What it should show, why, and the exact assets to make —
> a **still now**, a **short Otto video as a fast-follow**. Grounded in the Otto lock
> technique (`MASCOT.md §7`) and the state rules in `MOBBIN_COMPARISON.md §2.7`.

**Status:** v1 brief (cloud co-pilot). Light-only · Otto is the face.
**Reference for art gen:** hero id `5f74831c-0126-44d0-9dd8-731d331fb75a`.

---

## 1. What a splash is FOR (and what it isn't)
- **For:** imprint the brand in the ~1–2s of cold start, mask the JS/auth load, set the warm emotional tone. One held breath before the app.
- **Not for:** information, choices, taglines that ask anything, or a loader that reappears on every fetch. **One mascot, one wordmark, calm.** (Splash ≠ the sleepy-Otto *loader* in §2.7 — that's for in-flow waits; this is the cold-start brand beat, once per launch.)

## 2. The technical truth that decides "image first" (important)
The **very first frame is *always* a still image** — iOS/`expo-splash-screen` paints it *before*
React Native mounts, so it **cannot** be a video or an RN animation. A splash *video* can only
play as a **second stage**: an in-app animated splash that mounts after JS boots and then hands
off to the app.

So "image now, video later" isn't a compromise — the still is **permanently required** as frame
one. The video is an optional second beat layered on top. This is why we ship the still first and
treat the video as a fast-follow **that resolves into the exact same still** (seamless handoff, no
visual jump).

## 3. Decision
- **Now:** ship the **static brand still** (Otto + wordmark on cream) as the native splash. This is already partially in place (`otto-hero.png`) — upgrade it to a purpose-composed splash still.
- **Fast-follow:** a **2.5s Otto video** that plays once on cold start *after* mount, then dissolves to the still and reveals the app. Behind a "prefers-reduced-motion → skip to still" guard and tap-to-skip.
- **Why not video first:** can't (frame-one is a still), and generating/committing video is blocked by the CDN egress in this session — do it in the terminal. Placeholder still keeps the launch representable today.

## 4. What to show — deep-think

**Recommended still:** Otto **hero pose, centered** on `cream #FAF4EA`, the **"Otto" wordmark**
(Lora display) just beneath, a **faint curl of painted steam** rising behind the head, soft ground
shadow. Nothing else. The still doubles as the video's final frame.

**Rejection list (considered, cut):**
- ❌ **Tagline line** ("Recipes worth keeping") on the still — adds reading to a 1s frame; if wanted, it belongs on the *video's* resolve, not the native still. Keep still wordless-but-wordmark.
- ❌ **Food photography / recipe collage** — competes with Otto, ages fast, and every recipe app opens on food; Otto is the differentiator, so the splash is *him*.
- ❌ **Progress bar / percent / spinner** — a splash implies loading; chrome makes it feel slow. Let the held image carry it.
- ❌ **Niche/theme variants** — light-only, one brand (D2).
- ❌ **Looping animation** — a splash that never resolves reads as a hang; the video plays **once** then hands off.

**Video concept (the fast-follow):** one small, charming Otto action that ends on the lockup.
Recommended beat — **"the lid lift":** Otto lifts a pot lid, a curl of steam rises and gently
settles into the shape of the wordmark, Otto gives a tiny satisfied nod; hold on the final
still. 2.5s, warm, unhurried. (Alt beat: the clam-hold — Otto hugs a tomato to his belly and
looks up; simpler, cheaper.)

## 5. Mobbin gap (honesty)
Our prior Mobbin sweeps (`MOBBIN_COMPARISON.md`) covered auth, home, detail, saved, account, and
supporting states — **not** a dedicated launch/splash screen. Mobbin needs re-auth this session
(OAuth, non-interactive), so this brief reasons from the general pattern (static native splash →
optional animated logo reveal, e.g. mascot apps like Duolingo/Headspace) rather than fresh pulls.
**When Mobbin is re-authed, pull "splash / launch screen" for mascot apps to confirm the
lid-lift-resolves-to-lockup beat before producing the video.**

## 6. 🎨 Art prompt — the STILL (make this now, in the terminal)
```
[LOCK PHRASE — MASCOT.md §7: "…of the exact otter chef character from the reference
image. Reproduce the character IDENTICALLY — same face, same proportions, same
chestnut-brown fur and cream belly, same floppy white chef's hat, same terracotta
apron, same hand-painted watercolor/gouache storybook style. DO NOT redesign, restyle,
or simplify."]

SCENE: Otto standing centered, welcoming, facing viewer, cradling a fresh tomato
against his belly (signature clam-hold), a soft wisp of painted steam curling upward
behind his head. Simple warm cream background, faint painted ground shadow, warm
golden light.
COMPOSITION: vertical phone frame, Otto in the upper-center, GENEROUS clean space in
the lower third reserved for a wordmark (leave it empty — the wordmark is added in
app, not painted). Symmetrical, calm, iconic.
AVOID: 3D render, vinyl toy, flat vector, neon, busy background, food photos, UI
chrome, any text or letters in the image, logos, watermarks.
```
> The wordmark "Otto" (Lora) is composited in the app over the reserved lower third — do **not**
> bake text into the painting (keeps it reusable + avoids misspelled AI lettering).

## 7. 🎥 Video storyboard + prompt (fast-follow, terminal)
**Storyboard (2.5s, plays once, ends on the §6 still):**
1. `0.0–0.6s` — hold on cream, Otto steps in / settles (or fade-in from the still).
2. `0.6–1.6s` — Otto lifts a small pot lid; a curl of steam rises.
3. `1.6–2.2s` — the steam gathers and softly forms the wordmark space; Otto glances up, tiny nod.
4. `2.2–2.5s` — settle into the **exact final still** (frame-perfect match to §6), wordmark composited in app.

**Generation prompt (image-to-video, seed from the still):**
```
Animate the provided Otto still into a gentle 2.5-second hand-painted storybook moment.
Otto lifts a small pot lid; a soft curl of watercolor steam rises and drifts upward,
then settles; Otto gives a small, satisfied nod and looks warmly at the viewer. Keep the
character, palette, brushwork, floppy chef's hat and terracotta apron IDENTICAL to the
reference. Motion is slow, warm, and minimal — no camera shake, no fast cuts. End on a
calm, centered pose matching the reference still. Cream background throughout.
AVOID: morphing the character, changing colors, 3D look, fast motion, text, logos.
```
**Model:** Higgsfield `generate_video` (image-to-video), seed image = the §6 still, ~2.5s,
vertical. Review + pick best take in the terminal.

## 8. Technical notes (for the terminal)
- **Native splash (now):** `expo-splash-screen` via `app.json` → `splash` = the §6 still, `backgroundColor: "#FAF4EA"` (cream), `resizeMode: "contain"`. Must be a still PNG (`mobile/assets/splash/otto-splash.png`) + the required iOS sizes.
- **Animated second stage (later):** keep `SplashScreen.preventAutoHideAsync()` until fonts/auth resolve; mount an in-app `<SplashVideo>` (expo-video or a Rive/Lottie export) over the app; on end (or tap-skip, or reduced-motion) `hideAsync()` + fade to Discover/onboarding. **Total budget ≤ 2.5s**; never block the user if auth is slow — the app can boot behind the video.
- **Reduced motion:** `useReducedMotion()` → skip the video, show the still only.
- **Handoff seam:** the video's last frame must equal the native still pixel-for-pixel so there's no jump.
- ⚠️ **CDN egress:** still + video generate to the blocked cloudfront CDN — **generate/commit in the terminal**, manifest in `mobile/assets/splash/README.md`.

*End — splash brief. The screen right after this is `ONBOARDING_BRIEF.md` (first run) or Discover (returning).*
