// First-run flag. Signed in: "has THIS account finished onboarding" lives on the
// account (Supabase user_metadata.onboarded_at, next to the username), so it
// survives reinstalls and new phones, and a new account always gets the intro +
// trial offer. The device list of finished ids is a bridge for accounts that
// finished before the flag moved server-side. Signed out: "has this phone been
// used" (sign-in vs sign-up) is genuinely per device and stays local.
// onboarded=null means the kv read hasn't landed — the gate shows the splash.
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import { supabase } from '@/shared/supabase/client';
import { onboardedFor } from './gate';

const Stored = z.union([z.boolean(), z.array(z.string())]);

export function useOnboarded(user: User | null | undefined) {
  const [stored, setStored] = useState<boolean | string[] | null>(null);
  const uid = user?.id;

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
    // Best-effort: offline, the local list still lets this phone through.
    await supabase.auth
      .updateUser({ data: { onboarded_at: new Date().toISOString() } })
      .catch(() => {});
  }, [uid, stored]);

  const onAccount = Boolean(user?.user_metadata?.onboarded_at);
  const onboarded = stored === null ? null : onAccount || onboardedFor(stored, uid);
  return { onboarded, markOnboarded };
}
