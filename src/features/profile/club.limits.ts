// What the free tier gets, and the pure arithmetic that decides it. No React,
// no storage, no RevenueCat — so node --test can strip-type it and so the
// numbers below have exactly one home.
//
// The locked product decision (OTTO_CLUB_GOLIVE.md §5) is **freemium, not a
// hard gate**: browsing, searching, cooking any recipe, writing one out by
// hand and Otto's personality are free forever and are NOT counted here.
// Club buys the expensive verbs — the ones that cost us an AI call or that
// only matter once you have a real collection.
//
// TUNING: these three numbers are the whole free tier. Change them here and
// every screen follows. They are a founder call, not an engineering one — the
// values below are a starting point chosen so a new user can import a few
// recipes, keep a real shelf of them and ask Otto a handful of questions
// before they are ever asked for money.

export const FREE_LIMITS = {
  /** AI-backed imports (link, photo, pasted text) per calendar month. */
  importsPerMonth: 5,
  /** Recipes saved from Discover — the size of a free shelf. Your OWN written
   *  recipes are never counted: manual entry is free forever. */
  savedRecipes: 25,
  /** Questions to Otto per day (chat turns + mid-cook help). */
  asksPerDay: 5,
} as const;

export type GateKind = 'import' | 'save' | 'ask';

/** Counters that need a memory. `save` is deliberately absent: saves are
 *  counted from the rows themselves, because a save can be undone and a
 *  counter that only goes up would charge someone for a recipe they deleted. */
export interface ClubUsage {
  /** 'YYYY-MM' the import count belongs to. */
  month: string;
  imports: number;
  /** 'YYYY-MM-DD' the ask count belongs to. */
  day: string;
  asks: number;
}

export const emptyUsage: ClubUsage = { month: '', imports: 0, day: '', asks: 0 };

/** Local calendar keys — deliberately local, not UTC. A limit that resets at
 *  midnight should reset at the user's midnight; using UTC would roll over
 *  mid-evening in the Americas and mid-morning in Asia. */
export function monthKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function dayKey(now: Date): string {
  return `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Zero any counter whose period has rolled over. Always call this before
 *  reading a count — a stale month would keep last month's spend alive. */
export function rollUsage(usage: ClubUsage, now: Date): ClubUsage {
  const month = monthKey(now);
  const day = dayKey(now);
  return {
    month,
    day,
    imports: usage.month === month ? usage.imports : 0,
    asks: usage.day === day ? usage.asks : 0,
  };
}

export interface GateInput {
  member: boolean;
  usage: ClubUsage;
  /** Rows in the saved list right now. Only read for kind === 'save'. */
  savedCount: number;
  now: Date;
}

/** How many of this kind are left. Infinity for a member. Never negative —
 *  a shelf that is already over the limit (a lapsed member, or a limit we
 *  lowered) reads 0 and blocks the next one rather than reporting a debt. */
export function remaining(kind: GateKind, input: GateInput): number {
  if (input.member) return Infinity;
  const usage = rollUsage(input.usage, input.now);
  switch (kind) {
    case 'import':
      return Math.max(0, FREE_LIMITS.importsPerMonth - usage.imports);
    case 'ask':
      return Math.max(0, FREE_LIMITS.asksPerDay - usage.asks);
    case 'save':
      return Math.max(0, FREE_LIMITS.savedRecipes - input.savedCount);
  }
}

export function allowed(kind: GateKind, input: GateInput): boolean {
  return remaining(kind, input) > 0;
}

/** Spend one. Rolls the period first, so the first import of a new month
 *  lands on a zeroed counter rather than incrementing last month's. */
export function bump(kind: GateKind, usage: ClubUsage, now: Date): ClubUsage {
  const rolled = rollUsage(usage, now);
  if (kind === 'import') return { ...rolled, imports: rolled.imports + 1 };
  if (kind === 'ask') return { ...rolled, asks: rolled.asks + 1 };
  return rolled; // 'save' keeps no counter — see ClubUsage
}

/** The line shown when a gate closes. Says the number, says the period, and
 *  never implies the free thing was taken away — it wasn't. */
export function blockedMessage(kind: GateKind): string {
  switch (kind) {
    case 'import':
      return `That's ${FREE_LIMITS.importsPerMonth} imports this month. Otto Club makes them unlimited — writing a recipe out by hand stays free.`;
    case 'save':
      return `Your free shelf holds ${FREE_LIMITS.savedRecipes} saved recipes. Otto Club lifts the lid — your own recipes were never counted.`;
    case 'ask':
      return `That's ${FREE_LIMITS.asksPerDay} questions today. Otto Club means you can keep asking.`;
  }
}
