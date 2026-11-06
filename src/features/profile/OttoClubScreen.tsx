import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, TextLink, OttoArt, useToast } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { useClub } from './club.purchases';
import { usePurchasePending } from './club.pending';
import { flags } from '@/shared/flags';
import { purchaseErrorMessage } from './club.logic';
import { useDeleteAccount } from './useDeleteAccount';
import { useAuth } from '@/features/auth';
import { track } from '@/shared/track';

// Otto Club paywall — a HARD paywall (Juan, 2026-10-04): a signed-in non-member
// can't use Otto without starting the trial, so there is no X and no "Not now".
// Lean on purpose, like Cal AI / ReciMe / Julienne (Mobbin research 2026-10-04):
// one headline, two plans, one button, one price line, small Restore/Terms/
// Privacy. Apple 3.1.2 needs the billed price, period, trial and those links —
// nothing more. Members (opened from Account) get a back button + Manage.
const TERMS_URL = 'https://ottosapp.com/terms';
const PRIVACY_URL = 'https://ottosapp.com/privacy';
const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

export function OttoClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const club = useClub();
  const pending = usePurchasePending();
  const { signOut } = useAuth();
  // Hard paywall: a non-member can't reach Account, so its exits live here
  // (Apple 5.1.1(v): in-app deletion for every account, subscribed or not).
  const del = useDeleteAccount(club.member);
  // Through the launch gate, which re-reads membership: replacing straight to
  // the tabs could beat the root guard's own membership update and bounce.
  const goHome = () => router.replace('/');
  const close = () => (router.canGoBack() ? router.back() : goHome());

  // A member with nowhere behind them was sent here by mistake (they only belong
  // here when opened from Account): take them into the app.
  useEffect(() => {
    if (club.member && !router.canGoBack()) router.replace('/');
  }, [club.member, router]);

  const yearly = club.yearly?.product;
  const monthly = club.monthly?.product;
  const trialDays = club.trialDays;
  const selected = plan === 'year' ? yearly : monthly;
  const perMonth = (price: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price);

  useEffect(() => track('paywall_viewed', { variant: 'generic' }), []);

  const onBuy = async () => {
    const pkg = plan === 'year' ? club.yearly : club.monthly;
    if (!pkg) return;
    const result = await club.buy(pkg);
    track('purchase_result', { product: pkg.product.identifier, result: typeof result === 'object' ? 'error' : result === 'ok' || result === 'pending' || result === 'unconfirmed' ? result : 'cancelled' });
    // R2.2: cancelled → stay, no message; error → a native alert ("nothing was
    // charged"); pending → the waiting screen; unconfirmed → the honest toast.
    if (result === 'ok') {
      if (flags.flowV2) router.replace('/club/welcome');
      else goHome();
    }
    else if (result === 'unconfirmed')
      show("Apple confirmed it, but it hasn't unlocked yet. Tap Restore.", 'info');
    else if (result === 'pending') {
      if (flags.flowV2) void pending.set(true).then(() => router.replace('/club/pending'));
      else show('Waiting for Apple to approve the purchase.', 'info');
    } else if (typeof result === 'object') {
      if (flags.flowV2) Alert.alert("That didn't go through", `${purchaseErrorMessage(result.error)} Nothing was charged.`);
      else show(purchaseErrorMessage(result.error), 'error');
    }
  };
  const onRestore = async () => {
    const result = await club.restore();
    // R2.3: ok → "Purchases restored" then Home; none → a native alert, stay.
    if (result === 'ok') {
      show('Purchases restored.', 'success');
      goHome();
    } else if (result === 'none') {
      if (flags.flowV2) Alert.alert('Nothing to restore', 'There’s no Otto Club on this Apple ID. If you joined with another one, sign in to it in Settings, then tap Restore.');
      else show('No Otto Club membership found on this Apple ID.', 'info');
    } else show(purchaseErrorMessage(result.error), 'error');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[4] },
        ]}
      >
        <View style={styles.topRow}>
          {club.member ? (
            <Pressable
              style={styles.closeBtn}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View />
          )}
          {!club.member ? (
            <TextLink title="Restore purchases" onPress={onRestore} />
          ) : null}
        </View>

        <View style={styles.hero}>
          <OttoArt name="floating" size={280} />
          {/* The subscription's name on the screen that sells it (Schedule 2:
              title, length, price, all before purchase). */}
          <Text role="meta">OTTO CLUB</Text>
          <Text role="display">{club.member ? "You're in the Club" : 'Cook more. Plan less.'}</Text>
          <Text role="caption">
            {club.member
              ? 'Every recipe, plan and question, unlimited.'
              : 'Unlimited imports, plans and Ask Otto.'}
          </Text>
        </View>

        {club.member ? (
          <Pressable onPress={() => Linking.openURL(MANAGE_URL)} accessibilityRole="link">
            <RNText style={styles.link}>Manage subscription</RNText>
          </Pressable>
        ) : !yearly || !monthly ? (
          <View style={styles.center}>
            {club.failed ? (
              <>
                <Text role="caption">Couldn&apos;t load plans. Check your connection.</Text>
                <Button title="Try again" variant="primary" onPress={club.reload} />
              </>
            ) : (
              <ActivityIndicator color={colors.terracotta} />
            )}
          </View>
        ) : (
          <View style={{ gap: space[3] }}>
            <PlanCard
              active={plan === 'year'}
              onPress={() => setPlan('year')}
              name="Yearly"
              detail={`${perMonth(yearly.price / 12, yearly.currencyCode)}/mo`}
              right={`${yearly.priceString}/yr`}
            />
            <PlanCard
              active={plan === 'month'}
              onPress={() => setPlan('month')}
              name="Monthly"
              right={`${monthly.priceString}/mo`}
            />

            {/* Apple 3.1.2(c), 1.0.21 rejection: "the billed amount is the most clear
                and conspicuous pricing element"; free trial and calculated (per-month)
                pricing must be "subordinate in position and size". So the billed
                amount leads, in bold ink, and the trial only appears in the fine print. */}
            <RNText style={styles.billed}>
              {`${selected?.priceString}/${plan === 'year' ? 'year' : 'month'}`}
            </RNText>
            <Button
              title={trialDays ? 'Start free trial' : 'Subscribe'}
              variant="primary"
              size="lg"
              onPress={onBuy}
              loading={club.purchasing}
            />
            <RNText style={styles.fine}>
              {trialDays
                ? `Free for ${trialDays} days, then billed ${selected?.priceString}/${plan === 'year' ? 'year' : 'month'}. Renews automatically. Cancel anytime.`
                : 'Renews automatically. Cancel anytime.'}
            </RNText>
            <View style={styles.legalRow}>
              <TextLink title="Terms" role="link" onPress={() => Linking.openURL(TERMS_URL)} />
              <RNText style={[styles.fine, { alignSelf: 'center' }]}>·</RNText>
              <TextLink title="Privacy" role="link" onPress={() => Linking.openURL(PRIVACY_URL)} />
            </View>
          </View>
        )}

        {!club.member ? (
          <View style={styles.legalRow}>
            <Pressable onPress={() => void signOut()} accessibilityRole="button" hitSlop={8}>
              <RNText style={styles.legal}>Sign out</RNText>
            </Pressable>
            <RNText style={styles.fine}>·</RNText>
            <Pressable
              onPress={del.onDelete}
              disabled={del.deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete my account"
              hitSlop={8}
            >
              <RNText style={styles.legal}>Delete account</RNText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PlanCard({
  active,
  onPress,
  name,
  detail,
  right,
}: {
  active: boolean;
  onPress: () => void;
  name: string;
  detail?: string;
  right: string;
}) {
  return (
    <Pressable
      style={[styles.plan, active && styles.planActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${name}, ${right}${detail ? `, ${detail}` : ''}`}
    >
      <Ionicons
        name={active ? 'radio-button-on' : 'ellipse-outline'}
        size={22}
        color={active ? colors.terracotta : colors.grayStrong}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.planName}>
          <Text role={active ? 'computed' : 'body'}>{name}</Text>
        </View>
        {detail ? <Text role="caption">{detail}</Text> : null}
      </View>
      <Text role="label">{right}</Text>
    </Pressable>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: colors.cream } as ViewStyle,
  scroll: { flexGrow: 1, padding: space[4], gap: space[5] } as ViewStyle,
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  } as ViewStyle,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  hero: { alignItems: 'center', gap: space[2] } as ViewStyle,
  center: { alignItems: 'center', gap: space[3], paddingVertical: space[5] } as ViewStyle,
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
    borderWidth: 2,
    borderColor: colors.white,
  } as ViewStyle,
  planActive: { borderColor: colors.terracotta } as ViewStyle,
  planName: { flexDirection: 'row', alignItems: 'center', gap: space[2] } as ViewStyle,
  billed: { ...type.title, color: colors.ink, textAlign: 'center' } as TextStyle,
  fine: { ...type.caption, color: colors.inkSoft, textAlign: 'center' } as TextStyle,
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[2],
  } as ViewStyle,
  legal: { ...type.caption, color: colors.inkSoft, textDecorationLine: 'underline' } as TextStyle,
  link: { ...type.body, fontWeight: '600', color: colors.terracotta, textAlign: 'center' } as TextStyle,
};
