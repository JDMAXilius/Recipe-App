// Pure first-run gate decision — the ONE place launch routing is decided, kept
// React-free so it's unit-testable (gate.test.mjs). app/index.tsx consumes it.
// null = "still resolving, show the splash"; anything else is a redirect target.
//
// First-run order (Juan, 2026-10-03): sign up → onboarding → the Otto Club trial
// offer (OnboardingScreen's finish) → the app. Onboarding comes AFTER the account,
// so a signed-in user who hasn't seen it on this device is sent there.
export type GateRoute = '/onboarding' | '/(auth)/sign-up' | '/(auth)/sign-in' | '/otto-club' | '/(tabs)';

export interface GateInput {
  onboarded: boolean | null; // null = kv still loading
  isLoaded: boolean; // auth session resolved?
  hasSession: boolean;
  /** Otto Club: true/false once RevenueCat answered, null while it hasn't.
   *  An error (offline on a fresh install) is false: fail closed onto the
   *  paywall, which has Try again and Restore. */
  member: boolean | null;
}

// Hard paywall (Juan, 2026-10-04): nobody uses Otto without an account AND an
// active Otto Club entitlement (the 7-day trial counts). Onboarding comes first
// for a new account, then the paywall; the app opens only for members.
export function resolveRoute({ onboarded, isLoaded, hasSession, member }: GateInput): GateRoute | null {
  if (!isLoaded || onboarded === null) return null; // splash
  if (!hasSession) return onboarded ? '/(auth)/sign-in' : '/(auth)/sign-up';
  if (!onboarded) return '/onboarding';
  if (member === null) return null; // RevenueCat hasn't answered: splash, never the app
  return member ? '/(tabs)' : '/otto-club';
}

/** The route guard app/_layout applies to every screen except auth, onboarding
 *  and the paywall: signed in AND a member. Unknown is not a member. */
export function canUseApp(hasSession: boolean, member: boolean | null): boolean {
  return hasSession && member === true;
}

// What the gate's `onboarded` means, from the stored value (useOnboarded): signed
// in → has THIS account finished onboarding on this phone; signed out → has this
// phone been used (sign-in) or is it a first launch (sign-up). Stored is the list
// of finished user ids; a legacy `true` (old per-device flag) = used, no ids.
export function onboardedFor(stored: boolean | string[], uid: string | undefined): boolean {
  const ids = Array.isArray(stored) ? stored : [];
  return uid ? ids.includes(uid) : Array.isArray(stored) ? ids.length > 0 : stored;
}
