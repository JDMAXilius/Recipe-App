import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeScreen>
          <Slot />
        </SafeScreen>
      </AuthProvider>
    </ThemeProvider>
  );
}
