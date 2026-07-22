// Public surface of the onboarding feature (feature-module.md). Thin app/ routes
// (index gate, onboarding, _layout splash) mount these; nothing else leaks.
export { OnboardingScreen } from './OnboardingScreen';
export { Splash } from './Splash';
export { useOnboarded } from './useOnboarded';
export { resolveRoute, type GateRoute, type GateInput } from './gate';
