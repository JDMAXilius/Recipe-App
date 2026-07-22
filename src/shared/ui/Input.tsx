import React from 'react';
import { Text as RNText, TextInput, View, type KeyboardTypeOptions, type TextStyle } from 'react-native';
import { colors, fonts, radii, space } from '../theme/tokens';
import { Text } from './Text';

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  accessibilityLabel?: string;
}

// The forms primitive the 8 frozen ones didn't cover (auth + import both filed
// the gap). Token-styled, no per-screen StyleSheet; error text uses the danger
// token via the Text 'caption' role wrapped in a danger color at the boundary.
const base: TextStyle = {
  fontFamily: fonts.body,
  fontSize: 16,
  color: colors.ink,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.creamDeep,
  borderRadius: radii.card,
  paddingHorizontal: space[4],
  paddingVertical: space[3],
  minHeight: 48, // ≥44pt touch target
};

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  multiline,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  error,
  accessibilityLabel,
}: InputProps) {
  return (
    <View style={{ gap: space[1] }}>
      {label ? <Text role="caption">{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
        style={[
          base,
          multiline ? { minHeight: 96, textAlignVertical: 'top' } : null,
          error ? { borderColor: colors.danger } : null,
        ]}
      />
      {error ? (
        // Danger-colored caption — Text has no error role, so this one string
        // is styled from the danger token (not a hex) at the boundary.
        <RNText
          accessibilityLiveRegion="polite"
          style={{ fontSize: 13, lineHeight: 18, color: colors.danger }}
        >
          {error}
        </RNText>
      ) : null}
    </View>
  );
}
