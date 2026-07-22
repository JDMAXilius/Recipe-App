import React from 'react';
import { Text as RNText, View } from 'react-native';
import { colors, radii } from '../theme/tokens';

// Catalog typed from v1 asset usage (mobile/assets/mascot + mobile/assets/actions,
// read-only reference). Art assets don't exist in the v2 tree yet — this renders
// a labeled placeholder so layouts can be built and screenshotted now, and the
// name union stays the contract when the painted assets port in.
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

export function OttoArt({ name, size = 96 }: OttoArtProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Otto illustration: ${name}`}
      style={{
        width: size,
        height: size,
        borderRadius: radii.card,
        backgroundColor: colors.creamDeep,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.inkSoft,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <RNText
        style={{ fontSize: 11, color: colors.inkSoft, textAlign: 'center' }}
        numberOfLines={2}
      >
        otto:{name}
      </RNText>
    </View>
  );
}
