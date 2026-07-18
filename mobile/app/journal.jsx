import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { createAddStyles } from "../assets/styles/add.styles";
import { createFavoritesStyles } from "../assets/styles/favorites.styles";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";
import OttoIdle from "../components/OttoIdle";
import ScreenHeader from "../components/ScreenHeader";

// Cooking journal — the private life of "Snap your plate" (roadmap Phase 5:
// a journal life before any public feed). Photos live on-device
// (otto.journal.<recipeId>), newest first, each tied to its recipe.

const { width } = Dimensions.get("window");
const CELL = (width - SPACING.lg * 2 - SPACING.md) / 2;

const JournalScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const addStyles = useMemo(() => createAddStyles(colors), [colors]);
  const favStyles = useMemo(() => createFavoritesStyles(colors), [colors]);
  const [entries, setEntries] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
            k.startsWith("otto.journal.")
          );
          const rows = await AsyncStorage.multiGet(keys);
          const parsed = rows
            .map(([key, raw]) => {
              try {
                return { recipeId: key.slice("otto.journal.".length), ...JSON.parse(raw) };
              } catch {
                return null;
              }
            })
            .filter((e) => e?.uri)
            .sort((a, b) => (b.at || 0) - (a.at || 0));
          setEntries(parsed);
        } catch {
          setEntries([]);
        }
      })();
    }, [])
  );

  return (
    <View style={addStyles.container}>
      <ScreenHeader
        title="Cooking journal"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
      />

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl * 2 }}>
        {entries.length === 0 ? (
          <View style={favStyles.emptyState}>
            <OttoIdle
              source={require("../assets/mascot/otto-happy-cut.png")}
              style={favStyles.emptyOtto}
            />
            <Text style={favStyles.emptyTitle}>No plates yet</Text>
            <Text style={favStyles.emptyDescription}>
              Finish a cook and snap your plate — this is where the good memories live.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.md }}>
            {entries.map((entry) => (
              <TouchableOpacity
                key={entry.recipeId}
                onPress={() => router.push(`/recipe/${entry.recipeId}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${entry.title || "recipe"}`}
                style={{
                  width: CELL,
                  borderRadius: RADIUS.card,
                  overflow: "hidden",
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Image source={{ uri: entry.uri }} style={{ width: "100%", height: CELL }} contentFit="cover" />
                <View style={{ padding: SPACING.sm }}>
                  <Text style={{ ...TYPE.body, fontSize: 13, fontWeight: "700", color: colors.ink }} numberOfLines={1}>
                    {entry.title || "A good plate"}
                  </Text>
                  {entry.at ? (
                    <Text style={{ ...TYPE.caption, fontSize: 10, color: colors.inkSoft }}>
                      {new Date(entry.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
export default JournalScreen;
