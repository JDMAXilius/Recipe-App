// Pure rule for the ratings prompt (reviewPrompt.ts) — no imports, so
// reviewPrompt.logic.test.mjs loads it under node --test.
export interface ReviewState {
  cooks: number;
  lastAskedAt: number | null;
}

const COOKS_BEFORE_ASKING = 3;
export const COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

export function shouldAsk(state: ReviewState, now: number): boolean {
  if (state.cooks < COOKS_BEFORE_ASKING) return false;
  return state.lastAskedAt == null || now - state.lastAskedAt >= COOLDOWN_MS;
}
