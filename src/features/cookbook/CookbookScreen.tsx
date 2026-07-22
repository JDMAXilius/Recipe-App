import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SegmentBar, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useAuth } from '@/features/auth';
import { useSaved } from './useSaved';
import { fetchMyRecipes } from './mine.queries';
import { RecipeCard } from './components/RecipeCard';
import { EmptyState } from './components/EmptyState';
import {
  applyCookedFilter,
  mineToItem,
  savedToItem,
  selectSegment,
} from './cookbook.logic';
import type { Segment } from './cookbook.types';

// Cookbook (founder call: ONE tab, in-screen segments — Kitchen Stories pattern):
// All · Saved · My recipes, plus a quiet Cooked filter chip.
const SEGMENTS = [
  { label: 'All', value: 'all' },
  { label: 'Saved', value: 'saved' },
  { label: 'My recipes', value: 'mine' },
];

export function CookbookScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { saved, isSaved, toggle } = useSaved();

  const mineQuery = useQuery({
    queryKey: ['myRecipes', userId],
    queryFn: () => fetchMyRecipes(userId as string),
    enabled: !!userId,
  });

  const [segment, setSegment] = useState<Segment>('all');
  const [cookedOnly, setCookedOnly] = useState(false);

  const savedItems = useMemo(() => saved.map(savedToItem), [saved]);
  const mineItems = useMemo(() => (mineQuery.data ?? []).map(mineToItem), [mineQuery.data]);
  const items = useMemo(
    () => applyCookedFilter(selectSegment(segment, savedItems, mineItems), cookedOnly),
    [segment, savedItems, mineItems, cookedOnly],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space[4] }}>
        <View style={{ marginBottom: space[4] }}>
          <Text role="display">Cookbook</Text>
          {items.length > 0 ? (
            <Text role="caption">
              {items.length} {items.length === 1 ? 'recipe' : 'recipes'}
            </Text>
          ) : null}
        </View>

        <SegmentBar segments={SEGMENTS} selected={segment} onSelect={(v) => setSegment(v as Segment)} />

        <View style={{ flexDirection: 'row', marginTop: space[3], marginBottom: space[4] }}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setCookedOnly((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Show only recipes you have cooked"
            accessibilityState={{ selected: cookedOnly }}
            hitSlop={10}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: space[4],
              borderRadius: radii.pill,
              backgroundColor: cookedOnly ? colors.terracotta : colors.creamDeep,
            }}
          >
            <RNText
              style={{ fontSize: 13, fontWeight: '600', color: cookedOnly ? colors.white : colors.inkSoft }}
            >
              Cooked
            </RNText>
          </Pressable>
        </View>

        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.key}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <RecipeCard
              item={item}
              saved={isSaved(item.recipeId)}
              onToggleSave={() => item.save && toggle(item.save)}
              onPress={() => router.push(`/recipe/${item.recipeId}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              segment={segment}
              cookedOnly={cookedOnly}
              onExplore={() => router.push('/')}
              onAdd={() => router.push('/add')}
            />
          }
        />
      </ScrollView>
    </View>
  );
}
