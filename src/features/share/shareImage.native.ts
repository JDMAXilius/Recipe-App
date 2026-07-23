// Native share (ios/android — Metro resolves this over shareImage.ts). Snapshots
// the painted ShareCard (its forwardRef) to a PNG via react-native-view-shot and
// hands it to the OS share sheet via expo-sharing. Imports are STATIC, not
// `await import()`: Metro's async import of these native modules fails at runtime
// ("Requiring unknown module") on Hermes. Since this file is native-only, the
// static imports never reach the web bundle. Falls back to the text share if
// capture/sharing is unavailable.
import type { RefObject } from 'react';
import { Share, type View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { buildRecipeShareText } from './shareText';
import type { ShareRecipe } from './share.types';

export async function shareRecipeCard(
  cardRef: RefObject<View | null>,
  recipe: ShareRecipe,
  url?: string,
): Promise<void> {
  if (cardRef.current) {
    try {
      if (await Sharing.isAvailableAsync()) {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: recipe.title,
        });
        return;
      }
    } catch {
      // capture/sharing unavailable → fall through to the text share below
    }
  }
  await Share.share({ message: buildRecipeShareText(recipe, url) }).catch(() => {});
}
