// The only place expo-notifications is touched — permission + schedule plumbing.
// All time math lives in notifications.logic.ts; this file just talks to the OS.
// Web has no scheduling in expo-notifications, so every call is a guarded no-op
// there (the Reminders screen shows a "phone only" note instead).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { computeNotifications, type NotifPrefs } from './notifications.logic';
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
export async function syncNotifications(
  entries: Pick<PlanEntry, 'day' | 'title' | 'cooked'>[],
  prefs: NotifPrefs,
): Promise<void> {
  if (web) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!prefs.tonight && !prefs.sunday) return;
    for (const n of computeNotifications(entries, prefs, new Date())) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: { title: n.title, body: n.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date },
      });
    }
  } catch {
    // best-effort — a scheduling failure never blocks the UI
  }
}
