import React from 'react';
import { Image, Pressable, Text as RNText, View } from 'react-native';
import { PawMark, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import type { CookbookItem } from '../cookbook.types';

// Cookbook-private card (RecipeCard-equivalent — RecipeCard is not a shared
// primitive). ONE corner stamp per card (v1 §5.6): paw for saveable seed
// recipes, "By you" for written, source name for imported.
// The v1 calorie badge + macro dots are omitted here — they need useNutrition,
// which is not allowlisted to cookbook (see report-back gaps).
interface Props {
  item: CookbookItem;
  saved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
}

export function RecipeCard({ item, saved, onToggleSave, onPress }: Props) {
  // Card Pressable and the paw Pressable are SIBLINGS — a <button> nested in a
  // <button> (react-native-web renders both accessibilityRole="button"s as real
  // <button>s) is invalid HTML. The paw overlays via absolute positioning on the
  // wrapper, outside the card button. The "By you"/source badge is a plain View,
  // so it can stay inside.
  return (
    <View
      style={{
        flex: 1,
        margin: space[2],
        borderRadius: radii.card,
        backgroundColor: colors.white,
        overflow: 'hidden',
      }}
    >
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open recipe ${item.title}`}>
        <View style={{ aspectRatio: 5 / 4, backgroundColor: colors.creamDeep }}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : null}

          {item.variant !== 'saved' ? (
            <View
              style={{
                position: 'absolute',
                top: space[2],
                left: space[2],
                maxWidth: '80%',
                paddingHorizontal: space[2],
                paddingVertical: space[1],
                borderRadius: radii.pill,
                backgroundColor: colors.white,
              }}
            >
              <RNText style={{ fontSize: 11, fontWeight: '600', color: colors.inkSoft }} numberOfLines={1}>
                {item.variant === 'mine' ? 'By you' : item.sourceName || 'imported'}
              </RNText>
            </View>
          ) : null}
        </View>

        <View style={{ padding: space[3] }}>
          <Text role="body">{item.title}</Text>
        </View>
      </Pressable>

      {item.variant === 'saved' ? (
        <View style={{ position: 'absolute', top: space[2], right: space[2] }}>
          <PawMark saved={saved} onToggle={onToggleSave} size={24} />
        </View>
      ) : null}
    </View>
  );
}
