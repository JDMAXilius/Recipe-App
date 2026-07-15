import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { createClubStyles } from "../assets/styles/club.styles";
import Bounceable from "../components/Bounceable";

// Otto Club paywall (Mobbin paywall study, 2026-07-15 — Blinkist dated
// timeline + CREME both-directions price math + Kitchen Stories painted
// benefits + inline how-do-I-cancel). SHIP-HONEST PRE-IAP STATE: purchases
// aren't live, so the CTA says so ("opens soon"), there is NO Restore link
// (a dead one is a trust bug), no remind-me toggle (no trial exists yet),
// and the charge line stays conditional ("you'd be charged"). When
// StoreKit/RevenueCat lands: real CTA, Restore, remind-me toggle wired to a
// local notification, and "you'd" → "you'll".
// Founder dials (placeholder prices from OTTO_V2_ROADMAP §6):
const PRICE_YEAR = 29.99;
const PRICE_MONTH = 4.99;
const TRIAL_DAYS = 5;

const BENEFITS = [
  { icon: "bookmark", text: "Unlimited saved recipes — your whole collection, no caps" },
  { icon: "link", text: "Import recipes from anywhere on the web" },
  { icon: "calendar", text: "Smart weekly plans and shopping lists" },
  { icon: "paw", text: "Keeps the lights on — the Club is how Otto pays the cooks and the servers" },
];

const prettyDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

const OttoClubScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createClubStyles(colors), [colors]);
  const [plan, setPlan] = useState("year"); // annual preselected

  // Every date on this screen is computed from real "now" — never hardcoded.
  const now = new Date();
  const remindDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TRIAL_DAYS - 1);
  const chargeDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TRIAL_DAYS);

  const monthlyEquivalent = (PRICE_YEAR / 12).toFixed(2);
  const yearlyIfMonthly = (PRICE_MONTH * 12).toFixed(2);
  // savings computed ONLY against our own real monthly price — no anchors, ever
  const savePct = Math.round((1 - PRICE_YEAR / (PRICE_MONTH * 12)) * 100);
  const chargeAmount = plan === "year" ? `$${PRICE_YEAR} for the year` : `$${PRICE_MONTH} for the month`;

  const notifyMe = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await AsyncStorage.setItem("otto.clubWaitlist", new Date().toISOString());
    } catch {}
    show({ message: "You're on the list — Otto will holler when the Club opens." });
  };

  const pickPlan = (next) => {
    if (next === plan) return;
    Haptics.selectionAsync().catch(() => {});
    setPlan(next);
  };

  const TIMELINE = [
    {
      icon: "lock-open",
      when: `Today, ${now.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`,
      text: "Everything unlocks. Cook away.",
      soft: false,
    },
    {
      icon: "notifications",
      when: prettyDate(remindDay),
      text: "We'd send you a reminder that your trial ends tomorrow.",
      soft: false,
    },
    {
      icon: "star",
      when: prettyDate(chargeDay),
      text: `You'd be charged ${chargeAmount}. Cancel any time before — it takes two taps.`,
      soft: true,
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.closeButton, { top: Math.max(insets.top, 8) + 8 }]}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={22} color={colors.ink} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}>
        {/* Hero — the floating-Otto painting, full width at its own ratio */}
        <View style={styles.heroBand}>
          <Image
            source={require("../assets/mascot/otto-scene-floating.png")}
            style={styles.heroArt}
            contentFit="cover"
          />
        </View>

        <View style={styles.body}>
          <View>
            <Text style={styles.title}>Otto Club</Text>
            <Text style={styles.subtitle}>One membership. Everything Otto can do.</Text>
          </View>

          {/* Benefits — four painted rows, above the fold */}
          <View style={{ gap: 14 }}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.icon} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon} size={16} color={colors.accent} />
                </View>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          {/* Timeline — real computed dates; rail fades after the charge node */}
          <View>
            <Text style={styles.sectionTitle}>How your {TRIAL_DAYS} free days work</Text>
            <View style={{ height: 12 }} />
            <View style={styles.timeline}>
              {TIMELINE.map((node, index) => (
                <View key={node.icon} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={[styles.timelineNode, node.soft && styles.timelineNodeSoft]}>
                      <Ionicons
                        name={node.icon}
                        size={15}
                        color={node.soft ? colors.accent : colors.white}
                      />
                    </View>
                    {index < TIMELINE.length - 1 && (
                      <View
                        style={[styles.timelineLine, index >= 1 && styles.timelineLineFade]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineWhen}>{node.when}</Text>
                    <Text style={styles.timelineText}>{node.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Price block — annual preselected, math shown in BOTH directions */}
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[styles.planCard, plan === "year" && styles.planCardActive]}
              onPress={() => pickPlan("year")}
              accessibilityRole="radio"
              accessibilityState={{ checked: plan === "year" }}
              accessibilityLabel={`Yearly, $${PRICE_YEAR} per year`}
            >
              <View style={styles.planTopRow}>
                <View style={[styles.planRadio, plan === "year" && styles.planRadioActive]} />
                <Text style={styles.planName}>Yearly — ${PRICE_YEAR}/year</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>SAVE {savePct}%</Text>
                </View>
              </View>
              <Text style={styles.planMath}>
                ${monthlyEquivalent} a month. Save {savePct}% vs monthly.
              </Text>
              <Text style={styles.planTerms}>{TRIAL_DAYS} days free first · Cancel anytime</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, plan === "month" && styles.planCardActive]}
              onPress={() => pickPlan("month")}
              accessibilityRole="radio"
              accessibilityState={{ checked: plan === "month" }}
              accessibilityLabel={`Monthly, $${PRICE_MONTH} per month`}
            >
              <View style={styles.planTopRow}>
                <View style={[styles.planRadio, plan === "month" && styles.planRadioActive]} />
                <Text style={styles.planName}>Monthly — ${PRICE_MONTH}/month</Text>
              </View>
              <Text style={styles.planMath}>
                ${yearlyIfMonthly} a year if you stay all 12 months.
              </Text>
              <Text style={styles.planTerms}>{TRIAL_DAYS} days free first · Cancel anytime</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.truthLine}>
            No charge today. {TRIAL_DAYS} days free, then{" "}
            {plan === "year" ? `$${PRICE_YEAR}/year` : `$${PRICE_MONTH}/month`} starting{" "}
            {prettyDate(chargeDay)}. That's the whole price — one tier, no add-ons.
          </Text>

          {/* CTA — honest pre-IAP state; becomes "Start my 5 free days" with StoreKit */}
          <Bounceable
            style={styles.cta}
            onPress={notifyMe}
            accessibilityRole="button"
            accessibilityLabel="Otto Club opens soon — notify me"
          >
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={styles.ctaText}>Otto Club opens soon</Text>
          </Bounceable>
          <Text style={styles.ctaSub}>Memberships aren't on sale yet — this is the menu, not the bill.</Text>
          <TouchableOpacity onPress={notifyMe} accessibilityRole="button" accessibilityLabel="Notify me when it opens">
            <Text style={styles.notifyLink}>Notify me when it opens</Text>
          </TouchableOpacity>

          {/* How do I cancel — answered inline, not a FAQ link */}
          <View style={styles.cancelCard}>
            <Text style={styles.cancelTitle}>How do I cancel?</Text>
            <Text style={styles.cancelBody}>
              Open Settings on your iPhone → tap your name → Subscriptions → Otto → Cancel. Do it
              any time before {prettyDate(chargeDay)} and you pay nothing. You keep access for all{" "}
              {TRIAL_DAYS} days either way.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
export default OttoClubScreen;
