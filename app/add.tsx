import { useRouter } from 'expo-router';
import { AddSheet } from '@/features/import';

// "Bring in a recipe" — a pushed full screen (not a modal) with a back button;
// dismiss returns to wherever it was opened from (the chat import door, a
// cookbook empty state, etc.).
export default function AddRoute() {
  const router = useRouter();
  return <AddSheet onClose={() => router.back()} />;
}
