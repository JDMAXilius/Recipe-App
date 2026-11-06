// Image body guard shared by every vision function — no imports so Deno and
// `node --test` both load it. One question: is this a base64 image Otto can
// hand to the model, and if not, is it oversized (413) or malformed (400)?
// The size cap is why this can't lean on zod: max() can't tell "too big" from
// "bad type".

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
