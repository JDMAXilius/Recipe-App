import React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
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
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
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
            <RNText style={{ fontSize: 30, lineHeight: 34, color: colors.ink }}>‹</RNText>
          </Pressable>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}
        <View
          accessibilityRole="header"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          {title != null && <Text role="title">{title}</Text>}
        </View>
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          {right}
        </View>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
