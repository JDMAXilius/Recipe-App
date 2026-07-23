import React from 'react';
import { View } from 'react-native';
import { Button, OttoArt, Text } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import type { Segment } from '../cookbook.types';

// Per-segment empty states (v1 NoFavoritesFound + the mine/cooked variants).
// The Saved copy teaches the paw-mark in one line (MOBBIN_COMPARISON §2.5).
interface Props {
  segment: Segment;
  cookedOnly: boolean;
  onExplore: () => void;
  onAdd: () => void;
}

export function EmptyState({ segment, cookedOnly, onExplore, onAdd }: Props) {
  if (cookedOnly) {
    return (
      <Shell art="sleepy" title="Nothing cooked yet">
        <Text role="body">Finish a recipe in cook mode and it lands here, pan and all.</Text>
      </Shell>
    );
  }
  if (segment === 'mine') {
    return (
      <Shell art="thinking" title="Nothing of yours yet">
        <Text role="body">Paste a link or write one down — Otto keeps your recipes right here.</Text>
        <View style={{ marginTop: space[4] }}>
          <Button title="Add a recipe" variant="primary" onPress={onAdd} />
        </View>
      </Shell>
    );
  }
  return (
    <Shell art="sad" title="Nothing saved… yet">
      <Text role="body">Tap the paw on any recipe and Otto will keep it here for later.</Text>
      <View style={{ marginTop: space[4] }}>
        <Button title="Explore recipes" variant="primary" onPress={onExplore} />
      </View>
    </Shell>
  );
}

function Shell({
  art,
  title,
  children,
}: {
  art: 'sad' | 'sleepy' | 'thinking';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space[7], paddingHorizontal: space[5], gap: space[3] }}>
      <OttoArt name={art} size={120} />
      <Text role="title">{title}</Text>
      {children}
    </View>
  );
}
