// The top of Home (R3.2): Tonight and This week. The rest of Home is
// Discover's sections, so app/(tabs)/index.tsx hands this to DiscoverScreen
// as its `top` slot (the route composes; features don't import each other).
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, WeekStrip, useToast } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { space } from '@/shared/theme/tokens';
import { track } from '@/shared/track';
import { usePlan, tonightEntry } from '@/features/planner';
import { TonightCard } from './components/TonightCard';

export function HomeTop() {
  const router = useRouter();
  const { show } = useToast();
  const { entries, days, setCooked } = usePlan();
  const tonight = tonightEntry(entries, days[0].key);

  const week = days.map((d) => ({ key: d.key, planned: entries.filter((e) => e.day === d.key).length }));

  return (
    <View style={{ gap: space[4] }}>
      <TonightCard
        dish={tonight ? { title: tonight.title, image: tonight.image, category: tonight.category, cooked: tonight.cooked } : null}
        onCook={() => tonight?.recipe_id && router.push(`/recipe/cook/${tonight.recipe_id}`)}
        onCooked={() => {
          if (!tonight) return;
          haptics.notify('success');
          void setCooked(tonight.id, true)
            .then(() => track('item_cooked', { source: 'plan', via: 'button' }))
            .catch(() => show("Couldn't save that. Try again.", 'error'));
        }}
        onSwap={() => router.push('/(tabs)/plan')}
        onPlan={() => router.push('/(tabs)/plan')}
      />
      <View style={{ gap: space[2] }}>
        <Text role="title">This week</Text>
        <WeekStrip days={week} onPress={() => router.push('/(tabs)/plan')} />
      </View>
    </View>
  );
}
