import React from 'react';
import {
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/ui';
import { colors, fonts, radii, shadow, space, type } from '@/shared/theme/tokens';

// The composer CARD — the thing you touch every time you talk to Otto, so it
// gets the same weight as an Otto Club plan card: white surface, radii.card,
// space[4] padding, shadow.card. Two ROWS, not one thin line: the ask on its own
// full-width line, the two real actions (Speak, Send) beneath it on a defined
// baseline. Both actions are always visible — the old single trailing pill
// swapped Speak↔Send, which hid the stop-target the moment dictation produced a
// word. Speak stays put and reachable now, listening or not.
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
// Preserved from the one-row composer: the field grows with the ask, then
// scrolls, so a long paste can never eat the transcript.
const INPUT_MAX_HEIGHT = 120;

const card: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: radii.card,
  padding: space[4],
  gap: space[3],
  // Hairline AND shadow: RN's shadow renders faint on web, the border keeps the
  // card's edge honest there without changing the native look.
  borderWidth: 1,
  borderColor: colors.border,
  ...shadow.card,
};

const field: TextStyle = {
  fontFamily: fonts.body,
  // 16 is the field size the other three text inputs use (Input, AuthInput,
  // RecipeInput); tokens.type has no input role to borrow.
  fontSize: 16,
  lineHeight: 24,
  color: colors.ink,
  minHeight: TAP,
  maxHeight: INPUT_MAX_HEIGHT,
  textAlignVertical: 'top',
};

const actions: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: space[3],
};

const speakPill: ViewStyle = {
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
};

// White-on-terracotta while listening: no ink Text role fits white text (same
// reason Button styles its own label), so this one string reads the tokens direct.
const listeningLabel: TextStyle = { ...type.label, color: colors.white };

export function Composer({
  value,
  onChangeText,
  onSend,
  onSpeak,
  listening,
  sending,
}: ComposerProps) {
  const canSend = value.trim().length > 0 && !sending;
  return (
    <View style={card}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Tell Otto what you’re after…"
        placeholderTextColor={colors.inkSoft}
        accessibilityLabel="Message Otto"
        multiline
        onSubmitEditing={onSend}
        style={field}
      />
      <View style={actions}>
        <Pressable
          onPress={onSpeak}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stop listening' : 'Speak to Otto'}
          style={({ pressed }) => [
            speakPill,
            { backgroundColor: listening ? colors.terracotta : colors.creamDeep },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="mic" size={18} color={listening ? colors.white : colors.ink} />
          {listening ? (
            <RNText style={listeningLabel}>Listening</RNText>
          ) : (
            <Text role="label">Speak</Text>
          )}
        </Pressable>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend, busy: sending }}
          style={({ pressed }) => [
            sendButton,
            // gray is the disabled/muted token — a dimmed terracotta would still
            // read as "tap me". Nothing to send, nothing that looks tappable.
            { backgroundColor: canSend ? colors.terracotta : colors.gray },
            pressed && canSend && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="arrow-up" size={22} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
