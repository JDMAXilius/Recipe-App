import { useEffect } from 'react';
import { usePlan } from '@/features/planner';
import { useNotifPrefs } from './useNotifPrefs';
import { syncNotifications } from './notifications.queries';
import { useNotificationTaps } from './useNotificationTaps';
import { flags } from '@/shared/flags';

// Root-level reminder scheduler (mounted once in app/_layout, inside the auth +
// query providers). Keeps the OS notification schedule in step with the week +
// prefs from ANYWHERE — planning a meal on the Week tab reschedules tonight's
// nudge without the user ever opening Reminders. Renders nothing. Web-safe:
// syncNotifications no-ops on web. Single source of truth — the Reminders screen
// only edits prefs; it does NOT schedule (that would double-fire this).
/** trialEndsAt (R2.8, composed by the root layout from the membership): a
 *  renewing trial's end; flowV2 only. */
export function NotifSync({ trialEndsAt }: { trialEndsAt?: string | null } = {}) {
  const { entries, isLoading, isSuccess, setCooked } = usePlan();
  const prefs = useNotifPrefs();
  useNotificationTaps(flags.flowV2, { ready: isSuccess, entries, setCooked });
  const trial = flags.flowV2 ? trialEndsAt ?? null : null;

  useEffect(() => {
    if (isLoading) return; // empty-during-fetch would cancel a valid schedule
    void syncNotifications(entries, prefs, { trialEndsAt: trial });
    // prefs is a fresh object each render — depend on its scalar fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, entries, prefs.tonight, prefs.hour, prefs.sunday, trial]);

  return null;
}
