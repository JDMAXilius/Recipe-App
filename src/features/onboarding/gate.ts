// Pure first-run gate decision — the ONE place launch routing is decided, kept
// React-free so it's unit-testable (gate.test.mjs). app/index.tsx consumes it.
// null = "still resolving, show the splash"; anything else is a redirect target.
//
// First-run order (Juan, 2026-10-03): sign up → onboarding → the Otto Club trial
// offer (OnboardingScreen's finish) → the app. Onboarding comes AFTER the account,
// so a signed-in user who hasn't seen it on this device is sent there.
export type GateRoute = '/onboarding' | '/(auth)/sign-up' | '/(auth)/sign-in' | '/(tabs)';

export interface GateInput {
  onboarded: boolean | null; // null = kv still loading
  isLoaded: boolean; // auth session resolved?
  hasSession: boolean;
}

export function resolveRoute({ onboarded, isLoaded, hasSession }: GateInput): GateRoute | null {
  if (!isLoaded || onboarded === null) return null; // splash
  if (!hasSession) return onboarded ? '/(auth)/sign-in' : '/(auth)/sign-up';
  return onboarded ? '/(tabs)' : '/onboarding';
}
