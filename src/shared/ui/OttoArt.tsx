import React from 'react';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import {
  actionArt,
  ottoArt,
  sceneArt,
  type ActionName,
  type OttoName,
  type SceneName,
} from '../assets';

// Name union is the contract for what art the app can ask for; assets.ts owns the
// require()s. scene-*/action-* prefixes route to the scene/action registries.
export type OttoArtName =
  // mascot expressions
  | 'happy'
  | 'excited'
  | 'proud'
  | 'pleased'
  | 'sad'
  | 'sleepy'
  | 'thinking'
  | 'floating'
  | 'hero'
  | 'badge'
  // scenes
  | 'scene-cooking'
  | 'scene-empty'
  | 'scene-floating'
  | 'scene-loading'
  // cooking actions
  | 'action-bake'
  | 'action-chop'
  | 'action-cook'
  | 'action-mix'
  | 'action-pour'
  | 'action-saute'
  | 'action-season'
  | 'action-serve'
  | 'action-simmer'
  | 'action-wait';

export interface OttoArtProps {
  name: OttoArtName;
  size?: number;
  /**
   * A human sentence for the rare place where the art itself carries meaning
   * ("Otto asleep in an empty kitchen"). Leave it off — the default — and the
   * mascot is decorative: every call site today pairs it with real text, so
   * announcing it would only put furniture in front of the words.
   */
  label?: string;
}

function resolve(name: OttoArtName): ImageSourcePropType {
  if (name.startsWith('scene-')) return sceneArt[name.slice(6) as SceneName];
  if (name.startsWith('action-')) return actionArt[name.slice(7) as ActionName];
  return ottoArt[name as OttoName];
}

// Real painted art (contract §6). Static image — OttoIdle wraps this for the
// living/breathing mascot; every other site renders it plain.
// Decorative unless a caller says otherwise: an Image that isn't an
// accessibility element has no children to hide, so `accessible={false}` is the
// whole of it on both platforms — VoiceOver walks straight past to the text.
export function OttoArt({ name, size = 96, label }: OttoArtProps) {
  return (
    <Image
      source={resolve(name)}
      accessible={label != null}
      accessibilityLabel={label}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={200}
    />
  );
}
