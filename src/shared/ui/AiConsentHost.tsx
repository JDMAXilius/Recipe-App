import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, space, type } from '../theme/tokens';
import { haptics } from '../haptics';
import { AI_CONSENT_COPY, onAiConsentRequest, setAiConsent } from '../aiConsent';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { useToast } from './Toast';

// The AI consent sheet (Guideline 5.1.2(i)). Mounted once at the root, like
// ToastHost: ensureAiConsent() asks, this shows the sheet, the answer resolves
// every caller waiting on it. One card, once — the Runna/Liven shape, not a
// legal wall — naming the company and the data, with a real "Not now".
export function AiConsentHost() {
  const waiting = useRef<((allowed: boolean) => void)[]>([]);
  const [visible, setVisible] = useState(false);
  const toast = useToast();

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
    // An explicit "Not now" says where the switch is, so the action that just
    // did nothing doesn't look broken.
    if (remember && !allowed) toast.show(AI_CONSENT_COPY.offToast, 'info');
  };

  return (
    <Sheet visible={visible} onClose={() => answer(false, false)} title={AI_CONSENT_COPY.title}>
      <View style={{ gap: space[3], marginBottom: space[5] }}>
        <Text role="body">{AI_CONSENT_COPY.lead}</Text>
        <View style={{ gap: space[1] }}>
          {AI_CONSENT_COPY.bullets.map((b) => (
            <Text key={b} role="body">
              {`•  ${b}`}
            </Text>
          ))}
        </View>
        <Text role="caption">{AI_CONSENT_COPY.caption}</Text>
      </View>
      <View style={{ gap: space[2] }}>
        <Button title={AI_CONSENT_COPY.allow} variant="primary" size="lg" onPress={() => answer(true, true)} />
        <Button title={AI_CONSENT_COPY.decline} variant="ghost" onPress={() => answer(false, true)} />
      </View>
      {/* Opening the policy is not an answer: the sheet stays up. */}
      <Pressable
        onPress={() => void WebBrowser.openBrowserAsync(AI_CONSENT_COPY.privacyUrl)}
        accessibilityRole="link"
        accessibilityLabel={AI_CONSENT_COPY.privacyLink}
        hitSlop={8}
        style={{ alignSelf: 'center', marginTop: space[2] }}
      >
        {/* Same treatment as the paywall's legal links (OttoClubScreen). */}
        <RNText style={{ ...type.caption, color: colors.inkSoft }}>
          {AI_CONSENT_COPY.privacyLead}{' '}
          <RNText style={{ textDecorationLine: 'underline' }}>{AI_CONSENT_COPY.privacyLink}</RNText>
        </RNText>
      </Pressable>
    </Sheet>
  );
}
