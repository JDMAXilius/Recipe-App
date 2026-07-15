import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, FlatList, TouchableOpacity } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useSaved } from "../../context/SavedContext";
import { UserRecipeAPI, transformUserRecipe } from "../../services/userRecipes";
import { createFavoritesStyles } from "../../assets/styles/favorites.styles";
import RecipeCard from "../../components/RecipeCard";
import NoFavoritesFound from "../../components/NoFavoritesFound";
import LoadingSpinner from "../../components/LoadingSpinner";
import OttoIdle from "../../components/OttoIdle";

// Cookbook (roadmap Phase 1, founder call: ONE tab, in-screen segments —
// Kitchen Stories pattern): All · Saved · My recipes, plus a quiet Cooked
// filter chip. Saved cards wear the paw; user recipes wear their provenance
// stamp (RecipeCard decides). "Saved" stays the verb — the tab is the shelf.

const SEGMENTS = [
  { key: "all", label: "All" },
  { key: "saved", label: "Saved" },
  { key: "mine", label: "My recipes" },
];

const CookbookScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { savedList, loaded, refresh } = useSaved();
  const styles = useMemo(() => createFavoritesStyles(colors), [colors]);

  // Deep-linkable: /cookbook?segment=mine|saved, ?cooked=1 (Account stat doors)
  const params = useLocalSearchParams();
  const [segment, setSegment] = useState(
    ["all", "saved", "mine"].includes(params.segment) ? params.segment : "all"
  );
  const [mine, setMine] = useState([]);
  const [mineLoaded, setMineLoaded] = useState(false);
  const [cookedOnly, setCookedOnly] = useState(params.cooked === "1");
  const [cookedIds, setCookedIds] = useState(new Set());

  useFocusEffect(
    useCallback(() => {
      if (["all", "saved", "mine"].includes(params.segment)) setSegment(params.segment);
      if (params.cooked === "1") setCookedOnly(true);
    }, [params.segment, params.cooked])
  );

  const loadMine = useCallback(async () => {
    try {
      const rows = await UserRecipeAPI.list();
      setMine(rows.map(transformUserRecipe));
    } catch {
      // keep whatever we had — the shelf shouldn't blank on a flaky request
    } finally {
      setMineLoaded(true);
    }
  }, []);

  const loadCooked = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setCookedIds(
        new Set(
          keys
            .filter((k) => k.startsWith("otto.cooked."))
            .map((k) => k.slice("otto.cooked.".length))
        )
      );
    } catch {
      // filter chip just stays empty-handed
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadMine();
      loadCooked();
    }, [refresh, loadMine, loadCooked])
  );

  if (!loaded && !mineLoaded) return <LoadingSpinner message="Opening your cookbook..." />;

  const savedRecipes = savedList.map((favorite) => ({
    ...favorite,
    id: favorite.recipeId,
  }));

  const base =
    segment === "saved" ? savedRecipes : segment === "mine" ? mine : [...mine, ...savedRecipes];
  const recipes = cookedOnly ? base.filter((r) => cookedIds.has(String(r.id))) : base;

  const pickSegment = (key) => {
    if (key === segment) return;
    Haptics.selectionAsync().catch(() => {});
    setSegment(key);
  };

  const emptyState =
    segment === "mine" ? (
      <View style={styles.emptyState}>
        <OttoIdle
          source={require("../../assets/mascot/otto-thinking-cut.png")}
          style={styles.emptyOtto}
        />
        <Text style={styles.emptyTitle}>Nothing of yours yet</Text>
        <Text style={styles.emptyDescription}>
          Paste a link or write one down — Otto keeps your recipes right here.
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push("/add")}
          accessibilityRole="button"
          accessibilityLabel="Add a recipe"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.exploreButtonText}>Add a recipe</Text>
        </TouchableOpacity>
      </View>
    ) : cookedOnly ? (
      <View style={styles.emptyState}>
        <OttoIdle
          source={require("../../assets/mascot/otto-sleepy-cut.png")}
          style={styles.emptyOtto}
        />
        <Text style={styles.emptyTitle}>Nothing cooked yet</Text>
        <Text style={styles.emptyDescription}>
          Finish a recipe in cook mode and it lands here, pan and all.
        </Text>
      </View>
    ) : (
      <NoFavoritesFound />
    );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cookbook</Text>
          {recipes.length > 0 && (
            <Text style={styles.count}>
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </Text>
          )}
        </View>

        {/* Segments — in-screen, Kitchen Stories style */}
        <View style={styles.segmentRow}>
          {SEGMENTS.map((s) => (
            <TouchableOpacity
              key={s.key}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => pickSegment(s.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: segment === s.key }}
            >
              <Text style={[styles.segmentText, segment === s.key && styles.segmentActive]}>
                {s.label}
              </Text>
              <View style={[styles.segmentDaub, segment === s.key && styles.segmentDaubActive]} />
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.cookedChip, cookedOnly && styles.cookedChipActive]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setCookedOnly((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: cookedOnly }}
            accessibilityLabel="Show only recipes you have cooked"
          >
            <Ionicons name="flame" size={12} color={cookedOnly ? colors.white : colors.accent} />
            <Text style={[styles.cookedChipText, cookedOnly && styles.cookedChipTextActive]}>
              Cooked
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recipesSection}>
          <FlatList
            data={recipes}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.recipesGrid}
            scrollEnabled={false}
            ListEmptyComponent={emptyState}
          />
        </View>
      </ScrollView>
    </View>
  );
};
export default CookbookScreen;
