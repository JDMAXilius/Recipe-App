// The chat conductor: transcript state (device-local via kv 'chats'), the
// send/clarify-pick actions, and the latest server response that drives the
// chips / recipe preview. Server I/O lives in chat.queries; pure trimming/pruning
// in chat.logic; this hook only wires them to React + persistence.
//
// ponytail: the persisted 'chats' blob is text-only (role/content/ts). A
// clarify's option chips and a recipe preview are ephemeral session UI, not
// persisted — reopening shows the conversation but not a tappable preview.
// Upgrade path: persist the last ChatResponse alongside the blob if reopen-to-save
// is ever asked for (v1's `?chat=` reopen — a listed parity gap, not this packet).
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

export interface UseChat {
  messages: StoredMessage[];
  response: ChatResponse | null; // latest turn → chips / recipe / decline UI
  isSending: boolean;
  error: string | null;
  ready: boolean; // history loaded from kv
  send: (text: string) => void;
  pickOption: (option: string) => void;
}

export function useChat(opts: ChatOptions = {}): UseChat {
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Latest messages for the async send closure (avoids a stale snapshot when
  // two sends race — the transcript is always read fresh here).
  const messagesRef = useRef<StoredMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    let alive = true;
    kv.get<StoredMessage[]>('chats', [], StoredMessagesSchema).then((loaded) => {
      if (!alive) return;
      setMessages(pruneHistory(loaded, Date.now()));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: StoredMessage[]) => {
    setMessages(next);
    void kv.set('chats', next);
  }, []);

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
      sendChat(toWireTranscript(withUser), opts)
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
    [isSending, opts, persist],
  );

  const pickOption = useCallback((option: string) => send(option), [send]);

  return { messages, response, isSending, error, ready, send, pickOption };
}
