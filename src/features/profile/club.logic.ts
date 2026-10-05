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

