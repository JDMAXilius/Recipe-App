import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AddSheet } from '@/features/import';

// The add sheet mounted as a modal route; dismiss returns to the previous tab.
export default function AddRoute() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <AddSheet visible onClose={() => router.back()} />
    </View>
  );
}
