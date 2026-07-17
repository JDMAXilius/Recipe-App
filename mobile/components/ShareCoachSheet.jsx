import { useMemo } from "react";
import { View, Text, Modal, Pressable, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";

// The share-to-Otto coach — one sheet, no carousel (the 5-screen Kitchen
// Stories walkthrough boiled down to its two real jobs: motivate, then show
// the one thing to tap). Honest/gated: `live` is true only once the share
// extension ships (the iOS rebuild), so the CTA promises "Try it" then and
// "coming with the next update" until then — never teaching a button that
// isn't real yet.
export default function ShareCoachSheet({ visible, onClose, live = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />

          <Image
            source={require("../assets/mascot/otto-excited-cut.png")}
            style={styles.otto}
            resizeMode="contain"
          />
          <Text style={styles.title}>Save it straight from the app you saw it in</Text>
          <Text style={styles.subtitle}>
            A recipe on TikTok or Instagram lands in your cookbook without leaving the post.
          </Text>

          {/* A tiny mock of the iOS share sheet — Otto is the one to tap.
              Rendered, not an image, so it's always on-brand and crisp. */}
          <View style={styles.shareSheet}>
            <View style={styles.shareGrabber} />
            <View style={styles.appsRow}>
              {["share-social", "chatbubble", "mail"].map((icon) => (
                <View key={icon} style={styles.appCol}>
                  <View style={styles.appIconMuted}>
                    <Ionicons name={`${icon}-outline`} size={20} color={colors.inkSoft} />
                  </View>
                </View>
              ))}
              <View style={styles.appCol}>
                <View style={styles.ottoRing}>
                  <Image
                    source={require("../assets/mascot/otto-happy-cut.png")}
                    style={styles.ottoChip}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.ottoChipLabel}>Otto</Text>
              </View>
            </View>
          </View>

          {/* the whole flow in one honest line */}
          <View style={styles.steps}>
            <Text style={styles.stepText}>
              <Text style={styles.stepMark}>1  </Text>Tap <Text style={styles.stepStrong}>Share</Text> on the post
            </Text>
            <Text style={styles.stepText}>
              <Text style={styles.stepMark}>2  </Text>Pick <Text style={styles.stepStrong}>Otto</Text>
            </Text>
            <Text style={styles.stepText}>
              <Text style={styles.stepMark}>3  </Text>Check Otto&apos;s work and save
            </Text>
          </View>

          {live ? (
            <TouchableOpacity
              style={styles.cta}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Got it"
            >
              <Text style={styles.ctaText}>Got it</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.soonRow}>
                <Ionicons name="time-outline" size={15} color={colors.inkSoft} />
                <Text style={styles.soonText}>Rolling out with the next update</Text>
              </View>
              <TouchableOpacity
                style={[styles.cta, styles.ctaQuiet]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.ctaQuietText}>Meanwhile, paste a link above</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: "rgba(42,33,27,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: RADIUS.sheet,
      borderTopRightRadius: RADIUS.sheet,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xxl + SPACING.md,
      alignItems: "center",
    },
    grabber: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: SPACING.md,
    },
    otto: {
      width: 96,
      height: 96,
      marginBottom: SPACING.xs,
    },
    title: {
      ...TYPE.title,
      color: colors.ink,
      textAlign: "center",
    },
    subtitle: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
      marginTop: SPACING.xs,
      marginBottom: SPACING.lg,
      paddingHorizontal: SPACING.sm,
    },
    shareSheet: {
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.lg,
    },
    shareGrabber: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: SPACING.md,
    },
    appsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "flex-start",
    },
    appCol: {
      alignItems: "center",
      gap: 4,
    },
    appIconMuted: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.7,
    },
    ottoRing: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.card,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
      borderWidth: 2.5,
      borderColor: colors.accent,
    },
    ottoChip: {
      width: 40,
      height: 40,
    },
    ottoChipLabel: {
      ...TYPE.label,
      fontSize: 12,
      color: colors.accent,
    },
    steps: {
      alignSelf: "stretch",
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
      paddingHorizontal: SPACING.sm,
    },
    stepText: {
      ...TYPE.body,
      color: colors.ink,
    },
    stepMark: {
      ...TYPE.body,
      fontWeight: "800",
      color: colors.accent,
    },
    stepStrong: {
      fontWeight: "700",
      color: colors.ink,
    },
    cta: {
      alignSelf: "stretch",
      backgroundColor: colors.accent,
      borderRadius: RADIUS.button,
      paddingVertical: SPACING.md,
      alignItems: "center",
    },
    ctaText: {
      ...TYPE.label,
      color: colors.white,
    },
    ctaQuiet: {
      backgroundColor: "transparent",
    },
    ctaQuietText: {
      ...TYPE.label,
      color: colors.inkSoft,
    },
    soonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: SPACING.xs,
    },
    soonText: {
      ...TYPE.body,
      fontSize: 13,
      color: colors.inkSoft,
    },
  });
