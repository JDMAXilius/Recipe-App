import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { space } from '../theme/tokens';
import { haptics } from '../haptics';
import { AI_CONSENT_COPY, onAiConsentRequest, setAiConsent } from '../aiConsent';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

// The AI consent sheet (Guideline 5.1.2(i)). Mounted once at the root, like
// ToastHost: ensureAiConsent() asks, this shows the sheet, the answer resolves
// every caller waiting on it. One card, once — the Runna/Liven shape, not a
// legal wall — naming the company and the data, with a real "Not now".
export function AiConsentHost() {
  const waiting = useRef<((allowed: boolean) => void)[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(
    () =>
      onAiConsentRequest((resolve) => {
        waiting.current.push(resolve);
        setVisible(true);
      }),
    [],
  );

  // `remember` is false for a backdrop dismissal: closing the sheet is not a
  // decision, so nothing is stored and the next AI action simply asks again.
  const answer = async (allowed: boolean, remember: boolean) => {
    if (remember) await setAiConsent(allowed ? 'granted' : 'declined');
    haptics.select();
    setVisible(false);
    const resolvers = waiting.current;
    waiting.current = [];
    resolvers.forEach((r) => r(allowed));
  };

  return (
    <Sheet visible={visible} onClose={() => answer(false, false)} title={AI_CONSENT_COPY.title}>
      <View style={{ gap: space[3], marginBottom: space[5] }}>
        {AI_CONSENT_COPY.body.map((p) => (
          <Text key={p} role="body">
            {p}
          </Text>
        ))}
      </View>
      <View style={{ gap: space[2] }}>
        <Button title={AI_CONSENT_COPY.allow} variant="primary" size="lg" onPress={() => answer(true, true)} />
        <Button title={AI_CONSENT_COPY.decline} variant="ghost" onPress={() => answer(false, true)} />
      </View>
    </Sheet>
  );
}
