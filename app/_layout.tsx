import 'react-native-get-random-values'; // polyfill globalThis.crypto on native (share tokens)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Lora_400Regular, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { AuthProvider } from '@/features/auth';
import { Splash } from '@/features/onboarding';
import { NotifSync } from '@/features/notifications';
import { ErrorBoundary, ToastHost } from '@/shared/ui';

// The provider stack: gesture root → error boundary → server state (TanStack
// Query) → auth (the one allowed context) → toasts → safe area. Lora is loaded
// here and render gates on it so the serif never flashes system-first.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lora_400Regular, Lora_600SemiBold, Lora_700Bold });
  if (!fontsLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="add" options={{ presentation: 'modal' }} />
                <Stack.Screen name="ask" />
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
