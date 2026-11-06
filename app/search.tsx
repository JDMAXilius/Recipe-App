import { useRouter } from 'expo-router';
import { SearchScreen } from '@/features/recipes';
import { setOttoAsk } from '@/features/import';
import { openOtto } from '@/shared/flags';

// Search (R3.3, flowV2). Nothing found → the words go to Otto's composer
// (the editor's one-slot hand-off, consumed on focus) and the chat opens.
export default function Search() {
  const router = useRouter();
  return (
    <SearchScreen
      onAskOtto={(q) => {
        setOttoAsk(`Write me a recipe for ${q}`);
        openOtto(router);
      }}
    />
  );
}
