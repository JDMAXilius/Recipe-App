// URL → recipe draft via schema.org JSON-LD (the format virtually every
// recipe site publishes for Google). Deterministic — no LLM. Returns null
// when no Recipe object exists so the client can fall back to manual entry
// with honesty ("Otto couldn't read that page") instead of guessing.

const UNIT_WORDS =
  "cups?|cup|tablespoons?|tbsps?|tbsp|teaspoons?|tsps?|tsp|grams?|g|kgs?|kg|milliliters?|mls?|ml|liters?|litres?|l|ounces?|oz|pounds?|lbs?|lb|cloves?|cans?|tins?|slices?|sticks?|pinch(?:es)?|dash(?:es)?|handfuls?|pieces?|sprigs?|bunch(?:es)?|packets?|packages?|jars?|heads?|stalks?|fillets?|knobs?|drops?";

// "2 1/2 cups plain flour" → { measure: "2 1/2 cups", name: "plain flour" }
export function splitIngredientLine(line) {
  const text = decodeEntities(String(line)).replace(/\s+/g, " ").trim();
  const match = text.match(
    new RegExp(
      `^((?:\\d+\\s+\\d+[\\/⁄]\\d+|\\d+[\\/⁄]\\d+|\\d+(?:[.,]\\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\\s*[-–]\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:${UNIT_WORDS})?\\.?)\\s+(?:of\\s+)?(.+)$`,
      "i"
    )
  );
  if (match) return { measure: match[1].trim(), name: match[2].trim() };
  return { measure: "", name: text };
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function firstString(value) {
  if (!value) return null;
  if (typeof value === "string") return decodeEntities(value).trim();
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === "object") return firstString(value.url || value.name || value["@id"]);
  return null;
}

function flattenInstructions(value, out = []) {
  if (!value) return out;
  if (typeof value === "string") {
    // some sites cram all steps into one HTML-ish string
    decodeEntities(value)
      .split(/<\/?(?:li|p|br)[^>]*>|\n+/i)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .forEach((s) => out.push(s));
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => flattenInstructions(v, out));
    return out;
  }
  if (typeof value === "object") {
    if (value["@type"] === "HowToSection") return flattenInstructions(value.itemListElement, out);
    const text = value.text || value.name;
    if (text) out.push(decodeEntities(String(text)).replace(/<[^>]+>/g, "").trim());
    return out;
  }
  return out;
}

function parseYield(value) {
  const s = firstString(value);
  if (!s) return null;
  const n = parseInt(String(s).match(/\d+/)?.[0], 10);
  return Number.isFinite(n) && n > 0 && n <= 48 ? n : null;
}

function findRecipeNode(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Recipe")) return node;
  if (node["@graph"]) return findRecipeNode(node["@graph"]);
  return null;
}

export async function importRecipeFromUrl(url) {
  const target = new URL(url); // throws on garbage — caller maps to 400
  if (!/^https?:$/.test(target.protocol)) throw new Error("Only http(s) URLs");

  const response = await fetch(target.href, {
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
    headers: {
      // some recipe sites 403 the default undici UA
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) OttoRecipeReader/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Page answered ${response.status}`);
  const html = await response.text();

  let recipe = null;
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const [, raw] of scripts) {
    try {
      recipe = findRecipeNode(JSON.parse(raw.trim()));
    } catch {
      // malformed block — keep scanning; many pages ship several
    }
    if (recipe) break;
  }
  if (!recipe) return null;

  const ingredients = (recipe.recipeIngredient || recipe.ingredients || [])
    .map((line) => splitIngredientLine(line))
    .filter((p) => p.name);
  const steps = flattenInstructions(recipe.recipeInstructions).filter(Boolean);
  const sourceName =
    firstString(recipe.publisher?.name) ||
    firstString(recipe.author?.name || recipe.author) ||
    target.hostname.replace(/^www\./, "");

  return {
    title: firstString(recipe.name) || "Untitled recipe",
    image: firstString(recipe.image),
    servings: parseYield(recipe.recipeYield),
    category: firstString(recipe.recipeCategory),
    area: firstString(recipe.recipeCuisine),
    ingredients,
    steps,
    sourceUrl: target.href,
    sourceName,
  };
}
