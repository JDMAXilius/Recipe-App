# 🎬 Otto, Animated & Interactive — Proposal (D4, APPROVE BEFORE BUILDING)

> **Status: PROPOSAL — not part of the current redesign.** Per D4, v1 ships static Otto
> everywhere (see `DESIGN_SYSTEM.md` B6). This is the separate mini-plan for the animated
> upgrade, written so the founder can approve/reject it as a unit. Nothing below is built.

**Written:** 2026-07-14 (redesign Phase 3)

## 1. Scope — what "animated Otto" means (and doesn't)

**In:** one idle loop + four event reactions, all subtle, all skippable, all reduced-motion-aware.
**Out (permanently):** Otto following scroll, Otto commenting on browsing, screen-roaming,
voice/sound, blinking on every screen — anything that makes him a Clippy.

| Moment | Animation | Trigger |
|---|---|---|
| Discover greeting | idle: slow breath, occasional blink, steam wisp from pot (≤2 cpm) | screen focus |
| Save (first per session) | paw-stamp: Otto stamps the paw, tiny nod | save event |
| Cook-mode finish | Proud: straightens hat, chest up, 1.2s, once | finish event |
| Empty Saved | Sad→hopeful: looks up when the CTA is pressed | CTA press |
| Cold-start load | Sleepy: pot-lid rises/settles with breath | app launch |

## 2. Tech choice: Rive vs Lottie

| | **Rive** | **Lottie** |
|---|---|---|
| Interactivity | state machines — reactions blend from idle without cuts | fire-and-forget clips; blending = manual juggling |
| Runtime | `rive-react-native` (native lib; needs dev-build, fine — we're not Expo Go) | `lottie-react-native` (battle-tested) |
| Authoring | Rive editor (learn it; watercolor texture must be rebuilt as meshes/rasters) | After Effects + Bodymovin (contractor-friendly) |
| Fidelity risk | vector-first — hand-painted texture survives via raster meshes, needs care | excellent if exported from the painted frames |
| File size | tiny (~10–100KB per state machine) | small–medium per clip |

**Recommendation: Rive** — the whole point of D4 is *interactive* (reactions that interrupt idle
gracefully), which is exactly what Rive state machines do and Lottie doesn't. The real cost is
authoring: Otto's watercolor texture has to be reconstructed as layered raster meshes in the Rive
editor (est. 2–4 days of dedicated art/rig work for the five moments, likely a contractor with
Rive experience). If that cost is rejected, the fallback is Lottie loops for idle+loading only
(no event reactions) at roughly half the effort — but that's "animated", not "interactive", and
should be judged as a different, smaller feature.

## 3. Guardrails (non-negotiable if approved)

- Reduced motion → static PNGs everywhere, no exceptions.
- Idle animations pause off-screen and under memory pressure; zero animation during scroll.
- Every reaction ≤1.5s, non-blocking, never delays navigation or data.
- Static PNG fallback renders first; animation swaps in when loaded (no layout shift).
- One animated Otto per screen, same as static rule.

## 4. Acceptance gate

Before merging: battery/perf pass on a mid-tier Android device; A/B the greeting idle for a week
against static — if session length or saves don't move, keep static (charm must pay rent).

## 5. Decision requested

- [ ] Approve Rive plan (idle + 4 reactions, contractor rig)
- [ ] Approve Lottie-lite fallback (idle + loading loops only)
- [ ] Reject for now (static Otto stays; revisit post-subscription launch)
