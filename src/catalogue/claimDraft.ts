// Claim the onboarding draft (R0.3): after sign-up, the week the person saw
// goes into their plan and their answers into their preferences, once. Lives
// in the catalogue (a composition root) because it spans onboarding, planner
// and profile, and it writes through the same put_in_plan action as the
// screen and Otto. A failure keeps the draft; the next launch tries again.
//
// The draft belongs to the phone, not to a person, so it is claimed only by
// a NEW account (one that has never answered the questions). Someone who
// signs in to an existing account keeps their own plan and preferences; the
// draft is dropped.
import type { User } from '@supabase/supabase-js';
import { dispatch } from '@/shared/actions/action';
import { flags } from '@/shared/flags';
import { kv } from '@/shared/storage';
import { claimSteps } from '@/features/onboarding/onboarding.draft';
import { loadDraft } from '@/features/onboarding/useDraft';
import { markAccountOnboarded } from '@/features/onboarding/useOnboarded';
import { onboardedFor } from '@/features/onboarding/launch';
import { listPlan } from '@/features/planner/plan.queries';
import { weekDays } from '@/features/planner/week';
import { savePrefs } from '@/features/profile';
import { actions } from './index';

export type ClaimResult = 'none' | 'claimed' | 'dropped';

// One claim at a time: two overlapping runs would both read an empty plan and
// both insert the week.
let running: Promise<ClaimResult> | null = null;

export function claimDraft(user: User): Promise<ClaimResult> {
  running ??= run(user).finally(() => {
    running = null;
  });
  return running;
}

async function run(user: User): Promise<ClaimResult> {
  const draft = await loadDraft();
  const answeredBefore =
    Boolean(user.user_metadata?.onboarded_at) || onboardedFor(await kv.get<boolean | string[]>('onboarded', false), user.id);
  if (!draft || answeredBefore) {
    await kv.remove('onboardingDraft'); // stale, broken, or not this account's to take
    return draft ? 'dropped' : 'none';
  }
  const today = weekDays()[0].key;
  const last = draft.week.reduce((m, d) => (d.day > m ? d.day : m), today);
  const existing = await listPlan(user.id, today, last);
  for (const step of claimSteps(draft, today, existing)) {
    // label 'dinner' is kept only once the free-list columns exist (flowV2).
    const out = await dispatch(actions, { action: 'put_in_plan', input: { ...step, kind: 'recipe' } }, { userId: user.id, wantUndo: false }, { flowV2: flags.flowV2 });
    if (!out.ok) throw new Error(out.error);
  }
  await savePrefs(draft.answers);
  await markAccountOnboarded(user.id); // the next launch must not ask the questions again
  await kv.remove('onboardingDraft');
  return 'claimed';
}
