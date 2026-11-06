// A choice pill (D1.11, D1.12): diets, allergies, skips, labels, "Otto sees".
// Selected = accent fill + check; 44 pt tall so it's a real touch target.
import React from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, space } from '../theme/tokens';
import { haptics } from '../haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** "checkbox" for multi-select sets, "radio" for one-of. */
  kind?: 'checkbox' | 'radio';
  /** Shows an × and reads "Remove <label>": for chips that delete themselves. */
  removable?: boolean;
}

export function Chip({ label, selected = false, onPress, kind = 'checkbox', removable }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress?.();
      }}
      accessibilityRole={removable ? 'button' : kind}
      accessibilityLabel={removable ? `Remove ${label}` : label}
      accessibilityState={removable ? undefined : { checked: selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: space[4],
        borderRadius: radii.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[1],
        backgroundColor: selected ? colors.accentSoft : colors.white,
        borderWidth: 1,
        borderColor: selected ? colors.terracotta : colors.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {selected && !removable && <Ionicons name="checkmark" size={16} color={colors.terracotta} />}
      <RNText style={{ color: colors.ink, fontSize: 15, fontWeight: selected ? '700' : '500' }}>{label}</RNText>
      {removable && <Ionicons name="close" size={16} color={colors.inkSoft} />}
    </Pressable>
  );
}
