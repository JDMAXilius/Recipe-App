import React from 'react';
import { Text as RNText, View, type TextStyle, type ViewStyle } from 'react-native';
import { OttoIdle } from '@/shared/ui';
import { colors, space, type } from '@/shared/theme/tokens';

// The before-you-type state. Built to the hero rhythm the founder holds up as
// the standard: Otto at the Otto Club size (OttoClubScreen renders the floating
// otter at 220), then the display headline and one supporting line — the same
// hero → title → subtitle ladder the auth screens use (AuthScreenLayout: hero
// marginBottom space[5], title marginBottom space[2]). The old state ran a 140
// mascot under a role="title" line, which is why the screen read smaller than
// every screen around it.
const HERO = 220;
// Caps the headline to its two-line shape and keeps the support line at a
// readable measure on a wide web window (auth caps its whole column the same way).
const MEASURE = 320;

const wrap: ViewStyle = {
  alignItems: 'center',
  gap: space[5],
  paddingTop: space[4],
  paddingBottom: space[6],
};

const column: ViewStyle = { alignItems: 'center', gap: space[2], maxWidth: MEASURE };

// Text is role-only (no align prop), so the two centered hero lines style
// themselves from the type tokens — the contained exception AuthScreenLayout
// documents and this screen must match. DELIBERATE DEVIATION: the support line
// is body-SIZE in the caption INK — "body inkSoft" is not a Text role
// (Text.tsx: role IS the color decision), so it's hand-mixed here like the
// headline, as part of the same documented escape hatch. If a second screen
// wants this pairing, promote it to a real role instead of copying this.
const headline: TextStyle = { ...type.display, color: colors.ink, textAlign: 'center' };
const support: TextStyle = { ...type.body, color: colors.inkSoft, textAlign: 'center' };

export function ChatEmptyState() {
  return (
    <View style={wrap}>
      <OttoIdle name="happy" size={HERO} sway />
      <View style={column}>
        <RNText style={headline}>What are you hungry for?</RNText>
        <RNText style={support}>
          Tell Otto a craving, a few ingredients, or a mood. He’ll ask a little, then write you a
          recipe.
        </RNText>
      </View>
    </View>
  );
}
