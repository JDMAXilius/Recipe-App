import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Chip, Screen, Text } from '@/shared/ui';
import { ALLERGENS, LEAVE_OUT_NOTE } from '@/shared/allergens';
import { flags } from '@/shared/flags';
import { colors, radii, space } from '@/shared/theme/tokens';
import { DIETS, CUISINES } from './profile.prefs';
import { usePrefs } from './usePrefs';

// Food preferences — diet (single choice) + cuisines (any number). These bias
// Otto's pick and where Discover starts; search, filters and your own recipes
// stay fully yours. Persisted through usePrefs on every tap (best-effort, never
// blocks the UI), so "Save" just dismisses — silently.
export function PreferencesScreen() {
  const router = useRouter();
  const prefs = usePrefs();
  const { diet, cuisines, setDiet, toggleCuisine } = prefs;
  const [skipText, setSkipText] = useState('');

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

        {/* R7.2 (flowV2): the three first-run questions, editable. */}
        {flags.flowV2 && (
          <>
            <View style={{ gap: space[2] }}>
              <Text role="caption">Who’s eating</Text>
              <View style={styles.card}>
                {(['adults', 'kids'] as const).map((k, i) => {
                  const v = prefs.household[k];
                  const min = k === 'adults' ? 1 : 0;
                  const set = (n: number) => prefs.setHousehold({ ...prefs.household, [k]: Math.max(min, Math.min(8, n)) });
                  return (
                    <View
                      key={k}
                      style={[styles.row, i > 0 && styles.rowDivider]}
                      accessible
                      accessibilityRole="adjustable"
                      accessibilityLabel={k === 'adults' ? 'Adults' : 'Kids'}
                      accessibilityValue={{ min, max: 8, now: v, text: String(v) }}
                      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                      onAccessibilityAction={(e) => set(v + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
                    >
                      <Text role="body">{k === 'adults' ? 'Adults' : 'Kids'}</Text>
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => set(v - 1)} hitSlop={8} importantForAccessibility="no" style={styles.step}>
                        <Text role="title">−</Text>
                      </Pressable>
                      <Text role="computed">{String(v)}</Text>
                      <Pressable onPress={() => set(v + 1)} hitSlop={8} importantForAccessibility="no" style={styles.step}>
                        <Text role="title">+</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: space[2] }}>
              <Text role="caption">Allergies</Text>
              <View style={styles.chips}>
                {ALLERGENS.map((a) => (
                  <Chip key={a.key} label={a.label} selected={prefs.allergies.includes(a.key)} onPress={() => prefs.toggleAllergy(a.key)} />
                ))}
              </View>
              <Text role="caption">{LEAVE_OUT_NOTE}</Text>
            </View>

            <View style={{ gap: space[2] }}>
              <Text role="caption">Foods to skip</Text>
              <TextInput
                value={skipText}
                onChangeText={setSkipText}
                onSubmitEditing={() => {
                  const f = skipText.trim().toLowerCase().slice(0, 40);
                  if (f && !prefs.skips.includes(f)) prefs.addSkip(f);
                  setSkipText('');
                }}
                placeholder="Type a food and press return"
                placeholderTextColor={colors.inkSoft}
                returnKeyType="done"
                autoCapitalize="none"
                accessibilityLabel="A food to skip"
                style={inputStyle}
              />
              {prefs.skips.length > 0 && (
                <View style={styles.chips}>
                  {prefs.skips.map((s) => (
                    <Chip key={s} label={s} selected removable onPress={() => prefs.removeSkip(s)} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}

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

const inputStyle: TextStyle = { minHeight: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: space[4], fontSize: 16, color: colors.ink };

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
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
};
