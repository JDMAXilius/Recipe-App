// The chat conductor: transcript state (device-local via kv 'chats'), the
// send/clarify-pick actions, and the latest server response that drives the
// chips / recipe preview. Server I/O lives in chat.queries; pure trimming/pruning
// in chat.logic; this hook only wires them to React + persistence.
//
// Persistence is now a LIST of threads ({id,title,messages,updatedAt}) so the
// ＋ tab's Recent chats can list & reopen past conversations — the first cut
// stored one flat transcript. A reopened thread is loaded by id (?chat=); a
// fresh create tab starts empty and mints an id on its first turn.
//
// ponytail: the persisted thread is text-only (role/content/ts). A clarify's
// option chips and a recipe preview are ephemeral session UI, not persisted —
// reopening shows the conversation but not a tappable preview.
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import { sendChat, type ChatOptions } from './chat.queries';
import { optionPickToMessage, pruneHistory, toWireTranscript } from './chat.logic';
import type { ChatResponse, StoredMessage } from './chat.types';

const StoredMessagesSchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    ts: z.number(),
  }),
);

// One saved conversation. `title` is the user's first ask, verbatim (matches
// v1's Recent-chats row title). The 'chats' key holds an array of these.
export interface ChatThread {
  id: string;
  title: string;
  messages: StoredMessage[];
  updatedAt: number;
}

const ChatThreadsSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    messages: StoredMessagesSchema,
    updatedAt: z.number(),
  }),
);

const THREAD_CAP = 30;
const THREAD_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Newest first, drop anything >30 days, keep ≤30 — same shape of rule as the
// per-message prune, applied to whole threads.
export function pruneThreads(threads: ChatThread[], now: number): ChatThread[] {
  return threads
    .filter((t) => now - t.updatedAt <= THREAD_MAX_AGE_MS)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, THREAD_CAP);
}

// Load + prune the saved threads. Writes back only when the prune changed the
// set, so a plain read stays a read. Used by useChat and the Recent chats screen.
export async function loadThreads(now = Date.now()): Promise<ChatThread[]> {
  const all = await kv.get<ChatThread[]>('chats', [], ChatThreadsSchema);
  const kept = pruneThreads(all, now);
  if (kept.length !== all.length) void kv.set('chats', kept);
  return kept;
}

const titleOf = (messages: StoredMessage[]): string =>
  messages.find((m) => m.role === 'user')?.content.slice(0, 80) ?? 'New chat';

export interface UseChat {
  messages: StoredMessage[];
  response: ChatResponse | null; // latest turn → chips / recipe / decline UI
  isSending: boolean;
  error: string | null;
  ready: boolean; // history loaded from kv
  send: (text: string) => void;
  pickOption: (option: string) => void;
}

export function useChat(opts: ChatOptions & { threadId?: string } = {}): UseChat {
  const { threadId, ...chatOpts } = opts;
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Latest messages for the async send closure (avoids a stale snapshot when
  // two sends race — the transcript is always read fresh here).
  const messagesRef = useRef<StoredMessage[]>([]);
  messagesRef.current = messages;
  // The thread this session writes to; minted on the first turn of a new chat.
  const threadIdRef = useRef<string | null>(threadId ?? null);

  // Load history: a reopened thread (threadId) shows its transcript, a fresh
  // create tab starts empty. setMessages directly (not persist) so reopening a
  // thread never bumps its updatedAt.
  useEffect(() => {
    let alive = true;
    loadThreads().then((threads) => {
      if (!alive) return;
      const found = threadId ? threads.find((t) => t.id === threadId) : null;
      threadIdRef.current = threadId ?? null;
      setMessages(found ? pruneHistory(found.messages, Date.now()) : []);
      setResponse(null);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [threadId]);

  // Upsert the current thread. ponytail: read-modify-write on kv; turns are
  // serialized by isSending so last-write-wins is the later (fuller) turn.
  const saveCurrentThread = useCallback(async (next: StoredMessage[]) => {
    if (next.length === 0) return;
    const id = threadIdRef.current ?? (threadIdRef.current = String(Date.now()));
    const now = Date.now();
    const all = await kv.get<ChatThread[]>('chats', [], ChatThreadsSchema);
    const thread: ChatThread = { id, title: titleOf(next), messages: next, updatedAt: now };
    void kv.set('chats', pruneThreads([thread, ...all.filter((t) => t.id !== id)], now));
  }, []);

  const persist = useCallback(
    (next: StoredMessage[]) => {
      setMessages(next);
      void saveCurrentThread(next);
    },
    [saveCurrentThread],
  );

  const send = useCallback(
    (text: string) => {
      if (isSending) return;
      const userMsg = optionPickToMessage(text, Date.now());
      if (!userMsg) return;
      const withUser = pruneHistory([...messagesRef.current, userMsg], Date.now());
      persist(withUser);
      setResponse(null);
      setError(null);
      setIsSending(true);
      sendChat(toWireTranscript(withUser), chatOpts)
        .then((res) => {
          const ottoMsg: StoredMessage = { role: 'assistant', content: res.message, ts: Date.now() };
          persist(pruneHistory([...messagesRef.current, ottoMsg], Date.now()));
          setResponse(res);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Otto couldn't finish that.");
        })
        .finally(() => setIsSending(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSending, persist],
  );

  const pickOption = useCallback((option: string) => send(option), [send]);

  return { messages, response, isSending, error, ready, send, pickOption };
}
