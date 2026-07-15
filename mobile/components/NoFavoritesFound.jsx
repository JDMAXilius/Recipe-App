import { useMemo } from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import OttoIdle from "./OttoIdle";
import { useTheme } from "@/context/ThemeContext";
import { createFavoritesStyles } from "@/assets/styles/favorites.styles";

// First-run empty state for Saved — Otto-Sad + benefit line + one CTA, and the
// one sentence that teaches the paw-mark (MOBBIN_COMPARISON §2.5).
function NoFavoritesFound() {
  const router = useRouter();
  const { colors } = useTheme();
  const favoritesStyles = useMemo(() => createFavoritesStyles(colors), [colors]);

  return (
    <View style={favoritesStyles.emptyState}>
      <OttoIdle source={require("../assets/mascot/otto-sad-cut.png")} style={favoritesStyles.emptyOtto} />
      <Text style={favoritesStyles.emptyTitle}>Nothing saved… yet</Text>
      <Text style={favoritesStyles.emptyDescription}>
        Tap the paw on any recipe and Otto will keep it here for later.
      </Text>
      <TouchableOpacity
        style={favoritesStyles.exploreButton}
        onPress={() => router.push("/")}
        accessibilityRole="button"
        accessibilityLabel="Explore recipes"
      >
        <Text style={favoritesStyles.exploreButtonText}>Explore recipes</Text>
      </TouchableOpacity>
    </View>
  );
}

export default NoFavoritesFound;
