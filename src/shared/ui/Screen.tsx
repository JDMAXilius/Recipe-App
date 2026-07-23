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
      {/* Title is absolutely centered across the full width so it stays
          screen-centered no matter how wide the left/right slots are (the right
          slot can hold more than one action). Back + right sit on top at the
          edges; keep titles short so they don't collide with a wide right slot. */}
      <View style={{ height: 44, justifyContent: 'center' }}>
        {title != null && (
          <View
            accessibilityRole="header"
            pointerEvents="none"
            style={{ position: 'absolute', left: 44, right: 44, alignItems: 'center' }}
          >
            <Text role="title">{title}</Text>
          </View>
        )}
        <View
          style={{
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
              <Ionicons name="arrow-back" size={24} color={colors.ink} />
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
