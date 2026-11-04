import React, { useState } from 'react';
import {
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radii, space } from '@/shared/theme/tokens';

// shared/ui has no text-input primitive (the 8 frozen primitives don't cover
// forms), so the auth forms style a plain RN TextInput straight from tokens —
// no hardcoded colors, no per-screen style file. See report-back gaps: an
// `Input` primitive would be the tidier home for this if ui-systems adds one.
// Autofill (Passwords app / strong-password suggestion) and the return-key
// focus chain pass straight through to the TextInput (HIG 39 · Text fields).
type PassThrough = Pick<
  TextInputProps,
  'textContentType' | 'autoComplete' | 'passwordRules' | 'returnKeyType' | 'onSubmitEditing'
>;

export interface AuthInputProps extends PassThrough {
  ref?: React.Ref<TextInput>;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  label: string;
  secure?: boolean;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address';
}

const wrap: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.creamDeep,
  borderRadius: radii.card,
  paddingHorizontal: space[4],
  minHeight: 52,
  marginBottom: space[3],
};

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  label,
  secure = false,
  autoFocus = false,
  keyboardType = 'default',
  ref,
  ...pass
}: AuthInputProps) {
  const [reveal, setReveal] = useState(false);
  return (
    <View style={wrap}>
      <TextInput
        ref={ref}
        {...pass}
        submitBehavior={pass.returnKeyType === 'next' ? 'submit' : undefined}
        style={{ flex: 1, fontSize: 16, color: colors.ink, paddingVertical: space[3] }}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !reveal}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        accessibilityLabel={label}
      />
      {secure && (
        <Pressable
          onPress={() => setReveal((r) => !r)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
          style={{ paddingLeft: space[3], minHeight: 44, justifyContent: 'center' }}
        >
          <RNText style={{ color: colors.terracotta, fontSize: 14, fontWeight: '600' }}>
            {reveal ? 'Hide' : 'Show'}
          </RNText>
        </Pressable>
      )}
    </View>
  );
}
