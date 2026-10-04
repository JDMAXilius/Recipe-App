import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Text } from '@/shared/ui';
import { sessionFromUrl, useAuth } from '@/features/auth';

// Deep-link return for OAuth and the sign-up confirmation email: turn the link's
// ?code= (PKCE) or #tokens into a session, then hand off to the launch gate,
// which sends a new account to onboarding and everyone else home.
export default function AuthCallback() {
  const router = useRouter();
  const { session } = useAuth();
  const url = Linking.useURL();
  useEffect(() => {
    if (!session && url && Platform.OS !== 'web') void sessionFromUrl(url);
  }, [session, url]);
  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text role="body">Signing you in…</Text>
    </View>
  );
}
