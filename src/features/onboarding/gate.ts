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
  if (!onboarded) return '/onboarding';
  if (!hasSession) return '/(auth)/sign-in'; // onboarded but signed out
  return '/(tabs)'; // onboarded + a session (guest or real)
}
