import React from 'react';
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressSpring } from '../motion';

export interface BounceableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  /** Layout for the pressable surface itself — a tappable that needs `flex: 1`,
   *  a fixed circle, or padding could not adopt this wrapper without it, which
   *  is exactly why call sites kept hand-rolling `pressed && {opacity}` styles
   *  instead (polish sweep 2026-07-25, root cause of six findings). */
  style?: StyleProp<ViewStyle>;
  /** Reaching the 44pt floor without inflating the visual size. */
  hitSlop?: number;
}

// THE press-feedback wrapper (contract §6). Every tappable card/tile/row goes
// through here so the scale-0.97 spring lives in exactly one place. Motion comes
// from usePressSpring (reduced-motion aware — opacity dip instead of scale).
export function Bounceable({
  children,
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  style: surfaceStyle,
  hitSlop,
}: BounceableProps) {
  const { style, onPressIn, onPressOut } = usePressSpring();
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
    >
      {/* The animated view carries the layout so a styled Bounceable doesn't
          need a second wrapper View that changes the box. */}
      <Animated.View style={[surfaceStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
