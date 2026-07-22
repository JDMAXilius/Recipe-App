// Web / fallback share: the OS text share (buildRecipeShareText). The native
// image-capture variant lives in shareImage.native.ts, which Metro resolves on
// ios/android. Keeping the native modules (expo-sharing, react-native-view-shot)
// out of THIS file is what keeps them out of the web bundle — no runtime
// `await import()` needed (that form fails to resolve them on native anyway).
import type { RefObject } from 'react';
import { Share, type View } from 'react-native';
import { buildRecipeShareText } from './shareText';
import type { ShareRecipe } from './share.types';

export async function shareRecipeCard(
  _cardRef: RefObject<View | null>,
  recipe: ShareRecipe,
  url?: string,
): Promise<void> {
  await Share.share({ message: buildRecipeShareText(recipe, url) }).catch(() => {});
}
