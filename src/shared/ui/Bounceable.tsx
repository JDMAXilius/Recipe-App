import React from 'react';
import { Pressable, type AccessibilityRole } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressSpring } from '../motion';

export interface BounceableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
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
}: BounceableProps) {
  const { style, onPressIn, onPressOut } = usePressSpring();
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
    >
      <Animated.View style={style}>{children}</Animated.View>
    </Pressable>
  );
}
