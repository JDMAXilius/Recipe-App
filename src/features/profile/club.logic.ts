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
