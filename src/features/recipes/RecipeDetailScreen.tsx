import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Bounceable, Button, PawMark, Sheet, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
// Pure text enricher — tints detected temps/durations (semantic-ink: computed).
// Deep import mirrors RecipeCard → nutrition/estimates; no barrel for leaf utils.
import { segmentStep } from '@/features/cook/stepEnrich';
import { NutritionCard, type NutritionRecipe } from '@/features/nutrition';
import { ShareCard, shareRecipeCard, type ShareRecipe } from '@/features/share';
import { useSaved } from '@/features/cookbook';
import { usePlan } from '@/features/planner';
import { usePrefs } from '@/features/profile';
import { RecipeCard } from './RecipeCard';
import { VideoEmbed } from './components/VideoEmbed';
import { scaleIngredients, scaledIngredientLines } from './recipe.scale';
import { isUserRecipeRef, useRecipe, useRelated } from './recipe.queries';

// Recipe Detail v3: photo hero (title never on the art) → eyebrow → serif title
// → attribution → computed meta → NutritionCard → live-scaling ingredients
// (unit system from the global Account pref, never a per-screen toggle) →
// inline video → semantic-ink method → related. Save (paw) + share live in the
// hero cluster; a floating back sits top-left; add-to-week is the quiet pinned
// companion to Start cooking.
export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const recipeId = String(id ?? '');

  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: related = [] } = useRelated(recipe);
  const { isSaved, toggle } = useSaved();
  const { days, add } = usePlan();
  const { unitSystem } = usePrefs();
  const { show } = useToast();
  const shareCardRef = useRef<View>(null); // captured to a PNG by shareRecipeCard

  // Every recipe opens at one serving (founder call): the stepper starts at 1
  // and scales the list down to a single portion. The true yield stays in
  // baseServings so the scale factor keeps an honest denominator.
  const [servings, setServings] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

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

  const baseServings = recipe.servings || 4;
  const scaleFactor = servings / baseServings;
  const isSeed = !isUserRecipeRef(recipeId);
  const recipeIdNum = Number(recipe.id);

  const tickServings = (next: number) => {
    if (next < 1 || next > 24) return;
    setServings(next);
  };

  const { scalable, pantry } = scaleIngredients(recipe.ingredients, scaleFactor, unitSystem);
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
    ingredients: scaledIngredientLines(recipe.ingredients, scaleFactor, unitSystem),
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
          {/* Floating back — v1 parity; the drag-anywhere gesture also works. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            style={{
              position: 'absolute',
              top: insets.top + space[2],
              left: space[4],
              width: 44,
              height: 44,
              borderRadius: radii.pill,
              backgroundColor: colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View
            style={{
              position: 'absolute',
              top: insets.top + space[2],
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
            ) : (
              // User's own recipe (id "u-…") — edit affordance in the hero (v1
              // parity). Seed recipes get the paw instead; never both.
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit recipe"
                onPress={() => router.push(`/recipe/edit?id=${recipeId}`)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.pill,
                  backgroundColor: colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
              >
                <Ionicons name="pencil" size={20} color={colors.ink} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ padding: space[4], gap: space[5] }}>
          {/* TITLE BLOCK */}
          <View style={{ gap: space[2] }}>
            {[recipe.category, recipe.area].filter(Boolean).length ? (
              // Uppercase eyebrow (v1 parity). `meta` is the uppercase micro-label
              // role; terracotta stays reserved for computed values (semantic ink).
              <Text role="meta">{[recipe.category, recipe.area].filter(Boolean).join('  ·  ')}</Text>
            ) : null}
            <Text role="display">{recipe.title}</Text>
            {recipe.sourceName ? (
              recipe.sourceUrl ? (
                // Attribution is a link when the import carried its source URL —
                // opens the original in the in-app browser (v1 parity).
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Open the original recipe on ${recipe.sourceName}`}
                  onPress={() => void WebBrowser.openBrowserAsync(recipe.sourceUrl as string)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: space[1] }}
                >
                  <Text role="caption">From {recipe.sourceName}</Text>
                  <Ionicons name="open-outline" size={13} color={colors.terracotta} />
                </Pressable>
              ) : (
                <Text role="caption">From {recipe.sourceName}</Text>
              )
            ) : null}

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
            <NutritionCard recipe={nutritionRecipe} servings={servings} />
          </View>

          {/* INGREDIENTS — live scaling. Unit system follows the global Account
              preference (weight-first); no per-screen US/Metric toggle (v1). */}
          <View style={{ gap: space[3] }}>
            <Text role="title">Ingredients</Text>

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
                <View key={i} style={{ flexDirection: 'row', gap: space[3], alignItems: 'flex-start' }}>
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
                  {/* Enriched prose: detected temps/durations tint terracotta
                      (computed), the rest stays authored ink. */}
                  <View style={{ flex: 1 }}>
                    <Text role="body">
                      {segmentStep(step).map((seg, s) =>
                        seg.type === 'text' ? (
                          <Text key={s} role="body">{seg.text}</Text>
                        ) : (
                          <Text key={s} role="computed">
                            {seg.type === 'duration' ? `◷ ${seg.text}` : seg.text}
                          </Text>
                        ),
                      )}
                    </Text>
                  </View>
                  {/* Start cooking from this step (v1 parity). */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Start cooking from step ${i + 1}`}
                    hitSlop={8}
                    onPress={() => {
                      haptics.select();
                      router.push(`/recipe/cook/${recipeId}?step=${i}&servings=${servings}`);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: colors.terracotta,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="play" size={13} color={colors.terracotta} />
                  </Pressable>
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

      {/* PINNED BOTTOM BAR (v1 parity) — Start cooking is the primary flame
          Bounceable; Add-to-week is its quiet 54×54 calendar companion. Save +
          share live in the hero cluster, so they're not repeated here. When a
          recipe has no steps we offer the fix (add steps) instead of a fake
          cook entrance. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          paddingHorizontal: space[4],
          paddingTop: space[3],
          paddingBottom: insets.bottom + space[3],
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.cream,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add to Otto’s week"
          onPress={() => {
            haptics.select();
            setPlanOpen(true);
          }}
          style={{
            width: 54,
            height: 54,
            borderRadius: radii.button,
            borderWidth: 1.5,
            borderColor: colors.terracotta,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={22} color={colors.terracotta} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Bounceable
            accessibilityLabel={hasSteps ? 'Start cooking step by step' : 'Add steps to cook this'}
            onPress={() => {
              haptics.impact('medium');
              router.push(hasSteps ? `/recipe/cook/${recipeId}` : `/recipe/edit?id=${recipeId}`);
            }}
          >
            <View
              style={{
                height: 54,
                borderRadius: radii.button,
                backgroundColor: colors.terracotta,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[2],
              }}
            >
              <Ionicons name={hasSteps ? 'flame-outline' : 'create-outline'} size={20} color={colors.white} />
              <RNText style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
                {hasSteps ? 'Start cooking' : 'Add steps to cook this'}
              </RNText>
            </View>
          </Bounceable>
        </View>
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
