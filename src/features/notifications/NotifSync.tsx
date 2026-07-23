import { useEffect } from 'react';
import { usePlan } from '@/features/planner';
import { useNotifPrefs } from './useNotifPrefs';
import { syncNotifications } from './notifications.queries';

// Root-level reminder scheduler (mounted once in app/_layout, inside the auth +
// query providers). Keeps the OS notification schedule in step with the week +
// prefs from ANYWHERE — planning a meal on the Week tab reschedules tonight's
// nudge without the user ever opening Reminders. Renders nothing. Web-safe:
// syncNotifications no-ops on web. Single source of truth — the Reminders screen
// only edits prefs; it does NOT schedule (that would double-fire this).
export function NotifSync() {
  const { entries, isLoading } = usePlan();
  const prefs = useNotifPrefs();

  useEffect(() => {
    if (isLoading) return; // empty-during-fetch would cancel a valid schedule
    void syncNotifications(entries, prefs);
    // prefs is a fresh object each render — depend on its scalar fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, entries, prefs.tonight, prefs.hour, prefs.sunday]);

  return null;
}
