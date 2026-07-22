// Feature-private: the settings sub-screen shell — a quiet back header over a
// scrolling body. Not exported past index.ts; the five sub-screens share it so
// there's one copy of the header, not five.
import React from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';

export function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        >
          <Text role="computed">‹ Back</Text>
        </Pressable>
        <Text role="display">{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </View>
  );
}

const styles: Record<string, ViewStyle> = {
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: space[4], paddingTop: space[6], paddingBottom: space[2], gap: space[2] },
  scroll: { padding: space[4], paddingBottom: space[7] },
};
