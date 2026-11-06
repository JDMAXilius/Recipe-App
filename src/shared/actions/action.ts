// The action catalogue (R0.9). Every change a person can make by hand is an
// action, defined once, so the agent, notification buttons, widgets and Siri
// call the same thing the screen does. No framework imports: `node --test`
// loads this file.
//
// An action is split in two on purpose:
//   - the SPEC (name, summary, risk, input schema) is pure data in a feature's
//     `*.actions.ts`, so tools can be generated and checked without the app;
//   - the RUNNER lives next to the Supabase calls in the feature's
//     `*.queries.ts` (feature-module.md §3) and does the write.
// `bind` pairs them; the type makes a missing runner a compile error.
import { z } from 'zod';

// safe: runs at once (the agent shows what it did, with Undo when it can).
// confirm: the agent shows a confirm card first (deletes nothing comes back from).
export type Risk = 'safe' | 'confirm';

export interface ActionSpec<S extends z.ZodType = z.ZodType> {
  /** Tool name: snake_case verb phrase, unique across the app. */
  name: string;
  /** One sentence the model reads to pick the tool. */
  summary: string;
  risk: Risk;
  /** TanStack Query domains to refresh after a run (['plan'] → ['plan', …]). */
  touches: readonly string[];
  input: S;
  /** Build flag the action needs (its columns may not exist without it). */
  flag?: 'flowV2';
}

export interface ActionContext {
  userId: string;
  /** Read the state an undo needs before writing. The UI has its own cache
   *  and passes false; the agent passes true. */
  wantUndo?: boolean;
}

/** A call to make: what Undo runs, and what the agent proposes. */
export interface Step {
  action: string;
  input: unknown;
}

export interface Outcome<R = unknown> {
  result: R;
  undo?: Step | null;
}

export type Specs = Record<string, ActionSpec>;

export type Runners<T extends Specs> = {
  [K in keyof T]: (input: z.infer<T[K]['input']>, ctx: ActionContext) => Promise<Outcome>;
};

export interface Action extends ActionSpec {
  run: (input: unknown, ctx: ActionContext) => Promise<Outcome>;
}

export const defineActions = <T extends Specs>(specs: T): T => specs;

export function bind<T extends Specs>(specs: T, runners: Runners<T>): Action[] {
  return Object.keys(specs).map((k) => ({
    ...specs[k],
    run: runners[k] as Action['run'],
  }));
}

export type Dispatched =
  | { ok: true; result: unknown; undo: Step | null; touches: readonly string[] }
  | { ok: false; error: string };

// The one door for untrusted callers (the model, a notification payload):
// unknown name or bad input is an answer, not a throw, so the agent can fix
// its call. Input is validated here; the UI calls runners directly.
export async function dispatch(
  actions: readonly Action[],
  step: Step,
  ctx: ActionContext,
  enabled: Partial<Record<NonNullable<ActionSpec['flag']>, boolean>> = {},
): Promise<Dispatched> {
  const action = actions.find((a) => a.name === step.action);
  if (!action) return { ok: false, error: `No action named ${step.action}.` };
  if (action.flag && !enabled[action.flag]) return { ok: false, error: `${step.action} isn't available in this version.` };
  const parsed = action.input.safeParse(step.input);
  if (!parsed.success) return { ok: false, error: z.prettifyError(parsed.error) };
  try {
    const { result, undo } = await action.run(parsed.data, { ...ctx, wantUndo: ctx.wantUndo ?? true });
    return { ok: true, result, undo: undo ?? null, touches: action.touches };
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
    return { ok: false, error: message || 'That did not work.' };
  }
}

// An OpenAI Chat Completions function tool. Not strict: strict mode can't
// express optional fields, and dispatch validates with the same schema anyway.
export function toTool(spec: ActionSpec) {
  const { $schema: _drop, ...parameters } = z.toJSONSchema(spec.input, { io: 'input' }) as Record<string, unknown>;
  return { type: 'function' as const, function: { name: spec.name, description: spec.summary, parameters } };
}

// What the server reads (supabase/functions/_shared/actions.json): the tool
// plus what the agent must know before calling it. Sorted, so the file only
// changes when an action does.
export function toManifest(specs: readonly ActionSpec[]) {
  return [...specs]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ risk: s.risk, touches: s.touches, flag: s.flag ?? null, tool: toTool(s) }));
}

export const TOOL_NAME = /^[a-z][a-z0-9_]{2,63}$/;
