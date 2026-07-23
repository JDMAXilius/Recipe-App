import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
import { AuthInput } from './components/AuthInput';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { SocialAuthButtons } from './components/SocialAuthButtons';

// Sign-in — the everyday door. Inline errors (native Alert is invisible on web).
// On success AuthProvider picks up the session and the (auth) route guard sends
// the user home; this screen only reports failure.
export function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Fill in your email and password first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout title="Back to the kitchen?" subtitle="Otto kept your place." error={error}>
      <SocialAuthButtons mode="sign-in" onError={setError} />
      <AuthInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        label="Email"
        keyboardType="email-address"
      />
      <AuthInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        label="Password"
        secure
      />
      <View style={{ marginTop: space[2] }}>
        <Button
          title={loading ? 'Signing in…' : 'Sign in'}
          onPress={handleSignIn}
          variant="primary"
          size="lg"
          loading={loading}
        />
      </View>
      <Pressable
        onPress={() => router.push('/(auth)/forgot-password')}
        accessibilityRole="button"
        style={{ marginTop: space[4], alignItems: 'center' }}
      >
        <Text role="computed">Forgot your password?</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(auth)/sign-up')}
        accessibilityRole="button"
        style={{ marginTop: space[3], alignItems: 'center' }}
      >
        <Text role="body">New here? Pull up a stool</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
