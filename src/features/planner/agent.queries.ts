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

async function readError(error: unknown, fallback: string): Promise<string> {
  // supabase-js FunctionsHttpError keeps the Response on .context.
  const res = (error as { context?: Response })?.context;
  try {
    const body = res ? await res.json() : null;
    if (typeof body?.error === 'string') return body.error;
  } catch {
    /* fall through */
  }
  return fallback;
}

export async function askPlanAgent(turns: AgentTurn[], requestId: string): Promise<{ message: string; did: AgentDid[] }> {
  const { data, error } = await supabase.functions.invoke('otto-agent', {
    body: { messages: turns.slice(-12), today: toDayKey(new Date()), requestId },
  });
  if (error) throw new Error(await readError(error, "Otto couldn't finish that. Try again in a moment."));
  return { message: String(data?.message ?? ''), did: Array.isArray(data?.did) ? data.did : [] };
}

export async function undoAgentAction(id: number): Promise<string> {
  const { data, error } = await supabase.functions.invoke('otto-agent', { body: { undo: id } });
  if (error) throw new Error(await readError(error, "Otto couldn't undo that."));
  return String(data?.summary ?? 'Undone.');
}

export const newRequestId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
