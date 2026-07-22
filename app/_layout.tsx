import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/features/auth';
import { ToastHost } from '@/shared/ui';

// The ONE provider stack (FRAMEWORK §2): server state (TanStack Query), auth
// (the single allowed context, session via onAuthStateChange), toasts, safe area.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="add" options={{ presentation: 'modal' }} />
          </Stack>
          <ToastHost />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
