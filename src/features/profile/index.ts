// Public surface (feature-module.md §exports): the "You" tab plus the settings
// sub-screens app/ routes mount. Profile consumes cross-feature hooks
// (useAuth/useSaved/usePlan) but exports none of its own — nothing else leaks.
export { ProfileScreen } from './ProfileScreen';
export { PreferencesScreen } from './PreferencesScreen';
// Cross-feature read surface (allowlist: profile → recipes/nutrition). One
// writer (profile), many readers — see usePrefs.ts.
export { usePrefs, type UsePrefs, type PrefsState } from './usePrefs';
export { HouseholdScreen } from './HouseholdScreen';
export { NotificationsScreen } from './NotificationsScreen';
export { OttoClubScreen } from './OttoClubScreen';
export { FaqScreen } from './FaqScreen';
export { JournalScreen } from './JournalScreen';
