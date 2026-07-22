// import-recipe — URL → recipe draft via schema.org JSON-LD. Deterministic, no
// LLM. Faithful port of backend/src/lib/importRecipe.js including the SSRF
// guard: the endpoint fetches arbitrary user URLs and must never reach private
// address space (cloud metadata, localhost, LAN) — directly or via redirect.
// Resolve-then-connect: every hop's hostname is DNS-resolved and every
// resolved address checked against private/reserved ranges before fetching.
import { z } from "npm:zod@4";
import { getUserId, json, preflight } from "../_shared/http.ts";

const bodySchema = z.object({ url: z.string().trim().url().max(2000) });

// ---- SSRF guardrails ----------------------------------------------------
const MAX_BYTES = 3 * 1024 * 1024; // recipe pages are big; 3MB is generous
const MAX_REDIRECTS = 4;

function isPrivateV4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = octets;
  return (
    a === 127 ||
    a === 10 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateAddress(address: string): boolean {
  if (address.includes(":")) {
    const a = address.toLowerCase();
    // IPv4-mapped (::ffff:1.2.3.4) → judge the embedded IPv4.
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateV4(mapped[1]);
    return (
      a === "::" ||
      a === "::1" ||
      a.startsWith("fe80") ||
      a.startsWith("fc") ||
      a.startsWith("fd")
    );
  }
  return isPrivateV4(address);
}

async function assertPublicHost(target: URL): Promise<void> {
  const host = target.hostname.replace(/^\[|\]$/g, ""); // [::1] → ::1
  // literal IP — no DNS to trust
  if (/^[\d.]+$/.test(host) || host.includes(":")) {
    if (isPrivateAddress(host)) throw new Error("Blocked address");
    return;
  }
  const results: string[] = [];
  for (const type of ["A", "AAAA"] as const) {
    try {
      results.push(...(await Deno.resolveDns(host, type)));
    } catch {
      // no records of this type — the other may exist
    }
  }
  if (!results.length || results.some(isPrivateAddress)) {
    throw new Error("Blocked address");
  }
}

async function fetchPublicHtml(startUrl: URL): Promise<{ html: string; finalUrl: URL }> {
  let target = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!/^https?:$/.test(target.protocol)) throw new Error("Only http(s) URLs");
    await assertPublicHost(target);
    const response = await fetch(target.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: {
        // some recipe sites 403 the default UA
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) OttoRecipeReader/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location) throw new Error("Broken redirect");
      target = new URL(location, target); // re-validated on next hop
      continue;
    }
    if (!response.ok) throw new Error(`Page answered ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/.test(type)) throw new Error("Not an HTML page");
    // stream with a hard byte cap — never buffer an unbounded body
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(Math.min(total, MAX_BYTES + 65536));
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { html: new TextDecoder().decode(merged.subarray(0, offset)), finalUrl: target };
  }
  throw new Error("Too many redirects");
}

// ---- JSON-LD extraction (port of importRecipe.js) -------------------------
// One unit vocabulary — copied from backend/src/lib/nutrition/parseIngredient.js
// (the engine port owns the canonical copy; keep in sync via the contract).
const UNIT_WORDS =
  "cups?|cup|tablespoons?|tbsps?|tbsp|tbls?p?|tbs|teaspoons?|tsps?|tsp|grams?|g|kgs?|kg|milliliters?|mls?|ml|liters?|litres?|l|ounces?|oz|pounds?|lbs?|lb|quarts?|qts?|pints?|pts?|cloves?|cans?|tins?|slices?|rashers?|sticks?|leaf|leaves|pinch(?:es)?|dash(?:es)?|handfulls?|handfuls?|pieces?|sprigs?|bunch(?:es)?|packets?|packages?|jars?|heads?|stalks?|fillets?|knobs?|drops?|splash(?:es)?";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// "2 1/2 cups plain flour" → { measure: "2 1/2 cups", name: "plain flour" }
export function splitIngredientLine(line: unknown): { measure: string; name: string } {
  const text = decodeEntities(String(line)).replace(/\s+/g, " ").trim();
  const match = text.match(
    new RegExp(
      `^((?:\\d+\\s+\\d+[\\/⁄]\\d+|\\d+[\\/⁄]\\d+|\\d+(?:[.,]\\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\\s*[-–]\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:${UNIT_WORDS})?\\.?)\\s+(?:of\\s+)?(.+)$`,
      "i",
    ),
  );
  if (match) return { measure: match[1].trim(), name: match[2].trim() };
  return { measure: "", name: text };
}

// deno-lint-ignore no-explicit-any
function firstString(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return decodeEntities(value).trim();
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === "object") return firstString(value.url || value.name || value["@id"]);
  return null;
}

// deno-lint-ignore no-explicit-any
function flattenInstructions(value: any, out: string[] = []): string[] {
  if (!value) return out;
  if (typeof value === "string") {
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

// deno-lint-ignore no-explicit-any
function parseYield(value: any): number | null {
  const s = firstString(value);
  if (!s) return null;
  const n = parseInt(String(s).match(/\d+/)?.[0] ?? "", 10);
  return Number.isFinite(n) && n > 0 && n <= 48 ? n : null;
}

// deno-lint-ignore no-explicit-any
function findRecipeNode(node: any): any {
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

function splitOversizedStep(step: string, max = 2000): string[] {
  if (step.length <= max) return [step];
  const out: string[] = [];
  let current = "";
  for (const sentence of step.match(/[^.!?]+[.!?]*\s*/g) || [step]) {
    if (current && current.length + sentence.length > max) {
      out.push(current.trim());
      current = "";
    }
    current += sentence.length > max ? sentence.slice(0, max) : sentence;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

async function importRecipeFromUrl(url: string) {
  const start = new URL(url);
  const { html, finalUrl } = await fetchPublicHtml(start);
  const target = finalUrl;

  // deno-lint-ignore no-explicit-any
  let recipe: any = null;
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
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

  // Clamp to the save schema's limits — the import must never hand the editor
  // a draft the recipes INSERT would reject.
  const ingredients = (recipe.recipeIngredient || recipe.ingredients || [])
    .map((line: unknown) => splitIngredientLine(line))
    .filter((p: { name: string }) => p.name)
    .slice(0, 100)
    .map((p: { measure: string; name: string }) => ({
      measure: p.measure.slice(0, 80),
      name: p.name.slice(0, 200),
    }));
  const steps = flattenInstructions(recipe.recipeInstructions)
    .filter(Boolean)
    .flatMap((s) => splitOversizedStep(s))
    .slice(0, 60);
  const sourceName =
    firstString(recipe.publisher?.name) ||
    firstString(recipe.author?.name || recipe.author) ||
    target.hostname.replace(/^www\./, "");

  const clamp = (s: unknown, max: number) => (s == null ? null : String(s).slice(0, max));
  return {
    title: clamp(firstString(recipe.name), 300) || "Untitled recipe",
    image: clamp(firstString(recipe.image), 2000),
    servings: parseYield(recipe.recipeYield),
    category: clamp(firstString(recipe.recipeCategory), 100),
    area: clamp(firstString(recipe.recipeCuisine), 100),
    ingredients,
    steps,
    sourceUrl: clamp(target.href, 2000),
    sourceName: clamp(sourceName, 200),
  };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json(400, { error: "Invalid url" });

  try {
    const draft = await importRecipeFromUrl(parsed.data.url);
    if (!draft) return json(422, { error: "No recipe found on that page" });
    return json(200, draft);
  } catch (error) {
    console.warn("import failed", (error as Error).message); // message only — never the key material
    return json(422, { error: "Couldn't read that page" });
  }
});
