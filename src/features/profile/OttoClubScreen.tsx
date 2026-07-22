import React, { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Text, Button, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { Screen } from './components/Frame';

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
  const { show } = useToast();
  const [plan, setPlan] = useState<'year' | 'month'>('year'); // annual preselected

  const now = new Date();
  const chargeDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TRIAL_DAYS);

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

  return (
    <Screen title="Otto Club">
      <View style={{ gap: space[5] }}>
        <Text role="body">One membership. Everything Otto can do.</Text>

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

        {/* Trial timeline — real computed dates */}
        <View style={{ gap: space[2] }}>
          <Text role="title">How your {TRIAL_DAYS} free days work</Text>
          <View style={styles.card}>
            <Text role="body">Today — everything unlocks. Cook away.</Text>
          </View>
          <View style={styles.card}>
            <Text role="body">
              {prettyDate(chargeDay)} — you&apos;d be charged{' '}
              {plan === 'year' ? `$${PRICE_YEAR} for the year` : `$${PRICE_MONTH} for the month`}.
              Cancel any time before — it takes two taps.
            </Text>
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

        {/* CTA — honest pre-IAP state */}
        <Button title="Otto Club opens soon" variant="primary" onPress={notifyMe} />
        <Text role="caption">Memberships aren&apos;t on sale yet — this is the menu, not the bill.</Text>

        {/* How do I cancel — answered inline, not a FAQ link */}
        <View style={styles.card}>
          <Text role="title">How do I cancel?</Text>
          <Text role="caption">
            Open Settings on your iPhone → tap your name → Subscriptions → Otto → Cancel. Do it any
            time before {prettyDate(chargeDay)} and you pay nothing. You keep access for all{' '}
            {TRIAL_DAYS} days either way.
          </Text>
        </View>
      </View>
    </Screen>
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
        <Text role={active ? 'computed' : 'body'}>{name}</Text>
        <View style={{ flex: 1 }} />
        {badge ? <Text role="computed">{badge}</Text> : null}
      </View>
      <Text role="caption">{math}</Text>
      <Text role="caption">{TRIAL_DAYS} days free first · Cancel anytime</Text>
    </Pressable>
  );
}

const styles: Record<string, ViewStyle> = {
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: space[4], gap: space[2] },
  benefitRow: { flexDirection: 'row', gap: space[2], alignItems: 'flex-start' },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: space[4],
    gap: space[1],
    borderWidth: 2,
    borderColor: colors.white,
  },
  planCardActive: { borderColor: colors.terracotta, backgroundColor: colors.creamDeep },
  planTop: { flexDirection: 'row', alignItems: 'center' },
};
