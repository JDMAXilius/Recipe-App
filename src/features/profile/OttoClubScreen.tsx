import React, { useState } from 'react';
import {
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
import { Text, OttoArt, useToast } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';

// Otto Club paywall — membership surface, FRONTEND ONLY (packet). Ship-honest
// pre-IAP state: purchases aren't live, so the CTA says "opens soon", there is
// NO Restore link (a dead one is a trust bug), no remind-me toggle (no trial
// exists yet), and the charge line stays conditional ("you'd be charged").
// Every date is computed from real "now" — never hardcoded. When StoreKit /
// RevenueCat lands: real CTA, Restore, and "you'd" → "you'll".
const PRICE_YEAR = 29.99;
const PRICE_MONTH = 4.99;
const TRIAL_DAYS = 5;

const prettyDate = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export function OttoClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const [plan, setPlan] = useState<'year' | 'month'>('year'); // annual preselected

  const now = new Date();
  const chargeDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TRIAL_DAYS);
  // reminder lands the day before the charge — "your trial ends tomorrow"
  const reminderDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TRIAL_DAYS - 1);

  const monthlyEquivalent = (PRICE_YEAR / 12).toFixed(2);
  const yearlyIfMonthly = (PRICE_MONTH * 12).toFixed(2);
  // savings computed ONLY against our own real monthly price — no fake anchors
  const savePct = Math.round((1 - PRICE_YEAR / (PRICE_MONTH * 12)) * 100);

  const notifyMe = () =>
    show("You're on the list — Otto will holler when the Club opens.", 'success');

  const BENEFITS = [
    'Unlimited saved recipes — your whole collection, no caps',
    'Import recipes from anywhere on the web',
    'Smart weekly plans and shopping lists',
    'Keeps the lights on — the Club is how Otto pays the cooks and the servers',
  ];

  const TIMELINE = [
    { date: `Today, ${prettyDate(now)}`, body: 'Everything unlocks. Cook away.' },
    {
      date: prettyDate(reminderDay),
      body: "We'll send you a reminder that your trial ends tomorrow.",
    },
    {
      date: prettyDate(chargeDay),
      body: `You'd be charged $${PRICE_YEAR} for the year. Cancel before then, pay nothing.`,
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
            <View key={b} style={styles.benefitRow}>
              <Text role="computed">✓</Text>
              <View style={{ flex: 1 }}>
                <Text role="body">{b}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Trial timeline — real computed dates, dotted connector */}
        <View style={{ gap: space[2] }}>
          <Text role="title">How your {TRIAL_DAYS} free days work</Text>
          <View>
            {TIMELINE.map((step, i) => (
              <View key={step.date} style={styles.timelineRow}>
                <View style={styles.rail}>
                  <View style={styles.dot} />
                  {i < TIMELINE.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.timelineBody}>
                  <RNText style={styles.stepDate}>{step.date}</RNText>
                  <Text role="caption">{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Price block — annual preselected, math shown both directions */}
        <View style={{ gap: space[2] }}>
          <PlanCard
            active={plan === 'year'}
            onPress={() => setPlan('year')}
            name={`Yearly — $${PRICE_YEAR}/year`}
            math={`$${monthlyEquivalent} a month. Save ${savePct}% vs monthly.`}
            badge={`SAVE ${savePct}%`}
          />
          <PlanCard
            active={plan === 'month'}
            onPress={() => setPlan('month')}
            name={`Monthly — $${PRICE_MONTH}/month`}
            math={`$${yearlyIfMonthly} a year if you stay all 12 months.`}
          />
        </View>

        <Text role="caption">
          No charge today. {TRIAL_DAYS} days free, then{' '}
          {plan === 'year' ? `$${PRICE_YEAR}/year` : `$${PRICE_MONTH}/month`} starting{' '}
          {prettyDate(chargeDay)}. That&apos;s the whole price — one tier, no add-ons.
        </Text>

        {/* Opens-soon banner + notify link (honest pre-IAP state, no primary CTA) */}
        <View style={styles.banner}>
          <View style={styles.bannerHead}>
            <Ionicons name="paw" size={16} color={colors.terracotta} />
            <Text role="label">Otto Club opens soon</Text>
          </View>
          <Text role="caption">
            Memberships aren&apos;t on sale yet — this is the menu, not the bill.
          </Text>
        </View>

        <Pressable
          onPress={notifyMe}
          accessibilityRole="button"
          accessibilityLabel="Notify me when Otto Club opens"
          style={styles.notify}
        >
          <RNText style={styles.notifyText}>Notify me when it opens</RNText>
        </Pressable>

        {/* How do I cancel — answered inline, not a FAQ link */}
        <View style={styles.card}>
          <Text role="title">How do I cancel?</Text>
          <Text role="caption">
            Open Settings on your iPhone → tap your name → Subscriptions → Otto → Cancel. Do it any
            time before {prettyDate(chargeDay)} and you pay nothing. You keep access for all{' '}
            {TRIAL_DAYS} days either way.
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
}: {
  active: boolean;
  onPress: () => void;
  name: string;
  math: string;
  badge?: string;
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
      <Text role="caption">{TRIAL_DAYS} days free first · Cancel anytime</Text>
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

  benefitRow: { flexDirection: 'row', gap: space[2], alignItems: 'flex-start' } as ViewStyle,

  timelineRow: { flexDirection: 'row', gap: space[3] } as ViewStyle,
  rail: { width: 12, alignItems: 'center' } as ViewStyle,
  dot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
    marginTop: 3,
  } as ViewStyle,
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
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: space[2],
    paddingVertical: 3,
  } as ViewStyle,
  badgeText: { ...type.meta, fontVariant: ['tabular-nums'], color: colors.white } as TextStyle,

  banner: {
    backgroundColor: colors.creamDeep,
    borderRadius: radii.card,
    padding: space[4],
    gap: space[2],
    alignItems: 'center',
  } as ViewStyle,
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] } as ViewStyle,

  notify: { alignItems: 'center' } as ViewStyle,
  notifyText: {
    ...type.body,
    fontWeight: '600',
    color: colors.terracotta,
    textDecorationLine: 'underline',
  } as TextStyle,
};
