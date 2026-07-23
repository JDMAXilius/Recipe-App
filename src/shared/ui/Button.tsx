import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radii, space } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant: ButtonVariant;
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

const container: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.terracotta },
  secondary: { backgroundColor: colors.creamDeep },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.danger },
};

const labelColor: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.ink,
  ghost: colors.terracotta,
  destructive: colors.white,
};

const base: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  borderRadius: radii.pill,
  paddingHorizontal: space[5],
};

const labelBase: TextStyle = { fontSize: 16, fontWeight: '600' };

export function Button({ title, onPress, variant, size = 'md', disabled, loading }: ButtonProps) {
  const inert = !!disabled || !!loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inert, busy: !!loading }}
      onPress={inert ? undefined : onPress}
      style={({ pressed }) => [
        base,
        container[variant],
        { minHeight: size === 'lg' ? 52 : 44 },
        disabled && { opacity: 0.5 },
        pressed && !inert && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor[variant]} />
      ) : (
        <RNText style={[labelBase, { color: labelColor[variant] }]}>{title}</RNText>
      )}
    </Pressable>
  );
}
