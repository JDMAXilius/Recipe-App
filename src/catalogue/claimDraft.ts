// Claim the onboarding draft (R0.3): after sign-up, the week the person saw
// goes into their plan and their answers into their preferences, once. Lives
// in the catalogue (a composition root) because it spans onboarding, planner
// and profile, and it writes through the same put_in_plan action as the
// screen and Otto. A failure keeps the draft; the next launch tries again.
import { dispatch } from '@/shared/actions/action';
import { flags } from '@/shared/flags';
import { kv } from '@/shared/storage';
import { claimSteps } from '@/features/onboarding/onboarding.draft';
import { loadDraft } from '@/features/onboarding/useDraft';
import { listPlan } from '@/features/planner/plan.queries';
import { weekDays } from '@/features/planner/week';
import { savePrefs } from '@/features/profile';
import { actions } from './index';

export async function claimDraft(userId: string): Promise<'none' | 'claimed'> {
  const draft = await loadDraft();
  if (!draft) {
    await kv.remove('onboardingDraft'); // drop a stale or broken one
    return 'none';
  }
  const today = weekDays()[0].key;
  const last = draft.week.reduce((m, d) => (d.day > m ? d.day : m), today);
  const existing = await listPlan(userId, today, last);
  for (const step of claimSteps(draft, today, existing)) {
    const out = await dispatch(actions, { action: 'put_in_plan', input: { ...step, kind: 'recipe' } }, { userId, wantUndo: false }, { flowV2: flags.flowV2 });
    if (!out.ok) throw new Error(out.error);
  }
  await savePrefs(draft.answers);
  await kv.remove('onboardingDraft');
  return 'claimed';
}
