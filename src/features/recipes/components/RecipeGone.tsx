// R5.5 (flowV2): a link to a recipe that isn't there (removed, or a link from
// an old build). Says so plainly, offers Otto's pick in its place and two ways
// on: Search and Ask Otto. A failed READ is not this screen: the detail
// screen shows the retry state for that, never "not found".
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, OttoArt, Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { openOtto } from '@/shared/flags';
import { RecipeCard } from '../RecipeCard';
import { isUserRecipeRef, useFeatured } from '../recipe.queries';
import type { SeedId } from '@/types/ids';

export function RecipeGone({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const featured = useFeatured().data;
  // Otto's pick is always a catalogue dish; the guard keeps the type honest.
  const pick =
    featured && !isUserRecipeRef(String(featured.id))
      ? { id: featured.id as SeedId, title: featured.title, image: featured.image, category: featured.category }
      : null;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + space[6], paddingHorizontal: space[5], paddingBottom: space[7], gap: space[4], alignItems: 'center' }}
    >
      <OttoArt name="sleepy" size={120} />
      <Text role="title">This recipe isn&apos;t here any more</Text>
      <Text role="caption">It may have been removed, or the link is old.</Text>
      {pick && (
        <View style={{ alignSelf: 'stretch', gap: space[2] }}>
          <Text role="meta">TRY THIS INSTEAD</Text>
          <View style={{ width: '50%' }}>
            <RecipeCard recipe={pick} />
          </View>
        </View>
      )}
      <View style={{ alignSelf: 'stretch', gap: space[2] }}>
        <Button title="Search recipes" variant="primary" onPress={() => router.replace('/search')} />
        <Button title="Ask Otto" variant="secondary" onPress={() => openOtto(router, 'replace')} />
        <Button title="Take me back" variant="ghost" onPress={onBack} />
      </View>
    </ScrollView>
  );
}
