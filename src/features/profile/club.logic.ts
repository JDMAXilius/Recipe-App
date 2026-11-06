// Pure logic for Otto Club purchases (no react-native-purchases imports so
// node --test can strip-type it). Structural types mirror the SDK shapes.

export const CLUB_ENTITLEMENT = 'club';

interface IntroPriceLike {
  price: number;
  periodUnit: string; // 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  periodNumberOfUnits: number;
}

// Free-trial length in days from a product's intro offer. null = no free trial
// (missing intro, or a paid intro price — we only ever ship a free one).
export function introTrialDays(intro: IntroPriceLike | null | undefined): number | null {
  if (!intro || intro.price !== 0) return null;
  const days: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
  const per = days[intro.periodUnit];
  return per ? intro.periodNumberOfUnits * per : null;
}

interface CustomerInfoLike {
  entitlements: { active: Record<string, unknown> };
}

export function hasClubEntitlement(info: CustomerInfoLike | null | undefined): boolean {
  return Boolean(info?.entitlements.active[CLUB_ENTITLEMENT]);
}

// RevenueCat error codes (purchases-typescript-internal generated/error-codes)
// → what the person reads. Never a bare code: "(7)" on a paywall tells nobody
// anything (seen on build 48, 2026-10-05).
export const LINKED_ELSEWHERE =
  "This Apple ID's Otto Club is linked to another Otto account. Sign in to that account to use it.";

export function purchaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case '7': // RECEIPT_ALREADY_IN_USE_ERROR
    case '13': // RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR
      return LINKED_ELSEWHERE;
    case '6': // PRODUCT_ALREADY_PURCHASED_ERROR
      return 'This Apple ID already has Otto Club. Tap Restore.';
    case '10': // NETWORK_ERROR
      return 'No connection. Check your internet and try again.';
    case '3': // PURCHASE_NOT_ALLOWED_ERROR
      return 'Purchases are turned off on this iPhone (Screen Time or a work profile).';
    case '2': // STORE_PROBLEM_ERROR
      return 'The App Store had a problem. Try again in a moment.';
    case '15': // OPERATION_ALREADY_IN_PROGRESS_ERROR
      return 'Already working on it. One moment.';
    default:
      return "The purchase didn't go through. Try again, or tap Restore.";
  }
}


/** What the launch may conclude about Otto Club. Not ready = unknown, whatever
 *  stale info says (mid sign-in RevenueCat still describes the anonymous
 *  customer). A failed fetch is a known "none": fail closed onto the paywall.
 *  ended = a paid entitlement exists in `all` but not in `active`. */
export function membershipState(
  purchasesReady: boolean,
  info: (CustomerInfoLike & { entitlements: { all?: Record<string, unknown> } }) | null | undefined,
  failed: boolean,
): 'unknown' | 'member' | 'ended' | 'none' {
  if (!purchasesReady || (!info && !failed)) return 'unknown';
  if (hasClubEntitlement(info)) return 'member';
  // RevenueCat keeps expired entitlements in `all`, trials too: a trial
  // cancelled before it charged is not a returning member.
  const past = info?.entitlements.all?.[CLUB_ENTITLEMENT] as { periodType?: string } | undefined;
  return past && past.periodType !== 'TRIAL' ? 'ended' : 'none';
}

/** What the trial reminder (R2.8) and the grace banner (R2.7) need from the
 *  active entitlement. A trial counts only while it will renew: a cancelled
 *  trial never charges, so there is nothing to remind about. */
export interface ClubDates {
  trialEndsAt: string | null;
  billingIssue: boolean;
}

export function clubDates(info: CustomerInfoLike | null | undefined): ClubDates {
  const e = info?.entitlements.active[CLUB_ENTITLEMENT] as
    | { periodType?: string; expirationDate?: string | null; willRenew?: boolean; billingIssueDetectedAt?: string | null }
    | undefined;
  if (!e) return { trialEndsAt: null, billingIssue: false };
  return {
    trialEndsAt: e.periodType === 'TRIAL' && e.willRenew && e.expirationDate ? e.expirationDate : null,
    billingIssue: !!e.billingIssueDetectedAt,
  };
}

/** R2.1: the day a free trial started now would end, for "Free until Nov 11".
 *  Calendar units (a MONTH trial ends on the same date next month), as
 *  StoreKit counts them. null when there is no free trial. */
export function trialEndDate(intro: IntroPriceLike | null | undefined, now: Date): Date | null {
  if (!introTrialDays(intro) || !intro) return null;
  const d = new Date(now.getTime());
  const n = intro.periodNumberOfUnits;
  if (intro.periodUnit === 'DAY') d.setDate(d.getDate() + n);
  else if (intro.periodUnit === 'WEEK') d.setDate(d.getDate() + 7 * n);
  else if (intro.periodUnit === 'MONTH') d.setMonth(d.getMonth() + n);
  else if (intro.periodUnit === 'YEAR') d.setFullYear(d.getFullYear() + n);
  else return null;
  return d;
}

/** R7.1: the member's own line on Membership — which plan, and what happens
 *  next ("Renews on Dec 4" / "Ends on Dec 4"). null for a non-member. */
export interface MemberSummary {
  plan: 'Yearly' | 'Monthly' | null;
  next: string | null;
  trial: boolean;
}

export function memberSummary(info: CustomerInfoLike | null | undefined, format: (d: Date) => string): MemberSummary | null {
  const e = info?.entitlements.active[CLUB_ENTITLEMENT] as
    | { productIdentifier?: string; expirationDate?: string | null; willRenew?: boolean; periodType?: string }
    | undefined;
  if (!e) return null;
  const id = e.productIdentifier ?? '';
  const plan = /year|annual/i.test(id) ? 'Yearly' : /month/i.test(id) ? 'Monthly' : null;
  const when = e.expirationDate ? new Date(e.expirationDate) : null;
  const ok = when && !Number.isNaN(when.getTime());
  const next = ok ? `${e.willRenew ? 'Renews' : 'Ends'} on ${format(when)}` : null;
  return { plan, next, trial: e.periodType === 'TRIAL' };
}
