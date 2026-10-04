// First-run flag, device-local (persistence.md §4) but kept PER ACCOUNT: the order
// is sign up → onboarding → Otto Club trial offer, so every new account on this
// phone gets it, even after another account (or a deleted one) finished it.
// Stored as the list of user ids that finished; a legacy `true` (the old
// per-device flag) means "this phone has been used" with no ids yet.
// onboarded=null means the kv read hasn't landed — the gate shows the splash.
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import { onboardedFor } from './gate';

const Stored = z.union([z.boolean(), z.array(z.string())]);

export function useOnboarded(uid: string | undefined) {
  const [stored, setStored] = useState<boolean | string[] | null>(null);

  useEffect(() => {
    let alive = true;
    kv.get('onboarded', false as z.infer<typeof Stored>, Stored).then((v) => {
      if (alive) setStored(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const markOnboarded = useCallback(async () => {
    if (!uid) return;
    const ids = [...(Array.isArray(stored) ? stored : []), uid];
    await kv.set('onboarded', ids);
    setStored(ids);
  }, [uid, stored]);

  const onboarded = stored === null ? null : onboardedFor(stored, uid);
  return { onboarded, markOnboarded };
}
