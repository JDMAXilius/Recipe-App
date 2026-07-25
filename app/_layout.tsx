import 'react-native-get-random-values'; // polyfill globalThis.crypto on native (share tokens)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Lora_400Regular, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { AuthProvider } from '@/features/auth';
import { Splash } from '@/features/onboarding';
import { NotifSync } from '@/features/notifications';
import { RC_API_KEY, RC_TEST_STORE } from '@/features/profile/club.purchases';
import { ErrorBoundary, ToastHost } from '@/shared/ui';

// The provider stack: gesture root → error boundary → server state (TanStack
// Query) → auth (the one allowed context) → toasts → safe area. Lora is loaded
// here and render gates on it so the serif never flashes system-first.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// RevenueCat init at module scope, not in an effect: child effects (AuthProvider's
// Purchases.logIn) run before the root layout's would, so configure must beat render.
// A test_ key in a RELEASE build makes the RC SDK alert "Wrong API Key" and exit(0)
// on launch — so while we're on the Test Store key, only configure in dev. Every
// Purchases call is .catch-guarded, so an unconfigured release falls back to the
// paywall's opens-soon state. The gate dissolves itself once the appl_ key lands.
if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
if (__DEV__ || !RC_TEST_STORE) Purchases.configure({ apiKey: RC_API_KEY });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lora_400Regular, Lora_600SemiBold, Lora_700Bold });

  if (!fontsLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
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
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="add" />
                <Stack.Screen name="recipe/cook/[id]" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
              </Stack>
              <ToastHost />
              {/* Keeps OS reminders in step with the week + prefs from anywhere. */}
              <NotifSync />
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
