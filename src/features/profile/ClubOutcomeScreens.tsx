// What follows the paywall (R2.2, R2.4, R2.6): waiting for approval, you're
// all set, and Otto Club ended. One file: three short screens that share a
// layout. Reached from the launch (resolveLaunch) and from the paywall.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, OttoArt, Text, useToast, type OttoArtName } from '@/shared/ui';
import { colors, space } from '@/shared/theme/tokens';
import { usePlan, tonightEntry } from '@/features/planner';
import { useClub, useMembership } from './club.purchases';
import { purchaseErrorMessage } from './club.logic';
import { usePurchasePending } from './club.pending';

function Outcome({ art, title, body, children }: { art: OttoArtName; title: string; body: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + space[6], paddingBottom: insets.bottom + space[4], paddingHorizontal: space[6], justifyContent: 'space-between' }}>
      <View style={{ gap: space[4] }}>
        <View style={{ alignItems: 'center' }}>
          <OttoArt name={art} size={200} />
        </View>
        <Text role="display">{title}</Text>
        <Text role="body">{body}</Text>
      </View>
      <View style={{ gap: space[2] }}>{children}</View>
    </View>
  );
}

/** Ask to Buy: the purchase waits for a parent's approval. Opens on its own
 *  when the entitlement arrives. */
export function ClubPendingScreen() {
  const router = useRouter();
  const { state } = useMembership();
  const { set } = usePurchasePending();
  const club = useClub();
  const { show } = useToast();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (state !== 'member') return;
    void set(false).then(() => router.replace('/club/welcome'));
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = async () => {
    setChecking(true);
    const r = await club.restore();
    setChecking(false);
    if (r === 'none') show('Still waiting for approval.', 'info');
    else if (typeof r === 'object') show(purchaseErrorMessage(r.error), 'error');
  };

  return (
    <Outcome art="thinking" title="Waiting for approval" body="Your request is with the family organiser. Otto opens on its own once they say yes.">
      <Button title="Check again" variant="primary" size="lg" loading={checking} onPress={check} />
      <Button title="Choose another way" variant="ghost" onPress={() => void set(false).then(() => router.replace('/otto-club'))} />
    </Outcome>
  );
}

/** Right after the purchase: what's waiting, then the reminders ask (R2.5),
 *  the only place the app asks for it. */
export function ClubWelcomeScreen({ onRemind }: { onRemind: () => Promise<void> }) {
  const router = useRouter();
  const { entries, days } = usePlan();
  const tonight = tonightEntry(entries, days[0].key);
  const [asked, setAsked] = useState(false);
  const enter = () => router.replace('/');

  if (!asked) {
    return (
      <Outcome
        art="happy"
        title="You’re all set"
        body={tonight ? `Tonight is ${tonight.title}, and your shopping list is ready.` : 'Your week and your shopping list are ready.'}
      >
        <Button title="Continue" variant="primary" size="lg" onPress={() => setAsked(true)} />
      </Outcome>
    );
  }
  return (
    <Outcome art="scene-cooking" title="A nudge at dinnertime?" body="Otto can remind you what’s for dinner each evening. You can change this in Account any time.">
      <Button title="Remind me" variant="primary" size="lg" onPress={() => void onRemind().finally(enter)} />
      <Button title="Not now" variant="ghost" onPress={enter} />
    </Outcome>
  );
}

/** Was a member, isn't now. Nothing is deleted (ADR-0005). */
export function ClubEndedScreen() {
  const router = useRouter();
  return (
    <Outcome art="sleepy" title="Everything is still here" body="Your recipes, plans and lists are saved. Rejoin Otto Club to pick up where you left off.">
      <Button title="Rejoin Otto Club" variant="primary" size="lg" onPress={() => router.push('/otto-club')} />
    </Outcome>
  );
}
