import React from 'react';
import {
  Text as RNText,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bounceable } from '@/shared/ui';
import { colors, fonts, radii, shadow, space } from '@/shared/theme/tokens';

// ONE rounded field with a trailing pill (founder, 2026-07-25 — back to the v1
// shape): the ask fills the line, and the action sits inside the field on the
// right. Dark Speak pill when there's nothing to send, terracotta send arrow
// once there is. While dictating, the pill STAYS the pill (terracotta,
// "Listening") so the stop target never moves out from under the thumb as
// interim words fill the draft — that was the one real complaint against this
// layout, and gating the swap on `listening` answers it without the two-row card.
//
// Dimensions are the v1 shape at honest sizes: the trailing control is 44pt
// (v1 shipped 40, under the touch floor), and the field's own line-height and
// padding are set so the row is exactly TAP + the vertical padding at rest —
// it grows only when the ask wraps.
export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Toggles dictation. Owns its own toasts (unavailable / denied) — see ChatScreen. */
  onSpeak: () => void;
  listening: boolean;
  sending: boolean;
}

// ≥44pt touch floor (ui-components.md §7.1) — a target size, not a spacing step,
// so it is not on the space[] scale.
const TAP = 44;
// The field grows with the ask, then scrolls, so a long paste can never eat the
// transcript. ~4 lines at this line height.
const INPUT_MAX_HEIGHT = 112;

const field: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'flex-end', // the pill stays on the baseline as the ask wraps
  gap: space[2],
  backgroundColor: colors.white,
  borderRadius: radii.card,
  borderWidth: 1,
  borderColor: colors.border,
  paddingLeft: space[4],
  paddingRight: space[2],
  paddingVertical: space[2],
  ...shadow.card,
};

const input: TextStyle = {
  flex: 1,
  fontFamily: fonts.body,
  // 16 is the field size the app's other inputs use (Input, AuthInput,
  // RecipeInput); tokens.type has no input role to borrow.
  fontSize: 16,
  lineHeight: 22,
  color: colors.ink,
  // Centres a single line against the 44pt pill beside it: 22 line + 11×2 = 44.
  paddingTop: 11,
  paddingBottom: 11,
  maxHeight: INPUT_MAX_HEIGHT,
};

const pill: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: space[2],
  height: TAP,
  paddingHorizontal: space[4],
  borderRadius: radii.pill,
};

const sendButton: ViewStyle = {
  width: TAP,
  height: TAP,
  borderRadius: radii.pill,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.terracotta,
};

// White-on-dark label: no ink Text role produces white (same reason Button
// styles its own label), so this one string reads the tokens directly.
const pillLabel: TextStyle = { fontSize: 14, fontWeight: '700', color: colors.white };

export function Composer({
  value,
  onChangeText,
  onSend,
  onSpeak,
  listening,
  sending,
}: ComposerProps) {
  const hasText = value.trim().length > 0;
  const showSend = hasText && !listening;
  return (
    <View style={field}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Tell Otto what you’re after…"
        placeholderTextColor={colors.inkSoft}
        accessibilityLabel="Message Otto"
        multiline
        style={input}
      />
      {showSend ? (
        <Bounceable
          onPress={onSend}
          disabled={sending}
          accessibilityLabel="Send"
          accessibilityState={{ busy: sending }}
          style={sendButton}
        >
          <Ionicons name="arrow-up" size={22} color={colors.white} />
        </Bounceable>
      ) : (
        <Bounceable
          onPress={onSpeak}
          accessibilityLabel={listening ? 'Stop listening' : 'Speak to Otto'}
          style={[pill, { backgroundColor: listening ? colors.terracotta : colors.ink }]}
        >
          <Ionicons name="mic" size={18} color={colors.white} />
          <RNText style={pillLabel}>{listening ? 'Listening' : 'Speak'}</RNText>
        </Bounceable>
      )}
    </View>
  );
}
