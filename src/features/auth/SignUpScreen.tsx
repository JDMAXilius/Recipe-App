import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
import { AuthInput } from './components/AuthInput';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { SocialAuthButtons } from './components/SocialAuthButtons';

const MIN_PASSWORD = 6;

// Sign-up — first contact. An anonymous guest upgrades IN PLACE (handled in
// auth.queries.signUp) so their imports/plans/saves keep their owner.
export function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Fill in your email and password first.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Pull up a stool."
      subtitle="Save recipes, plan dinners — Otto remembers."
      error={error}
    >
      <SocialAuthButtons mode="sign-up" onError={setError} />
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
        placeholder="Password (6+ characters)"
        label="Password"
        secure
      />
      <View style={{ marginTop: space[2] }}>
        <Button
          title={loading ? 'Setting your place…' : "Join Otto's kitchen"}
          onPress={handleSignUp}
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
        <Text role="body">Already have an account? Sign in</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
