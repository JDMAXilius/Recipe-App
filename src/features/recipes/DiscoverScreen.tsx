import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { OttoIdle, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { usePlan, tonightEntry } from '@/features/planner';
import { CategoryTiles } from './components/CategoryTiles';
import { FilterSheet, filterByCategories } from './components/FilterSheet';
import { RecipeCard } from './RecipeCard';
import { useCategories, useDiscover, useFeatured, useSearch } from './recipe.queries';

// Discover — Home + Search merged (v1 tab decision). Scroll rhythm:
// greeting → search pill → Otto's pick hero → painted category tiles → grid.
// Typing switches the grid to results in place; clearing restores browse.
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, chef';
  if (h < 17) return 'Good afternoon, chef';
  return 'Good evening, chef';
}

export function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterCats, setFilterCats] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // The grid's category pool changes when you switch category or search, and
  // stale chips would silently empty the grid — reset the filter on either.
  useEffect(() => {
    setFilterCats(new Set());
  }, [selectedCategory, debounced]);

  const categoriesQuery = useCategories();
  const featuredQuery = useFeatured();
  // Tonight band: today's planned dish, if any (planner → recipes allowlist).
  const { entries, days } = usePlan();
  const tonight = tonightEntry(entries, days[0].key);
  const discoverQuery = useDiscover(selectedCategory);
  const searchQuery = useSearch(debounced);
  const isSearching = debounced.length > 0;

  // Land on the first category once the catalogue loads (no server-side default).
  useEffect(() => {
    if (!selectedCategory && categoriesQuery.data?.length) {
      setSelectedCategory(categoriesQuery.data[0].name);
    }
  }, [categoriesQuery.data, selectedCategory]);

  const rawGrid = useMemo(
    () => (isSearching ? searchQuery.data ?? [] : discoverQuery.data ?? []),
    [isSearching, searchQuery.data, discoverQuery.data],
  );
  // Distinct categories present in the loaded grid. Browse mode is one category
  // (filter would be degenerate), so the filter affordance only shows when the
  // grid genuinely spans categories — i.e. search results.
  const availableCats = useMemo(
    () => [...new Set(rawGrid.map((r) => r.category).filter((c): c is string => !!c))],
    [rawGrid],
  );
  const canFilter = availableCats.length > 1;
  const grid = filterByCategories(rawGrid, filterCats);
  const gridTitle = isSearching ? `Results for “${debounced}”` : selectedCategory ?? 'Recipes';
  const featured = featuredQuery.data;

  const toggleFilter = (cat: string) =>
    setFilterCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

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

      {/* Search pill */}
      <View
        style={{
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

          {/* Otto's pick — the featured hero */}
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
              <View style={{ padding: space[4], gap: space[1] }}>
                <Text role="caption">Otto’s pick</Text>
                <Text role="title">{featured.title}</Text>
                {[featured.area, featured.category].filter(Boolean).length ? (
                  <Text role="caption">
                    {[featured.area, featured.category].filter(Boolean).join('  ·  ')}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          {categoriesQuery.data?.length ? (
            <CategoryTiles
              categories={categoriesQuery.data}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          ) : null}
        </>
      )}

      {/* Grid title + filter affordance (only when the grid spans categories) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text role="title">{gridTitle}</Text>
        {canFilter ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter recipes"
            onPress={() => setFilterOpen(true)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space[1] }}
          >
            <Text role={filterCats.size ? 'computed' : 'label'}>Filter</Text>
            {filterCats.size ? (
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta }}
              />
            ) : null}
          </Pressable>
        ) : grid.length > 0 ? (
          <Text role="caption">{grid.length} recipes</Text>
        ) : null}
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
          <Text role="caption">
            {isSearching
              ? `Otto came up empty for “${debounced}” — try another dish or ingredient.`
              : 'Nothing on this shelf yet — try another category.'}
          </Text>
        }
      />
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={availableCats}
        selected={filterCats}
        onToggle={toggleFilter}
        onClear={() => setFilterCats(new Set())}
        resultCount={grid.length}
      />
    </SafeAreaView>
  );
}
