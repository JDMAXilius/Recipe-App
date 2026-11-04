import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextLink } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { useAuth } from './AuthProvider';
import { AuthInput } from './components/AuthInput';
import { AuthLegal, AuthScreenLayout } from './components/AuthScreenLayout';
import { SocialAuthButtons } from './components/SocialAuthButtons';

const MIN_PASSWORD = 8; // same floor as change/reset password

// Sign-up — first contact. An anonymous guest upgrades IN PLACE (handled in
// auth.queries.signUp) so their imports/plans/saves keep their owner.
export function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);
  const passwordRef = useRef<TextInput>(null);

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
      if (await signUp(email, password)) setCheckInbox(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkInbox) {
    return (
      <AuthScreenLayout
        title="Check your email"
        subtitle={`Otto sent a link to ${email.trim()}. Tap it on this phone to finish creating your account.`}
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
    <AuthScreenLayout title="Create your account" error={error}>
      <SocialAuthButtons mode="sign-up" onError={setError} />
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
        placeholder={`Password (${MIN_PASSWORD}+ characters)`}
        label="Password"
        secure
        ref={passwordRef}
        textContentType="newPassword"
        autoComplete="new-password"
        passwordRules={`minlength: ${MIN_PASSWORD};`}
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
      />
      <View style={{ marginTop: space[2] }}>
        <Button
          title={loading ? 'Creating account…' : 'Create account'}
          onPress={handleSignUp}
          variant="primary"
          size="lg"
          loading={loading}
        />
      </View>
      <View style={{ marginTop: space[3] }}>
        <TextLink title="Already have an account? Sign in" onPress={() => router.push('/(auth)/sign-in')} />
      </View>
      <AuthLegal />
    </AuthScreenLayout>
  );
}
