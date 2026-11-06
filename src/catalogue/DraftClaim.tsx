// Mounted once in app/_layout: when someone is signed in and a draft waits,
// claim it, then refresh the plan and the draft (the launch moves on).
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { DRAFT_KEY, useDraft } from '@/features/onboarding/useDraft';
import { claimDraft } from './claimDraft';

export function DraftClaim() {
  const { session } = useAuth();
  const { hasDraft } = useDraft();
  const qc = useQueryClient();
  const user = session?.user;

  useEffect(() => {
    if (!user || !hasDraft) return;
    let alive = true;
    claimDraft(user)
      .then(() => {
        if (!alive) return;
        void qc.invalidateQueries({ queryKey: ['plan'] });
        void qc.invalidateQueries({ queryKey: DRAFT_KEY });
      })
      .catch((e: Error) => console.warn('draft claim failed; kept for next launch', e.message));
    return () => {
      alive = false;
    };
  }, [user, hasDraft, qc]);

  return null;
}
