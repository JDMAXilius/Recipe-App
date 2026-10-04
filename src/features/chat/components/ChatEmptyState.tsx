import React from 'react';
import { Text as RNText, View, type TextStyle, type ViewStyle } from 'react-native';
import { OttoIdle } from '@/shared/ui';
import { colors, space, type } from '@/shared/theme/tokens';
import { OptionChips } from './Transcript';

// The before-you-type state (UX audit 2026-10-04, item 09): Otto, one headline,
// then three starters that send as the first message. Chips demonstrate what to
// ask instead of a sentence explaining it — the ChatGPT/Gemini pattern. They are
// the same pills as Otto's clarify options, so a tap gets the same consent +
// send beat (ChatScreen's onPickChip).
const HERO = 140;
// Caps the headline to its two-line shape on a wide web window.
const MEASURE = 320;

const STARTERS = [
  '20-min weeknight pasta',
  'Use up chicken thighs + spinach',
  'Something cozy, vegetarian',
];

const wrap: ViewStyle = {
  alignItems: 'center',
  gap: space[5],
  paddingTop: space[4],
  paddingBottom: space[6],
};

// Text is role-only (no align prop), so the centered headline styles itself
// from the type tokens — the contained exception AuthScreenLayout documents.
const headline: TextStyle = {
  ...type.display,
  color: colors.ink,
  textAlign: 'center',
  maxWidth: MEASURE,
};

export function ChatEmptyState({ onPick }: { onPick: (starter: string) => void }) {
  return (
    <View style={wrap}>
      <OttoIdle name="happy" size={HERO} sway />
      <RNText style={headline}>What are you hungry for?</RNText>
      {/* stretch: a wrapping row needs a real width inside the centered column */}
      <View style={{ alignSelf: 'stretch' }}>
        <OptionChips options={STARTERS} onPick={onPick} />
      </View>
    </View>
  );
}
