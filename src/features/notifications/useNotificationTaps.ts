// Reminder taps (R8.2, flowV2). A tap while Otto is running opens its href
// now. A tap that launched Otto goes through the intent store (kv 'intent'),
// which the launch opens once the person is through sign-in and the paywall,
// so a cold tap never fights the launch's own redirect. Intent rules drop
// doors (the Otto Club screen is one), so a cold trial tap opens Home.
// Dinner buttons: Swap opens the week; Cooked it marks that entry cooked once
// the plan has loaded (the person is signed in by then), then opens the week.
// A delivered banner can outlive a swap or a move: the entry is ticked only
// if it still has the title and day the banner named.
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { kv } from '@/shared/storage';
import { remember } from '@/shared/intent';
import type { PlanEntry } from '@/features/planner';
import { responseKey, tappedAction, tappedHref, type DinnerAction } from './notifications.queries';

const WEEK = '/plan?view=week';
let coldHandled = false;
const handled = new Set<string>();

export function useNotificationTaps(
  enabled: boolean,
  plan: { ready: boolean; entries: readonly PlanEntry[]; setCooked: (id: number, cooked: boolean) => Promise<void> },
) {
  const router = useRouter();
  const [pending, setPending] = useState<DinnerAction | null>(null);
  const setCooked = useRef(plan.setCooked);
  setCooked.current = plan.setCooked;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const handle = (r: Notifications.NotificationResponse | null, cold: boolean) => {
      if (!r) return;
      const key = responseKey(r);
      if (handled.has(key)) return; // the launch response reaches both paths
      handled.add(key);
      const act = tappedAction(r);
      if (act?.action === 'cooked') setPending(act);
      const href = act ? WEEK : tappedHref(r);
      if (!href) return;
      if (cold) {
        const intent = remember(href, Date.now());
        if (intent) void kv.set('intent', intent);
      } else router.push(href as Href);
    };
    // The cold read goes first so a launch tap is taken as cold (through the
    // intent store), never pushed over the launch redirect.
    let sub: { remove: () => void } | null = null;
    const listen = () => {
      sub = Notifications.addNotificationResponseReceivedListener((r) => handle(r, false));
    };
    if (!coldHandled) {
      coldHandled = true;
      void Notifications.getLastNotificationResponseAsync()
        .then((r) => handle(r, true))
        .catch(() => {})
        .finally(listen);
    } else listen();
    return () => sub?.remove();
  }, [enabled, router]);

  // Cooked it, once the plan can take the write — and only if the entry is
  // still the dish the banner named.
  useEffect(() => {
    if (!enabled || !plan.ready || !pending) return;
    const act = pending;
    setPending(null);
    const entry = plan.entries.find((e) => e.id === act.entryId);
    const same = entry && (act.title == null || entry.title === act.title) && (act.day == null || entry.day === act.day);
    if (same && !entry.cooked) void setCooked.current(act.entryId, true).catch(() => {});
  }, [enabled, plan.ready, plan.entries, pending]);
}
