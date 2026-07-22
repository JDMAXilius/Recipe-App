// Vision-import pure bits for generate-recipe — no imports so both Deno (the
// edge fn) and `node --test` (imageMode.test.mjs) can load it. It answers one
// question: is this a base64 image Otto can hand to Claude, and if not, does it
// fail because it's oversized (413) or malformed (400)? The size cap is why
// this can't lean on the zod body the other two modes use — zod's max() failure
// doesn't tell us "too big" from "bad type".

export const MAX_IMAGE_CHARS = 10_000_000; // ~7 MB decoded; base64 is ~4/3 of bytes
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageMime = (typeof IMAGE_MIMES)[number];

export type ImageCheck =
  | { ok: true; image: string; mimeType: ImageMime }
  | { ok: false; status: 400 | 413 };

export function checkImage(image: unknown, mimeType: unknown): ImageCheck {
  if (typeof image !== "string" || image.length === 0) return { ok: false, status: 400 };
  if (image.length > MAX_IMAGE_CHARS) return { ok: false, status: 413 };
  if (typeof mimeType !== "string" || !IMAGE_MIMES.includes(mimeType as ImageMime)) {
    return { ok: false, status: 400 };
  }
  return { ok: true, image, mimeType: mimeType as ImageMime };
}

// Anchors transcription over invention; the weight-first + is_possible rules
// still come from SYSTEM (this rides on top of it).
export const VISION_INSTRUCTION =
  `This photo shows a recipe — a cookbook page, a handwritten card, or a screenshot. ` +
  `Transcribe it faithfully into the schema: keep the cook's own ingredients, quantities, and steps — ` +
  `don't invent, pad, or "improve" anything the photo doesn't show. Where an amount is written, express it ` +
  `weight-first (grams for solids, millilitres for thin liquids, tsp/tbsp with decimals for small amounts); ` +
  `leave measure "" for anything unmeasured. If the image isn't a readable recipe — not a recipe at all, or ` +
  `too blurry to read — set is_possible to false with a short, kind decline_reason.`;
