import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { OttoArt, Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';

// Shared chrome for all five auth screens: safe keyboard behaviour, a centered
// scroll column, the Otto hero, headline + subhead, and an inline error line.
// One place so the five screens stay ~form-only (ponytail: 5 copies of this
// wrapper is exactly the boilerplate to delete).
export interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  error?: string | null;
  hero?: boolean;
  children: React.ReactNode;
}

export function AuthScreenLayout({
  title,
  subtitle,
  error,
  hero = true,
  children,
}: AuthScreenLayoutProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: space[5],
            maxWidth: 480,
            width: '100%',
            alignSelf: 'center',
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {hero && (
            <View style={{ alignItems: 'center', marginBottom: space[5] }}>
              <OttoArt name="hero" size={140} />
            </View>
          )}
          <View style={{ marginBottom: space[2] }}>
            <Text role="display">{title}</Text>
          </View>
          {subtitle != null && (
            <View style={{ marginBottom: space[5] }}>
              <Text role="body">{subtitle}</Text>
            </View>
          )}
          {error != null && error !== '' && (
            <RNText
              accessibilityRole="alert"
              style={{ color: colors.danger, fontSize: 14, marginBottom: space[3] }}
            >
              {error}
            </RNText>
          )}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
