import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth';

// A signed-in user has no business on the auth screens. The moment a session
// exists — email/password, social, or a session restored on launch — leave for
// home. Without this guard a successful sign-in sets the session but never
// navigates, stranding the user on the form: the launch gate (app/index) only
// runs at the root route, which we're no longer mounted on once inside (auth).
// Symmetric with the (tabs) guard that bounces a signed-out user back here.
export default function AuthLayout() {
  const { isLoaded, session } = useAuth();
  // The launch gate (app/index) decides where a new session goes: onboarding the
  // first time on this device, otherwise home.
  if (isLoaded && session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
