// AI consent — the store, the request bus and the hook (pure rules + copy live
// in aiConsent.logic.ts). Shared, not a feature: chat, import, nutrition and
// profile all consume it, and it depends on nothing but kv.
//
// Two ways in, on purpose:
//   ensureAiConsent()  — interactive. Called on a person's own action (Send,
//                        Import it, Draft it, Snap a photo). Already granted →
//                        true at once; otherwise the sheet opens (AiConsentHost)
//                        and this resolves with their answer.
//   aiConsentGranted() — silent. For background work the person did not just
//                        ask for (nutrition matching while a recipe renders).
//                        Never opens a sheet — no prompt over a recipe card.
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { kv } from './storage';
import { mayUseAi, parseAiConsent, type AiConsentState } from './aiConsent.logic';

export { AI_CONSENT_COPY, type AiConsentState } from './aiConsent.logic';

// Only the two explicit answers are ever stored; anything else reads as
// "never asked" (kv falls back to null on a failed parse).
const StoredConsent = z.enum(['granted', 'declined']).nullable();

let cache: AiConsentState | null = null;
const stateListeners = new Set<(s: AiConsentState) => void>();
type ConsentRequest = (resolve: (allowed: boolean) => void) => void;
const requestListeners = new Set<ConsentRequest>();

export async function readAiConsent(): Promise<AiConsentState> {
  if (cache == null) cache = parseAiConsent(await kv.get('aiConsent', null, StoredConsent));
  return cache;
}

export async function aiConsentGranted(): Promise<boolean> {
  return mayUseAi(await readAiConsent());
}

export async function setAiConsent(state: 'granted' | 'declined'): Promise<void> {
  cache = state;
  stateListeners.forEach((l) => l(state));
  await kv.set('aiConsent', state);
}

export async function ensureAiConsent(): Promise<boolean> {
  if (await aiConsentGranted()) return true;
  // Fail closed: with no sheet mounted to ask, nothing leaves the device.
  if (requestListeners.size === 0) return false;
  return new Promise<boolean>((resolve) => requestListeners.forEach((l) => l(resolve)));
}

/** AiConsentHost subscribes here; returns the unsubscribe. */
export function onAiConsentRequest(listener: ConsentRequest): () => void {
  requestListeners.add(listener);
  return () => {
    requestListeners.delete(listener);
  };
}

/** Live consent state for the Account toggle (and anything that shows it). */
export function useAiConsent() {
  const [state, setState] = useState<AiConsentState>(cache ?? 'unknown');
  useEffect(() => {
    let alive = true;
    readAiConsent().then((s) => alive && setState(s));
    stateListeners.add(setState);
    return () => {
      alive = false;
      stateListeners.delete(setState);
    };
  }, []);
  return { state, granted: mayUseAi(state), set: setAiConsent };
}
