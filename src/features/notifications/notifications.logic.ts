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
  /** Where a tap opens (R8.2). Absent: the app just opens. */
  href?: string;
  /** R8.2 buttons: 'dinner' = Cooked it · Swap, for a day with ONE dish
   *  (two dishes: which one was cooked? The tap opens the app instead). */
  category?: 'dinner';
  entryId?: number;
  entryTitle?: string;
  entryDay?: string;
}

export const DINNER_ACTIONS = { cooked: 'cooked', swap: 'swap' } as const;

type PlanRow = Pick<PlanEntry, 'day' | 'title' | 'cooked'> & { recipe_id?: string | null; id?: number };

/** Account facts that aren't in the plan. trialEndsAt: a renewing free
 *  trial's end (RevenueCat expirationDate, ISO). */
export interface NotifExtra {
  trialEndsAt?: string | null;
}

const TRIAL_HOUR = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/** R2.8: two days before the trial ends, at 10:00 local that day — never in
 *  the night, never in the past, and only while some reminder is on. */
export function trialReminder(trialEndsAt: string | null | undefined, remindersOn: boolean, now: Date): PlannedNotification | null {
  if (!trialEndsAt || !remindersOn) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  const day = new Date(end.getTime() - 2 * DAY_MS);
  const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), TRIAL_HOUR, 0, 0, 0);
  if (when.getTime() <= now.getTime() || when.getTime() >= end.getTime()) return null;
  const date = end.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  return {
    id: `trial-${toDayKey(end)}`,
    date: when,
    title: 'Your free trial ends in 2 days',
    body: `Otto Club starts on ${date}. You can change or cancel it in Account.`,
    href: '/otto-club',
  };
}

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
  extra: NotifExtra = {},
): PlannedNotification[] {
  const out: PlannedNotification[] = [];

  if (prefs.tonight) {
    // Group uncooked dishes by day, preserving plan order within a day.
    const byDay = new Map<string, string[]>();
    const firstRecipe = new Map<string, string>();
    const ids = new Map<string, number[]>();
    for (const e of entries) {
      if (e.cooked || !e.day || !e.title) continue;
      const list = byDay.get(e.day) ?? [];
      list.push(e.title);
      byDay.set(e.day, list);
      if (e.recipe_id && !firstRecipe.has(e.day)) firstRecipe.set(e.day, e.recipe_id);
      if (typeof e.id === 'number') ids.set(e.day, [...(ids.get(e.day) ?? []), e.id]);
    }
    for (const [day, dishes] of byDay) {
      const when = dayAt(day, prefs.hour);
      if (when.getTime() <= now.getTime()) continue; // past — skip
      const more = dishes.length > 1 ? ` and ${dishes.length - 1} more` : '';
      out.push({
        id: `tonight-${day}`,
        date: when,
        title: 'Tonight in your kitchen',
        body: `${dishes[0]}${more}. Ready to start cooking?`,
        href: firstRecipe.has(day) ? `/recipe/${firstRecipe.get(day)}` : '/plan?view=week',
        ...(dishes.length === 1 && ids.get(day)?.length === 1
          ? { category: 'dinner' as const, entryId: ids.get(day)![0], entryTitle: dishes[0], entryDay: day }
          : {}),
      });
    }
  }

  if (prefs.sunday) {
    const when = nextSunday(now);
    out.push({
      id: `sunday-${toDayKey(when)}`,
      date: when,
      title: 'Plan your week',
      body: 'A fresh week ahead. What are you cooking?',
      href: '/plan?view=week',
    });
  }

  const trial = trialReminder(extra.trialEndsAt, prefs.tonight || prefs.sunday, now);
  if (trial) out.push(trial);

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
