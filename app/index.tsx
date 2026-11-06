import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth';
import { Splash, launchHref, resolveLaunch, useDraft, useOnboarded } from '@/features/onboarding';
import { flags } from '@/shared/flags';
import { useMembership } from '@/features/profile';
import { useIntent } from '@/shared/useIntent';

// The launch entry (`/`): gathers the signals, asks resolveLaunch (pure,
// tested) where to open, and redirects. Nothing is decided here.
export default function Index() {
  const { isLoaded, session } = useAuth();
  const { onboarded } = useOnboarded(session?.user);
  const { state } = useMembership();
  const { hasDraft } = useDraft();

  const launch = resolveLaunch({
    authReady: isLoaded,
    signedIn: !!session,
    onboarded,
    hasDraft,
    membership: state,
    purchasePending: false, // Ask to Buy waiting arrives with R2.2
  });
  // A link that came in before sign-in or the paywall opens now (R0.2).
  const intent = useIntent(launch === 'app');
  if (launch === 'loading' || (launch === 'app' && intent === undefined)) return <Splash />;
  return <Redirect href={(launch === 'app' && intent ? intent : launchHref(launch, flags.flowV2)) as Href} />;
}
