// otto-agent (1.2, "Otto plans your week"): the plan agent. The model reads
// the week, finds dinners and changes the plan through the action catalogue's
// plan tools; every write is logged in agent_actions with its inverse, so
// "Otto did" can show it and Undo can replay it.
//
// Boundaries, enforced here and not left to the prompt:
// - Every read and write uses THE PERSON'S TOKEN, so RLS decides (their rows).
// - A dish must come from the catalogue AND pass the household's allergies,
//   diet and skips (eligibleDinners, the first week's own filter). The filter
//   is the UNION of the account's answers and the phone's (the app sends its
//   cached prefs); if the account can't be read, nothing is planned. Never an
//   empty filter by accident.
// - Days, and the rows it touches, must be inside the 7-day window.
// - Caps per turn: 6 model rounds, 14 tool calls, 7 writes, a 110 s deadline.
// - A replayed requestId returns what it already did, without asking the
//   model again. A write whose log entry fails is undone on the spot.
// - Undo is claimed first (undone_at set only if still null), refuses when the
//   row changed since, and releases the claim if it can't run.
// Keys only from Deno.env; prompts and outputs are never logged.
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { getUserId, json, preflight, rateLimitedDurable, requireClub } from "../_shared/http.ts";
import { askTools, openaiActive, type ToolMessage } from "../_shared/openai.ts";
import manifest from "./tools.json" with { type: "json" };
import { eligibleDinners, type CatalogueDish } from "../../../src/features/onboarding/firstWeek.ts";
import { positionAtEnd } from "../../../src/features/planner/plan.list.ts";
import type { Allergen, Diet } from "../../../src/shared/allergens.ts";
import {
  agentTools,
  type Args,
  CAPS,
  checkArgs,
  cleanArgs,
  dayInWindow,
  idempotencyKey,
  inverseOf,
  PLAN_TOOLS,
  type PlanRow,
  type PlanTool,
  REQUEST_ID,
  shuffleKey,
  type Step,
  stillAsLeft,
  summaryOf,
  SYSTEM,
} from "./agent.ts";

const MODEL = "gpt-5.1";
const TOOLS = agentTools(manifest as never);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DEADLINE_MS = 110_000; // under the platform's 150 s
const ROUND_MS = 60_000;
const MAX_ITEMS = 40;

type Did = { id: number; summary: string; undoable: boolean };
type Filter = { diet: Diet; allergies: Allergen[]; skips: string[]; cuisines: string[] };

const DIET_RANK = new Map<string, number>([["none", 0], ["vegetarian", 1], ["vegan", 2]]);
const asDiet = (v: unknown): Diet => (typeof v === "string" && DIET_RANK.has(v) ? v : "none") as Diet;
const strictest = (a: Diet, b: Diet): Diet => ((DIET_RANK.get(a) ?? 0) >= (DIET_RANK.get(b) ?? 0) ? a : b);
const strings = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 40)).slice(0, max) : [];

function windowFrom(today: string): string[] {
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
}

// The person's "today" may differ from the server's by a day either way
// (time zones); anything further is refused.
function plausibleToday(today: unknown): today is string {
  if (typeof today !== "string" || !DAY.test(today)) return false;
  const diff = Math.abs(Date.parse(`${today}T12:00:00Z`) - Date.now());
  return Number.isFinite(diff) && diff < 36 * 60 * 60 * 1000;
}

async function readShelf(db: SupabaseClient, f: Filter): Promise<Map<string, CatalogueDish>> {
  const { data, error } = await db
    .from("otto_recipes")
    .select("id, title:canonical->>title, category:canonical->>category, area:canonical->>area, image:canonical->media->>image, ingredients:canonical->ingredients")
    .not("canonical->>category", "in", "(Dessert,Side,Breakfast,Starter)");
  if (error) throw new Error("catalogue unavailable");
  // deno-lint-ignore no-explicit-any
  const all: CatalogueDish[] = (data ?? []).filter((r: any) => r.title).map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    area: r.area,
    image: typeof r.image === "string" && r.image.startsWith("https://") ? r.image : null,
    ingredients: (r.ingredients ?? []).flatMap((i: { name?: string; key?: string; original?: string }) => [i.name, i.key, i.original].filter(Boolean)),
  }));
  return new Map(eligibleDinners(all, f).map((d) => [d.id, d]));
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const started = Date.now();

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  // deno-lint-ignore no-explicit-any
  const body: any = await req.json().catch(() => ({}));
  const isUndo = !!body && typeof body === "object" && "undo" in body;
  // Undo has its own allowance: running out of asks must never block undoing Otto.
  if (isUndo ? await rateLimitedDurable(`agent-undo:${userId}`, 60, 15 * 60 * 1000) : await rateLimitedDurable(`agent:${userId}`, 20, 15 * 60 * 1000)) {
    return json(429, { error: isUndo ? "That's a lot of undoing. Try again in a few minutes." : "Otto needs a breather: that's 20 requests in 15 minutes. Try again in a few minutes." });
  }
  const gate = await requireClub(userId);
  if (gate) return gate;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
    auth: { persistSession: false },
  });
  // ---- plan writes, shared by the agent loop and Undo ------------------------
  const ownRow = async (id: number): Promise<PlanRow | null> => {
    const { data } = await db.from("plan_entries").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    return (data as PlanRow | null) ?? null;
  };
  const endOfDay = async (day: string): Promise<number> => {
    const { data } = await db.from("plan_entries").select("id, position, created_at").eq("user_id", userId).eq("day", day);
    return positionAtEnd((data ?? []) as never);
  };

  let filter: Filter | null = null;
  let shelf: Map<string, CatalogueDish> | null = null;
  const getShelf = async () => (shelf ??= await readShelf(db, filter!));

  /** One plan write. `restoring` = Undo putting the person's own row back
   *  (it was theirs, so the catalogue filter and the window don't apply). */
  async function write(step: Step, restoring: boolean, days: string[]): Promise<{ before: PlanRow | null; created: PlanRow | null; title: string | null } | string> {
    const a = step.input;
    const dishFrom = async (recipeId: string) => {
      if (restoring) return { title: String(a.title ?? "A dish"), image: (a.image as string) ?? null, category: (a.category as string) ?? null };
      const d = (await getShelf()).get(recipeId);
      return d ? { title: d.title, image: d.image, category: d.category } : null;
    };
    const target = async () => {
      const before = await ownRow(Number(a.id));
      if (!before) return "That plan item isn't there any more.";
      if (!restoring && !dayInWindow(before.day, days)) return "Otto only changes the next 7 days.";
      return before;
    };
    switch (step.action) {
      case "put_in_plan": {
        const dish = await dishFrom(String(a.recipeId));
        if (!dish) return "That recipe isn't one this household can have. Use an id from find_dinners.";
        const position = restoring && typeof a.position === "number" ? a.position : await endOfDay(String(a.day));
        const { data, error } = await db.from("plan_entries").insert({
          user_id: userId, day: a.day, recipe_id: a.recipeId, title: dish.title, image: dish.image, category: dish.category,
          note: (a.note as string) ?? null, label: (a.label as string) ?? null, kind: restoring ? ((a.kind as string) ?? "recipe") : "recipe",
          cooked: restoring ? Boolean(a.cooked) : false, position,
        }).select().single();
        if (error || !data) return "Otto couldn't add that.";
        return { before: null, created: data as PlanRow, title: dish.title };
      }
      case "swap_in_plan": {
        const before = await target();
        if (typeof before === "string") return before;
        if (!restoring && (before.kind !== "recipe" || !before.recipe_id)) return "Otto only swaps a recipe for a recipe; that item is a note or a plan to eat out.";
        const dish = await dishFrom(String(a.recipeId));
        if (!dish) return "That recipe isn't one this household can have. Use an id from find_dinners.";
        const { error } = await db.from("plan_entries").update({
          recipe_id: a.recipeId, title: dish.title, image: dish.image, category: dish.category,
          note: restoring ? ((a.note as string) ?? null) : before.note, // the person's note stays
          cooked: restoring ? Boolean(a.cooked) : false, kind: restoring ? ((a.kind as string) ?? "recipe") : "recipe",
        }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't swap that." : { before, created: null, title: dish.title };
      }
      case "move_plan_item": {
        const before = await target();
        if (typeof before === "string") return before;
        const position = restoring && typeof a.position === "number" ? a.position : await endOfDay(String(a.day));
        const { error } = await db.from("plan_entries").update({ day: a.day, position }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't move that." : { before, created: null, title: before.title };
      }
      case "remove_from_plan": {
        const before = await target();
        if (typeof before === "string") return before;
        const { error } = await db.from("plan_entries").delete().eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't remove that." : { before, created: null, title: before.title };
      }
      case "mark_cooked": {
        const before = await target();
        if (typeof before === "string") return before;
        const { error } = await db.from("plan_entries").update({ cooked: a.cooked }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't change that." : { before, created: null, title: before.title };
      }
      case "label_plan_item": {
        const before = await target();
        if (typeof before === "string") return before;
        const { error } = await db.from("plan_entries").update({ label: a.label }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't label that." : { before, created: null, title: before.title };
      }
    }
  }

  // ---- Undo ------------------------------------------------------------------
  if (isUndo) {
    const id = Number(body.undo);
    if (!Number.isInteger(id) || id <= 0) return json(400, { error: "Invalid body" });
    const { data: row, error: rowError } = await db.from("agent_actions").select("id, inverse, summary").eq("id", id).maybeSingle();
    if (rowError) return json(503, { error: "Otto can't reach your plan right now. Try again in a moment." });
    if (!row) return json(404, { error: "Otto can't find that change." });
    const inv = row.inverse as Step | null;
    if (!inv || !(PLAN_TOOLS as readonly string[]).includes(inv.action)) return json(409, { error: "There's nothing to undo for that one." });
    // Claim it: only the first of two taps gets past this.
    const { data: claimed, error: claimError } = await db.from("agent_actions").update({ undone_at: new Date().toISOString() }).eq("id", id).is("undone_at", null).select("id");
    if (claimError) return json(503, { error: "Otto can't reach your plan right now. Try again in a moment." });
    if (!claimed?.length) return json(200, { ok: true, already: true });
    const release = () => db.from("agent_actions").update({ undone_at: null }).eq("id", id);
    try {
      if (inv.expect && !stillAsLeft(inv.expect, await ownRow(inv.expect.id))) {
        await release();
        return json(409, { error: "That dinner has changed since Otto made the change. Change it by hand on the plan." });
      }
      const result = await write(inv, true, []);
      if (typeof result === "string") {
        await release();
        return json(409, { error: result });
      }
      return json(200, { ok: true, summary: `Undid: ${row.summary}` });
    } catch (error) {
      // A throw must not leave it marked undone when nothing was put back.
      await release();
      console.error("otto-agent undo failed", (error as Error).message);
      return json(502, { error: "Otto couldn't undo that right now. Try again in a moment." });
    }
  }

  // ---- a chat turn ------------------------------------------------------------
  if (!openaiActive()) return json(503, { error: "Otto can't do that just yet. That part of the kitchen is still being wired up." });
  const turns = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
  const okTurns = turns.length > 0 && turns.every((t: { role?: unknown; content?: unknown }) =>
    (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim().length > 0 && t.content.length <= 600
  );
  if (!okTurns || turns[turns.length - 1].role !== "user") return json(400, { error: "Invalid body" });
  if (!plausibleToday(body.today)) return json(400, { error: "Invalid body" });
  const requestId = typeof body.requestId === "string" && REQUEST_ID.test(body.requestId) ? body.requestId : null;
  if (!requestId) return json(400, { error: "Invalid body" });
  const days = windowFrom(body.today);

  // One run per requestId. The first run claims a lock row (unique key); a
  // retry finds it and says what already happened instead of acting again. A
  // lock with no changes older than the deadline is a run that died before
  // doing anything, so the retry may go ahead.
  const LOCK = `${requestId}:lock`;
  const { error: lockError } = await db.from("agent_actions").insert({ idempotency_key: LOCK, action: "turn", input: {}, inverse: null, summary: "Planning" });
  if (lockError) {
    const { data: earlier, error: earlierError } = await db.from("agent_actions").select("id, summary, inverse, action, created_at")
      .like("idempotency_key", `${requestId}:%`).order("id");
    if (earlierError || !earlier) return json(503, { error: "Otto can't reach your plan right now. Try again in a moment." });
    const changes = earlier.filter((r) => r.action !== "turn");
    const lock = earlier.find((r) => r.action === "turn");
    const stale = !!lock && Date.now() - Date.parse(lock.created_at) > DEADLINE_MS + 10_000;
    if (changes.length || !stale) {
      return json(200, {
        message: changes.length ? "Otto got this far last time. Ask again for the rest." : "Otto is still working on that. Give it a moment.",
        did: changes.map((r) => ({ id: r.id, summary: r.summary, undoable: !!r.inverse })),
      });
    }
  }

  // The filter: the account's answers AND the phone's, the stricter of each.
  const { data: prof, error: profError } = await db.from("profiles").select("diet, allergies, skips, cuisines").eq("user_id", userId).maybeSingle();
  if (profError) return json(503, { error: "Otto can't read your answers right now, so it won't plan. Try again in a moment." });
  // The account's answers are the base: phone defaults can't be told apart
  // from "no allergies", so without a profile row Otto doesn't plan at all.
  if (!prof) return json(409, { error: "Otto needs your answers first: who's eating, allergies and foods to skip. Open Account → Preferences and save them." });
  const phone = body.prefs && typeof body.prefs === "object" ? body.prefs : null;
  filter = {
    diet: strictest(asDiet(prof.diet), asDiet(phone?.diet)),
    allergies: [...new Set([...(prof.allergies ?? []), ...strings(phone?.allergies, 9)])] as Allergen[],
    skips: [...new Set([...(prof.skips ?? []), ...strings(phone?.skips, 20)].map((x) => x.toLowerCase()))],
    cuisines: prof.cuisines?.length ? prof.cuisines : strings(phone?.cuisines, 6),
  };

  const messages: ToolMessage[] = turns.map((t: { role: "user" | "assistant"; content: string }) => ({ role: t.role, content: t.content }));
  const f = filter;
  const system = `${SYSTEM}\n\nThe 7 days you may plan: ${days.join(", ")} (the first is today). Household: ${
    f.diet !== "none" ? `${f.diet}; ` : ""
  }${f.allergies.length ? `allergies on file (filtered for you): ${f.allergies.join(", ")}; ` : ""}${
    f.skips.length ? `skips: ${f.skips.join(", ")}; ` : ""
  }${f.cuisines.length ? `likes: ${f.cuisines.join(", ")}.` : ""}`;

  const did: Did[] = [];
  let calls = 0;
  let writes = 0;
  const left = () => DEADLINE_MS - (Date.now() - started);
  try {
    for (let round = 0; round < CAPS.rounds; round++) {
      if (left() < 15_000) return json(200, { message: did.length ? "Otto ran out of time, here's what got done." : "Otto ran out of time. Try asking more simply.", did });
      const reply = await askTools({ model: MODEL, system, messages, tools: TOOLS, maxTokens: 3000, effort: "low" }, Math.min(ROUND_MS, left() - 5_000));
      if (!reply) return json(502, { error: "Otto lost his train of thought. Try again in a moment.", did });
      const toolCalls = reply.tool_calls ?? [];
      if (!toolCalls.length) return json(200, { message: (reply.content ?? "").slice(0, 800) || "Done.", did });
      messages.push({ role: "assistant", content: reply.content, tool_calls: toolCalls });

      for (const call of toolCalls) {
        const name = call.function.name;
        let out: unknown;
        let raw: Args = {};
        try {
          raw = JSON.parse(call.function.arguments || "{}");
        } catch {
          raw = {};
        }
        const problem = checkArgs(name, raw);
        const args = cleanArgs(name, raw);
        if (left() < 5_000) out = { error: "Otto ran out of time for this one." }; // writes count against the deadline too
        else if (++calls > CAPS.calls) out = { error: "That's as much as Otto can do in one go." };
        else if (problem) out = { error: problem };
        else if (name === "read_week") {
          const { data } = await db.from("plan_entries").select("id, day, title, label, kind, cooked, recipe_id")
            .eq("user_id", userId).gte("day", days[0]).lte("day", days[6]).order("day").order("position");
          const items = data ?? [];
          out = { days, items: items.slice(0, MAX_ITEMS), ...(items.length > MAX_ITEMS ? { truncated: true } : {}) };
        } else if (name === "find_dinners") {
          const q = String(args.query ?? "").toLowerCase();
          const cat = String(args.category ?? "").toLowerCase();
          const cui = String(args.cuisine ?? "").toLowerCase();
          const { data: planned } = await db.from("plan_entries").select("recipe_id").eq("user_id", userId).gte("day", days[0]).lte("day", days[6]);
          const inWeek = new Set((planned ?? []).map((r) => r.recipe_id).filter(Boolean));
          const hits = [...(await getShelf()).values()]
            .filter((d) => !inWeek.has(d.id))
            .filter((d) => (!q || d.title.toLowerCase().includes(q)) && (!cat || (d.category ?? "").toLowerCase() === cat) && (!cui || (d.area ?? "").toLowerCase() === cui))
            .sort((x, y) => shuffleKey(requestId, x.id) - shuffleKey(requestId, y.id));
          out = { dinners: hits.slice(0, 12).map((d) => ({ recipeId: d.id, title: d.title, category: d.category, cuisine: d.area })) };
        } else {
          const action = name as PlanTool;
          if ("day" in args && !dayInWindow(String(args.day), days)) out = { error: "That day is outside the 7 days Otto can plan." };
          else if (++writes > CAPS.writes) out = { error: "That's as much as Otto can change in one go." };
          else {
            const key = idempotencyKey(requestId, calls, name, args);
            const result = await write({ action, input: args }, false, days);
            if (typeof result === "string") out = { error: result };
            else {
              const inverse = inverseOf(action, args, result.before, result.created);
              const summary = summaryOf(action, args, result.before, { title: result.title });
              const { data: logged } = await db.from("agent_actions")
                .insert({ idempotency_key: key, action, input: args, inverse, summary }).select("id").single();
              if (logged) {
                did.push({ id: logged.id, summary, undoable: !!inverse });
                out = { ok: true, ...(result.created ? { id: result.created.id } : {}) };
              } else {
                // Not logged = not undoable: put it back now rather than leave a silent change.
                const reverted = inverse ? await write(inverse, true, days) : "nothing to put back";
                out = typeof reverted === "string"
                  ? { error: "Otto made that change but couldn't record it. Check the plan." }
                  : { error: "Otto couldn't record that change, so it put it back." };
              }
            }
          }
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out) });
      }
    }
    return json(200, { message: did.length ? "Done. Here's what changed." : "Otto couldn't finish that one. Try asking more simply.", did });
  } catch (error) {
    console.error("otto-agent failed", (error as Error).message);
    return json(502, { error: "Otto couldn't finish that right now. Try again in a moment.", did });
  }
});
