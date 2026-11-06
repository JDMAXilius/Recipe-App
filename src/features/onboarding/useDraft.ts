// The onboarding draft on the phone (kv 'onboardingDraft'), read through
// TanStack Query so the launch and the claim see the same answer.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kv } from '@/shared/storage';
import { newDraft, readDraft, type DraftDish } from './onboarding.draft';

export const DRAFT_KEY = ['onboarding-draft'] as const;

export const loadDraft = async () => readDraft(await kv.get<unknown>('onboardingDraft', null), Date.now());

export function useDraft() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: DRAFT_KEY, queryFn: loadDraft, staleTime: 0 });
  return {
    draft: query.data ?? null,
    /** null while the phone is still being read: the launch waits. */
    hasDraft: query.isSuccess ? query.data !== null : null,
    save: async (answers: Record<string, unknown>, week: DraftDish[]) => {
      await kv.set('onboardingDraft', newDraft(answers, week, Date.now()));
      await qc.invalidateQueries({ queryKey: DRAFT_KEY });
    },
  };
}
