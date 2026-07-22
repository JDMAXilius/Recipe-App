import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MealAPI } from "../../services/mealAPI";
import { loadPrefs, hasPrefs, DIET_CATEGORY, DIET_HIDDEN_CATEGORIES } from "../../lib/prefs";
import { syncTonightReminder } from "../../lib/notifications";
import { PlanAPI } from "../../services/userRecipes";
import { toDayKey } from "../../lib/week";
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
import AskOtto from "../../components/AskOtto";

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
  const [tonight, setTonight] = useState(null);

  // Today's first uncooked plan entry — quiet, one line, only when it exists.
  useFocusEffect(
    useCallback(() => {
      const today = toDayKey(new Date());
      PlanAPI.list(today, today)
        .then((rows) => {
          const entry = rows.find((r) => !r.cooked && r.recipeId) || null;
          setTonight(entry);
          // keep the local dinner reminder honest: cooked/cleared plans
          // cancel it, fresh plans (re)book it at the chosen hour
          syncTonightReminder(entry);
        })
        .catch(() => {});
    }, [])
  );
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

  // Food preferences (profile → Food preferences) shape exactly two things
  // here, as the picker promises: Otto's pick and where the grid starts.
  const [prefs, setPrefs] = useState(null);
  const appliedPrefsRef = useRef(null);
  const loadDataRef = useRef(() => {});

  // Otto's pick, honoring prefs: diet always wins, cuisines narrow within it
  // when the sets overlap. Any gap falls back honestly (null → random pick).
  const pickPreferredFeatured = async (p) => {
    try {
      let pool = [];
      const dietCategory = DIET_CATEGORY[p.diet];
      if (dietCategory) {
        pool = await MealAPI.filterByCategory(dietCategory);
        if (p.cuisines.length > 0 && pool.length > 0) {
          const areaLists = await Promise.all(p.cuisines.map((a) => MealAPI.filterByArea(a)));
          const areaIds = new Set(areaLists.flat().map((m) => m.idMeal));
          const both = pool.filter((m) => areaIds.has(m.idMeal));
          if (both.length > 0) pool = both;
        }
      } else if (p.cuisines.length > 0) {
        const area = p.cuisines[Math.floor(Math.random() * p.cuisines.length)];
        pool = await MealAPI.filterByArea(area);
      }
      if (pool.length === 0) return null;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      // filter.php rows are id/name/thumb only — the featured card needs the
      // full record
      return await MealAPI.getMealById(pick.idMeal);
    } catch {
      return null;
    }
  };

  const loadData = async ({ resetCategory = false } = {}) => {
    try {
      setLoading(true);
      setLoadError(false);
      const userPrefs = await loadPrefs();
      setPrefs(userPrefs);
      appliedPrefsRef.current = JSON.stringify(userPrefs);

      const [apiCategories, randomMeals, preferredMeal] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeals(12),
        hasPrefs(userPrefs) ? pickPreferredFeatured(userPrefs) : Promise.resolve(null),
      ]);
      const featuredMeal = preferredMeal || (await MealAPI.getRandomMeal());

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

      // keep the grid honest: whatever category chip is selected is what loads
      // (random meals under a "Beef" title was a refresh-time lie).
      // A set diet moves the STARTING category (a vegetarian shouldn't land
      // on Beef); an explicit tile tap still goes anywhere.
      const dietStart = transformedCategories.find(
        (c) => c.name === DIET_CATEGORY[userPrefs.diet]
      )?.name;
      const category =
        (!resetCategory && selectedCategory) || dietStart || transformedCategories[0]?.name;
      if (category) {
        if (selectedCategory !== category) setSelectedCategory(category);
        const meals = await MealAPI.filterByCategory(category);
        setRecipes(
          meals
            .map((meal) => MealAPI.transformMealData(meal))
            .filter((meal) => meal !== null)
            // filter.php omits strCategory — stamp the one we filtered by
            .map((meal) => ({ ...meal, category }))
        );
      }
    } catch (error) {
      console.log("Error loading Discover", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };
  loadDataRef.current = loadData;

  // Returning from the picker with changed prefs re-seats Discover (fresh
  // pick + starting category); an unchanged visit costs nothing.
  useFocusEffect(
    useCallback(() => {
      loadPrefs().then((p) => {
        if (appliedPrefsRef.current !== null && JSON.stringify(p) !== appliedPrefsRef.current) {
          loadDataRef.current({ resetCategory: true });
        }
      });
    }, [])
  );

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
  // A set diet puts the meat tiles away (default row only — the filter
  // sheet and search still offer everything).
  const hiddenTiles = new Set(DIET_HIDDEN_CATEGORIES[prefs?.diet] || []);
  const visibleCategories = categories.filter((c) => !hiddenTiles.has(c.name));
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
            {/* Tonight — the plan's payoff moment is 5pm, not Sunday */}
            {tonight && (
              <TouchableOpacity
                style={homeStyles.tonightBand}
                onPress={() => router.push(`/recipe/${tonight.recipeId}`)}
                accessibilityRole="button"
                accessibilityLabel={`Tonight: ${tonight.title}`}
              >
                {tonight.image ? (
                  <Image source={{ uri: tonight.image }} style={homeStyles.tonightThumb} contentFit="cover" />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={homeStyles.tonightLabel}>WHAT&apos;S COOKING TONIGHT?</Text>
                  <Text style={homeStyles.tonightTitle} numberOfLines={1}>
                    {tonight.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.accent} />
              </TouchableOpacity>
            )}

            {/* Ask Otto — search looks through what exists, this writes what
                doesn't. Sits under tonight (time-critical, conditional) and
                above Otto's pick, per Figma 199:60. */}
            <AskOtto onPress={() => router.navigate("/create")} />

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
                        <Text style={homeStyles.featuredBadgeText}>Otto&apos;s pick</Text>
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

            {visibleCategories.length > 0 && (
              <CategoryFilter
                categories={visibleCategories}
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
                Otto&apos;s still thinking. Try another dish or ingredient.
              </Text>
            </View>
          ) : (
            <View style={homeStyles.emptyState}>
              <OttoIdle
                source={require("../../assets/mascot/otto-sad-cut.png")}
                style={homeStyles.emptyOtto}
              />
              <Text style={homeStyles.emptyTitle}>Nothing on this shelf yet</Text>
              <Text style={homeStyles.emptyDescription}>
                Otto came up empty here — try another category, or pull to refresh.
              </Text>
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
