import React from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { OttoArt, TextLink } from '@/shared/ui';
import { colors, space, type } from '@/shared/theme/tokens';

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
              <OttoArt name="happy" size={180} />
            </View>
          )}
          {/* Centered hero title + subtitle (Figma master board). The shared
              Text is role-only (no align), so the auth chrome styles these two
              lines directly with the type tokens — a contained exception. */}
          <RNText style={{ ...type.display, color: colors.ink, textAlign: 'center', marginBottom: space[2] }}>
            {title}
          </RNText>
          {subtitle != null && (
            <RNText style={{ ...type.body, color: colors.inkSoft, textAlign: 'center', marginBottom: space[5] }}>
              {subtitle}
            </RNText>
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

const TERMS_URL = 'https://ottosapp.com/terms';
const PRIVACY_URL = 'https://ottosapp.com/privacy';

// The fine print every reference sign-up carries, under the buttons. The links
// sit on their own line as TextLinks: inline `Text onPress` links are only as
// tall as the caption (HIG 44pt targets).
export function AuthLegal() {
  return (
    <View style={{ marginTop: space[4] }}>
      <RNText style={{ ...type.caption, color: colors.inkSoft, textAlign: 'center' }}>
        By continuing you agree to the
      </RNText>
      <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: space[4] }}>
        <TextLink title="Terms" role="link" onPress={() => Linking.openURL(TERMS_URL)} />
        <TextLink title="Privacy Policy" role="link" onPress={() => Linking.openURL(PRIVACY_URL)} />
      </View>
    </View>
  );
}
