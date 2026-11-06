// The three questions (R1.3): who's eating · how you eat · anything to skip.
// "Question n of 3", Skip on each (a skipped question keeps its defaults),
// no account. Answers live in firstRun.store until "Save my week".
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, Screen, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { ALLERGENS, LEAVE_OUT_NOTE, type Diet } from '@/shared/allergens';
import { setAnswers, useAnswers } from './firstRun.store';

const STEPS = 3;
const DIETS: { key: Diet; label: string }[] = [
  { key: 'none', label: 'Everything' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
];
const SKIP_IDEAS = ['Mushrooms', 'Olives', 'Coriander', 'Aubergine', 'Blue cheese'];

export function QuestionScreen({ step }: { step: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const n = Math.min(STEPS, Math.max(1, Math.round(step) || 1));
  const next = () => router.push(n === STEPS ? '/first-week' : `/about/${n + 1}`);

  return (
    <Screen onBack={() => router.back()} right={<SkipButton onPress={next} />}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space[6], paddingBottom: space[6], gap: space[5] }}>
        <Text role="meta">{`Question ${n} of ${STEPS}`}</Text>
        {n === 1 && <WhoIsEating />}
        {n === 2 && <HowYouEat />}
        {n === 3 && <AnythingToSkip />}
      </ScrollView>
      <View style={{ paddingHorizontal: space[6], paddingBottom: Math.max(insets.bottom, space[4]) + space[2] }}>
        <Button title={n === STEPS ? 'Show my week' : 'Continue'} variant="primary" size="lg" onPress={next} />
      </View>
    </Screen>
  );
}

function SkipButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Skip this question" style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space[3] }}>
      <Text role="label">Skip</Text>
    </Pressable>
  );
}

function WhoIsEating() {
  const { household } = useAnswers();
  const set = (patch: Partial<typeof household>) => setAnswers({ household: { ...household, ...patch } });
  return (
    <View style={{ gap: space[5] }}>
      <Text role="display">Who’s eating?</Text>
      <Text role="body">Otto sizes every dinner for your table.</Text>
      <Stepper label="Adults" value={household.adults} min={1} max={8} onChange={(adults) => set({ adults })} />
      <Stepper label="Kids" value={household.kids} min={0} max={8} onChange={(kids) => set({ kids })} />
    </View>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const step = (d: number) => {
    const v = Math.max(min, Math.min(max, value + d));
    if (v !== value) {
      haptics.select();
      onChange(v);
    }
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: radii.card, paddingVertical: space[3], paddingHorizontal: space[4] }}
    >
      <Text role="title">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
        <RoundButton icon="remove" disabled={value <= min} onPress={() => step(-1)} />
        <Text role="computed">{String(value)}</Text>
        <RoundButton icon="add" disabled={value >= max} onPress={() => step(1)} />
      </View>
    </View>
  );
}

function RoundButton({ icon, disabled, onPress }: { icon: 'add' | 'remove'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep, opacity: disabled ? 0.4 : 1 }}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

function HowYouEat() {
  const { diet, allergies } = useAnswers();
  const toggle = (key: (typeof allergies)[number]) =>
    setAnswers({ allergies: allergies.includes(key) ? allergies.filter((a) => a !== key) : [...allergies, key] });
  return (
    <View style={{ gap: space[5] }}>
      <Text role="display">How do you eat?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
        {DIETS.map((d) => (
          <Chip key={d.key} kind="radio" label={d.label} selected={diet === d.key} onPress={() => setAnswers({ diet: d.key })} />
        ))}
      </View>
      <Text role="title">Allergies</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
        {ALLERGENS.map((a) => (
          <Chip key={a.key} label={a.label} selected={allergies.includes(a.key)} onPress={() => toggle(a.key)} />
        ))}
      </View>
      <Text role="caption">{LEAVE_OUT_NOTE}</Text>
    </View>
  );
}

function AnythingToSkip() {
  const { skips } = useAnswers();
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const food = raw.trim().toLowerCase().slice(0, 40);
    if (food && !skips.includes(food) && skips.length < 12) setAnswers({ skips: [...skips, food] });
    setText('');
  };
  const remove = (food: string) => setAnswers({ skips: skips.filter((s) => s !== food) });
  const ideas = SKIP_IDEAS.filter((i) => !skips.includes(i.toLowerCase()));
  return (
    <View style={{ gap: space[5] }}>
      <Text role="display">Anything to skip?</Text>
      <Text role="body">Foods you’d rather not see. Otto leaves them out.</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => add(text)}
        placeholder="Type a food and press return"
        placeholderTextColor={colors.inkSoft}
        returnKeyType="done"
        autoCapitalize="none"
        accessibilityLabel="A food to skip"
        style={{ minHeight: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: space[4], fontSize: 16, color: colors.ink }}
      />
      {skips.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {skips.map((s) => (
            <Chip key={s} label={s} selected removable onPress={() => remove(s)} />
          ))}
        </View>
      )}
      {ideas.length > 0 && (
        <View style={{ gap: space[2] }}>
          <Text role="meta">Common ones</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
            {ideas.map((i) => (
              <Chip key={i} label={i} onPress={() => add(i)} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
