// The system ratings prompt, spent only on ASO plan §8 Trigger A: the 3rd
// lifetime finished cook, never within 90 days of the last ask. Apple caps
// the sheet at 3 per user per year and may show nothing, so each ask is
// scarce. Never from a button, launch, or purchase (the Profile "Rate Otto"
// row is the no-quota write-review link instead).
// ponytail: Trigger A only. Triggers B (5th clean import) and C (shared-list
// payoff) and the suppression windows (failed import, support, paywall) wait
// until there are ratings to compare against.
import * as StoreReview from 'expo-store-review';
import { kv } from '@/shared/storage';
import { shouldAsk, type ReviewState } from './reviewPrompt.logic';

// Call once per finished cook. Counts it, and when due asks ~1.5s later so
// the sheet lands after the "Dinner, done." beat, not on top of it.
export async function noteFinishedCook(now = Date.now()): Promise<void> {
  const prev = await kv.get<ReviewState>('reviewPrompt', { cooks: 0, lastAskedAt: null });
  const state = { ...prev, cooks: prev.cooks + 1 };
  const ask = shouldAsk(state, now);
  await kv.set('reviewPrompt', ask ? { ...state, lastAskedAt: now } : state);
  if (!ask) return;
  try {
    if (!(await StoreReview.hasAction())) return;
    setTimeout(() => {
      void StoreReview.requestReview().catch(() => {});
    }, 1500);
  } catch {
    // no store on this device (simulator, web) — nothing to show
  }
}
