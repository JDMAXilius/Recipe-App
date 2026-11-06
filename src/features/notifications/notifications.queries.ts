// The only place expo-notifications is touched — permission + schedule plumbing.
// All time math lives in notifications.logic.ts; this file just talks to the OS.
// Web has no scheduling in expo-notifications, so every call is a guarded no-op
// there (the Reminders screen shows a "phone only" note instead).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { computeNotifications, DINNER_ACTIONS, type NotifExtra, type NotifPrefs } from './notifications.logic';
import { flags } from '@/shared/flags';
import type { PlanEntry } from '@/features/planner';

const web = Platform.OS === 'web';

// Foreground presentation behavior, set once at module init. Banner + list, no
// sound/badge — a gentle nudge, not an alarm.
if (!web) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Ask (or re-check) OS permission. Returns whether reminders may actually fire,
// so the toggle can stay OFF and show the "enable in Settings" path on denial.
export async function ensurePermission(): Promise<boolean> {
  if (web) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false; // permanently denied — Settings only
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

// Idempotent re-sync: wipe every scheduled Otto reminder and reschedule from the
// current plan + prefs. Called on enable, on prefs change, and on plan change —
// cancel-all-first is what makes repeated calls safe.
// R8.2 (flowV2): the dinner reminder's two buttons. Both open Otto: a quit app
// can't run JS from a background action reliably, and opening shows the
// result ("Cooked it" lands on the plan, ticked).
let categoryReady: Promise<unknown> | null = null;
function dinnerCategory(): Promise<unknown> {
  categoryReady ??= Notifications.setNotificationCategoryAsync('dinner', [
    { identifier: DINNER_ACTIONS.cooked, buttonTitle: 'Cooked it', options: { opensAppToForeground: true } },
    { identifier: DINNER_ACTIONS.swap, buttonTitle: 'Swap', options: { opensAppToForeground: true } },
  ]).catch(() => {
    categoryReady = null;
  });
  return categoryReady;
}

export async function syncNotifications(
  entries: Pick<PlanEntry, 'day' | 'title' | 'cooked' | 'recipe_id' | 'id'>[],
  prefs: NotifPrefs,
  extra: NotifExtra = {},
): Promise<void> {
  if (web) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!prefs.tonight && !prefs.sunday) return;
    if (flags.flowV2) await dinnerCategory();
    for (const n of computeNotifications(entries, prefs, new Date(), extra)) {
      const buttons = flags.flowV2 && n.category ? { categoryIdentifier: n.category } : {};
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: {
          title: n.title,
          body: n.body,
          data: { ...(n.href ? { href: n.href } : {}), ...(n.entryId != null ? { entryId: n.entryId } : {}) },
          ...buttons,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date },
      });
    }
  } catch {
    // best-effort — a scheduling failure never blocks the UI
  }
}

/** The href a tapped reminder carries (R8.2), or null. */
export function tappedHref(response: Notifications.NotificationResponse | null | undefined): string | null {
  const href = response?.notification.request.content.data?.href;
  return typeof href === 'string' && href.startsWith('/') ? href : null;
}

/** The action a reminder button carries (R8.2): which button, for which entry. */
export function tappedAction(response: Notifications.NotificationResponse | null | undefined): { action: 'cooked' | 'swap'; entryId: number } | null {
  if (!response) return null;
  const action = response.actionIdentifier;
  const entryId = response.notification.request.content.data?.entryId;
  if ((action !== DINNER_ACTIONS.cooked && action !== DINNER_ACTIONS.swap) || typeof entryId !== 'number') return null;
  return { action, entryId };
}
