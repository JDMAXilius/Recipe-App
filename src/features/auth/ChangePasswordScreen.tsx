import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, useToast } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
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
      setError(err instanceof Error ? err.message : "Couldn't change it just now — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Change your password"
      subtitle="Otto asks for the current one first — so a borrowed phone can't lock you out of your own account."
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
      />
      <AuthInput
        value={next}
        onChangeText={setNext}
        placeholder="New password"
        label="New password"
        secure
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
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        style={{ marginTop: space[4], alignItems: 'center' }}
      >
        <Text role="computed">Never mind</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
