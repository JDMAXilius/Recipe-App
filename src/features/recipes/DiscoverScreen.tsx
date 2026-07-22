import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { CategoryTiles } from './components/CategoryTiles';
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

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const categoriesQuery = useCategories();
  const featuredQuery = useFeatured();
  const discoverQuery = useDiscover(selectedCategory);
  const searchQuery = useSearch(debounced);
  const isSearching = debounced.length > 0;

  // Land on the first category once the catalogue loads (no server-side default).
  useEffect(() => {
    if (!selectedCategory && categoriesQuery.data?.length) {
      setSelectedCategory(categoriesQuery.data[0].name);
    }
  }, [categoriesQuery.data, selectedCategory]);

  const grid = isSearching ? searchQuery.data ?? [] : discoverQuery.data ?? [];
  const gridTitle = isSearching ? `Results for “${debounced}”` : selectedCategory ?? 'Recipes';
  const featured = featuredQuery.data;

  const header = useMemo(() => greeting(), []);

  // Single FlatList (grid is the scroller); the greeting/search/pick/categories/
  // title live in ListHeaderComponent. Review fix: a FlatList nested in a
  // ScrollView disables windowing and eager-renders every RecipeCard (each
  // calling useSaved) — and warns "VirtualizedLists nested" on native.
  const ListHeader = (
    <View style={{ gap: space[4] }}>
      <Text role="display">{header}</Text>

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

      {/* Grid title */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text role="title">{gridTitle}</Text>
        {grid.length > 0 ? <Text role="caption">{grid.length} recipes</Text> : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
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
    </View>
  );
}
