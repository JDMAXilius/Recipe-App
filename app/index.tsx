import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth';
import { Splash, resolveRoute, useOnboarded } from '@/features/onboarding';

// The launch entry (`/`). Resolves auth + the first-run flag, then either holds
// on the splash (still loading) or redirects. Decision lives in resolveRoute
// (pure, tested); this file only wires state → <Redirect>.
export default function Index() {
  const { isLoaded, session } = useAuth();
  const { onboarded } = useOnboarded();

  const route = resolveRoute({ onboarded, isLoaded, hasSession: !!session });
  if (!route) return <Splash />;
  return <Redirect href={route as Href} />;
}
