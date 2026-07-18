import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useShareIntentSafe, sharedUrlFrom } from "../lib/shareIntent";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AnimatedSplash from "@/components/AnimatedSplash";
import {
  useFonts,
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import SafeScreen from "@/components/SafeScreen";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SavedProvider } from "../context/SavedContext";
import { ToastProvider } from "../context/ToastContext";
import { NutritionProvider } from "../context/NutritionContext";

export default function RootLayout() {
  // Lora = the display serif (docs/DESIGN_SYSTEM.md B2). Body text stays system.
  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);
  const router = useRouter();

  // Share-sheet entry (I1): a TikTok/IG/Safari share into Otto opens the
  // add screen with the link prefilled. Inert until the dev build carries
  // the native module (lib/shareIntent.js gates it, C23-style).
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentSafe();
  useEffect(() => {
    if (!hasShareIntent) return;
    const sharedUrl = sharedUrlFrom(shareIntent);
    resetShareIntent();
    if (sharedUrl) router.push({ pathname: "/add", params: { url: sharedUrl } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          {/* NutritionProvider needs the session (cards fetch via authFetch),
              so it sits inside AuthProvider. */}
          <NutritionProvider>
            <SavedProvider>
              <ToastProvider>
                <SafeScreen>
                  {/* Native stack (was <Slot/>, which had no stack under it)
                      so every card gets the iOS "drag anywhere to the side to
                      go back" gesture — a second, gestural way out of any
                      X-button screen. Two opt-outs:
                      · cook mode — its exit is guarded (don't lose a session
                        to a stray swipe); the X stays the deliberate way out.
                      · onboarding — it pages horizontally, which the back
                        gesture would fight. */}
                  <Stack screenOptions={{ headerShown: false, fullScreenGestureEnabled: true }}>
                    <Stack.Screen name="recipe/cook/[id]" options={{ gestureEnabled: false }} />
                    <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                  </Stack>
                  {!splashDone && <AnimatedSplash onDone={() => setSplashDone(true)} />}
                </SafeScreen>
              </ToastProvider>
            </SavedProvider>
          </NutritionProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
