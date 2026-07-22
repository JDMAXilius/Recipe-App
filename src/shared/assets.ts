// Typed asset registry (contract: ui-components.md §4). The ONE place painted
// art is wired — components read from here, never `require()` at the call site.
// Ports the wired v1 subset (docs/V1_DESIGN_SPEC.md §6); dead sprite-sheets/
// dupes/tab-glyphs are deliberately not carried.
import type { ImageSourcePropType } from 'react-native';

export type OttoName =
  | 'happy'
  | 'thinking'
  | 'sad'
  | 'excited'
  | 'proud'
  | 'sleepy'
  | 'floating'
  | 'hero'
  | 'badge';
export type SceneName = 'cooking' | 'empty' | 'floating' | 'loading';
export type ActionName =
  | 'chop'
  | 'mix'
  | 'saute'
  | 'simmer'
  | 'bake'
  | 'wait'
  | 'season'
  | 'pour'
  | 'serve'
  | 'cook';

// '-cut' = matted cutout (used in-app over cream). hero/badge are framed.
export const ottoArt: Record<OttoName, ImageSourcePropType> = {
  happy: require('../../assets/mascot/otto-happy-cut.png'),
  thinking: require('../../assets/mascot/otto-thinking-cut.png'),
  sad: require('../../assets/mascot/otto-sad-cut.png'),
  excited: require('../../assets/mascot/otto-excited-cut.png'),
  proud: require('../../assets/mascot/otto-proud-cut.png'),
  sleepy: require('../../assets/mascot/otto-sleepy-cut.png'),
  floating: require('../../assets/mascot/otto-floating-cut.png'),
  hero: require('../../assets/mascot/otto-hero.png'),
  badge: require('../../assets/mascot/otto-badge.png'),
};

export const sceneArt: Record<SceneName, ImageSourcePropType> = {
  cooking: require('../../assets/mascot/otto-scene-cooking.png'),
  empty: require('../../assets/mascot/otto-scene-empty.png'),
  floating: require('../../assets/mascot/otto-scene-floating.png'),
  loading: require('../../assets/mascot/otto-scene-loading.png'),
};

export const actionArt: Record<ActionName, ImageSourcePropType> = {
  chop: require('../../assets/actions/otto-chop.png'),
  mix: require('../../assets/actions/otto-mix.png'),
  saute: require('../../assets/actions/otto-saute.png'),
  simmer: require('../../assets/actions/otto-simmer.png'),
  bake: require('../../assets/actions/otto-bake.png'),
  wait: require('../../assets/actions/otto-wait.png'),
  season: require('../../assets/actions/otto-season.png'),
  pour: require('../../assets/actions/otto-pour.png'),
  serve: require('../../assets/actions/otto-serve.png'),
  cook: require('../../assets/actions/otto-cook.png'),
};

// TheMealDB category → painted tile. Lowercased match; misc fallback.
const foodIcons: Record<string, ImageSourcePropType> = {
  beef: require('../../assets/food/cat-beef.webp'),
  breakfast: require('../../assets/food/cat-breakfast.webp'),
  chicken: require('../../assets/food/cat-chicken.webp'),
  dessert: require('../../assets/food/cat-dessert.webp'),
  goat: require('../../assets/food/cat-goat.webp'),
  lamb: require('../../assets/food/cat-lamb.webp'),
  miscellaneous: require('../../assets/food/cat-miscellaneous.webp'),
  pasta: require('../../assets/food/cat-pasta.webp'),
  pork: require('../../assets/food/cat-pork.webp'),
  seafood: require('../../assets/food/cat-seafood.webp'),
  side: require('../../assets/food/cat-side.webp'),
  starter: require('../../assets/food/cat-starter.webp'),
  vegan: require('../../assets/food/cat-vegan.webp'),
  vegetarian: require('../../assets/food/cat-vegetarian.webp'),
};
export const foodIcon = (category: string): ImageSourcePropType =>
  foodIcons[category?.toLowerCase().trim()] ?? foodIcons.miscellaneous;

export const onboardingArt: Record<'collect' | 'cook' | 'plan', ImageSourcePropType> = {
  collect: require('../../assets/onboarding/onboarding-1-collect.png'),
  cook: require('../../assets/onboarding/onboarding-2-cook.png'),
  plan: require('../../assets/onboarding/onboarding-3-plan.png'),
};

export const splashArt: ImageSourcePropType = require('../../assets/splash/otto-splash.webp');

// Apple + Facebook render as glyphs; only Google needs a raster mark.
export const brandMark: Record<'google', ImageSourcePropType> = {
  google: require('../../assets/brands/google-g.png'),
};

export const paw = {
  filled: require('../../assets/mascot/paw-filled.png') as ImageSourcePropType,
  outline: require('../../assets/mascot/paw-outline.png') as ImageSourcePropType,
};

// Player dep (expo-audio) lands with cook (P3); the source require is here now.
export const alarmSound = require('../../assets/sounds/timer-alarm.wav');
