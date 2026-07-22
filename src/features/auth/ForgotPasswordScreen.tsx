import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
import { AuthInput } from './components/AuthInput';
import { AuthScreenLayout } from './components/AuthScreenLayout';

// "I forgot my password" — the way back in for password accounts. The emailed
// link lands on /reset-password (outside (auth) on purpose, see queries).
export function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Type the email you signed up with.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that just now — try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthScreenLayout
        title="Check your email"
        subtitle={`If there's an account for ${email.trim()}, Otto just sent it a link to set a new password. It expires in an hour.`}
      >
        <Button
          title="Back to sign in"
          onPress={() => router.replace('/(auth)/sign-in')}
          variant="primary"
          size="lg"
        />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Forgot your password?"
      subtitle="Happens to everyone. Otto will email you a link to set a new one."
      error={error}
    >
      <AuthInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        label="Email"
        keyboardType="email-address"
        autoFocus
      />
      <View style={{ marginTop: space[2] }}>
        <Button
          title={loading ? 'Sending…' : 'Send me a link'}
          onPress={handleSend}
          variant="primary"
          size="lg"
          loading={loading}
        />
      </View>
      <Pressable
        onPress={() => router.push('/(auth)/sign-in')}
        accessibilityRole="button"
        style={{ marginTop: space[4], alignItems: 'center' }}
      >
        <Text role="body">Remembered it? Sign in</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
