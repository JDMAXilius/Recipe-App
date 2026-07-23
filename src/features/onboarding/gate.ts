// Pure first-run gate decision — the ONE place launch routing is decided, kept
// React-free so it's unit-testable (gate.test.mjs). app/index.tsx consumes it.
// null = "still resolving, show the splash"; anything else is a redirect target.
export type GateRoute = '/onboarding' | '/(auth)/sign-in' | '/(tabs)';

export interface GateInput {
  onboarded: boolean | null; // null = kv still loading
  isLoaded: boolean; // auth session resolved?
  hasSession: boolean; // guest OR real
}

export function resolveRoute({ onboarded, isLoaded, hasSession }: GateInput): GateRoute | null {
  if (!isLoaded || onboarded === null) return null; // splash
  // A live session wins over the onboarding flag: an already-signed-in user
  // whose local onboarded flag was cleared (app-data reset) should go straight
  // home, not be force-marched through onboarding → sign-up and bounced back.
  if (hasSession) return '/(tabs)';
  if (!onboarded) return '/onboarding';
  return '/(auth)/sign-in'; // onboarded but signed out
}
