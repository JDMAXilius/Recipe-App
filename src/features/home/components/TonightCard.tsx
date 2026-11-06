// Tonight (D1.2, R3.2, R5.6): the big card on Home. Start cooking, Cooked it
// (one tap, for people who cook from memory), Swap. With nothing planned it
// says so and offers to plan.
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Button, Text } from '@/shared/ui';
import { foodIcon } from '@/shared/assets';
import { colors, radii, shadow, space } from '@/shared/theme/tokens';

export interface TonightDish {
  title: string;
  image: string | null;
  category: string | null;
  cooked: boolean;
}

export function TonightCard({
  dish,
  onCook,
  onCooked,
  onSwap,
  onPlan,
}: {
  dish: TonightDish | null;
  onCook: () => void;
  onCooked: () => void;
  onSwap: () => void;
  onPlan: () => void;
}) {
  if (!dish) {
    return (
      <View style={{ borderRadius: radii.card, backgroundColor: colors.creamDeep, padding: space[5], gap: space[3] }}>
        <Text role="meta">TONIGHT</Text>
        <Text role="title">Open. No plans, no guilt.</Text>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button title="Plan tonight" variant="primary" onPress={onPlan} />
        </View>
      </View>
    );
  }
  return (
    <View style={{ borderRadius: radii.card, backgroundColor: colors.white, overflow: 'hidden', ...shadow.card }}>
      <Image
        source={dish.image ? { uri: dish.image } : foodIcon(dish.category ?? '')}
        style={{ width: '100%', aspectRatio: 16 / 10 }}
        contentFit="cover"
        accessibilityLabel={dish.title}
      />
      <View style={{ padding: space[4], gap: space[3] }}>
        <View style={{ gap: space[1] }}>
          <Text role="meta">TONIGHT</Text>
          <Text role="title">{dish.title}</Text>
          {dish.cooked && <Text role="caption">Cooked. Nice one.</Text>}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          <Button title="Start cooking" variant="primary" onPress={onCook} />
          {!dish.cooked && <Button title="Cooked it" variant="secondary" onPress={onCooked} />}
          <Button title="Swap" variant="ghost" onPress={onSwap} />
        </View>
      </View>
    </View>
  );
}
