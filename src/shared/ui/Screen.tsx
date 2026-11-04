import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../theme/tokens';
import { Text } from './Text';

export interface ScreenProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}

// Shared pushed-screen wrapper (contract §6): safe-area top inset + a 44×44
// back/close header, centered title, optional right slot. Replaces the
// profile-local Frame.
export function Screen({ title, onBack, right, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
      {/* The title sits in flow (so the bar grows with Dynamic Type instead of
          clipping at 44) and is padded 44 each side so it stays screen-centered.
          Back + right overlay it at the edges; keep titles short so they don't
          collide with a wide right slot. */}
      <View style={{ minHeight: 44, justifyContent: 'center' }}>
        {title != null && (
          <View
            pointerEvents="none"
            style={{ paddingHorizontal: 44, paddingVertical: space[2], alignItems: 'center' }}
          >
            {/* Nav titles only: one line, shrink to fit, capped like UIKit's bar. */}
            <Text role="title" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.6}>
              {title}
            </Text>
          </View>
        )}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space[2],
          }}
        >
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={{ width: 44, height: 44 }} />
          )}
          <View style={{ minWidth: 44, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            {right}
          </View>
        </View>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
