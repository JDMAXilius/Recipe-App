import React from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { DIETS, CUISINES } from './profile.prefs';
import { usePrefs } from './usePrefs';

// Food preferences — diet (single choice) + cuisines (any number). These bias
// Otto's pick and where Discover starts; search, filters and your own recipes
// stay fully yours. Persisted through usePrefs on every tap (best-effort, never
// blocks the UI), so "Save" just dismisses — silently.
export function PreferencesScreen() {
  const router = useRouter();
  const { diet, cuisines, setDiet, toggleCuisine } = usePrefs();

  const onBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <Screen
      title="Food preferences"
      onBack={onBack}
      right={
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Save preferences">
          <Text role="computed">Save</Text>
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ gap: space[4] }}>
        <View style={{ gap: space[2] }}>
          <Text role="caption">Diet</Text>
          <View style={styles.card}>
            {DIETS.map((d, i) => {
              const on = diet === d.key;
              return (
                <Pressable
                  key={d.key}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                  onPress={() => setDiet(d.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={d.label}
                >
                  <Text role="body">{d.label}</Text>
                  <View style={{ flex: 1 }} />
                  <Text role={on ? 'computed' : 'caption'}>{on ? '●' : '○'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: space[2] }}>
          <Text role="caption">Cuisines you love</Text>
          <View style={styles.chips}>
            {CUISINES.map((area) => {
              const on = cuisines.includes(area);
              return (
                <Pressable
                  key={area}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleCuisine(area)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={area}
                >
                  <Text role={on ? 'computed' : 'caption'}>{area}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles: Record<string, ViewStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
  card: { backgroundColor: colors.white, borderRadius: radii.card, paddingHorizontal: space[4] },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: space[3] },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.creamDeep },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.creamDeep },
};
