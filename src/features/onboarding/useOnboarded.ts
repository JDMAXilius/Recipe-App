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
import { onboardedFor } from './launch';

const Stored = z.union([z.boolean(), z.array(z.string())]);

/** Record that this account has its answers (the claimed draft, or the
 *  onboarding screen): on the phone at once, on the account best-effort. */
export async function markAccountOnboarded(uid: string): Promise<string[]> {
  const stored = await kv.get('onboarded', false as z.infer<typeof Stored>, Stored);
  const ids = Array.isArray(stored) ? stored : [];
  const next = ids.includes(uid) ? ids : [...ids, uid];
  await kv.set('onboarded', next);
  // Offline, the local list still lets this phone through.
  await supabase.auth.updateUser({ data: { onboarded_at: new Date().toISOString() } }).catch(() => {});
  return next;
}

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
    setStored(await markAccountOnboarded(uid));
  }, [uid]);

  const onAccount = Boolean(user?.user_metadata?.onboarded_at);
  const onboarded = stored === null ? null : onAccount || onboardedFor(stored, uid);
  return { onboarded, markOnboarded };
}
