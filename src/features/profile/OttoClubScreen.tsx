import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Button, Text, OttoArt, useToast } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { useClub } from './club.purchases';
import { useDeleteAccount } from './useDeleteAccount';
import { useAuth } from '@/features/auth';

// Otto Club paywall — a HARD paywall (Juan, 2026-10-04): a signed-in non-member
// can't use Otto without starting the trial, so there is no X and no "Not now".
// Lean on purpose, like Cal AI / ReciMe / Julienne (Mobbin research 2026-10-04):
// one headline, two plans, one button, one price line, small Restore/Terms/
// Privacy. Apple 3.1.2 needs the billed price, period, trial and those links —
// nothing more. Members (opened from Account) get a close button + Manage.
const TERMS_URL = 'https://ottosapp.com/terms';
const PRIVACY_URL = 'https://ottosapp.com/privacy';
const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

export function OttoClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const club = useClub();
  const { signOut } = useAuth();
  // Hard paywall: a non-member can't reach Account, so its exits live here
  // (Apple 5.1.1(v): in-app deletion for every account, subscribed or not).
  const del = useDeleteAccount(club.member);
  // Through the launch gate, which re-reads membership: replacing straight to
  // the tabs could beat the root guard's own membership update and bounce.
  const goHome = () => router.replace('/');
  const close = () => (router.canGoBack() ? router.back() : goHome());

  const yearly = club.yearly?.product;
  const monthly = club.monthly?.product;
  const trialDays = club.trialDays;
  const selected = plan === 'year' ? yearly : monthly;
  const savePct =
    yearly && monthly ? Math.round((1 - yearly.price / (monthly.price * 12)) * 100) : null;
  const perMonth = (price: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price);

  const onBuy = async () => {
    const pkg = plan === 'year' ? club.yearly : club.monthly;
    if (!pkg) return;
    const result = await club.buy(pkg);
    if (result === 'ok') goHome();
    else if (result === 'unconfirmed')
      show("Apple confirmed it, but it hasn't unlocked yet. Tap Restore.", 'info');
    else if (result === 'pending') show('Waiting for Apple to approve the purchase.', 'info');
    else if (typeof result === 'object')
      show(`The purchase didn't go through (${result.error}).`, 'error');
  };
  const onRestore = async () => {
    if (await club.restore()) goHome();
    else show('No Otto Club membership found on this Apple ID.', 'info');
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
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View />
          )}
          {!club.member ? (
            <Pressable onPress={onRestore} accessibilityRole="button" hitSlop={8}>
              <RNText style={styles.small}>Restore</RNText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.hero}>
          <OttoArt name="floating" size={200} />
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
              detail={`${yearly.priceString} / year`}
              right={`${perMonth(yearly.price / 12, yearly.currencyCode)}/mo`}
              badge={savePct ? `SAVE ${savePct}%` : undefined}
            />
            <PlanCard
              active={plan === 'month'}
              onPress={() => setPlan('month')}
              name="Monthly"
              right={`${monthly.priceString}/mo`}
            />

            {trialDays ? (
              <View style={styles.reassure}>
                <Ionicons name="checkmark" size={18} color={colors.ink} />
                <Text role="label">No payment due now</Text>
              </View>
            ) : null}

            <Button
              title={trialDays ? `Start my free ${trialDays === 7 ? 'week' : `${trialDays} days`}` : 'Continue'}
              variant="primary"
              size="lg"
              onPress={onBuy}
              loading={club.purchasing}
            />
            {/* Apple 3.1.2 / Schedule 2: the amount billed, the period, the trial
                and that it renews on its own — on this screen, before the tap. */}
            <RNText style={styles.fine}>
              {trialDays
                ? `${trialDays} days free, then ${selected?.priceString}/${plan === 'year' ? 'year' : 'month'}. Renews automatically. Cancel anytime.`
                : `${selected?.priceString}/${plan === 'year' ? 'year' : 'month'}. Renews automatically. Cancel anytime.`}
            </RNText>
            <View style={styles.legalRow}>
              <Pressable onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link">
                <RNText style={styles.legal}>Terms</RNText>
              </Pressable>
              <RNText style={styles.fine}>·</RNText>
              <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
                <RNText style={styles.legal}>Privacy</RNText>
              </Pressable>
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
  badge,
}: {
  active: boolean;
  onPress: () => void;
  name: string;
  detail?: string;
  right: string;
  badge?: string;
}) {
  return (
    <Pressable
      style={[styles.plan, active && styles.planActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${name}, ${detail ?? right}`}
    >
      <Ionicons
        name={active ? 'radio-button-on' : 'ellipse-outline'}
        size={22}
        color={active ? colors.terracotta : colors.gray}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.planName}>
          <Text role={active ? 'computed' : 'body'}>{name}</Text>
          {badge ? (
            <View style={styles.badge}>
              <RNText style={styles.badgeText}>{badge}</RNText>
            </View>
          ) : null}
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
  small: { ...type.caption, color: colors.inkSoft } as TextStyle,
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
  badge: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  } as ViewStyle,
  badgeText: { ...type.meta, fontVariant: ['tabular-nums'], color: colors.white } as TextStyle,
  reassure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  } as ViewStyle,
  fine: { ...type.caption, color: colors.inkSoft, textAlign: 'center' } as TextStyle,
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[2],
  } as ViewStyle,
  legal: { ...type.caption, color: colors.inkSoft, textDecorationLine: 'underline' } as TextStyle,
  link: { ...type.body, fontWeight: '600', color: colors.terracotta, textAlign: 'center' } as TextStyle,
};
