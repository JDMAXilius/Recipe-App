# ADR-0015: "Scan" means a meal; recipes come in by meal photo, free text, voice, or the editor

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Juan (founder) · written by Claude
- **Planning only:** nothing is removed or built yet; this records the target.

## Context
Today's Add screen (`src/features/import/AddSheet.tsx:197-205`) has four tiles: Paste a link, Paste text, **Snap a photo** (which photographs a recipe page or card, and the vision mode transcribes it: `supabase/functions/generate-recipe/imageMode.ts`, "vision mode (photo → transcribed recipe)", `index.ts:350`), and Write it myself. Juan (2026-11-05): the camera must only ever mean *scan a meal and Otto creates the recipe*. That is the magic moment (ADR-0013).

## Decision
1. **The camera scans meals only.** Remove photographing recipe pages, cards or screenshots to transcribe them. No barcode scanning. No text scanning. The vision path becomes Snap any dish (identify → confirm → retrieve → reconstruct → check → on-device nutrition).
2. **Recipes come in four ways:**
   - **Snap a meal**: the hero (ADR-0013).
   - **Write or paste**: one free box, like a note. Type a recipe in your own words or paste one from anywhere, and Otto structures it. No form and no fixed fields up front. (Today's "Paste text" path, made the default writing surface.)
   - **Say it**: talk through the recipe. On-device speech-to-text fills the same box, then Otto structures it. Same path as Write or paste.
   - **Write it yourself**: today's editor, made more dynamic: inline edits, add steps and ingredients in place, reorder by dragging, Otto fills the gaps on request.
3. All four end in the same review-first card (ingredients with amounts, steps, servings and unit, `~` nutrition) before saving.
4. **Open question for Juan:** keep **Paste a link** (websites, TikTok and Instagram captions)? It isn't scanning, so this record keeps it until Juan decides.

## Consequences
- Planned removal (ticket R6.6): the "Snap a photo" recipe-page tile, `VISION_INSTRUCTION`'s transcription prompt and decline rules in `imageMode.ts`, `useImportFromPhoto`'s page-transcription use, and the camera primer copy "Snap a cookbook page". These are replaced by the meal-scan pipeline.
- Figma screens that show "Snap a cookbook page" (Bring in a recipe, camera primer) are redesigned in the design roadmap.
- App privacy: photos sent to OpenAI are now only meal photos; the truth table re-audit covers it.
- Voice uses on-device recognition (no new audio disclosure); the text it produces goes to OpenAI only when structured, under the existing consent (ADR-0006).

## Options considered
- Keep recipe-page photo transcription as a second camera mode (rejected: it dilutes "scan" and the magic moment).
- Barcode scanning for packaged foods (rejected).
