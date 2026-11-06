// The onboarding draft (R0.3): the three answers and the first week, kept on
// the phone before there is an account (ADR-0013: plan first, account at
// "Save your plan"). Claimed once after sign-up (src/catalogue/claimDraft.ts),
// then cleared. Pure: `node --test` loads it.
import { z } from 'zod';

export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const dish = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recipeId: z.string().min(1),
  title: z.string().min(1),
  image: z.string().nullable(),
  category: z.string().nullable(),
});

// Answers are stored raw and normalised by the profile on save
// (normalizePrefs), so this schema never drifts from the prefs model.
export const draftSchema = z.object({
  v: z.literal(1),
  answers: z.record(z.string(), z.unknown()),
  week: z.array(dish).max(14),
  createdAt: z.number(),
});
export type OnboardingDraft = z.infer<typeof draftSchema>;
export type DraftDish = z.infer<typeof dish>;

export function newDraft(answers: Record<string, unknown>, week: DraftDish[], now: number): OnboardingDraft {
  return { v: 1, answers, week, createdAt: now };
}

/** A stored value as a usable draft: invalid or older than 30 days is none. */
export function readDraft(raw: unknown, now: number): OnboardingDraft | null {
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) return null;
  return now - parsed.data.createdAt > DRAFT_MAX_AGE_MS ? null : parsed.data;
}

export interface ClaimStep {
  day: string;
  recipeId: string;
  title: string;
  image: string | null;
  category: string | null;
  label: 'dinner';
}

/** What to put in the plan: days from today on (past days are dropped), and
 *  nothing the plan already holds for that day (a claim that was cut off
 *  half way and runs again must not double a dinner). */
export function claimSteps(draft: OnboardingDraft, todayKey: string, existing: readonly { day: string; recipe_id: string | null }[]): ClaimStep[] {
  return draft.week
    .filter((d) => d.day >= todayKey)
    .filter((d) => !existing.some((e) => e.day === d.day && e.recipe_id === d.recipeId))
    .map((d) => ({ ...d, label: 'dinner' as const }));
}
