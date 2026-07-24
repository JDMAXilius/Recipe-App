// ALL server I/O for the chat domain (feature-module.md §2/§3): the single
// `generate-recipe` invoke in chat mode. The client posts the running transcript
// and zod-parses the reply at the trust boundary (rule 6). Saving a generated
// recipe does NOT live here — it reuses import's useSaveRecipe (rule 5).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { fetch } from 'expo/fetch';
import { z } from 'zod';
import { supabase } from '@/shared/supabase/client';
import { feedSse } from './sse.logic';
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
      // The function's shapeGeneratedRecipe emits string | null for both (a
      // dish with no clear cuisine gets area: null). Requiring strings here
      // turned a legal null into a parse error bubble — surfaced live when
      // sonnet answered "tomato soup" with area: null.
      category: z.string().nullable(),
      area: z.string().nullable(),
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
      return 'Otto needs a breather. Give it a few minutes and try again.';
    case 503:
      return "Otto's kitchen is still being wired up. Check back soon.";
    case 502:
      return "That didn't go through. Try again.";
    default:
      return bodyError ?? "Otto couldn't finish that. Try again in a moment.";
  }
}

export interface ChatOptions {
  diet?: string;
  cuisines?: string[];
}

// Zod details are for developers; a shape mismatch shows users ONE friendly
// line, never the raw issue dump (critic finding 2026-07-24).
function parseChatResponse(data: unknown): ChatResponse {
  const parsed = ChatResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Otto lost his train of thought. Try again in a moment.');
  }
  return parsed.data;
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
    throw new Error("Otto can't reach the kitchen. Check your connection and try again.");
  }
  return parseChatResponse(data);
}

// One SSE event off the wire. Loosely typed on purpose — the payload only gets
// trusted after ChatResponseSchema.parse (rule 6); anything else is skipped.
const SseEventSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  payload: z.unknown().optional(),
  error: z.string().optional(),
});

// Streaming send: same request as sendChat plus `stream: true`, but Otto's
// prose arrives as SSE deltas so the bubble can fill in live. onDelta receives
// the FULL text so far (not the increment). Resolves with the same zod-parsed
// ChatResponse as sendChat — the final message/chips/recipe always come from
// the done payload, never from the accumulated deltas.
//
// Fallback: a not-yet-redeployed function ignores `stream` and answers plain
// JSON — detected by content-type (or a missing body) and parsed exactly like
// sendChat, so this is a strict superset of the old path.
export async function sendChatStreaming(
  messages: WireMessage[],
  opts: ChatOptions = {},
  onDelta: (fullTextSoFar: string) => void,
): Promise<ChatResponse> {
  // client.ts keeps these env reads private; same source, same inline-at-build
  // semantics (EXPO_PUBLIC_* pattern).
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://missing-env.invalid';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'missing-env';
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-recipe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token ?? anonKey}`,
      apikey: anonKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages, ...opts, stream: true }),
  }).catch(() => {
    throw new Error("Otto can't reach the kitchen. Check your connection and try again.");
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(messageForStatus(response.status, body?.error));
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!response.body || contentType.includes('application/json')) {
    // Server ignored the stream flag (old deploy) or the runtime can't stream:
    // this is exactly today's non-streaming happy path.
    return parseChatResponse((await response.json()) as unknown);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = '';
  let accumulated = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
      const fed = feedSse(chunk, carry);
      carry = fed.carry;
      for (const raw of fed.events) {
        const parsed = SseEventSchema.safeParse(raw);
        if (!parsed.success) continue;
        const event = parsed.data;
        if (event.type === 'delta' && event.text != null) {
          accumulated += event.text;
          onDelta(accumulated);
        } else if (event.type === 'done') {
          return parseChatResponse(event.payload);
        } else if (event.type === 'error') {
          throw new Error(event.error ?? "Otto couldn't finish that. Try again in a moment.");
        }
      }
      if (done) break;
    }
  } finally {
    void reader.cancel().catch(() => undefined);
  }
  // Stream closed without a done event — the reply is incomplete, so fail
  // loudly rather than pass off partial prose as the answer.
  throw new Error('Otto lost his train of thought. Try again in a moment.');
}
