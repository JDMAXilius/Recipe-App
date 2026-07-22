import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OttoLoading, SegmentBar, Text } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useCookedState } from '@/features/cook';
import { useSaved } from './useSaved';
import { useMyRecipes } from './useMyRecipes';
import { RecipeCard } from './components/RecipeCard';
import { EmptyState } from './components/EmptyState';
import {
  applyCookedFilter,
  markCooked,
  planRecipeId,
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
  const { saved, isSaved, toggle } = useSaved();

  const mineQuery = useMyRecipes();

  // Deep-link entry (v1 parity): Account's "cooked / saved / yours" stat tiles
  // open this screen pre-filtered via ?segment=&cooked=1. Read once for the
  // initial state; the user can still switch segments after.
  const params = useLocalSearchParams<{ segment?: string; cooked?: string }>();
  const initialSegment: Segment =
    params.segment === 'saved' || params.segment === 'mine' ? params.segment : 'all';
  const [segment, setSegment] = useState<Segment>(initialSegment);
  const [cookedOnly, setCookedOnly] = useState(params.cooked === '1');

  const { isCooked } = useCookedState();
  const savedItems = useMemo(
    () => markCooked(saved.map(savedToItem), isCooked),
    [saved, isCooked],
  );
  const mineItems = useMemo(
    () => markCooked(mineQuery.recipes.map(mineToItem), isCooked),
    [mineQuery.recipes, isCooked],
  );
  const items = useMemo(
    () => applyCookedFilter(selectSegment(segment, savedItems, mineItems), cookedOnly),
    [segment, savedItems, mineItems, cookedOnly],
  );

  // Single FlatList (grid is the scroller); title/segments/Cooked-chip live in
  // ListHeaderComponent. Review fix: FlatList-in-ScrollView disabled windowing
  // and eager-rendered every card (VirtualizedLists-nested warning on native).
  const ListHeader = (
    <View>
      <View style={{ marginBottom: space[4] }}>
        <Text role="display">Cookbook</Text>
        {items.length > 0 ? (
          <Text role="caption">
            {items.length} {items.length === 1 ? 'recipe' : 'recipes'}
          </Text>
        ) : null}
      </View>

      <SegmentBar
        segments={SEGMENTS}
        selected={segment}
        onSelect={(v) => {
          haptics.select();
          setSegment(v as Segment);
        }}
      />

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
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[1],
            justifyContent: 'center',
            paddingHorizontal: space[4],
            borderRadius: radii.pill,
            backgroundColor: cookedOnly ? colors.terracotta : colors.creamDeep,
          }}
        >
          <Ionicons
            name={cookedOnly ? 'flame' : 'flame-outline'}
            size={15}
            color={cookedOnly ? colors.white : colors.inkSoft}
          />
          <RNText
            style={{ fontSize: 13, fontWeight: '600', color: cookedOnly ? colors.white : colors.inkSoft }}
          >
            Cooked
          </RNText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream }}>
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: space[4] }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <RecipeCard
            item={item}
            saved={isSaved(item.recipeId)}
            onToggleSave={() => item.save && toggle(item.save)}
            // planRecipeId applies the u- convention: user recipes open at
            // /recipe/u-<id>, seeds at /recipe/<seedId>. Pushing the bare
            // serial opened every user recipe as a (missing) seed (review bug).
            onPress={() => router.push(`/recipe/${planRecipeId(item)}` as Href)}
          />
        )}
        ListEmptyComponent={
          // useMyRecipes is the one network fetch here (saved is cache-optimistic
          // and exposes no loading signal) — show Otto while it's in flight for
          // the segments it feeds; every other empty is a per-segment mascot.
          mineQuery.isLoading && segment !== 'saved' ? (
            <OttoLoading />
          ) : (
            <EmptyState
              segment={segment}
              cookedOnly={cookedOnly}
              onExplore={() => router.push('/')}
              onAdd={() => router.push('/add')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
