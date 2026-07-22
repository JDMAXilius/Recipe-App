import React, { useMemo } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useSaved, useMyRecipes } from '@/features/cookbook';
import { savedToPick, mineToPick, type PickItem } from '../plan.pick';

// The in-planner recipe picker (v1 parity): a Sheet listing the user's whole
// cookbook — their own recipes first, then saved seeds — to drop onto a day or
// swap into a slot. Picking hands a normalized PickItem back to PlanScreen,
// which turns it into an add/swap. Read-only on cookbook (allowlisted hooks).
export interface RecipePickerSheetProps {
  visible: boolean;
  title: string;
  onPick: (pick: PickItem) => void;
  onClose: () => void;
}

export function RecipePickerSheet({ visible, title, onPick, onClose }: RecipePickerSheetProps) {
  const { saved } = useSaved();
  const { recipes: mine } = useMyRecipes();

  const items = useMemo<PickItem[]>(
    () => [...mine.map(mineToPick), ...saved.map(savedToPick)],
    [mine, saved],
  );

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {items.length === 0 ? (
        <Text role="caption">
          Your cookbook is empty — save a recipe or write your own, then plan it here.
        </Text>
      ) : (
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {items.map((item) => (
            <Pressable
              key={item.recipeId}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.title}`}
              style={styles.row}
              onPress={() => {
                onPick(item);
                onClose();
              }}
            >
              <View style={{ flex: 1 }}>
                <Text role="body">{item.title}</Text>
                {item.category != null && <Text role="caption">{item.category}</Text>}
              </View>
              <Ionicons name="add-circle" size={22} color={colors.terracotta} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles: Record<string, ViewStyle> = {
  // Cap the list so a big cookbook doesn't push the sheet off-screen.
  list: { maxHeight: 380 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[3],
    borderRadius: radii.button,
    backgroundColor: colors.white,
    marginBottom: space[2],
  },
};
