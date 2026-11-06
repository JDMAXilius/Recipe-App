// Text-import and (legacy) vision-import pieces for generate-recipe. The image
// guard lives in _shared/image.ts (shared with scan-meal) and is re-exported
// here so existing imports keep working.
export { checkImage, IMAGE_MIMES, MAX_IMAGE_CHARS, type ImageCheck, type ImageMime } from "../_shared/image.ts";

// LEGACY (ADR-0015): recipe-page photo transcription. No current client sends
// it (the app's camera scans meals via scan-meal); kept only so builds ≤1.0.23
// keep working. Remove with R6.6 once they age out.
// Anchors transcription over invention; the weight-first + is_possible rules
// still come from SYSTEM (this rides on top of it).
export const VISION_INSTRUCTION =
  `This photo shows a recipe — a cookbook page, a handwritten card, or a screenshot. ` +
  `Transcribe it faithfully into the schema: keep the cook's own ingredients, quantities, and steps — ` +
  `don't invent, pad, or "improve" anything the photo doesn't show. Where an amount is written, express it ` +
  `weight-first (grams for solids, millilitres for thin liquids, tsp/tbsp with decimals for small amounts); ` +
  `leave measure "" for anything unmeasured. If the image isn't a readable recipe — not a recipe at all, or ` +
  `too blurry to read — set is_possible to false with a short, kind decline_reason.`;

// Pasted text (a note, an email, a TikTok/Instagram caption) → the same
// faithful transcription the photo path does, never a fresh invention. The
// one-shot {prompt} path frames its input as a *request* ("make me…"), which
// is wrong for someone else's recipe.
export const MAX_TEXT_CHARS = 8000;
export const TEXT_INSTRUCTION =
  `Below is recipe text someone pasted or shared: a note, a message, or a social media caption. ` +
  `Transcribe it faithfully into the schema: keep the cook's own ingredients, quantities, and steps. ` +
  `Don't invent, pad, or "improve" anything the text doesn't say. Ignore hashtags, emoji, and ` +
  `chatter that isn't part of the recipe. Where an amount is written, express it weight-first ` +
  `(grams for solids, millilitres for thin liquids, tsp/tbsp with decimals for small amounts); ` +
  `leave measure "" for anything unmeasured. If the method is only implied (a caption that lists ` +
  `ingredients and says "mix and bake"), write only the steps the text supports. If there is no ` +
  `recipe in it at all, set is_possible to false with a short, kind decline_reason.`;
