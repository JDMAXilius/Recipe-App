import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text as RNText, TextInput, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OttoArt, OttoError, OttoIdle, OttoLoading, Text } from '@/shared/ui';
import { colors, overlay, radii, space, type } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { usePlan, tonightEntry } from '@/features/planner';
import { CategoryTiles } from './components/CategoryTiles';
import { FilterSheet } from './components/FilterSheet';
import { RecipeCard } from './RecipeCard';
import { useAreas, useCategories, useDiscover, useFeatured, useSearch } from './recipe.queries';

// Discover — Home + Search merged (v1 tab decision). Scroll rhythm:
// greeting → search pill → Otto's pick hero → painted category tiles → grid.
// Typing switches the grid to results in place; clearing restores browse.
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, chef';
  if (h < 17) return 'Good afternoon, chef';
  return 'Good evening, chef';
}

// White-on-photo overlay text (the hero). No Text role is white, so these carry
// the tokens with color forced; the typed annotation relaxes type.meta's
// readonly fontVariant tuple the same way the Text primitive does.
const heroEyebrow: TextStyle = { ...type.meta, fontVariant: ['tabular-nums'], color: colors.white };
const heroTitle: TextStyle = { ...type.title, color: colors.white };

export function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const categoriesQuery = useCategories();
  const areasQuery = useAreas();
  const featuredQuery = useFeatured();
  // Tonight band: today's planned dish, if any (planner → recipes allowlist).
  const { entries, days } = usePlan();
  const tonight = tonightEntry(entries, days[0].key);
  const discoverQuery = useDiscover(selectedCategory, activeArea);
  const searchQuery = useSearch(debounced);
  const isSearching = debounced.length > 0;

  // Land on the first category once the catalogue loads (no server-side default).
  useEffect(() => {
    if (!selectedCategory && categoriesQuery.data?.length) {
      setSelectedCategory(categoriesQuery.data[0].name);
    }
  }, [categoriesQuery.data, selectedCategory]);

  const grid = useMemo(
    () => (isSearching ? searchQuery.data ?? [] : discoverQuery.data ?? []),
    [isSearching, searchQuery.data, discoverQuery.data],
  );
  const browseTitle = [selectedCategory, activeArea].filter(Boolean).join(' · ') || 'Recipes';
  const gridTitle = isSearching ? `Results for “${debounced}”` : browseTitle;
  const featured = featuredQuery.data;

  // A category tile tap is the quick path — it clears any cuisine filter (v1).
  const selectCategory = (name: string) => {
    setActiveArea(null);
    setSelectedCategory(name);
  };

  // FilterSheet apply: filtering is a browse action, so exit search. Clearing
  // both (null/null) falls back to the first category so the grid never empties.
  const applyFilters = (category: string | null, area: string | null) => {
    setFilterOpen(false);
    setQuery('');
    setActiveArea(area);
    setSelectedCategory(category ?? (area ? null : categoriesQuery.data?.[0]?.name ?? null));
  };

  // Grid loading/error tracks whichever query feeds it (search vs browse); browse
  // also waits on the category catalogue that seeds selectedCategory.
  const gridQuery = isSearching ? searchQuery : discoverQuery;
  const gridLoading = isSearching
    ? searchQuery.isLoading
    : categoriesQuery.isLoading || discoverQuery.isLoading;
  const gridError = isSearching
    ? searchQuery.isError
    : discoverQuery.isError || categoriesQuery.isError;

  const header = useMemo(() => greeting(), []);

  // Single FlatList (grid is the scroller); the greeting/search/pick/categories/
  // title live in ListHeaderComponent. Review fix: a FlatList nested in a
  // ScrollView disables windowing and eager-renders every RecipeCard (each
  // calling useSaved) — and warns "VirtualizedLists nested" on native.
  const ListHeader = (
    <View style={{ gap: space[4] }}>
      {/* Greeting + living Otto — he hops to 'excited' when a recipe is saved
          (bus wired by PawMark); reduced-motion falls back to a static mascot. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <Text role="display">{header}</Text>
        </View>
        <OttoIdle name="happy" reactTo="save" size={64} />
      </View>

      {/* Filter button + search pill */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          onPress={() => {
            haptics.select();
            setFilterOpen(true);
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: radii.pill,
            backgroundColor: colors.creamDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="options-outline" size={20} color={colors.ink} />
          {activeArea ? (
            <View
              style={{
                position: 'absolute',
                top: 11,
                right: 11,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.terracotta,
              }}
            />
          ) : null}
        </Pressable>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.creamDeep,
            borderRadius: radii.pill,
            paddingHorizontal: space[4],
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="What are we cooking today?"
            placeholderTextColor={colors.inkSoft}
            returnKeyType="search"
            accessibilityLabel="Search recipes"
            style={{ fontSize: 16, color: colors.ink }}
          />
        </View>
      </View>

      {!isSearching && (
        <>
          {/* Tonight band — today's planned dish, only when one exists. */}
          {tonight ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Tonight: ${tonight.title}`}
              onPress={() => router.push(`/recipe/${tonight.recipe_id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[3],
                backgroundColor: colors.creamDeep,
                borderRadius: radii.card,
                padding: space[3],
              }}
            >
              {tonight.image ? (
                <Image
                  source={{ uri: tonight.image }}
                  style={{ width: 44, height: 44, borderRadius: radii.pill }}
                  resizeMode="cover"
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text role="caption">WHAT&apos;S COOKING TONIGHT?</Text>
                <Text role="body">{tonight.title}</Text>
              </View>
              <Text role="caption">›</Text>
            </Pressable>
          ) : null}

          {/* Ask Otto — search looks through what exists, this writes what
              doesn't. Sits under Tonight (time-critical, conditional) and above
              Otto's pick, so on the common no-plan day it's directly below the
              search row (Figma 213:45). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask Otto for a recipe"
            onPress={() => {
              haptics.select();
              router.push('/create');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              backgroundColor: colors.creamDeep,
              borderRadius: radii.card,
              padding: space[3],
              paddingRight: space[4],
            }}
          >
            <OttoArt name="happy" size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text role="body">Ask Otto</Text>
              <Text role="caption">
                Tell him what you&apos;re hungry for — he&apos;ll write the recipe.
              </Text>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.pill,
                backgroundColor: colors.terracotta,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </View>
          </Pressable>

          {/* Otto's pick — featured hero with the eyebrow/title/meta overlaid
              bottom-left on the image over a dark scrim (Figma 213:45). White
              text on photo has no Text role, so raw RNText carries it. */}
          {featured && featured.image ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Otto's pick: ${featured.title}`}
              onPress={() => router.push(`/recipe/${featured.id}`)}
              style={{ borderRadius: radii.card, overflow: 'hidden', backgroundColor: colors.creamDeep }}
            >
              <Image
                source={{ uri: featured.image }}
                style={{ width: '100%', aspectRatio: 16 / 9 }}
                resizeMode="cover"
              />
              {/* Two stacked scrims fake a bottom→transparent gradient (no lib). */}
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: overlay.scrim }}
              />
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '32%', backgroundColor: overlay.scrimStrong }}
              />
              <View style={{ position: 'absolute', left: space[4], right: space[4], bottom: space[4], gap: space[1] }}>
                <RNText style={heroEyebrow}>Otto’s pick</RNText>
                <RNText style={heroTitle}>{featured.title}</RNText>
                {[featured.area, featured.category].filter(Boolean).length ? (
                  <RNText style={heroEyebrow}>
                    {[featured.area, featured.category].filter(Boolean).join('  ·  ')}
                  </RNText>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          {categoriesQuery.data?.length ? (
            <CategoryTiles
              categories={categoriesQuery.data}
              selected={selectedCategory}
              onSelect={selectCategory}
            />
          ) : null}
        </>
      )}

      {/* Grid title + live count (Figma: "Beef" · "95 RECIPES") */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text role="title">{gridTitle}</Text>
        {grid.length > 0 ? <Text role="meta">{grid.length} recipes</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <FlatList
        data={grid}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: space[2] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space[4], gap: space[3] }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          gridLoading ? (
            <OttoLoading message={isSearching ? 'Otto’s looking…' : undefined} />
          ) : gridError ? (
            <OttoError
              onRetry={() => {
                categoriesQuery.refetch();
                gridQuery.refetch();
              }}
            />
          ) : (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: space[7],
                paddingHorizontal: space[5],
                gap: space[3],
              }}
            >
              <OttoArt name={isSearching ? 'thinking' : 'sleepy'} size={120} />
              <Text role="title">{isSearching ? 'Nothing found' : 'This shelf is empty'}</Text>
              <Text role="caption">
                {isSearching
                  ? `Otto came up empty for “${debounced}” — try another dish or ingredient.`
                  : 'Nothing on this shelf yet — try another category.'}
              </Text>
            </View>
          )
        }
      />
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={(categoriesQuery.data ?? []).map((c) => c.name)}
        areas={areasQuery.data ?? []}
        initialCategory={selectedCategory}
        initialArea={activeArea}
        onApply={applyFilters}
      />
    </SafeAreaView>
  );
}
