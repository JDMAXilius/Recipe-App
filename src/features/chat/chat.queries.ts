// ALL server I/O for the chat domain (feature-module.md §2/§3): the single
// `generate-recipe` invoke in chat mode. The client posts the running transcript
// and zod-parses the reply at the trust boundary (rule 6). Saving a generated
// recipe does NOT live here — it reuses import's useSaveRecipe (rule 5).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { z } from 'zod';
import { supabase } from '@/shared/supabase/client';
import type { ChatResponse, WireMessage } from './chat.types';

// The three 200 shapes, discriminated on `mode`. Unknown/garbage → parse throws
// and the caller surfaces a friendly line (never a crash).
const ChatResponseSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('clarify'),
    message: z.string(),
    options: z.array(z.string()),
  }),
  z.object({
    mode: z.literal('recipe'),
    message: z.string(),
    recipe: z.object({
      title: z.string(),
      servings: z.number(),
      category: z.string(),
      area: z.string(),
      ingredients: z.array(z.object({ measure: z.string(), name: z.string() })),
      steps: z.array(z.string()),
      image: z.null(),
      source: z.literal('otto'),
      sourceUrl: z.null(),
      sourceName: z.null(),
    }),
  }),
  z.object({
    mode: z.literal('decline'),
    message: z.string(),
  }),
]);

// Map the function's error statuses to Otto-voice lines (packet contract). The
// server writes a body for some; we prefer status → message so every status has
// a friendly copy even when the body is empty.
function messageForStatus(status: number, bodyError?: string): string {
  switch (status) {
    case 401:
      return 'Sign in to chat with Otto.';
    case 429:
      return "Otto needs a breather — give it a few minutes and try again.";
    case 503:
      return "Otto's kitchen is still being wired up — check back soon.";
    case 502:
      return 'That one slipped — try again.';
    default:
      return bodyError ?? "Otto couldn't finish that — try again in a moment.";
  }
}

export interface ChatOptions {
  diet?: string;
  cuisines?: string[];
}

// Send the transcript, get one turn back. Throws Error(friendlyMessage) on any
// failure so the hook can drop it straight into an inline error bubble.
export async function sendChat(
  messages: WireMessage[],
  opts: ChatOptions = {},
): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { messages, ...opts },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status as number;
      const body = (await error.context.json().catch(() => null)) as { error?: string } | null;
      throw new Error(messageForStatus(status, body?.error));
    }
    throw new Error("Otto can't reach the kitchen — check your connection and try again.");
  }
  return ChatResponseSchema.parse(data);
}
