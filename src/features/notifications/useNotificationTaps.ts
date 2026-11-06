// Reminder taps (R8.2, flowV2). A tap while Otto is running opens its href
// now. A tap that launched Otto goes through the intent store (kv 'intent'),
// which the launch opens once the person is through sign-in and the paywall,
// so a cold tap never fights the launch's own redirect. Intent rules drop
// doors (the Otto Club screen is one), so a cold trial tap opens Home.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { kv } from '@/shared/storage';
import { remember } from '@/shared/intent';
import { tappedHref } from './notifications.queries';

let coldHandled = false;

export function useNotificationTaps(enabled: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    if (!coldHandled) {
      coldHandled = true;
      void Notifications.getLastNotificationResponseAsync()
        .then((r) => {
          const intent = remember(tappedHref(r), Date.now());
          if (intent) void kv.set('intent', intent);
        })
        .catch(() => {});
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const href = tappedHref(r);
      if (href) router.push(href as Href);
    });
    return () => sub.remove();
  }, [enabled, router]);
}
