// URL → recipe draft via schema.org JSON-LD (the format virtually every
// recipe site publishes for Google). Deterministic — no LLM. Returns null
// when no Recipe object exists so the client can fall back to manual entry
// with honesty ("Otto couldn't read that page") instead of guessing.

import { UNIT_WORDS } from "./nutrition/parseIngredient.js"; // one unit vocabulary, one place (B1.1)

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

// ---- SSRF guardrails --------------------------------------------------
// The endpoint fetches arbitrary user URLs; never let it reach private
// address space (cloud metadata, localhost, LAN) — directly or via redirect.
import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 3 * 1024 * 1024; // recipe pages are big; 3MB is generous
const MAX_REDIRECTS = 4;

function isPrivateAddress(address) {
  if (net.isIPv6(address)) {
    const a = address.toLowerCase();
    return (
      a === "::1" ||
      a.startsWith("fe80") ||
      a.startsWith("fc") ||
      a.startsWith("fd") ||
      a.startsWith("::ffff:127.") ||
      a.startsWith("::ffff:10.") ||
      a.startsWith("::ffff:192.168.")
    );
  }
  const octets = address.split(".").map(Number);
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

async function assertPublicHost(target) {
  if (net.isIP(target.hostname)) {
    if (isPrivateAddress(target.hostname)) throw new Error("Blocked address");
    return;
  }
  const results = await lookup(target.hostname, { all: true });
  if (!results.length || results.some((r) => isPrivateAddress(r.address))) {
    throw new Error("Blocked address");
  }
}

export async function fetchPublicHtml(startUrl) {
  let target = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!/^https?:$/.test(target.protocol)) throw new Error("Only http(s) URLs");
    await assertPublicHost(target);
    const response = await fetch(target.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: {
        // some recipe sites 403 the default undici UA
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) OttoRecipeReader/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Broken redirect");
      target = new URL(location, target); // re-validated on next hop
      continue;
    }
    if (!response.ok) throw new Error(`Page answered ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/.test(type)) throw new Error("Not an HTML page");
    // stream with a hard byte cap — never buffer an unbounded body
    const reader = response.body.getReader();
    const chunks = [];
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
    return { html: Buffer.concat(chunks).toString("utf8"), finalUrl: target };
  }
  throw new Error("Too many redirects");
}

// A single-paragraph instruction blob > 2000 chars gets split at sentence
// boundaries so every piece fits the save schema.
function splitOversizedStep(step, max = 2000) {
  if (step.length <= max) return [step];
  const out = [];
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

export async function importRecipeFromUrl(url) {
  const start = new URL(url); // throws on garbage — caller maps to 400
  const { html, finalUrl } = await fetchPublicHtml(start);
  const target = finalUrl;

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

  // Clamp to the save schema's limits (validate.js) — the import must never
  // hand the editor a draft that POST /api/recipes will reject (QA P2-4).
  const ingredients = (recipe.recipeIngredient || recipe.ingredients || [])
    .map((line) => splitIngredientLine(line))
    .filter((p) => p.name)
    .slice(0, 100)
    .map((p) => ({ measure: p.measure.slice(0, 80), name: p.name.slice(0, 200) }));
  const steps = flattenInstructions(recipe.recipeInstructions)
    .filter(Boolean)
    .flatMap(splitOversizedStep)
    .slice(0, 60);
  const sourceName =
    firstString(recipe.publisher?.name) ||
    firstString(recipe.author?.name || recipe.author) ||
    target.hostname.replace(/^www\./, "");

  const clamp = (s, max) => (s == null ? s : String(s).slice(0, max));
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
