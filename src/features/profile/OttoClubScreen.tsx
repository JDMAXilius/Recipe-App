import React, { useState } from 'react';
import {
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

// Otto Club paywall. Three states, decided by RevenueCat at runtime:
//  · member  — already subscribed: thank-you card + manage link, no sell.
//  · live    — offerings loaded: real prices/trial from the store, purchase +
//              Restore + the Terms/Privacy links App Review requires.
//  · fallback — offerings unavailable (products not configured, offline):
//              the honest "opens soon" state below. No dead buy buttons.
// Every date is computed from real "now" — never hardcoded. The constants are
// display placeholders for the fallback only; live mode prices come from the
// store.
const PRICE_YEAR = 29.99;
const PRICE_MONTH = 4.99;
const TRIAL_DAYS = 5;
const TERMS_URL = 'https://ottosapp.com/terms';
const PRIVACY_URL = 'https://ottosapp.com/privacy';
const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

const prettyDate = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export function OttoClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const [plan, setPlan] = useState<'year' | 'month'>('year'); // annual preselected
  const club = useClub();

  // Live mode reads price/trial from the store; fallback keeps the placeholders.
  // In live mode the trial is ONLY what the store's intro offer says — if the
  // product has no free trial we must not advertise one (trust + App Review).
  const priceYear = club.yearly?.product.price ?? PRICE_YEAR;
  const priceMonth = club.monthly?.product.price ?? PRICE_MONTH;
  const priceYearText = club.yearly?.product.priceString ?? `$${PRICE_YEAR}`;
  const priceMonthText = club.monthly?.product.priceString ?? `$${PRICE_MONTH}`;
  const trialDays = club.live ? club.trialDays : TRIAL_DAYS;
  const hasTrial = trialDays != null;

  const now = new Date();
  const chargeDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (trialDays ?? 0));
  // reminder lands the day before the charge — "your trial ends tomorrow"
  const reminderDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (trialDays ?? 0) - 1,
  );

  const monthlyEquivalent = (priceYear / 12).toFixed(2);
  const yearlyIfMonthly = (priceMonth * 12).toFixed(2);
  // savings computed ONLY against our own real monthly price — no fake anchors
  const savePct = Math.round((1 - priceYear / (priceMonth * 12)) * 100);

  const notifyMe = () =>
    show("You're on the list — Otto will holler when the Club opens.", 'success');

  const selectedPkg = plan === 'year' ? club.yearly : club.monthly;
  const onBuy = async () => {
    if (!selectedPkg) return;
    const result = await club.buy(selectedPkg);
    if (result === 'ok') show('Welcome to the Club — everything is unlocked.', 'success');
    else if (result === 'error')
      show("The purchase didn't go through. You weren't charged.", 'error');
    // cancelled: user closed the sheet on purpose, no toast nagging
  };
  const onRestore = async () => {
    const restored = await club.restore();
    show(
      restored ? 'Membership restored — welcome back.' : 'No membership found on this Apple ID.',
      restored ? 'success' : 'info',
    );
  };

  const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'bookmark', text: 'Unlimited saved recipes — your whole collection, no caps' },
    { icon: 'link', text: 'Import recipes from anywhere on the web' },
    { icon: 'calendar', text: 'Smart weekly plans and shopping lists' },
    { icon: 'paw', text: 'Keeps the lights on — the Club is how Otto pays the cooks and the servers' },
  ];

  const TIMELINE: { icon: keyof typeof Ionicons.glyphMap; date: string; body: string }[] = [
    { icon: 'lock-open', date: `Today, ${prettyDate(now)}`, body: 'Everything unlocks. Cook away.' },
    {
      icon: 'notifications',
      date: prettyDate(reminderDay),
      body: "We'll send you a reminder that your trial ends tomorrow.",
    },
    {
      icon: 'star',
      date: prettyDate(chargeDay),
      body: `${club.live ? "You'll" : "You'd"} be charged ${
        plan === 'year' ? `${priceYearText} for the year` : `${priceMonthText} for the month`
      }. Cancel before then, pay nothing.`,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space[2] }]}>
        {/* X-close — circular, top-right (no nav bar) */}
        <View style={styles.closeRow}>
          <Pressable
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {/* Floating Otto — the otter lying back, eating */}
        <OttoArt name="floating" size={220} />

        {/* In-content title + subtitle */}
        <View style={{ gap: space[1] }}>
          <Text role="display">Otto Club</Text>
          <Text role="caption">One membership. Everything Otto can do.</Text>
        </View>

        {/* Benefits */}
        <View style={{ gap: space[2] }}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.benefitTile}>
                <Ionicons name={b.icon} size={20} color={colors.terracotta} />
              </View>
              <View style={{ flex: 1 }}>
                <Text role="body">{b.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Trial timeline — real computed dates, dotted connector. Hidden when
            the live product carries no free trial: promising one is a trust bug. */}
        {hasTrial ? (
        <View style={{ gap: space[2] }}>
          <Text role="title">How your {trialDays} free days work</Text>
          <View>
            {TIMELINE.map((step, i) => {
              const isCharge = i === TIMELINE.length - 1;
              return (
                <View key={step.date} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={[styles.node, isCharge && styles.nodeSoft]}>
                      <Ionicons
                        name={step.icon}
                        size={15}
                        color={isCharge ? colors.terracotta : colors.white}
                      />
                    </View>
                    {i < TIMELINE.length - 1 ? <View style={styles.line} /> : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <RNText style={styles.stepDate}>{step.date}</RNText>
                    <Text role="caption">{step.body}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        ) : null}

        {/* Price block — annual preselected, math shown both directions */}
        <View style={{ gap: space[2] }}>
          <PlanCard
            active={plan === 'year'}
            onPress={() => setPlan('year')}
            name={`Yearly — ${priceYearText}/year`}
            math={`$${monthlyEquivalent} a month. Save ${savePct}% vs monthly.`}
            badge={`SAVE ${savePct}%`}
            note={hasTrial ? `${trialDays} days free first · Cancel anytime` : 'Cancel anytime'}
          />
          <PlanCard
            active={plan === 'month'}
            onPress={() => setPlan('month')}
            name={`Monthly — ${priceMonthText}/month`}
            math={`$${yearlyIfMonthly} a year if you stay all 12 months.`}
            note={hasTrial ? `${trialDays} days free first · Cancel anytime` : 'Cancel anytime'}
          />
        </View>

        <Text role="caption">
          {hasTrial
            ? `No charge today. ${trialDays} days free, then ${
                plan === 'year' ? `${priceYearText}/year` : `${priceMonthText}/month`
              } starting ${prettyDate(chargeDay)}. That's the whole price — one tier, no add-ons.`
            : `${
                plan === 'year' ? `${priceYearText}/year` : `${priceMonthText}/month`
              }, billed through your Apple ID. That's the whole price — one tier, no add-ons.`}
        </Text>

        {club.member ? (
          /* Already in — no sell, just thanks + where to manage */
          <View style={{ gap: space[2], alignItems: 'center' }}>
            <View style={styles.banner}>
              <View style={styles.bannerHead}>
                <Ionicons name="paw" size={16} color={colors.terracotta} />
                <Text role="label">You&apos;re in the Club</Text>
              </View>
            </View>
            <Pressable
              onPress={() => Linking.openURL(MANAGE_URL)}
              accessibilityRole="link"
              accessibilityLabel="Manage subscription"
              style={styles.notify}
            >
              <RNText style={styles.notifyText}>Manage subscription</RNText>
            </Pressable>
          </View>
        ) : club.live ? (
          /* Live store — real purchase, Restore, and the links App Review requires */
          <View style={{ gap: space[3] }}>
            <Button
              title={hasTrial ? `Start my ${trialDays} free days` : 'Join Otto Club'}
              variant="primary"
              onPress={onBuy}
              loading={club.purchasing}
            />
            <Pressable
              onPress={onRestore}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              style={styles.notify}
            >
              <RNText style={styles.notifyText}>Restore purchases</RNText>
            </Pressable>
            <View style={styles.legalRow}>
              <Pressable onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link">
                <RNText style={styles.legalLink}>Terms of Service</RNText>
              </Pressable>
              <RNText style={styles.legalDot}>·</RNText>
              <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
                <RNText style={styles.legalLink}>Privacy Policy</RNText>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Fallback — store unavailable, stay honest (no dead buy button) */
          <View style={{ gap: space[2], alignItems: 'center' }}>
            <View style={styles.banner}>
              <View style={styles.bannerHead}>
                <Ionicons name="time-outline" size={16} color={colors.terracotta} />
                <Text role="label">Otto Club opens soon</Text>
              </View>
            </View>
            <RNText style={styles.bannerNote}>
              Memberships aren&apos;t on sale yet — this is the menu, not the bill.
            </RNText>
            <Pressable
              onPress={notifyMe}
              accessibilityRole="button"
              accessibilityLabel="Notify me when Otto Club opens"
              style={styles.notify}
            >
              <RNText style={styles.notifyText}>Notify me when it opens</RNText>
            </Pressable>
          </View>
        )}

        {/* How do I cancel — answered inline, not a FAQ link */}
        <View style={styles.card}>
          <Text role="title">How do I cancel?</Text>
          <Text role="caption">
            {hasTrial
              ? `Open Settings on your iPhone → tap your name → Subscriptions → Otto → Cancel. Do it any time before ${prettyDate(chargeDay)} and you pay nothing. You keep access for all ${trialDays} days either way.`
              : 'Open Settings on your iPhone → tap your name → Subscriptions → Otto → Cancel. You keep access until the end of the period you already paid for.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PlanCard({
  active,
  onPress,
  name,
  math,
  badge,
  note,
}: {
  active: boolean;
  onPress: () => void;
  name: string;
  math: string;
  badge?: string;
  note: string;
}) {
  return (
    <Pressable
      style={[styles.planCard, active && styles.planCardActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={name}
    >
      <View style={styles.planTop}>
        <Ionicons
          name={active ? 'radio-button-on' : 'ellipse-outline'}
          size={22}
          color={active ? colors.terracotta : colors.gray}
        />
        <Text role={active ? 'computed' : 'body'}>{name}</Text>
        <View style={{ flex: 1 }} />
        {badge ? (
          <View style={styles.badge}>
            <RNText style={styles.badgeText}>{badge}</RNText>
          </View>
        ) : null}
      </View>
      <Text role="caption">{math}</Text>
      <Text role="caption">{note}</Text>
    </Pressable>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: colors.cream } as ViewStyle,
  scroll: { padding: space[4], paddingBottom: space[7], gap: space[5] } as ViewStyle,

  closeRow: { flexDirection: 'row', justifyContent: 'flex-end' } as ViewStyle,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  benefitRow: { flexDirection: 'row', gap: space[3], alignItems: 'center' } as ViewStyle,
  benefitTile: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  timelineRow: { flexDirection: 'row', gap: space[3] } as ViewStyle,
  rail: { width: 30, alignItems: 'center' } as ViewStyle,
  node: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  nodeSoft: { backgroundColor: colors.accentSoft } as ViewStyle,
  line: { flex: 1, width: 2, backgroundColor: colors.accentSoft, marginTop: 2 } as ViewStyle,
  timelineBody: { flex: 1, paddingBottom: space[4], gap: 2 } as ViewStyle,
  stepDate: { ...type.body, fontWeight: '700', color: colors.ink } as TextStyle,

  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
    gap: space[2],
  } as ViewStyle,

  planCard: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
    gap: space[1],
    borderWidth: 2,
    borderColor: colors.white,
  } as ViewStyle,
  planCardActive: { borderColor: colors.terracotta, backgroundColor: colors.creamDeep } as ViewStyle,
  planTop: { flexDirection: 'row', alignItems: 'center', gap: space[2] } as ViewStyle,
  badge: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
    paddingHorizontal: space[2],
    paddingVertical: 3,
  } as ViewStyle,
  badgeText: { ...type.meta, fontVariant: ['tabular-nums'], color: colors.white } as TextStyle,

  banner: {
    alignSelf: 'stretch',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.card,
    padding: space[4],
    alignItems: 'center',
  } as ViewStyle,
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] } as ViewStyle,
  bannerNote: {
    ...type.meta,
    fontVariant: ['tabular-nums'],
    color: colors.inkSoft,
    textAlign: 'center',
  } as TextStyle,

  notify: { alignItems: 'center' } as ViewStyle,
  notifyText: {
    ...type.body,
    fontWeight: '600',
    color: colors.terracotta,
  } as TextStyle,

  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space[2],
  } as ViewStyle,
  legalLink: {
    ...type.meta,
    fontVariant: ['tabular-nums'],
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  } as TextStyle,
  legalDot: { ...type.meta, fontVariant: ['tabular-nums'], color: colors.inkSoft } as TextStyle,
};
