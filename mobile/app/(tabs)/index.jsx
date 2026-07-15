import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MealAPI } from "../../services/mealAPI";
import { useDebounce } from "../../hooks/useDebounce";
import { useTheme } from "../../context/ThemeContext";
import { createHomeStyles } from "../../assets/styles/home.styles";
import CategoryFilter from "../../components/CategoryFilter";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import FilterSheet from "../../components/FilterSheet";
import { OttoLoading, OttoError } from "../../components/OttoStates";
import OttoIdle from "../../components/OttoIdle";
import Bounceable from "../../components/Bounceable";

// Discover — Home + Search merged (tab decision P2-1, MOBBIN_COMPARISON §2.1).
// Scroll rhythm: greeting → search pill → featured → category tiles → grid.
// Typing switches the grid to results in place; clearing restores browse.

const greetingForHour = (h) => {
  if (h < 12) return "Good morning, chef";
  if (h < 17) return "Good afternoon, chef";
  return "Good evening, chef";
};

const DiscoverScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const homeStyles = useMemo(() => createHomeStyles(colors), [colors]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = debouncedQuery.trim().length > 0;

  const [filterVisible, setFilterVisible] = useState(false);
  const [activeArea, setActiveArea] = useState(null);

  const greeting = greetingForHour(new Date().getHours());

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const [apiCategories, randomMeals, featuredMeal] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeals(12),
        MealAPI.getRandomMeal(),
      ]);

      const transformedCategories = apiCategories.map((cat, index) => ({
        id: index + 1,
        name: cat.strCategory,
        description: cat.strCategoryDescription,
      }));
      setCategories(transformedCategories);

      const transformedMeals = randomMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);
      setRecipes(transformedMeals);

      setFeaturedRecipe(MealAPI.transformMealData(featuredMeal));

      if (!selectedCategory && transformedCategories.length > 0) {
        setSelectedCategory(transformedCategories[0].name);
        const meals = await MealAPI.filterByCategory(transformedCategories[0].name);
        setRecipes(
          meals
            .map((meal) => MealAPI.transformMealData(meal))
            .filter((meal) => meal !== null)
            // filter.php omits strCategory — stamp the one we filtered by
            .map((meal) => ({ ...meal, category: transformedCategories[0].name }))
        );
      }
    } catch (error) {
      console.log("Error loading Discover", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setActiveArea(null); // tile tap = quick path; clears any cuisine filter
    try {
      const meals = await MealAPI.filterByCategory(category);
      setRecipes(
        meals
          .map((meal) => MealAPI.transformMealData(meal))
          .filter((meal) => meal !== null)
          // filter.php omits strCategory — stamp the one we filtered by
          .map((meal) => ({ ...meal, category }))
      );
    } catch (error) {
      console.error("Error loading category", error);
      setRecipes([]);
    }
  };

  // Search: by name first, ingredient fallback (kept from the old Search tab).
  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const nameResults = await MealAPI.searchMealsByName(debouncedQuery.trim());
        let results = nameResults;
        if (results.length === 0) {
          results = await MealAPI.filterByIngredient(debouncedQuery.trim());
        }
        if (!cancelled) {
          setSearchResults(
            results
              .slice(0, 24)
              .map((meal) => MealAPI.transformMealData(meal))
              .filter((meal) => meal !== null)
          );
        }
      } catch (error) {
        console.error("Error searching", error);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isSearching]);

  // FilterSheet apply (Category × Cuisine — intersected client-side; TheMealDB
  // can't combine filters server-side)
  const applyFilters = async (category, area) => {
    setFilterVisible(false);
    if (!category && !area) {
      setActiveArea(null);
      if (categories.length > 0) await handleCategorySelect(categories[0].name);
      return;
    }
    setSelectedCategory(category || null);
    setActiveArea(area || null);
    try {
      let list = [];
      if (category && area) {
        const [byCat, byArea] = await Promise.all([
          MealAPI.filterByCategory(category),
          MealAPI.filterByArea(area),
        ]);
        const ids = new Set(byArea.map((m) => m.idMeal));
        list = byCat.filter((m) => ids.has(m.idMeal));
      } else if (category) {
        list = await MealAPI.filterByCategory(category);
      } else {
        list = await MealAPI.filterByArea(area);
      }
      setRecipes(
        list
          .map((meal) => MealAPI.transformMealData(meal))
          .filter((meal) => meal !== null)
          .map((meal) => (category ? { ...meal, category } : meal))
      );
    } catch (error) {
      console.error("Error applying filters", error);
      setRecipes([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cold start = the one Sleepy-Otto moment (B6); failures = Sad Otto + retry.
  if (loading && !refreshing) return <OttoLoading />;
  if (loadError && recipes.length === 0) return <OttoError onRetry={loadData} />;

  const gridData = isSearching ? searchResults : recipes;
  const browseTitle = [selectedCategory, activeArea].filter(Boolean).join(" · ") || "Recipes";
  const gridTitle = isSearching ? `Results for “${debouncedQuery.trim()}”` : browseTitle;

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* GREETING — Otto's one appearance on this screen */}
        <View style={homeStyles.greetingSection}>
          <Text style={homeStyles.greetingText}>{greeting}</Text>
          <OttoIdle
            source={require("../../assets/mascot/otto-happy-cut.png")}
            reactionSource={require("../../assets/mascot/otto-excited-cut.png")}
            reactTo="save"
            style={homeStyles.greetingOtto}
          />
        </View>

        {/* SEARCH PILL + FILTER */}
        <View style={homeStyles.searchSection}>
          <TouchableOpacity
            style={homeStyles.filterButton}
            onPress={() => setFilterVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options-outline" size={20} color={colors.ink} />
            {activeArea && <View style={homeStyles.filterActiveDot} />}
          </TouchableOpacity>
          <View style={homeStyles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.inkSoft}
              style={homeStyles.searchIcon}
            />
            <TextInput
              style={homeStyles.searchInput}
              placeholder="What are we cooking today?"
              placeholderTextColor={colors.inkSoft}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              accessibilityLabel="Search recipes"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.inkSoft} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* BROWSE (hidden while searching) */}
        {!isSearching && (
          <>
            {featuredRecipe && (
              <View style={homeStyles.featuredSection}>
                <Bounceable
                  style={homeStyles.featuredCard}
                  onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Otto's pick: ${featuredRecipe.title}`}
                >
                  <View style={homeStyles.featuredImageContainer}>
                    <Image
                      source={{ uri: featuredRecipe.image }}
                      style={homeStyles.featuredImage}
                      contentFit="cover"
                      transition={500}
                    />
                    <View style={homeStyles.featuredOverlay}>
                      <View style={homeStyles.featuredBadge}>
                        <Text style={homeStyles.featuredBadgeText}>Otto's pick</Text>
                      </View>
                      <View style={homeStyles.featuredContent}>
                        <Text style={homeStyles.featuredTitle} numberOfLines={2}>
                          {featuredRecipe.title}
                        </Text>
                        <View style={homeStyles.featuredMeta}>
                          {featuredRecipe.area ? (
                            <View style={homeStyles.metaItem}>
                              <Ionicons name="location-outline" size={14} color={colors.white} />
                              <Text style={homeStyles.metaText}>{featuredRecipe.area}</Text>
                            </View>
                          ) : null}
                          {featuredRecipe.category ? (
                            <View style={homeStyles.metaItem}>
                              <Ionicons name="restaurant-outline" size={14} color={colors.white} />
                              <Text style={homeStyles.metaText}>{featuredRecipe.category}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                </Bounceable>
              </View>
            )}

            {categories.length > 0 && (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategorySelect}
              />
            )}
          </>
        )}

        {/* GRID (browse or results) */}
        <View style={homeStyles.recipesSection}>
          <View style={homeStyles.sectionHeader}>
            <Text style={homeStyles.sectionTitle}>{gridTitle}</Text>
            {gridData.length > 0 && (
              <Text style={homeStyles.sectionCount}>{gridData.length} recipes</Text>
            )}
          </View>

          {searching ? (
            <LoadingSpinner message="Otto's looking..." size="small" />
          ) : gridData.length > 0 ? (
            <FlatList
              data={gridData}
              renderItem={({ item }) => <RecipeCard recipe={item} />}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={homeStyles.row}
              contentContainerStyle={homeStyles.recipesGrid}
              scrollEnabled={false}
            />
          ) : isSearching ? (
            <View style={homeStyles.emptyState}>
              <OttoIdle
                source={require("../../assets/mascot/otto-thinking-cut.png")}
                style={homeStyles.emptyOtto}
                sway
              />
              <Text style={homeStyles.emptyTitle}>Nothing for “{debouncedQuery.trim()}” yet</Text>
              <Text style={homeStyles.emptyDescription}>
                Otto's still thinking. Try another dish or ingredient.
              </Text>
            </View>
          ) : (
            <View style={homeStyles.emptyState}>
              <Text style={homeStyles.emptyTitle}>No recipes found</Text>
              <Text style={homeStyles.emptyDescription}>Try a different category.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={categories.map((c) => c.name)}
        initialCategory={selectedCategory}
        initialArea={activeArea}
        onApply={applyFilters}
      />
    </View>
  );
};
export default DiscoverScreen;
