// The first week (R1.4): seven dinners from Otto's catalogue, before any
// account. Opens on tonight (tomorrow after 8 pm) as a big card sized for the
// household, the rest of the week below with a one-tap Swap per day, and the
// shopping list count. No AI, nothing leaves the phone but the catalogue read.
// "Save my week" keeps the answers and the week as the draft (R0.3) and goes
// on to Save your plan (sign-up) — or, already signed in, back to the launch.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, OttoError, OttoLoading, Screen, Text } from '@/shared/ui';
import { colors, radii, shadow, space } from '@/shared/theme/tokens';
import { foodIcon } from '@/shared/assets';
import { haptics } from '@/shared/haptics';
import { LEAVE_OUT_NOTE } from '@/shared/allergens';
import { toDayKey, weekDays } from '@/shared/week';
import { useAuth } from '@/features/auth';
import { buildFirstWeek, firstDayIndex, shoppingCount, swapDay, type WeekDish } from './firstWeek';
import { useAnswers } from './firstRun.store';
import { useDinnerShelf } from './onboarding.queries';
import { useDraft } from './useDraft';

export function FirstWeekScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const answers = useAnswers();
  const shelf = useDinnerShelf();
  const draft = useDraft();
  const [seed] = useState(() => Date.now() % 1_000_000_007);
  const [swaps, setSwaps] = useState<Record<number, WeekDish>>({});
  const [saving, setSaving] = useState(false);

  // Tonight, or tomorrow once it's late; seven days from there.
  const days = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + firstDayIndex(now));
    return weekDays(start).map((d) => d.key);
  }, []);
  const weekAnswers = useMemo(() => ({ ...answers, cuisines: [] }), [answers]);
  const built = useMemo(
    () => (shelf.data ? buildFirstWeek(shelf.data, weekAnswers, days, seed) : []),
    [shelf.data, weekAnswers, days, seed],
  );
  const week = built.map((d, i) => swaps[i] ?? d);
  const servings = Math.max(1, Math.ceil(answers.household.adults + answers.household.kids / 2));

  const swap = (i: number) => {
    if (!shelf.data) return;
    const next = swapDay(week, i, shelf.data, weekAnswers, seed + i * 7919 + Object.keys(swaps).length);
    if (next) {
      haptics.select();
      setSwaps((s) => ({ ...s, [i]: next }));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await draft.save({ household: answers.household, diet: answers.diet, allergies: answers.allergies, skips: answers.skips }, week);
      haptics.notify('success');
      // Signed in (an account that never answered): the launch moves on and the
      // draft is claimed. Signed out: Save your plan makes the account.
      router.replace(session ? '/' : '/(auth)/sign-up');
    } finally {
      setSaving(false);
    }
  };

  if (shelf.isLoading) return <OttoLoading message="Otto is planning your week…" />;
  if (shelf.isError) return <OttoError message="Otto couldn't reach the kitchen. Check your connection." onRetry={() => void shelf.refetch()} />;

  const [tonight, ...rest] = week;
  const count = shelf.data ? shoppingCount(week, shelf.data) : 0;

  return (
    <Screen onBack={() => router.back()}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space[5], paddingBottom: space[6], gap: space[4] }}>
        <Text role="display">Your week</Text>
        {week.length < days.length && (
          <Text role="caption">{`Otto found ${week.length} dinners that fit. You can add more any time.`}</Text>
        )}
        {answers.allergies.length > 0 && <Text role="caption">{LEAVE_OUT_NOTE}</Text>}

        {tonight ? (
          <TonightCard dish={tonight} label={dayLabel(tonight.day)} servings={servings} onSwap={() => swap(0)} />
        ) : (
          <Text role="body">Nothing fits those answers yet. Go back and loosen one, or save and plan by hand.</Text>
        )}

        {rest.map((d, i) => (
          <DayRow key={d.day} dish={d} label={dayLabel(d.day)} onSwap={() => swap(i + 1)} />
        ))}

        {count > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderRadius: radii.card, backgroundColor: colors.creamDeep }}>
            <Ionicons name="basket-outline" size={22} color={colors.ink} />
            <Text role="body">{`Shopping list ready · ${count} items`}</Text>
          </View>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: space[5], paddingBottom: Math.max(insets.bottom, space[4]) + space[2] }}>
        <Button title="Save my week" variant="primary" size="lg" loading={saving} disabled={week.length === 0} onPress={save} />
      </View>
    </Screen>
  );
}

function dayLabel(key: string): string {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (key === toDayKey(today)) return 'Tonight';
  if (key === toDayKey(tomorrow)) return 'Tomorrow';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' });
}

const picture = (d: WeekDish) => (d.image ? { uri: d.image } : foodIcon(d.category ?? ''));

function TonightCard({ dish, label, servings, onSwap }: { dish: WeekDish; label: string; servings: number; onSwap: () => void }) {
  return (
    <View style={{ borderRadius: radii.card, backgroundColor: colors.white, overflow: 'hidden', ...shadow.card }}>
      <Image source={picture(dish)} style={{ width: '100%', aspectRatio: 4 / 3 }} contentFit="cover" accessibilityLabel={dish.title} />
      <View style={{ padding: space[4], gap: space[2] }}>
        <Text role="meta">{label}</Text>
        <Text role="title">{dish.title}</Text>
        <Text role="caption">{`Sized for ${servings} · From Otto's kitchen`}</Text>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button title="Swap" variant="secondary" onPress={onSwap} />
        </View>
      </View>
    </View>
  );
}

function DayRow({ dish, label, onSwap }: { dish: WeekDish; label: string; onSwap: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], borderRadius: radii.card, backgroundColor: colors.white }}>
      <Image source={picture(dish)} style={{ width: 56, height: 56, borderRadius: radii.button }} contentFit="cover" accessible={false} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text role="meta">{label}</Text>
        <Text role="body" numberOfLines={2}>{dish.title}</Text>
      </View>
      <Pressable
        onPress={onSwap}
        accessibilityRole="button"
        accessibilityLabel={`Swap ${label}'s dinner`}
        style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="shuffle" size={22} color={colors.terracotta} />
      </Pressable>
    </View>
  );
}
