import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text, OttoArt } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { Screen } from './components/Frame';

// Cooking journal — the private life of "Snap your plate" (roadmap Phase 5).
// ponytail: photos live on-device (v1 stored otto.journal.<id> in AsyncStorage),
// which isn't an installed dependency yet — so the journal shows its honest
// empty state until on-device storage lands. Wire the photo grid then.
export function JournalScreen() {
  return (
    <Screen title="Cooking journal">
      <View style={styles.empty}>
        <OttoArt name="happy" size={120} />
        <Text role="title">No plates yet</Text>
        <Text role="caption">
          Finish a cook and snap your plate — this is where the good memories live.
        </Text>
      </View>
    </Screen>
  );
}

const styles: Record<string, ViewStyle> = {
  empty: { alignItems: 'center', gap: space[3], marginTop: space[5] },
};
