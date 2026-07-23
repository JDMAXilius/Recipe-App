# Otto — docs

Organized into four buckets so the living reference isn't lost in the build record.

## `tickets/` — ACTIVE work (read these first)
The live cloud↔terminal handoff docs. A ticket moves to `history/` when its work ships.
- **TERMINAL_TICKET_OTTO_RECIPES_KICKOFF.md** — ⏳ NEXT UP for the terminal: Phase 0 legal
  gate → Phase 1 snapshot → Phase 2 ten-recipe pilot
- **OWN_RECIPE_DB.md** — the otto-recipes data-ownership migration: verdict, research,
  medallion architecture, agent-crew map, phased roadmap, Phase 7 data-asset vision
- **NUTRITION_ACCURACY.md** — nutrition-accuracy tickets (T6 ✅, T1 mechanism ✅; the rest
  absorbed by OWN_RECIPE_DB — see its supersession note)

## `reference/` — the current v2 app
Read these to understand or work on Otto today.
- **ARCHITECTURE.md** — the codebase map (app/ + src/features + supabase)
- **API_ARCHITECTURE.md** — data access: RLS queries, Edge Functions, RPCs, Realtime
- **DESIGN_SYSTEM.md** — the authoritative design system (tokens, semantic ink, mascot)
- **CONTEXT_ENGINEERING.md** — how to navigate the tree + task→file map
- **SCREEN_MAP.md** · **MASCOT.md** · **FRAMEWORK.md** — screen/brand/framework reference
- **TESTING.md** · **SSO_SETUP.md** · **PROMPT_ENGINEERING.md** — testing, SSO setup, coding constraints
- **otto-feature-definition.md** · **otto-v2-direction-and-structure.md** — what Otto is + the v2 structure
- **contracts/** — the module/database/engine/ui/persistence/testing contracts

## `history/` — the build record (kept, not current)
How Otto was built and redesigned. Preserved for reference; may point at paths that have since moved.
- **REDESIGN_NOTES.md** — the decision log (every call, with rationale)
- **TERMINAL_TICKET_\*** · **REBUILD_\*** — the v2 rebuild tickets + process
- **V1_DESIGN_SPEC**, **V2_PARITY_\***, **AUDIT** — v1 spec + the v1→v2 parity work
- roadmaps, Mobbin/nutrition research, onboarding/splash briefs, PRD, website docs
- **archive/** · **figma/** — older tickets + the Figma board build script
- **captures/** — the v1 / redesign / store screenshots (images)

## `legal/`
Privacy policy + terms of service (Markdown + HTML).
