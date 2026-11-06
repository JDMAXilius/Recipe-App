// The Plan tab under flowV2 (R4.5): one place for the week and what to buy.
// A Week · Shopping segment on top; the shopping list is the same screen
// /shopping opens (that route stays as the deep link and notification target),
// shown without its back button. The tab opens on the week; it keeps the
// segment while it stays mounted, and a link that names one (`?view=week`,
// used by Home and the Sunday reminder) wins, so "go to the plan" never lands
// on the shopping list.
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SegmentBar } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { PlanScreen, type PlanScreenProps } from './PlanScreen';
import { ShoppingScreen } from './ShoppingScreen';

const SEGMENTS = [
  { label: 'Week', value: 'week' },
  { label: 'Shopping', value: 'shopping' },
] as const;
type Segment = (typeof SEGMENTS)[number]['value'];

export function PlanTab({ planMyWeek }: Pick<PlanScreenProps, 'planMyWeek'>) {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('week');
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  useFocusEffect(
    useCallback(() => {
      if (view !== 'week' && view !== 'shopping') return;
      setSegment(view);
      router.setParams({ view: undefined }); // consumed: the next link can say it again
    }, [view, router]),
  );
  const select = (v: string) => {
    if (v === segment) return;
    haptics.select();
    setSegment(v as Segment);
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: space[4], paddingTop: space[2], paddingBottom: space[1] }}>
        <SegmentBar segments={[...SEGMENTS]} selected={segment} onSelect={select} />
      </View>
      {segment === 'week' ? (
        <PlanScreen embedded planMyWeek={planMyWeek} onOpenShopping={() => select('shopping')} />
      ) : (
        <ShoppingScreen embedded onPlan={() => select('week')} />
      )}
    </View>
  );
}
