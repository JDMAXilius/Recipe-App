// Pure transcript logic for Ask-Otto — zero framework imports so node --test can
// strip-type it directly (chat.logic.test.mjs). Three jobs, all off the trust
// boundary:
//   • pruneHistory   — the kv persistence cap (persistence.md §1: 30-day / 50-msg)
//   • toWireTranscript — trim to the function's request limits (≤20 turns, ≤600 chars)
//   • optionPickToMessage — a tapped clarify chip becomes the next user turn
import type { StoredMessage, WireMessage } from './chat.types';

export const CONTENT_CAP = 600; // per-turn content limit the function enforces
export const TURN_CAP = 20; // max turns per request
export const MSG_CAP = 50; // persisted-history cap (persistence.md §1)
export const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30-day window

// Append a turn, drop anything older than 30 days, keep only the last 50.
// Age filter runs before the count cap so a burst of fresh turns can't be
// evicted by stale ones that a plain slice would have kept.
export function pruneHistory(history: StoredMessage[], now: number): StoredMessage[] {
  return history.filter((m) => now - m.ts <= MAX_AGE_MS).slice(-MSG_CAP);
}

// History → the function's request transcript: last ≤20 turns, content clamped
// to 600 chars, timestamps stripped. The function requires the last turn to be
// role:'user' — callers only send after appending a user turn, so we don't
// re-assert it here (the append is the guarantee).
export function toWireTranscript(history: StoredMessage[]): WireMessage[] {
  return history.slice(-TURN_CAP).map((m) => ({
    role: m.role,
    content: m.content.slice(0, CONTENT_CAP),
  }));
}

// A typed user turn from raw text (a typed message OR a tapped clarify chip).
// Trims + clamps so an oversized chip/paste never violates the content cap.
export function optionPickToMessage(text: string, ts: number): StoredMessage | null {
  const content = text.trim().slice(0, CONTENT_CAP);
  if (!content) return null;
  return { role: 'user', content, ts };
}
