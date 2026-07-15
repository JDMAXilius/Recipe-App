import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Lora_600SemiBold, Lora_700Bold } from "@expo-google-fonts/lora";
import SafeScreen from "@/components/SafeScreen";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SavedProvider } from "../context/SavedContext";
import { ToastProvider } from "../context/ToastContext";

export default function RootLayout() {
  // Lora = the display serif (docs/DESIGN_SYSTEM.md B2). Body text stays system.
  const [fontsLoaded] = useFonts({ Lora_600SemiBold, Lora_700Bold });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <SavedProvider>
            <ToastProvider>
              <SafeScreen>
                <Slot />
              </SafeScreen>
            </ToastProvider>
          </SavedProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
