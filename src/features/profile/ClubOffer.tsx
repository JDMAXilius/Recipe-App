import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import { useAuth } from '@/features/auth';
import { useMembership } from './club.purchases';

// Root-level, renders nothing. Once per account on this device, the first time a
// non-member lands in the tabs after signing in, open Otto Club so the 7-day free
// trial is offered up front. The paywall has "Not now" and the X; it never repeats.
const Seen = z.array(z.string());

export function ClubOffer() {
  const { user } = useAuth();
  const { member } = useMembership();
  const router = useRouter();
  const inTabs = useSegments()[0] === '(tabs)';
  const uid = user?.id;

  useEffect(() => {
    if (!uid || member || !inTabs) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      const seen = await kv.get('clubOffered', [] as string[], Seen);
      if (cancelled || seen.includes(uid)) return;
      // Let the home screen settle first; membership may still be loading.
      timer = setTimeout(() => {
        void kv.set('clubOffered', [...seen, uid]);
        router.push('/otto-club');
      }, 1200);
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [uid, member, inTabs, router]);

  return null;
}
