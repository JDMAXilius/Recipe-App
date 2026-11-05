# ADR-0014: AI-written recipe images are photorealistic food images, tagged "AI image"

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Juan (founder) · written by Claude
- **Supersedes:** decision 4 of ADR-0013 (painted illustrations)

## Context
ADR-0013 (accepted earlier on 2026-11-05) said recipes written by Otto AI get a painted illustration in Otto's style when no real photo exists. Juan changed his mind the same day: the image has to look like real food, generated with OpenAI. The older rule from 2026-07-21, "no AI food photography presented as real, ever" (`docs/history/REDESIGN_NOTES.md:718`), protected people from mistaking a generated picture for a real dish.

## Decision
1. When an AI-written recipe has no real photo, Otto generates a **photorealistic image of the dish** with OpenAI's image model, once per recipe, stored in Storage.
2. Order of preference stays: **the user's own photo → a catalogue photo of the same dish → a generated image.**
3. A generated image carries a small **"AI image"** tag wherever it appears (card, recipe hero, share card), and the recipe offers **"Snap your plate"** after cooking to replace it with a real photo. *(Tag recommended by Claude to keep the honesty rule's intent; Juan can drop it with a new record.)*
4. A generated image is never shown as the user's own dish, never used as a "result" photo after Snap any dish (the user's photo is used there), and never used in store screenshots or marketing as if it were a cooked Otto recipe.

## Consequences
- **Amends** the 2026-07-21 rule: generated food images are allowed, photoreal, as long as they are tagged and never passed off as a real dish.
- **Design:** image treatment (DESIGN_ROADMAP D1.13) gains the "AI image" tag style. Painted art stays for categories, mascot scenes and empty states.
- **Cost:** one image per new AI recipe, generated once and cached (estimate a few cents each; check current OpenAI image pricing before building). Images are never regenerated per view.
- **Review:** generated images go through the same content filtering as generated text (guideline 1.2); prompts never include people.
- **Privacy:** no user photo is sent to the image model; the prompt is built from the recipe text only.

## Options considered
- Painted illustrations (ADR-0013 decision 4; replaced by Juan, 2026-11-05).
- Photoreal with no tag (not chosen by default; open to Juan).
- No image (rejected: AI recipes would look unfinished next to catalogue recipes).
