// The onboarding draft on the phone (kv 'onboardingDraft'), read through
// TanStack Query so the launch and the claim see the same answer.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kv } from '@/shared/storage';
import { newDraft, readDraft, type DraftDish } from './onboarding.draft';

export const DRAFT_KEY = ['onboarding-draft'] as const;

export const loadDraft = async () => readDraft(await kv.get<unknown>('onboardingDraft', null), Date.now());

export function useDraft() {
  const qc = useQueryClient();
  // A phone read: it must run offline too (the default networkMode waits
  // for a connection, and the launch would wait with it).
  const query = useQuery({ queryKey: DRAFT_KEY, queryFn: loadDraft, staleTime: 0, networkMode: 'always', meta: { persist: false } });
  return {
    draft: query.data ?? null,
    /** null until the phone has been read on this mount: a cached answer
     *  from before could send the launch through the wrong door. */
    hasDraft: query.isSuccess && query.isFetchedAfterMount ? query.data !== null : null,
    save: async (answers: Record<string, unknown>, week: DraftDish[]) => {
      await kv.set('onboardingDraft', newDraft(answers, week, Date.now()));
      await qc.invalidateQueries({ queryKey: DRAFT_KEY });
    },
  };
}
