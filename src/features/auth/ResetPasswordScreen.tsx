import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { hasActiveSession, sessionFromUrl, updatePassword } from './auth.queries';
import { AuthInput } from './components/AuthInput';
import { AuthScreenLayout } from './components/AuthScreenLayout';

// Set a new password after following the emailed recovery link. Lives at the
// ROOT (not under (auth)) on purpose: the recovery link signs you in, and
// (auth) redirects signed-in users home — so from in there the form is
// unreachable.
const MIN_PASSWORD = 8;

export function ResetPasswordScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = still working out whether we have a recovery session
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Web already turned the URL into a session (detectSessionInUrl); native
      // has to do it here.
      if (Platform.OS !== 'web' && url) await sessionFromUrl(url);
      const ok = await hasActiveSession();
      if (!cancelled) setReady(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleSave = async () => {
    if (password.length < MIN_PASSWORD) {
      setError(`Passwords need at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that password — try again.");
    } finally {
      setLoading(false);
    }
  };

  if (ready === false) {
    return (
      <AuthScreenLayout
        title="That link has expired"
        subtitle="Recovery links only last an hour, and each one works once. Ask for a fresh one and you're back in."
        hero={false}
      >
        <Button
          title="Send a new link"
          onPress={() => router.replace('/(auth)/forgot-password')}
          variant="primary"
          size="lg"
        />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Set a new password"
      subtitle="Pick something you'll remember — Otto will keep you signed in afterwards."
      error={error}
      hero={false}
    >
      <AuthInput
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        label="New password"
        secure
        autoFocus
      />
      <View style={{ marginTop: space[2] }}>
        <Button
          title={loading ? 'Saving…' : 'Save new password'}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={loading}
          disabled={ready === null}
        />
      </View>
    </AuthScreenLayout>
  );
}
