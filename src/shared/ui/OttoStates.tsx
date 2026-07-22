import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { space } from '../theme/tokens';
import { Button } from './Button';
import { OttoArt } from './OttoArt';
import { OttoIdle } from './OttoIdle';
import { Text } from './Text';

// Cold-start loader (spec §5): breathing Sleepy Otto + a rotating cooking tip
// (2600ms, the six v1 tips). Routine fetches don't use this.
const TIPS = [
  'Salt your pasta water like the sea.',
  'Rest meat as long as you seared it.',
  'Read the whole recipe before the pan gets hot.',
  'Taste as you go — Otto always does.',
  'Sharp knives are safer than dull ones.',
  'Mise en place: chop first, cook calm.',
];

export interface OttoLoadingProps {
  message?: string;
  tips?: string[];
}

export function OttoLoading({ message = 'Warming up the kitchen…', tips = TIPS }: OttoLoadingProps) {
  const [i, setI] = useState(() => Math.floor(Math.random() * (tips.length || 1)));
  useEffect(() => {
    if (tips.length <= 1) return;
    const id = setInterval(() => setI((n) => (n + 1) % tips.length), 2600);
    return () => clearInterval(id);
  }, [tips.length]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6] }}>
      <View style={{ marginBottom: space[5] }}>
        <OttoIdle name="sleepy" size={180} />
      </View>
      <View style={{ marginBottom: space[2] }}>
        <Text role="caption">{message}</Text>
      </View>
      {tips.length > 0 && <Text role="body">{tips[i]}</Text>}
    </View>
  );
}

export interface OttoErrorProps {
  message?: string;
  onRetry?: () => void;
}

// Otto takes the blame; recovery action when one is given. Static (no breathe).
export function OttoError({ message = 'We dropped the pan.', onRetry }: OttoErrorProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6] }}>
      <View style={{ marginBottom: space[5] }}>
        <OttoArt name="sad" size={180} />
      </View>
      <View style={{ marginBottom: space[4] }}>
        <Text role="title">{message}</Text>
      </View>
      {onRetry && <Button title="Try again" variant="primary" size="lg" onPress={onRetry} />}
    </View>
  );
}
