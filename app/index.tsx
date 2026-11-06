import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth';
import { LAUNCH_HREF, Splash, resolveLaunch, useOnboarded } from '@/features/onboarding';
import { useMembership } from '@/features/profile';

// The launch entry (`/`): gathers the signals, asks resolveLaunch (pure,
// tested) where to open, and redirects. Nothing is decided here.
export default function Index() {
  const { isLoaded, session } = useAuth();
  const { onboarded } = useOnboarded(session?.user);
  const { state } = useMembership();

  const launch = resolveLaunch({
    authReady: isLoaded,
    signedIn: !!session,
    onboarded,
    hasDraft: false, // the onboarding draft arrives with R0.3
    membership: state,
    purchasePending: false, // Ask to Buy waiting arrives with R2.2
  });
  if (launch === 'loading') return <Splash />;
  return <Redirect href={LAUNCH_HREF[launch] as Href} />;
}
