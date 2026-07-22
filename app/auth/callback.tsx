import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/shared/ui';
import { useAuth } from '@/features/auth';

// OAuth/deep-link return: Supabase parses the session from the URL fragment;
// once authed we bounce to the tabs.
export default function AuthCallback() {
  const router = useRouter();
  const { session } = useAuth();
  useEffect(() => {
    if (session) router.replace('/(tabs)');
  }, [session, router]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text role="body">Signing you in…</Text>
    </View>
  );
}
