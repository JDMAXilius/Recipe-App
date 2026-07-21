// Photo → recipe (API-8 seam #1): a cookbook page, a handwritten card, a
// screenshot, a printout — the user snaps or picks a photo and Otto copies
// the recipe off it into the same review-editor draft shape as every other
// import. DORMANT until ANTHROPIC_API_KEY lands in env, same C21 pattern.
//
// Honesty rules match the text extractor exactly (shared schema + shaping):
// an is_recipe gate refuses non-recipe photos, nothing is ever invented,
// the author's wording survives, and every draft lands on the review screen.
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../config/env.js";
import { logger } from "../logger.js";
import { EXTRACT_SCHEMA, shapeExtractedRecipe } from "./extractRecipe.js";

export const photoExtractionActive = () => Boolean(ENV.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }));

// Opus-tier: unlike the caption extractor (Haiku — the text is already
// text), the hard part HERE is reading the page: dense cookbook typography,
// handwriting, curled pages, screenshots of screenshots. The copy job is
// only as good as the eyes.
const MODEL = "claude-opus-4-8";

const SYSTEM = `You read a photo of a recipe — a cookbook page, a handwritten recipe card, a screenshot, or a printout — and copy the recipe into structured data.

Rules — these are non-negotiable:
- If the image does not actually show a written recipe (ingredients and/or method), set is_recipe to false and leave everything else empty. A photo of a finished dish, a menu, or a shopping list is NOT a recipe.
- Never invent anything. A field the page doesn't state is null (title, servings) or empty (an ingredient without a quantity gets measure ""). Do not guess quantities, servings, times, or steps you cannot read.
- Keep the author's wording for steps; fix only obvious artifacts (hyphenation across line breaks, OCR-style noise).
- measure holds the quantity + unit exactly as written ("2 cups", "1/2 tsp"); name holds the ingredient itself.
- If part of the page is cut off or unreadable, transcribe what you can read and reflect it in confidence — never fill the gap.
- confidence: high = clean, fully readable page; medium = readable but you had to interpret layout or handwriting; low = partly unreadable, the user must check every line.`;

// Claude's per-image cap is 5 MB decoded; base64 is 4/3 the size.
const MAX_IMAGE_B64_CHARS = 7_000_000;
const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function extractRecipeFromPhoto({ image, mediaType }) {
  if (!photoExtractionActive()) return null;
  const data64 = String(image || "").replace(/^data:[^,]*,/, "").trim();
  if (!data64 || data64.length > MAX_IMAGE_B64_CHARS || !MEDIA_TYPES.has(mediaType)) return null;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: EXTRACT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: data64 } },
          { type: "text", text: "Copy the recipe from this photo." },
        ],
      },
    ],
  });

  logger.info(
    { model: MODEL, usage: response.usage, stop: response.stop_reason },
    "photo extraction ran"
  );
  if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") return null;

  const textBlock = response.content.find((block) => block.type === "text");
  let parsed;
  try {
    parsed = JSON.parse(textBlock?.text ?? "");
  } catch {
    return null; // schema-constrained, so this shouldn't happen — null beats a guess
  }
  return shapeExtractedRecipe(parsed);
}
