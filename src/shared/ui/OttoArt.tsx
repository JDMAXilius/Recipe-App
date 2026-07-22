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
}

function resolve(name: OttoArtName): ImageSourcePropType {
  if (name.startsWith('scene-')) return sceneArt[name.slice(6) as SceneName];
  if (name.startsWith('action-')) return actionArt[name.slice(7) as ActionName];
  return ottoArt[name as OttoName];
}

// Real painted art (contract §6). Static image — OttoIdle wraps this for the
// living/breathing mascot; every other site renders it plain.
export function OttoArt({ name, size = 96 }: OttoArtProps) {
  return (
    <Image
      source={resolve(name)}
      accessible
      accessibilityLabel={`Otto illustration: ${name}`}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={200}
    />
  );
}
