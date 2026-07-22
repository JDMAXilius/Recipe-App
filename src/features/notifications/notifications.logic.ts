// Pure notification scheduling logic (contract: feature-module.md — no RN, no
// expo imports here so the colocated .mjs test can strip-types and run it).
// Given the week's plan + the user's reminder prefs + a "now", it computes the
// exact local notifications to schedule. Everything time-based lives here so
// notifications.queries.ts is just the expo-notifications plumbing.
import type { PlanEntry } from '@/features/planner';

// What v1 persisted, minus the cosmetic: a per-planned-day dinner nudge (with a
// chosen hour) and a Sunday planning nudge. Both default OFF — Otto is quiet.
export interface NotifPrefs {
  tonight: boolean; // nudge on days that have an uncooked planned dish
  hour: number; // 0-23 — when the tonight nudge fires
  sunday: boolean; // Sunday 9am "plan your week" nudge
}

export const DEFAULT_PREFS: NotifPrefs = { tonight: false, hour: 17, sunday: false };
export const TONIGHT_HOURS = [16, 17, 18, 19] as const;

export interface PlannedNotification {
  id: string; // stable per occurrence — the idempotent reschedule key
  date: Date;
  title: string;
  body: string;
}

type PlanRow = Pick<PlanEntry, 'day' | 'title' | 'cooked'>;

const SUNDAY_HOUR = 9;

// Local Date at `hour` on a YYYY-MM-DD day key (mirrors week.ts's local-time
// convention — never UTC, or "Today 5pm" drifts by the timezone offset).
function dayAt(dayKey: string, hour: number): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// The next Sunday at 9am from `now`. If today is Sunday and it's still before
// 9am, that's today; otherwise the coming Sunday.
function nextSunday(now: Date): Date {
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), SUNDAY_HOUR, 0, 0, 0);
  let add = (7 - at.getDay()) % 7; // days until Sunday (0 = today is Sunday)
  if (add === 0 && at.getTime() <= now.getTime()) add = 7; // already past 9am today
  at.setDate(at.getDate() + add);
  return at;
}

// Pure: plan rows + prefs + now → the local notifications to schedule, sorted
// by fire time. Past fire-times are pruned (you can't schedule the past). One
// tonight nudge per future day with an uncooked dish, naming the first dish.
export function computeNotifications(
  entries: PlanRow[],
  prefs: NotifPrefs,
  now: Date,
): PlannedNotification[] {
  const out: PlannedNotification[] = [];

  if (prefs.tonight) {
    // Group uncooked dishes by day, preserving plan order within a day.
    const byDay = new Map<string, string[]>();
    for (const e of entries) {
      if (e.cooked || !e.day || !e.title) continue;
      const list = byDay.get(e.day) ?? [];
      list.push(e.title);
      byDay.set(e.day, list);
    }
    for (const [day, dishes] of byDay) {
      const when = dayAt(day, prefs.hour);
      if (when.getTime() <= now.getTime()) continue; // past — skip
      const extra = dishes.length > 1 ? ` and ${dishes.length - 1} more` : '';
      out.push({
        id: `tonight-${day}`,
        date: when,
        title: 'Tonight in your kitchen',
        body: `${dishes[0]}${extra} — ready to start cooking?`,
      });
    }
  }

  if (prefs.sunday) {
    const when = nextSunday(now);
    out.push({
      id: `sunday-${toDayKey(when)}`,
      date: when,
      title: 'Plan your week',
      body: 'A fresh week ahead — what are you cooking?',
    });
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
