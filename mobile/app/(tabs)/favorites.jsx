import { useCallback, useMemo } from "react";
import { View, Text, ScrollView, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useSaved } from "../../context/SavedContext";
import { createFavoritesStyles } from "../../assets/styles/favorites.styles";
import RecipeCard from "../../components/RecipeCard";
import NoFavoritesFound from "../../components/NoFavoritesFound";
import LoadingSpinner from "../../components/LoadingSpinner";

// Saved v2 — reads from SavedContext (no per-screen fetch); paw on each card
// unsaves in place; count in the header; Otto-Sad empty state.
const SavedScreen = () => {
  const { colors } = useTheme();
  const { savedList, loaded, refresh } = useSaved();
  const favoritesStyles = useMemo(() => createFavoritesStyles(colors), [colors]);

  // Reconcile with the server whenever the tab gains focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!loaded) return <LoadingSpinner message="Fetching your saved recipes..." />;

  const recipes = savedList.map((favorite) => ({
    ...favorite,
    id: favorite.recipeId,
  }));

  return (
    <View style={favoritesStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={favoritesStyles.header}>
          <Text style={favoritesStyles.title}>Saved</Text>
          {recipes.length > 0 && (
            <Text style={favoritesStyles.count}>
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </Text>
          )}
        </View>

        <View style={favoritesStyles.recipesSection}>
          <FlatList
            data={recipes}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={favoritesStyles.row}
            contentContainerStyle={favoritesStyles.recipesGrid}
            scrollEnabled={false}
            ListEmptyComponent={<NoFavoritesFound />}
          />
        </View>
      </ScrollView>
    </View>
  );
};
export default SavedScreen;
