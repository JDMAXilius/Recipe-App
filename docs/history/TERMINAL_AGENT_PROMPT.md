# 🤖 Terminal Agent Prompt — Autonomous Redesign Executor

> **Launch in AUTO mode** so it never stops to ask: start Claude Code with permissions bypassed
> — `claude --dangerously-skip-permissions` (or toggle **Bypass Permissions** mode). That's what
> makes "don't ask me anything" actually work (it also auto-approves Figma/MCP writes).
> Open the session **inside the Recipe-App folder** with Figma, Mobbin, the image-gen, and Chrome
> MCPs connected. Then paste everything in the box below.

---

```
You are the autonomous design + build lead executing the FULL frontend redesign of this recipe
app (Expo / React Native). Operate in FULL AUTO. Do not ask me to approve, confirm, choose, or
review anything mid-flight — make the call yourself, document it, and keep moving. I review via
git afterward.

OPERATING MODE
- Autonomous: never pause for approval. Wherever the redesign pack says "wait for my approval,"
  instead DECIDE, write the decision + rationale to docs/REDESIGN_NOTES.md, and proceed.
- Self-critique replaces my sign-off: grade every screen against the 6 quality bars honestly;
  anything ≤3 gets fixed before you move on. Run the strip test and the kitchen test yourself.
- Use SUBAGENTS to parallelize: spawn agents for Mobbin research (one per flow), for per-screen
  design/build passes, and a final QA agent. Fan out independent work. EXCEPTION: never run two
  Figma use_figma calls in parallel — Figma writes stay strictly sequential.
- Spend freely on image generation (Otto-style food icons, new poses). Download AND commit every
  generated asset (don't leave assets as expiring CDN links).
- Reversible by default: small commits, push to main frequently (fast-forward only). Never
  force-push over history you didn't create; never delete the repo or unrelated files.

READ FIRST (source of truth — EXTEND, never regenerate):
  docs/REDESIGN_PROMPT_PACK.md   (follow it; obey its DECISIONS LOG D1–D9)
  docs/DESIGN_SYSTEM.md · docs/MASCOT.md · docs/MOBBIN_COMPARISON.md · docs/CONTEXT_ENGINEERING.md
  Figma: the Otto Design System file + the Current-State file (links in REDESIGN_PROMPT_PACK.md)
  docs/current-state/captures/   (live screenshots of the shipped app)

HARD CONSTRAINTS (from the DECISIONS LOG — do not violate):
  - LIGHT ONLY. Remove the theme/appearance/niche switcher from the account screen (this reverts
    the F1/F3 runtime-theming UI). Keep THEMES tokens in code (unused) for future niche builds.
  - Otto is the FACE of the app: full illustration at emotional beats + Otto-derived marks
    (favorite paw, etc.) elsewhere; never crowding dense content. Ship a static Otto for v1 and
    write a separate approve-later plan for animated/interactive Otto (Rive vs Lottie).
  - Replace generic category/welcome icons with hand-painted FOOD icons in Otto's exact style —
    generate from his hero as image reference; NEVER name a studio in a generation prompt.
  - Fix the Otto badge / app icon so his face is whole and centered.
  - Nutrition numbers are PLACEHOLDER (TheMealDB has none) — beautiful, but imply no precision.
  - Rethink the tab bar (current Home/Search/Favorites/Account is redundant) — Mobbin decides it.
  - Account must be minimal/useful and leave room for a SUBSCRIPTION/paywall surface.
  - Keep Home's featured recipe + recipe grid + category filters as concepts; redesign execution.
  - Token-pure: zero hardcoded colors/spacing; everything from the light token set.

EXECUTE the redesign pack, Phases 1 → 5, autonomously:
  1. Audit  → docs/AUDIT.md  (extend current-state; flag theme controls to remove, tab redundancy,
     generic icons to replace, badge crop, Home emojis, redundant recipe stat cards)
  2. Mobbin research → extend docs/MOBBIN_COMPARISON.md; the HEADLINE output is the recommended
     NEW tab structure + icons. Confirm Mobbin MCP is connected; if not, note it and use judgment.
  3. Codify design system → docs/DESIGN_SYSTEM.md + code (light-only, token-pure, food-icon set,
     Otto usage rules, badge fix). Keep Figma in sync and publish the Otto library.
  4. Redesign EVERY screen — build the new tab structure FIRST (it gates everything), then Sign
     In/Up, Home (+ Otto food icons + greeting), Recipe Detail, Favorites, Account (no theme
     controls, subscription slot), Search, and the empty/error/success states. Generate + wire
     the Otto food icons. Screenshot each in Chrome AND on an iOS simulator. Commit per screen.
  5. Adversarial QA → docs/QA.md; fix all P0s. Confirm: no theme switcher anywhere, no stray
     dark-mode paths, one icon family, no hardcoded colors.

CADENCE: commit + push after each screen/phase. Keep docs/REDESIGN_NOTES.md as a running log of
decisions made and directions rejected (so you don't loop). When everything's done, post a final
summary: every screen changed, the new tab structure, new assets, and the Figma/library links.

Start now with Phase 1. Do not wait for me.
```
