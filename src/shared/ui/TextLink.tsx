import React from 'react';
import { Pressable, Text as RNText, type TextStyle, type ViewStyle } from 'react-native';
import { colors, type } from '../theme/tokens';

export interface TextLinkProps {
  title: string;
  onPress: () => void;
  // 'link' opens something outside the app (Terms, Privacy); 'button' acts in it.
  role?: 'link' | 'button';
  accessibilityLabel?: string;
  disabled?: boolean;
}

// A bare line of tappable text, still a 44pt target (HIG 30 · Buttons). The
// one home for "Forgot password?", "Terms", "Restore purchases"-style links so
// none of them shrink back to the height of their text.
const base: ViewStyle = { minHeight: 44, justifyContent: 'center', alignItems: 'center' };
const label: TextStyle = { ...type.body, fontWeight: '600', color: colors.terracotta, textAlign: 'center' };

export function TextLink({ title, onPress, role = 'button', accessibilityLabel, disabled }: TextLinkProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [base, (disabled || pressed) && { opacity: disabled ? 0.5 : 0.6 }]}
    >
      <RNText style={label}>{title}</RNText>
    </Pressable>
  );
}
