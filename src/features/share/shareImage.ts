// The runtime share action for the painted ShareCard. Captures the card (via its
// forwardRef → react-native-view-shot `captureRef`) to a PNG and hands it to the
// OS share sheet through expo-sharing. Both are native modules → they only run in
// a dev build; the imports are lazy + Platform-guarded so the web bundle never
// pulls them in at runtime. Web (and any device where capture/sharing is
// unavailable) falls back to the honest text share (buildRecipeShareText).
import type { RefObject } from 'react';
import { Platform, Share, type View } from 'react-native';
import { buildRecipeShareText } from './shareText';
import type { ShareRecipe } from './share.types';

export async function shareRecipeCard(
  cardRef: RefObject<View | null>,
  recipe: ShareRecipe,
  url?: string,
): Promise<void> {
  if (Platform.OS !== 'web' && cardRef.current) {
    try {
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        const { captureRef } = await import('react-native-view-shot');
        const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: recipe.title,
        });
        return;
      }
    } catch {
      // Capture/sharing unavailable → fall through to the text share below.
    }
  }
  await Share.share({ message: buildRecipeShareText(recipe, url) }).catch(() => {});
}
