// scan-meal — Snap a meal (ADR-0013, ADR-0015): one photo of food → the recipe
// of the whole dish (2 slices of banana bread → the loaf, served by the slice).
// The model identifies and reconstructs; scan.ts checks the answer in code and
// gets one retry to fix what the checks found. Nutrition is NOT computed here:
// the app computes it on the device from the ingredient grams at save time.
//
// Auth: a signed-in user, Otto Club when REQUIRE_CLUB is on. The pre-account
// scan (3 per device, DeviceCheck/App Attest) is a separate step (R0.16).
// The photo is sent to OpenAI for this one call and not stored here.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getUserId, json, preflight, rateLimitedDurable, requireClub } from "../_shared/http.ts";
import { checkImage } from "../_shared/image.ts";
import { askJson, type ChatMessage, openaiActive } from "../_shared/openai.ts";
import { checkScan, SCAN_SCHEMA, SCAN_SYSTEM, shapeScan, type ScanRecipe } from "./scan.ts";

// ponytail: the model slug is the calibration knob; score changes against the
// photo calibration set (R6.5) before swapping it.
const MODEL = "gpt-5.1";
const TIMEOUT_MS = 55_000;
const LOST = "Otto couldn't work that dish out right now. Try again in a moment.";

async function ask(messages: ChatMessage[]) {
  return await askJson({ model: MODEL, system: SCAN_SYSTEM, schema: SCAN_SCHEMA, messages, maxTokens: 4000, effort: "medium" }, TIMEOUT_MS);
}

// The closest catalogue recipe by title, so the review card can point to
// Otto's own version. otto_recipes is readable by anon under RLS, so this uses
// the anon client, not the service role. Of the titles containing every word,
// the shortest is the closest ("Banana bread" over "Chocolate walnut banana
// bread"). Null when none.
async function closestCatalogue(dish: string): Promise<{ id: string; title: string } | null> {
  const words = dish.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const { data } = await anon
    .from("otto_recipes")
    .select("id, title:canonical->>title")
    .ilike("canonical->>title", `%${words.join("%")}%`)
    .limit(5);
  const rows = (data ?? []) as { id: string; title: string }[];
  const best = rows.sort((a, b) => a.title.length - b.title.length)[0];
  return best ? { id: best.id, title: best.title } : null;
}

function payload(r: ScanRecipe, checks: string[], closest: { id: string; title: string } | null) {
  return {
    // The draft fields the editor already reads (same shape as generate-recipe).
    title: r.dish,
    servings: r.servings.count,
    category: r.category,
    area: r.area,
    ingredients: r.ingredients,
    steps: r.steps,
    image: null,
    source: "otto",
    sourceUrl: null,
    sourceName: null,
    // Snap a meal extras.
    scan: {
      archetype: r.archetype,
      seen: r.seen,
      portion: r.portion,
      yield: r.yield,
      servingUnit: r.servings.unit,
      questions: r.questions,
      assumptions: r.assumptions,
      checks, // anything still off after the retry, shown to the user, never hidden
      closest,
    },
  };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });
  if (!openaiActive()) return json(503, { error: "Snap a meal isn't switched on yet." });

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  const club = await requireClub(userId);
  if (club) return club;
  if (await rateLimitedDurable(`scan:${userId}`, 10, 15 * 60 * 1000)) {
    return json(429, { error: "That's a lot of snaps. Give Otto a few minutes." });
  }

  const raw = await req.json().catch(() => null);
  const image = checkImage(raw?.image, raw?.mimeType);
  if (!image.ok) {
    return image.status === 413
      ? json(413, { error: "That photo's a bit big for Otto. Try a smaller shot." })
      : json(400, { error: "Invalid body" });
  }

  try {
    const first: ChatMessage = {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.image}` } },
        { type: "text", text: "Work out the recipe for this dish." },
      ],
    };
    const data = await ask([first]);
    let shaped = shapeScan(data);
    if (!shaped) return json(502, { error: LOST });
    if (!shaped.ok) return json(422, { error: shaped.decline });

    // One retry with the checks as feedback; whatever is still off is returned
    // as `checks` so the review card can say so.
    // A retry that fails (timeout, 5xx) keeps the first answer and its checks:
    // a reviewable recipe beats an error after a long wait.
    let checks = checkScan(shaped.recipe);
    if (checks.length) {
      try {
        const retry = shapeScan(await ask([
          first,
          { role: "assistant", content: JSON.stringify(data) },
          { role: "user", content: `Fix these problems and answer again in full:\n- ${checks.join("\n- ")}` },
        ]));
        if (retry?.ok) {
          shaped = retry;
          checks = checkScan(retry.recipe);
        }
      } catch (error) {
        console.error("scan retry failed", (error as Error).message);
      }
    }
    if (!shaped.ok) return json(502, { error: LOST });
    const closest = await closestCatalogue(shaped.recipe.dish).catch(() => null);
    return json(200, payload(shaped.recipe, checks, closest));
  } catch (error) {
    console.error("scan failed", (error as Error).message);
    return json(502, { error: LOST });
  }
});
