// The plan agent (1.2, flags.agent): ask Otto to change the week, and undo
// one change. The work happens in the otto-agent function with the person's
// token; this file only calls it.
import { supabase } from '@/shared/supabase/client';
import { toDayKey } from '@/shared/week';

export interface AgentDid {
  id: number;
  summary: string;
  undoable: boolean;
}

export interface AgentTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** A failed turn can still have changed things: `did` carries them, so the
 *  sheet shows them with Undo instead of hiding work that happened. */
export class AgentError extends Error {
  constructor(message: string, readonly did: AgentDid[]) {
    super(message);
  }
}

async function readError(error: unknown, fallback: string): Promise<{ message: string; did: AgentDid[] }> {
  // supabase-js FunctionsHttpError keeps the Response on .context.
  const res = (error as { context?: Response })?.context;
  try {
    const body = res ? await res.json() : null;
    return { message: typeof body?.error === 'string' ? body.error : fallback, did: Array.isArray(body?.did) ? body.did : [] };
  } catch {
    return { message: fallback, did: [] };
  }
}

/** The phone's answers go along: the server filters on the account's AND
 *  these (the stricter of each), so an answer the account missed still counts. */
export interface AgentPrefs {
  diet: string;
  allergies: readonly string[];
  skips: readonly string[];
  cuisines: readonly string[];
}

export async function askPlanAgent(turns: AgentTurn[], requestId: string, prefs: AgentPrefs): Promise<{ message: string; did: AgentDid[] }> {
  const { data, error } = await supabase.functions.invoke('otto-agent', {
    body: { messages: turns.slice(-12), today: toDayKey(new Date()), requestId, prefs },
  });
  if (error) {
    const e = await readError(error, "Otto couldn't finish that. Try again in a moment.");
    throw new AgentError(e.message, e.did);
  }
  return { message: String(data?.message ?? ''), did: Array.isArray(data?.did) ? data.did : [] };
}

export async function undoAgentAction(id: number): Promise<string> {
  const { data, error } = await supabase.functions.invoke('otto-agent', { body: { undo: id } });
  if (error) throw new Error((await readError(error, "Otto couldn't undo that.")).message);
  return String(data?.summary ?? 'Undone.');
}

export const newRequestId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
