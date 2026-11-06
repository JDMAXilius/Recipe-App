// Reminder taps (R8.2, flowV2). A tap while Otto is running opens its href
// now. A tap that launched Otto goes through the intent store (kv 'intent'),
// which the launch opens once the person is through sign-in and the paywall,
// so a cold tap never fights the launch's own redirect. Intent rules drop
// doors (the Otto Club screen is one), so a cold trial tap opens Home.
// Dinner buttons: Swap opens the week; Cooked it marks that entry cooked once
// the plan has loaded (the person is signed in by then), then opens the week.
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { kv } from '@/shared/storage';
import { remember } from '@/shared/intent';
import { tappedAction, tappedHref } from './notifications.queries';

const WEEK = '/plan?view=week';
let coldHandled = false;

export function useNotificationTaps(
  enabled: boolean,
  plan: { ready: boolean; setCooked: (id: number, cooked: boolean) => Promise<void> },
) {
  const router = useRouter();
  const pendingCooked = useRef<number | null>(null);
  const setCooked = useRef(plan.setCooked);
  setCooked.current = plan.setCooked;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const handle = (r: Notifications.NotificationResponse | null, cold: boolean) => {
      const act = tappedAction(r);
      if (act?.action === 'cooked') pendingCooked.current = act.entryId;
      const href = act ? WEEK : tappedHref(r);
      if (!href) return;
      if (cold) {
        const intent = remember(href, Date.now());
        if (intent) void kv.set('intent', intent);
      } else router.push(href as Href);
    };
    if (!coldHandled) {
      coldHandled = true;
      void Notifications.getLastNotificationResponseAsync()
        .then((r) => handle(r, true))
        .catch(() => {});
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) => handle(r, false));
    return () => sub.remove();
  }, [enabled, router]);

  // Cooked it, once the plan can take the write.
  useEffect(() => {
    if (!enabled || !plan.ready || pendingCooked.current == null) return;
    const id = pendingCooked.current;
    pendingCooked.current = null;
    void setCooked.current(id, true).catch(() => {});
  });
}
