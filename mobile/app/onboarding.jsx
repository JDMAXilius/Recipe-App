import { useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, AccessibilityInfo } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";
import Bounceable from "../components/Bounceable";

// Onboarding — 3-screen painted showcase (ONBOARDING_BRIEF, ticket P10 §1).
// No quiz, no account wall, no "tailored for you": show, don't interrogate.
// Ends in Discover; the account ask comes later, at the first save.

const { width } = Dimensions.get("window");

const SCREENS = [
  {
    art: require("../assets/onboarding/onboarding-1-collect.png"),
    title: "Every recipe you love — in one place",
    body: "Import from any site or video, or write your own — Otto keeps them all together.",
    cta: "Continue",
  },
  {
    art: require("../assets/onboarding/onboarding-2-cook.png"),
    title: "Cook it right, every time",
    body: "Step-by-step cook mode, serving sizes that scale, and a nutrition estimate for every dish.",
    cta: "Continue",
  },
  {
    art: require("../assets/onboarding/onboarding-3-plan.png"),
    title: "Plan the week, shop in one tap",
    body: "Plan your meals and Otto builds the shopping list for you.",
    cta: "Start cooking",
  },
];

export const ONBOARDED_KEY = "otto.onboarded.v1";

const OnboardingScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scroller = useRef(null);
  const [page, setPage] = useState(0);

  const styles = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: colors.bg },
      skip: {
        position: "absolute",
        top: Math.max(insets.top, 8) + 6,
        right: SPACING.lg,
        zIndex: 2,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
      },
      skipText: { ...TYPE.label, color: colors.inkSoft },
      page: { width, flex: 1 },
      art: { width: "100%", flex: 1 },
      panel: { padding: SPACING.xl, paddingTop: SPACING.lg, gap: SPACING.md },
      title: { ...TYPE.display, fontSize: 26, lineHeight: 33, color: colors.ink },
      body: { ...TYPE.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
      dotsRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
      dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
      dotActive: { backgroundColor: colors.accent, width: 20 },
      cta: {
        height: 54,
        borderRadius: RADIUS.button,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
      },
      ctaText: { ...TYPE.body, fontWeight: "800", color: colors.white },
    }),
    [colors, insets.top]
  );

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDED_KEY, "1");
    } catch {}
    // Ticket P10: end ANONYMOUS in Discover; the account ask comes at first
    // save. Needs "Anonymous sign-ins" enabled in Supabase Auth settings —
    // until then this falls back to the sign-in stool.
    try {
      const { supabase } = await import("../lib/supabase");
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data?.session) {
        router.replace("/(tabs)");
        return;
      }
    } catch {}
    router.replace("/(auth)/sign-in");
  };

  const advance = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (page === SCREENS.length - 1) return finish();
    const next = page + 1;
    const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    scroller.current?.scrollTo({ x: next * width, animated: !reduce });
    setPage(next);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.skip}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip the introduction"
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SCREENS.map((screen) => (
          <View key={screen.title} style={styles.page}>
            <Image source={screen.art} style={styles.art} contentFit="contain" />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, SPACING.lg) + SPACING.md }]}>
        <View style={styles.dotsRow}>
          {SCREENS.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.title}>{SCREENS[page].title}</Text>
        <Text style={styles.body}>{SCREENS[page].body}</Text>
        <Bounceable
          style={styles.cta}
          onPress={advance}
          accessibilityRole="button"
          accessibilityLabel={SCREENS[page].cta}
        >
          <Text style={styles.ctaText}>{SCREENS[page].cta}</Text>
        </Bounceable>
      </View>
    </View>
  );
};
export default OnboardingScreen;
