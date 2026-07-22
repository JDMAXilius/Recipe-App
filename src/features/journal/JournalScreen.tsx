import React, { useState } from 'react';
import { FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { OttoArt, OttoIdle, Screen, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useJournal } from './useJournal';
import type { JournalEntry } from './journal.logic';

// Cooking journal — the grid of plates snapped at cook-finish (P4). Newest
// first, device-local. Tapping a plate reopens its recipe. A photo whose file
// went missing (deleted from the library) degrades to the mascot placeholder,
// never a crash.
export function JournalScreen() {
  const router = useRouter();
  const { entries, loading } = useJournal();
  const { width } = useWindowDimensions();
  const size = (width - space[4] * 2 - space[3]) / 2;

  if (!loading && entries.length === 0) {
    return (
      <Screen title="Cooking journal" onBack={() => router.back()}>
        <View style={{ alignItems: 'center', gap: space[3], marginTop: space[6], paddingHorizontal: space[5] }}>
          <OttoIdle name="happy" size={140} />
          <Text role="title">No plates yet</Text>
          <Text role="caption">
            Finish a cook and snap your plate — this is where the good memories live.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Cooking journal" onBack={() => router.back()}>
      <FlatList
        data={entries}
        numColumns={2}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: space[4], gap: space[4] }}
        columnWrapperStyle={{ gap: space[3] }}
        renderItem={({ item }) => (
          <PlateTile
            entry={item}
            size={size}
            onPress={() => router.push(`/recipe/${item.recipeId}` as Href)}
          />
        )}
      />
    </Screen>
  );
}

function PlateTile({
  entry,
  size,
  onPress,
}: {
  entry: JournalEntry;
  size: number;
  onPress: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const date = new Date(entry.cookedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.title}, cooked ${date}`}
      style={{ width: size, gap: space[1] }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radii.card,
          overflow: 'hidden',
          backgroundColor: colors.creamDeep,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {failed ? (
          <OttoArt name="happy" size={size * 0.5} />
        ) : (
          <Image
            source={{ uri: entry.uri }}
            onError={() => setFailed(true)}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </View>
      <Text role="body">{entry.title}</Text>
      <Text role="caption">{date}</Text>
    </Pressable>
  );
}
