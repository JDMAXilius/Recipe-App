import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { flags } from '@/shared/flags';
import { Button, TextLink } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
import { AuthInput } from './components/AuthInput';
import { AuthLegal, AuthScreenLayout } from './components/AuthScreenLayout';
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
  const passwordRef = useRef<TextInput>(null);

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
    <AuthScreenLayout title="Welcome back" error={error}>
      <SocialAuthButtons mode="sign-in" onError={setError} />
      <AuthInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        label="Email"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        label="Password"
        secure
        ref={passwordRef}
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
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
      <View style={{ marginTop: space[3] }}>
        <TextLink title="Forgot your password?" onPress={() => router.push('/(auth)/forgot-password')} />
        <TextLink
          title={flags.flowV2 ? 'New to Otto? Plan your week' : 'New to Otto? Create account'}
          // The rework starts with the questions; the account comes at Save your plan.
          onPress={() => router.push(flags.flowV2 ? '/welcome' : '/(auth)/sign-up')}
        />
      </View>
      <AuthLegal />
    </AuthScreenLayout>
  );
}
