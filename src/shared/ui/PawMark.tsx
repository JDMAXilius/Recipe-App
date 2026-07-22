import React from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { colors } from '../theme/tokens';

export interface PawMarkProps {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}

// THE save affordance, everywhere. Outline circle = unsaved, terracotta-filled
// = saved (interactive → terracotta, per the semantic ink rule).
// ponytail: paw glyph is a placeholder — v1's paw-outline/paw-filled PNGs
// aren't in the v2 asset tree yet; swap glyph for the real art when assets port.
export function PawMark({ saved, onToggle, size = 28 }: PawMarkProps) {
  const pad = Math.max(0, (44 - size) / 2); // hit target ≥ 44pt regardless of size
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Saved — remove from cookbook' : 'Save to cookbook'}
      accessibilityState={{ selected: saved }}
      onPress={onToggle}
      hitSlop={pad}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: colors.terracotta,
        backgroundColor: saved ? colors.terracotta : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <RNText style={{ fontSize: size * 0.5, lineHeight: size * 0.7 }}>🐾</RNText>
    </Pressable>
  );
}
