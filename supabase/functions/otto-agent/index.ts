// otto-agent (1.2, "Otto plans your week"): the Otto tab's agent. The model
// reads the week, finds dinners and changes the plan through the action
// catalogue's plan tools; every write is logged in agent_actions with its
// inverse, so "Otto did" can show it and Undo can replay it.
//
// Boundaries, enforced here and not left to the prompt:
// - Every read and write uses THE PERSON'S TOKEN, so RLS decides (their rows).
// - A dish must come from the catalogue AND pass the household's allergies,
//   diet and skips (eligibleDinners, the first week's own filter). A made-up
//   or unsafe recipe id is refused, whatever the model says.
// - Days must be in the 7-day window the app sent (checked against the
//   server's date, so it can't be moved to last month).
// - Caps per turn: 6 model rounds, 14 tool calls, 7 writes.
// - A retried call (same requestId) finds its agent_actions row and doesn't
//   act twice.
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
  dayInWindow,
  idempotencyKey,
  inverseOf,
  PLAN_TOOLS,
  type PlanRow,
  type PlanTool,
  type Step,
  summaryOf,
  SYSTEM,
} from "./agent.ts";

const MODEL = "gpt-5.1";
const TOOLS = agentTools(manifest as never);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

type Did = { id: number; summary: string; undoable: boolean };

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

type Profile = { diet: string; allergies: string[]; skips: string[]; cuisines: string[] };

async function readShelf(db: SupabaseClient, p: Profile): Promise<Map<string, CatalogueDish>> {
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
  const fit = eligibleDinners(all, {
    diet: (p.diet as Diet) ?? "none",
    allergies: p.allergies as Allergen[],
    skips: p.skips,
    cuisines: p.cuisines,
  });
  return new Map(fit.map((d) => [d.id, d]));
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  if (await rateLimitedDurable(`agent:${userId}`, 20, 15 * 60 * 1000)) {
    return json(429, { error: "Otto needs a breather: that's 20 requests in 15 minutes. Try again in a few minutes." });
  }
  const gate = await requireClub(userId);
  if (gate) return gate;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
    auth: { persistSession: false },
  });
  // deno-lint-ignore no-explicit-any
  const body: any = await req.json().catch(() => ({}));

  // ---- plan writes, shared by the agent loop and Undo ------------------------
  const ownRow = async (id: number): Promise<PlanRow | null> => {
    const { data } = await db.from("plan_entries").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    return (data as PlanRow | null) ?? null;
  };
  const endOfDay = async (day: string): Promise<number> => {
    const { data } = await db.from("plan_entries").select("id, position, created_at").eq("user_id", userId).eq("day", day);
    return positionAtEnd((data ?? []) as never);
  };
  let shelf: Map<string, CatalogueDish> | null = null;
  let profile: Profile | null = null;
  const readProfile = async (): Promise<Profile> => {
    if (profile) return profile;
    const { data } = await db.from("profiles").select("diet, allergies, skips, cuisines").eq("user_id", userId).maybeSingle();
    profile = { diet: data?.diet ?? "none", allergies: data?.allergies ?? [], skips: data?.skips ?? [], cuisines: data?.cuisines ?? [] };
    return profile;
  };
  const getShelf = async () => (shelf ??= await readShelf(db, await readProfile()));

  /** One plan write. `restoring` = Undo putting the person's own row back
   *  (it was theirs, so the catalogue filter doesn't apply). */
  async function write(step: Step, restoring: boolean): Promise<{ before: PlanRow | null; created: PlanRow | null; title: string | null } | string> {
    const a = step.input;
    const dishFrom = async (recipeId: string) => {
      if (restoring) return { title: String(a.title ?? "A dish"), image: (a.image as string) ?? null, category: (a.category as string) ?? null };
      const d = (await getShelf()).get(recipeId);
      return d ? { title: d.title, image: d.image, category: d.category } : null;
    };
    switch (step.action) {
      case "put_in_plan": {
        const dish = await dishFrom(String(a.recipeId));
        if (!dish) return "That recipe isn't one this household can have. Use an id from find_dinners.";
        const position = typeof a.position === "number" ? a.position : await endOfDay(String(a.day));
        const { data, error } = await db.from("plan_entries").insert({
          user_id: userId, day: a.day, recipe_id: a.recipeId, title: dish.title, image: dish.image, category: dish.category,
          note: (a.note as string) ?? null, label: (a.label as string) ?? null, kind: (a.kind as string) ?? "recipe", position,
        }).select().single();
        if (error || !data) return "Otto couldn't add that.";
        return { before: null, created: data as PlanRow, title: dish.title };
      }
      case "swap_in_plan": {
        const before = await ownRow(Number(a.id));
        if (!before) return "That plan item isn't there any more.";
        const dish = await dishFrom(String(a.recipeId));
        if (!dish) return "That recipe isn't one this household can have. Use an id from find_dinners.";
        const { error } = await db.from("plan_entries").update({
          recipe_id: a.recipeId, title: dish.title, image: dish.image, category: dish.category, note: (a.note as string) ?? null,
          cooked: restoring ? Boolean(a.cooked) : false, kind: (a.kind as string) ?? "recipe",
        }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't swap that." : { before, created: null, title: dish.title };
      }
      case "move_plan_item": {
        const before = await ownRow(Number(a.id));
        if (!before) return "That plan item isn't there any more.";
        const position = typeof a.position === "number" ? a.position : await endOfDay(String(a.day));
        const { error } = await db.from("plan_entries").update({ day: a.day, position }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't move that." : { before, created: null, title: before.title };
      }
      case "remove_from_plan": {
        const before = await ownRow(Number(a.id));
        if (!before) return "That plan item isn't there any more.";
        const { error } = await db.from("plan_entries").delete().eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't remove that." : { before, created: null, title: before.title };
      }
      case "mark_cooked": {
        const before = await ownRow(Number(a.id));
        if (!before) return "That plan item isn't there any more.";
        const { error } = await db.from("plan_entries").update({ cooked: a.cooked }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't change that." : { before, created: null, title: before.title };
      }
      case "label_plan_item": {
        const before = await ownRow(Number(a.id));
        if (!before) return "That plan item isn't there any more.";
        const { error } = await db.from("plan_entries").update({ label: a.label }).eq("id", before.id).eq("user_id", userId);
        return error ? "Otto couldn't label that." : { before, created: null, title: before.title };
      }
    }
  }

  // ---- Undo ------------------------------------------------------------------
  if (body && typeof body === "object" && "undo" in body) {
    const id = Number(body.undo);
    if (!Number.isInteger(id) || id <= 0) return json(400, { error: "Invalid body" });
    const { data: row } = await db.from("agent_actions").select("id, inverse, undone_at, summary").eq("id", id).maybeSingle();
    if (!row) return json(404, { error: "Otto can't find that change." });
    if (row.undone_at) return json(200, { ok: true, already: true });
    const inv = row.inverse as Step | null;
    if (!inv || !(PLAN_TOOLS as readonly string[]).includes(inv.action)) return json(409, { error: "There's nothing to undo for that one." });
    const result = await write(inv, true);
    if (typeof result === "string") return json(409, { error: result });
    await db.from("agent_actions").update({ undone_at: new Date().toISOString() }).eq("id", id);
    return json(200, { ok: true, summary: `Undid: ${row.summary}` });
  }

  // ---- a chat turn ------------------------------------------------------------
  if (!openaiActive()) return json(503, { error: "Otto can't do that just yet. That part of the kitchen is still being wired up." });
  const turns = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
  const okTurns = turns.length > 0 && turns.every((t: { role?: unknown; content?: unknown }) =>
    (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim().length > 0 && t.content.length <= 600
  );
  if (!okTurns || turns[turns.length - 1].role !== "user") return json(400, { error: "Invalid body" });
  if (!plausibleToday(body.today)) return json(400, { error: "Invalid body" });
  const requestId = typeof body.requestId === "string" && /^[\w-]{8,64}$/.test(body.requestId) ? body.requestId : null;
  if (!requestId) return json(400, { error: "Invalid body" });
  const days = windowFrom(body.today);

  const messages: ToolMessage[] = turns.map((t: { role: "user" | "assistant"; content: string }) => ({ role: t.role, content: t.content }));
  const p = await readProfile();
  const system = `${SYSTEM}\n\nThe 7 days you may plan: ${days.join(", ")} (the first is today). Household: ${
    p.diet !== "none" ? `${p.diet}; ` : ""
  }${p.allergies.length ? `allergies on file (filtered for you): ${p.allergies.join(", ")}; ` : ""}${
    p.skips.length ? `skips: ${p.skips.join(", ")}; ` : ""
  }${p.cuisines.length ? `likes: ${p.cuisines.join(", ")}.` : ""}`;

  const did: Did[] = [];
  let calls = 0;
  let writes = 0;
  try {
    for (let round = 0; round < CAPS.rounds; round++) {
      const reply = await askTools({ model: MODEL, system, messages, tools: TOOLS, maxTokens: 3000, effort: "low" }, 60000);
      if (!reply) return json(502, { error: "Otto lost his train of thought. Try again in a moment.", did });
      const toolCalls = reply.tool_calls ?? [];
      if (!toolCalls.length) return json(200, { message: (reply.content ?? "").slice(0, 800) || "Done.", did });
      messages.push({ role: "assistant", content: reply.content, tool_calls: toolCalls });

      for (const call of toolCalls) {
        const name = call.function.name;
        let out: unknown;
        let args: Args = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        const problem = checkArgs(name, args);
        if (++calls > CAPS.calls) out = { error: "That's as much as Otto can do in one go." };
        else if (problem) out = { error: problem };
        else if (name === "read_week") {
          const { data } = await db.from("plan_entries").select("id, day, title, label, cooked, recipe_id")
            .eq("user_id", userId).gte("day", days[0]).lte("day", days[6]).order("day").order("position");
          out = { days, items: data ?? [] };
        } else if (name === "find_dinners") {
          const q = String(args.query ?? "").toLowerCase();
          const cat = String(args.category ?? "").toLowerCase();
          const cui = String(args.cuisine ?? "").toLowerCase();
          const hits = [...(await getShelf()).values()].filter((d) =>
            (!q || d.title.toLowerCase().includes(q)) && (!cat || (d.category ?? "").toLowerCase() === cat) && (!cui || (d.area ?? "").toLowerCase() === cui)
          );
          // A stable shuffle per request, so "something different" varies by turn.
          const seed = [...requestId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
          hits.sort((x, y) => ((x.id.charCodeAt(0) * seed) % 97) - ((y.id.charCodeAt(0) * seed) % 97) || x.title.localeCompare(y.title));
          out = { dinners: hits.slice(0, 12).map((d) => ({ recipeId: d.id, title: d.title, category: d.category, cuisine: d.area })) };
        } else {
          const action = name as PlanTool;
          if ("day" in args && !dayInWindow(String(args.day), days)) out = { error: "That day is outside the 7 days Otto can plan." };
          else if (++writes > CAPS.writes) out = { error: "That's as much as Otto can change in one go." };
          else {
            const key = idempotencyKey(requestId, calls, name, args);
            const { data: seen } = await db.from("agent_actions").select("id, summary, inverse").eq("idempotency_key", key).maybeSingle();
            if (seen) {
              did.push({ id: seen.id, summary: seen.summary, undoable: !!seen.inverse });
              out = { ok: true, already: true };
            } else {
              const result = await write({ action, input: args }, false);
              if (typeof result === "string") out = { error: result };
              else {
                const inverse = inverseOf(action, args, result.before, result.created);
                const summary = summaryOf(action, args, result.before, { title: result.title });
                const { data: logged } = await db.from("agent_actions")
                  .insert({ idempotency_key: key, action, input: args, inverse, summary }).select("id").single();
                if (logged) did.push({ id: logged.id, summary, undoable: !!inverse });
                out = { ok: true, ...(result.created ? { id: result.created.id } : {}) };
              }
            }
          }
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out).slice(0, 6000) });
      }
    }
    return json(200, { message: did.length ? "Done. Here's what changed." : "Otto couldn't finish that one. Try asking more simply.", did });
  } catch (error) {
    console.error("otto-agent failed", (error as Error).message);
    return json(502, { error: "Otto couldn't finish that right now. Try again in a moment.", did });
  }
});
