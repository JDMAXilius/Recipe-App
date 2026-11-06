import 'react-native-get-random-values'; // polyfill globalThis.crypto on native (share tokens)
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Lora_400Regular, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { AuthProvider, useAuth } from '@/features/auth';
import { Splash, canUseApp } from '@/features/onboarding';
import { NotifSync } from '@/features/notifications';
import { RC_API_KEY, useMembership } from '@/features/profile/club.purchases';
import { AiConsentHost, ErrorBoundary, ToastHost } from '@/shared/ui';
import { OfflineBanner } from '@/shared/ui/OfflineBanner';
import { supabase } from '@/shared/supabase/client';
import { kv } from '@/shared/storage';
import { flags } from '@/shared/flags';
import { DraftClaim } from '@/catalogue/DraftClaim';
import '@/shared/online'; // NetInfo → onlineManager, AppState → focusManager
import { timing } from '@/shared/theme/tokens';

// The provider stack: gesture root → error boundary → server state (TanStack
// Query) → auth (the one allowed context) → toasts → safe area. Lora is loaded
// here and render gates on it so the serif never flashes system-first.
// The cache is persisted to AsyncStorage so Cookbook/Plan/Shopping read offline
// (gap audit P1-12). gcTime must be ≥ the persister's maxAge or restored queries
// are collected straight away. The buster drops the cache on each app version,
// so a changed query shape never hydrates stale data. Mutations aren't persisted.
const WEEK = 7 * 24 * 60 * 60 * 1000;
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, gcTime: WEEK } },
});
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'otto.v2.queryCache' });
const persistOptions = {
  persister,
  maxAge: WEEK,
  buster: Constants.expoConfig?.version ?? '',
  dehydrateOptions: { shouldDehydrateMutation: () => false },
};

// The persisted cache is one user's data: drop it (memory + disk) on sign-out or
// when a different account signs in, so the next person never sees it.
let cacheOwner: string | undefined;
supabase.auth.onAuthStateChange((_event, session) => {
  const uid = session?.user.id;
  if (!uid || (cacheOwner && uid !== cacheOwner)) {
    queryClient.clear();
    persister.removeClient();
    // The personal shopping list is one user's data too (ticks, extras).
    void kv.remove('shoppingState');
  }
  cacheOwner = uid;
});

// RevenueCat init at module scope, not in an effect: child effects (AuthProvider's
// Purchases.logIn) run before the root layout's would, so configure must beat render.
if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
// The key is the App Store one: the web build (visual QA only, D0.6) has no
// RevenueCat, and a throw here would blank every screen. Membership then
// stays unknown, so the app itself stays closed (fail closed).
try {
  Purchases.configure({ apiKey: RC_API_KEY });
} catch (e) {
  console.warn('RevenueCat unavailable on this platform:', (e as Error).message);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lora_400Regular, Lora_600SemiBold, Lora_700Bold });

  if (!fontsLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <AuthProvider>
              {/* Back is the LEFT-EDGE swipe, not a drag from anywhere. The
                  full-screen variant recognised a pan starting mid-screen, so a
                  slightly-diagonal flick down a long page (recipe detail, the
                  parallax hero) was claimed as "go back" instead of scrolling —
                  the gesture has to be intentional or the page can't be read.
                  The edge gesture is also what every iOS app trains for, and it
                  costs Android nothing: fullScreenGestureEnabled is iOS-only
                  (react-native-screens' fullScreenSwipeEnabled), so Android was
                  always on the system back gesture / hardware back. Cook opts
                  out entirely below — its step pager owns horizontal pans. */}
              {/* G5, "intentional easing" (motion.md §1): the push is CHOSEN,
                  not inherited — one slide-from-right on both platforms
                  (Android's default differs), at the `enter` duration.
                  HONEST CEILING: this is a native stack, so iOS runs UIKit's
                  own transition curve and `animationDuration` is Android-only.
                  Claiming a tokenized curve on iOS here would be false; the
                  role-named tokens govern in-app motion, not the OS push. */}
              <RootStack />
              <ToastHost />
              <OfflineBanner />
              {/* Asks before anything leaves for a third-party AI (5.1.2(i)). */}
              <AiConsentHost />
              {/* Keeps OS reminders in step with the week + prefs from anywhere. */}
              <NotifSync />
              {/* Puts the pre-account week and answers on the account, once. */}
              <DraftClaim />
            </AuthProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

// Every route, declared and guarded in one place (Expo Router's Stack.Protected).
// Hard paywall (Juan, 2026-10-04): signed out → only the auth screens; signed in
// without Otto Club → only onboarding and the paywall; the rest of the app is for
// signed-in members. A screen NOT declared here would be reachable by deep link
// with no guard, so every route in app/ is listed. A guard that turns false
// sends the user to `index`, the launch gate, which picks the right door.
function RootStack() {
  const { session } = useAuth();
  const { state } = useMembership();
  const signedIn = !!session;
  const allowed = canUseApp(signedIn, state);

  return (
    // Back is the LEFT-EDGE swipe, not a drag from anywhere: a full-screen pan
    // claimed slightly-diagonal scrolls on long pages as "go back". Cook opts
    // out entirely — its step pager owns horizontal pans. One slide-from-right
    // push on both platforms at the `enter` duration (motion.md §1); iOS runs
    // UIKit's own curve, `animationDuration` is Android-only.
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: timing.enter,
      }}
    >
      {/* Always reachable: the launch gate and the link landings. */}
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="reset-password" />

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* First run (flowV2, R1.2–R1.4): Welcome for the signed out; the
          questions and the week for anyone not yet in the app (a signed-in
          account that never answered comes here too). */}
      <Stack.Protected guard={flags.flowV2 && !signedIn}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={flags.flowV2 && !allowed}>
        <Stack.Screen name="about/[step]" />
        <Stack.Screen name="first-week" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="onboarding" />
        {/* No swipe-back: a non-member has nowhere behind the paywall to go. */}
        <Stack.Screen name="otto-club" options={{ gestureEnabled: state === 'member' }} />
      </Stack.Protected>

      <Stack.Protected guard={allowed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="recipe/edit" />
        <Stack.Screen name="recipe/cook/[id]" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
        <Stack.Screen name="shopping" />
        <Stack.Screen name="chats" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="household" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="change-password" />
      </Stack.Protected>
    </Stack>
  );
}
