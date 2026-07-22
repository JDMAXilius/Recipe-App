import React from 'react';
import { TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';

// shared/ui has no text-input primitive (the 8 frozen primitives don't cover
// forms — same gap the auth feature flagged), so the editor styles a plain RN
// TextInput straight from tokens: no hardcoded colors, no per-screen style file.
export interface RecipeInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  label?: string;
  accessibilityLabel: string;
  multiline?: boolean;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'url';
}

const field: TextStyle = {
  backgroundColor: colors.creamDeep,
  borderRadius: radii.card,
  paddingHorizontal: space[4],
  paddingVertical: space[3],
  minHeight: 48,
  fontSize: 16,
  color: colors.ink,
};

const labelWrap: ViewStyle = { marginBottom: space[2], marginTop: space[4] };

export function RecipeInput({
  value,
  onChangeText,
  placeholder,
  label,
  accessibilityLabel,
  multiline = false,
  autoFocus = false,
  keyboardType = 'default',
}: RecipeInputProps) {
  return (
    <View>
      {label != null && (
        <View style={labelWrap}>
          <Text role="caption">{label}</Text>
        </View>
      )}
      <TextInput
        style={[field, multiline ? { minHeight: 88, textAlignVertical: 'top' } : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        multiline={multiline}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        autoCorrect={keyboardType !== 'url'}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}
