// The painted, shareable recipe card recipes' detail renders (cross-feature,
// allowlisted). Portrait artifact: photo, serif title, honest meta, immutable
// attribution, and the Otto sign-off (the paw is Otto's mark — this card IS an
// Otto artifact). forwardRef so a later capture step (viewShot) can snapshot
// it; on screen it renders as-is. Uses @/shared/ui primitives + theme tokens.
import React, { forwardRef } from 'react';
import { Image, View } from 'react-native';
import { OttoArt, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import type { ShareRecipe } from './share.types';

export interface ShareCardProps {
  recipe: ShareRecipe;
}

const CARD_W = 360;

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { recipe },
  ref,
) {
  const meta = [
    recipe.ingredients.length ? `${recipe.ingredients.length} ingredients` : null,
    recipe.steps.length ? `${recipe.steps.length} steps` : null,
    recipe.servings ? `serves ${recipe.servings}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: CARD_W,
        backgroundColor: colors.cream,
        borderRadius: radii.card,
        padding: space[5],
      }}
    >
      {recipe.image ? (
        <Image
          source={{ uri: recipe.image }}
          style={{
            width: CARD_W - space[5] * 2,
            height: 210,
            borderRadius: radii.card,
            backgroundColor: colors.creamDeep,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: CARD_W - space[5] * 2,
            height: 90,
            borderRadius: radii.card,
            backgroundColor: colors.creamDeep,
          }}
        />
      )}

      <View style={{ paddingTop: space[3], gap: space[1] }}>
        <Text role="display">{recipe.title}</Text>
        {meta ? <Text role="caption">{meta}</Text> : null}
        {recipe.sourceName ? (
          <Text role="caption">From {recipe.sourceName}</Text>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          marginTop: space[4],
        }}
      >
        <OttoArt name="badge" size={20} />
        <Text role="caption">Otto — the quieter kind of cookbook</Text>
      </View>
    </View>
  );
});
