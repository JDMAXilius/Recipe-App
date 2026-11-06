import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextLink, useToast } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
import { authErrorMessage } from './authErrors';
import { AuthInput } from './components/AuthInput';
import { AuthScreenLayout } from './components/AuthScreenLayout';

// Change your password while signed in — separate from /reset-password (which
// serves people who FORGOT theirs and so can't be asked for it). Keeping them
// apart is what lets this one demand the current password. Verification of the
// current password happens in auth.queries.changePassword.
const MIN_PASSWORD = 8;

export function ChangePasswordScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!current) return setError('Enter your current password first.');
    if (next.length < MIN_PASSWORD) {
      return setError(`New password needs at least ${MIN_PASSWORD} characters.`);
    }
    if (next === current) return setError("That's the password you already have.");

    setError(null);
    setLoading(true);
    try {
      await changePassword(current, next);
      show('Password changed.', 'success');
      router.back();
    } catch (err) {
      setError(authErrorMessage(err, 'password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Change your password"
      subtitle="Otto asks for the current one first, so a borrowed phone can't lock you out of your own account."
      error={error}
      hero={false}
    >
      <AuthInput
        value={current}
        onChangeText={setCurrent}
        placeholder="Current password"
        label="Current password"
        secure
        autoFocus
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="next"
        onSubmitEditing={() => nextRef.current?.focus()}
      />
      <AuthInput
        value={next}
        onChangeText={setNext}
        placeholder="New password"
        label="New password"
        secure
        ref={nextRef}
        textContentType="newPassword"
        autoComplete="new-password"
        passwordRules={`minlength: ${MIN_PASSWORD};`}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      <View style={{ marginTop: space[2] }}>
        <Button
          title={loading ? 'Saving…' : 'Save new password'}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={loading}
        />
      </View>
      <View style={{ marginTop: space[3] }}>
        <TextLink title="Never mind" onPress={() => router.back()} />
      </View>
    </AuthScreenLayout>
  );
}
