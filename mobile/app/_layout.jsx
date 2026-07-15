import { Slot } from "expo-router";
import { useFonts, Lora_600SemiBold, Lora_700Bold } from "@expo-google-fonts/lora";
import SafeScreen from "@/components/SafeScreen";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SavedProvider } from "../context/SavedContext";

export default function RootLayout() {
  // Lora = the display serif (docs/DESIGN_SYSTEM.md B2). Body text stays system.
  const [fontsLoaded] = useFonts({ Lora_600SemiBold, Lora_700Bold });
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <SavedProvider>
          <SafeScreen>
            <Slot />
          </SafeScreen>
        </SavedProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
