import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth';
import { LAUNCH_HREF, Splash, resolveLaunch, useDraft, useOnboarded } from '@/features/onboarding';
import { useMembership } from '@/features/profile';

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
  if (launch === 'loading') return <Splash />;
  return <Redirect href={LAUNCH_HREF[launch] as Href} />;
}
