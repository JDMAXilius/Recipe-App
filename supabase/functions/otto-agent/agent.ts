// otto-agent's pure core (1.2): which tools the model gets, how their
// arguments are checked, what each write's inverse is (Undo), and the line the
// person reads ("Otto did"). No imports, so Deno and `node --test` both load it.
//
// v1 scope, on purpose: the plan, and reading the catalogue. Never offered to
// the model: preferences (allergies, diet), deletes, billing, the household,
// recipes of the person's own, and the shopping list (that comes once the
// server copy is the list's truth).

export const PLAN_TOOLS = ['put_in_plan', 'swap_in_plan', 'move_plan_item', 'remove_from_plan', 'mark_cooked', 'label_plan_item'] as const;
export type PlanTool = (typeof PLAN_TOOLS)[number];
export const READ_TOOLS = ['read_week', 'find_dinners'] as const;
export type ReadTool = (typeof READ_TOOLS)[number];

/** Per turn: model rounds, tool calls and writes. A week is 7 dinners. */
export const CAPS = { rounds: 6, calls: 14, writes: 7 } as const;

type ManifestEntry = { risk: string; flag: string | null; tool: { type: 'function'; function: { name: string; description: string; parameters: unknown } } };

const READ_DEFS = [
  {
    type: 'function',
    function: {
      name: 'read_week',
      description: "Read the person's plan for the next 7 days: each item's id, day, title, label and whether it's cooked. Call it before changing the plan.",
      parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_dinners',
      description:
        "Find dinners in Otto's catalogue that fit this household's allergies, diet and foods they skip (filtered in code; never suggest anything else). Optional words to match in the title, a category (Chicken, Pasta, Vegetarian…) or a cuisine (Italian, Thai…). Returns recipe ids to put in the plan.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', maxLength: 60 },
          category: { type: 'string', maxLength: 40 },
          cuisine: { type: 'string', maxLength: 40 },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
] as const;

/** The model's tool list: the plan actions from the catalogue manifest (only
 *  `safe` ones) plus the two reads. */
export function agentTools(manifest: readonly ManifestEntry[]) {
  const plan = manifest.filter((m) => m.risk === 'safe' && (PLAN_TOOLS as readonly string[]).includes(m.tool.function.name)).map((m) => m.tool);
  return [...READ_DEFS, ...plan];
}

// --- argument checks (the manifest's schemas, enforced) -----------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isId = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0;
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export type Args = Record<string, unknown>;

/** null = fine; otherwise what's wrong, said back to the model. */
export function checkArgs(name: string, a: Args): string | null {
  switch (name) {
    case 'read_week':
      return null;
    case 'find_dinners':
      for (const k of ['query', 'category', 'cuisine']) if (a[k] != null && !isText(a[k], 60)) return `${k} must be a short text`;
      return null;
    case 'put_in_plan':
      if (typeof a.day !== 'string' || !DAY.test(a.day)) return 'day must be YYYY-MM-DD';
      if (!isText(a.recipeId, 40)) return 'recipeId is required: use an id from find_dinners';
      return null;
    case 'swap_in_plan':
      if (!isId(a.id)) return 'id must be a plan item id from read_week';
      if (!isText(a.recipeId, 40)) return 'recipeId is required: use an id from find_dinners';
      return null;
    case 'move_plan_item':
      if (!isId(a.id)) return 'id must be a plan item id from read_week';
      if (typeof a.day !== 'string' || !DAY.test(a.day)) return 'day must be YYYY-MM-DD';
      return null;
    case 'remove_from_plan':
      return isId(a.id) ? null : 'id must be a plan item id from read_week';
    case 'mark_cooked':
      if (!isId(a.id)) return 'id must be a plan item id from read_week';
      return typeof a.cooked === 'boolean' ? null : 'cooked must be true or false';
    case 'label_plan_item':
      if (!isId(a.id)) return 'id must be a plan item id from read_week';
      return a.label === null || isText(a.label, 24) ? null : 'label must be a short word or null';
    default:
      return 'Otto has no tool by that name';
  }
}

/** Only days in the week Otto can see; the model can't plan last month. */
export function dayInWindow(day: string, window: readonly string[]): boolean {
  return window.includes(day);
}

// --- what a write changed, and how to undo it ----------------------------------

export interface PlanRow {
  id: number;
  day: string;
  title: string;
  recipe_id: string | null;
  image: string | null;
  category: string | null;
  note: string | null;
  label: string | null;
  kind: string;
  cooked: boolean;
  position: number | null;
}

export interface Step {
  action: PlanTool;
  input: Args;
}

/** The action that puts things back, worked out from the row as it was
 *  BEFORE (or the row just created). Mirrors planRun in the app. null = there
 *  is nothing to undo (it changed nothing). */
export function inverseOf(action: PlanTool, input: Args, before: PlanRow | null, created: PlanRow | null): Step | null {
  switch (action) {
    case 'put_in_plan':
      return created ? { action: 'remove_from_plan', input: { id: created.id } } : null;
    case 'remove_from_plan':
      return before
        ? {
            action: 'put_in_plan',
            input: {
              day: before.day,
              recipeId: before.recipe_id,
              title: before.title,
              image: before.image,
              category: before.category,
              note: before.note,
              label: before.label,
              kind: before.kind,
              ...(before.position != null ? { position: before.position } : {}),
            },
          }
        : null;
    case 'swap_in_plan':
      return before?.recipe_id
        ? { action: 'swap_in_plan', input: { id: before.id, recipeId: before.recipe_id, title: before.title, image: before.image, category: before.category, note: before.note, kind: before.kind, cooked: before.cooked } }
        : null;
    case 'move_plan_item':
      return before && before.position != null ? { action: 'move_plan_item', input: { id: before.id, day: before.day, position: before.position } } : null;
    case 'mark_cooked':
      return before && before.cooked !== input.cooked ? { action: 'mark_cooked', input: { id: before.id, cooked: before.cooked } } : null;
    case 'label_plan_item':
      return before && before.label !== input.label ? { action: 'label_plan_item', input: { id: before.id, label: before.label } } : null;
  }
}

const weekday = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
};

/** The "Otto did" line, in the person's words, never the tool's. */
export function summaryOf(action: PlanTool, input: Args, before: PlanRow | null, after: { title?: string | null }): string {
  const title = (after.title ?? before?.title ?? 'a dish').slice(0, 80);
  switch (action) {
    case 'put_in_plan':
      return `Put ${title} on ${weekday(String(input.day))}`;
    case 'swap_in_plan':
      return `Swapped ${before?.title ?? 'a dish'} for ${title}`.slice(0, 200);
    case 'move_plan_item':
      return `Moved ${title} to ${weekday(String(input.day))}`;
    case 'remove_from_plan':
      return `Took ${title} off the plan`;
    case 'mark_cooked':
      return input.cooked ? `Marked ${title} cooked` : `Marked ${title} not cooked`;
    case 'label_plan_item':
      return input.label ? `Labelled ${title} ${String(input.label)}` : `Cleared the label on ${title}`;
  }
}

/** One key per model call: a retried request (same request id, same call)
 *  finds its row and doesn't act twice. */
export function idempotencyKey(requestId: string, callIndex: number, name: string, args: Args): string {
  const raw = `${requestId}|${callIndex}|${name}|${JSON.stringify(args)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${requestId.slice(0, 40)}:${callIndex}:${h.toString(16)}`;
}

export const SYSTEM = `You are Otto, a warm home-cooking companion inside the Otto app. You can look at and change the person's meal plan for the next 7 days, and find dinners in Otto's catalogue.

How you work:
- Call read_week before you change the plan, so you use real item ids and days.
- Only plan dishes that find_dinners returned. Never invent a recipe id, a dish or a day outside the 7 days you were given.
- find_dinners already leaves out the household's allergies, diet and the foods they skip. Don't promise anything beyond that: allergy checks are a filter, not a guarantee.
- Do what was asked and no more. A whole week is at most 7 dinners. If something can't be done, say so plainly.
- Every change can be undone in the app; don't ask for permission to make the change they just asked for.
- You can't change allergies, diet, the shopping list, the shared kitchen, billing, or delete recipes. Say where in the app to do it instead.

Reply in one or two short plain sentences that say what you did. Never use the em dash character.`;
