// Public surface of the auth feature (feature-module.md).
// Screens are imported by thin app/ routes; useAuth() + AuthProvider are the
// cross-feature auth surface (allowlist: useAuth consumed by ALL features,
// AuthProvider is the one allowed provider, mounted at app/_layout).
export { AuthProvider, useAuth, type AuthValue } from './AuthProvider';

export { SignInScreen } from './SignInScreen';
export { SignUpScreen } from './SignUpScreen';
export { ForgotPasswordScreen } from './ForgotPasswordScreen';
export { ResetPasswordScreen } from './ResetPasswordScreen';
export { ChangePasswordScreen } from './ChangePasswordScreen';

export {
  SOCIAL_PROVIDERS,
  providerLabel,
  type SocialProvider,
  type AuthMode,
} from './social';
export { displayNameFor, hasUsername, cleanUsername, MAX_USERNAME } from './username';
