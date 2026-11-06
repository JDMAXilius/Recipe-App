// What's new (R8.4): once per release, on Home, for people who used Otto
// before it. Short and true: only things this release does.
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Sheet, Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { CURRENT_RELEASE, useWhatsNew } from '@/shared/useWhatsNew';

const NOTES: Record<string, [keyof typeof Ionicons.glyphMap, string][]> = {
  '1.1': [
    ['home-outline', 'Home opens on tonight: start cooking, swap it, or mark it cooked.'],
    ['calendar-outline', 'Plan is your week by date, with the shopping list one tap away.'],
    ['camera-outline', 'Snap any dish and Otto writes the recipe.'],
    ['sparkles-outline', 'Otto has its own tab, at the end of the bar.'],
  ],
};

export function WhatsNewSheet() {
  const notes = CURRENT_RELEASE ? NOTES[CURRENT_RELEASE] : undefined;
  const { visible, close } = useWhatsNew(!!notes);
  if (!notes) return null;
  return (
    <Sheet visible={visible} onClose={close} title="What's new in Otto">
      <View style={{ gap: space[3], paddingBottom: space[2] }}>
        {notes.map(([icon, line]) => (
          <View key={line} style={{ flexDirection: 'row', gap: space[3], alignItems: 'center' }}>
            <Ionicons name={icon} size={22} color={colors.terracotta} />
            <View style={{ flex: 1 }}>
              <Text role="body">{line}</Text>
            </View>
          </View>
        ))}
        <Button title="Got it" variant="primary" onPress={close} />
      </View>
    </Sheet>
  );
}
