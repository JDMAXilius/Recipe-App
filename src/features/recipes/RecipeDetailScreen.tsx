import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, PawMark, SegmentBar, Sheet, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { NutritionCard, type NutritionRecipe } from '@/features/nutrition';
import { ShareCard, shareRecipeCard, type ShareRecipe } from '@/features/share';
import { useSaved } from '@/features/cookbook';
import { usePlan } from '@/features/planner';
import { RecipeCard } from './RecipeCard';
import { VideoEmbed } from './components/VideoEmbed';
import { scaleIngredients, scaledIngredientLines, type UnitSystem } from './recipe.scale';
import { isUserRecipeRef, useRecipe, useRelated } from './recipe.queries';

const UNIT_SEGMENTS = [
  { label: 'Metric', value: 'metric' },
  { label: 'US', value: 'us' },
];

// Recipe Detail v3: photo hero (title never on the art) → eyebrow → serif title
// → attribution → computed meta → NutritionCard → live-scaling ingredients with
// US/Metric → inline video → semantic-ink method → related. Save (paw) + share
// live in the hero cluster; add-to-week is the quiet pinned companion.
export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recipeId = String(id ?? '');

  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: related = [] } = useRelated(recipe);
  const { isSaved, toggle } = useSaved();
  const { days, add } = usePlan();
  const { show } = useToast();
  const shareCardRef = useRef<View>(null); // captured to a PNG by shareRecipeCard

  // Every recipe opens at one serving (founder call): the stepper starts at 1
  // and scales the list down to a single portion. The true yield stays in
  // baseServings so the scale factor keeps an honest denominator.
  const [servings, setServings] = useState(1);
  const [system, setSystem] = useState<UnitSystem>('metric');
  const [planOpen, setPlanOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text role="body">Getting the recipe ready…</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cream,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space[6],
          gap: space[3],
        }}
      >
        <Text role="title">That page is gone</Text>
        <Text role="caption">Otto looked everywhere — this recipe isn’t on the shelf anymore.</Text>
        <Button title="Take me back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const baseServings = recipe.servings ?? 4;
  const scaleFactor = servings / baseServings;
  const isSeed = !isUserRecipeRef(recipeId);
  const recipeIdNum = Number(recipe.id);

  const tickServings = (next: number) => {
    if (next < 1 || next > 24) return;
    setServings(next);
  };

  const { scalable, pantry } = scaleIngredients(recipe.ingredients, scaleFactor, system);
  const hasSteps = recipe.steps.length > 0;

  const nutritionRecipe: NutritionRecipe = {
    id: recipe.id,
    ingredients: recipe.ingredients,
    servings: recipe.servings,
    category: recipe.category,
    steps: recipe.steps,
  };

  const shareRecipe: ShareRecipe = {
    title: recipe.title,
    image: recipe.image,
    ingredients: scaledIngredientLines(recipe.ingredients, scaleFactor, system),
    steps: recipe.steps,
    servings,
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
  };

  const addToWeek = async (dayKey: string, label: string) => {
    setPlanOpen(false);
    try {
      await add({
        day: dayKey,
        recipeId: String(recipe.id),
        title: recipe.title,
        image: recipe.image,
        category: recipe.category,
      });
      show(`On ${label}’s card — Otto’s week has plans.`, 'success');
    } catch (e) {
      show((e as Error).message || 'Couldn’t add it to the week.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space[7] }}>
        {/* HERO — photo only */}
        <View>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', height: 280, backgroundColor: colors.creamDeep }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', height: 160, backgroundColor: colors.creamDeep }} />
          )}
          <View
            style={{
              position: 'absolute',
              top: space[4],
              right: space[4],
              flexDirection: 'row',
              gap: space[2],
            }}
          >
            {isSeed ? (
              <PawMark
                saved={isSaved(recipeIdNum)}
                onToggle={() =>
                  toggle({
                    recipeId: recipeIdNum,
                    title: recipe.title,
                    image: recipe.image,
                    category: recipe.category,
                    cookTime: null,
                    servings: recipe.servings != null ? String(recipe.servings) : null,
                  })
                }
              />
            ) : null}
          </View>
        </View>

        <View style={{ padding: space[4], gap: space[5] }}>
          {/* TITLE BLOCK */}
          <View style={{ gap: space[2] }}>
            {[recipe.category, recipe.area].filter(Boolean).length ? (
              <Text role="caption">{[recipe.category, recipe.area].filter(Boolean).join('  ·  ')}</Text>
            ) : null}
            <Text role="display">{recipe.title}</Text>
            {recipe.sourceName ? <Text role="caption">From {recipe.sourceName}</Text> : null}

            {/* Computed meta */}
            <View style={{ flexDirection: 'row', gap: space[5], marginTop: space[2] }}>
              {[
                { value: servings, label: servings === 1 ? 'serving' : 'servings' },
                { value: recipe.ingredients.length, label: 'ingredients' },
                { value: recipe.steps.length, label: 'steps' },
              ].map((m) => (
                <View key={m.label} style={{ alignItems: 'center', gap: space[1] }}>
                  <Text role="computed">{String(m.value)}</Text>
                  <Text role="caption">{m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* NUTRITION — the merged card, per serving */}
          <View style={{ gap: space[2] }}>
            <Text role="title">Nutrition</Text>
            <NutritionCard recipe={nutritionRecipe} />
          </View>

          {/* INGREDIENTS — live scaling + US/Metric */}
          <View style={{ gap: space[3] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text role="title">Ingredients</Text>
              <View style={{ width: 160 }}>
                <SegmentBar segments={UNIT_SEGMENTS} selected={system} onSelect={(v) => setSystem(v as UnitSystem)} />
              </View>
            </View>

            {/* Servings stepper */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.creamDeep,
                borderRadius: radii.card,
                paddingHorizontal: space[4],
                paddingVertical: space[3],
              }}
            >
              <Text role="body">
                For {servings} {servings === 1 ? 'serving' : 'servings'}
              </Text>
              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <Stepper label="Decrease servings" symbol="−" onPress={() => tickServings(servings - 1)} />
                <Stepper label="Increase servings" symbol="+" onPress={() => tickServings(servings + 1)} />
              </View>
            </View>

            {scalable.map((row, i) => (
              <View key={`s${i}`} style={{ flexDirection: 'row', gap: space[3], paddingVertical: space[1] }}>
                <View style={{ minWidth: 88 }}>
                  <Text role="computed">{row.display}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text role="body">{row.name}</Text>
                </View>
              </View>
            ))}
            {pantry.length > 0 ? <View style={{ height: space[2] }} /> : null}
            {pantry.map((row, i) => (
              <View key={`p${i}`} style={{ flexDirection: 'row', gap: space[3], paddingVertical: space[1] }}>
                {row.display ? (
                  <View style={{ minWidth: 88 }}>
                    <Text role="caption">{row.display}</Text>
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text role="body">{row.name}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* VIDEO — inline */}
          <VideoEmbed youtubeUrl={recipe.youtubeUrl} />

          {/* METHOD — semantic ink */}
          {recipe.steps.length > 0 ? (
            <View style={{ gap: space[3] }}>
              <Text role="title">Method</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: space[3] }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.creamDeep,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text role="computed">{String(i + 1)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text role="body">{step}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* SHARE — the painted, shareable card. Tap Share (or long-press the
              card) captures it to a PNG and opens the OS share sheet; web/no-
              capture falls back to text share inside shareRecipeCard. */}
          <View style={{ gap: space[2] }}>
            <Text role="title">Share this recipe</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share this recipe"
              onLongPress={() => {
                haptics.impact('medium');
                shareRecipeCard(shareCardRef, shareRecipe);
              }}
            >
              <ShareCard ref={shareCardRef} recipe={shareRecipe} />
            </Pressable>
            <Button
              title="Share"
              variant="secondary"
              onPress={() => {
                haptics.impact('medium');
                shareRecipeCard(shareCardRef, shareRecipe);
              }}
            />
          </View>

          {/* EXIT — related recipes */}
          {related.length > 0 ? (
            <View style={{ gap: space[3] }}>
              <Text role="title">More from the pantry</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {related.map((r) => (
                  <RecipeCard key={String(r.id)} recipe={r} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* PINNED — add-to-week */}
      <View
        style={{
          flexDirection: 'row',
          gap: space[3],
          padding: space[4],
          borderTopWidth: 1,
          borderTopColor: colors.creamDeep,
          backgroundColor: colors.cream,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            title="Add to Otto’s week"
            variant={hasSteps ? 'secondary' : 'primary'}
            size="lg"
            onPress={() => setPlanOpen(true)}
          />
        </View>
        {hasSteps ? (
          <View style={{ flex: 1 }}>
            <Button
              title="Start cooking"
              variant="primary"
              size="lg"
              onPress={() => router.push(`/recipe/cook/${recipeId}`)}
            />
          </View>
        ) : null}
      </View>

      <Sheet visible={planOpen} onClose={() => setPlanOpen(false)} title="Add to Otto’s week">
        {days.map((day) => (
          <Pressable
            key={day.key}
            accessibilityRole="button"
            accessibilityLabel={`Add to ${day.label}`}
            onPress={() => addToWeek(day.key, day.label)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: 48,
              paddingVertical: space[2],
            }}
          >
            <Text role="body">{day.label}</Text>
            <Text role="caption">{day.sub}</Text>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

function Stepper({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RNText style={{ fontSize: 22, color: colors.terracotta }}>{symbol}</RNText>
    </Pressable>
  );
}
