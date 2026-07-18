// The shopping list, painted as a shareable card (see docs mockup): cream
// stock with a hairline border + soft drop shadow, a double rose frame, the
// notched "SHOPPING LIST" pennant with paw prints trailing off its shoulder,
// serif (Lora) throughout, aisle sections ruled in rose, and the italic Otto
// sign-off. Rendered off-screen and snapshotted by
// lib/shareCard.js#captureAndShareTallCard, so the share is this picture — not
// the plain-text dump the recipient used to get.
import { forwardRef, useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { SPACING } from "../constants/tokens";

const pawFilled = require("../assets/mascot/paw-filled.png");

const CARD_W = 440;

// Same grouping the text share uses (open items, by aisle, then extras) so the
// picture and the fallback text always agree.
function groupOpen({ items = [], custom = [], checked = {} }, aisleOrder) {
  const open = items.filter((i) => !checked[i.key]);
  const order = aisleOrder?.length ? aisleOrder : [...new Set(open.map((i) => i.aisle))];
  const sections = order
    .map((aisle) => ({ aisle, rows: open.filter((i) => i.aisle === aisle) }))
    .filter((s) => s.rows.length > 0);
  const extras = custom.filter((c) => !checked[c.key]);
  if (extras.length) {
    sections.push({ aisle: "Everything else", rows: extras });
  }
  return sections;
}

const ShoppingListShareCard = forwardRef(function ShoppingListShareCard(
  { state, aisles },
  ref
) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sections = groupOpen(state, aisles);
  if (!sections.length) return null;
  const count = sections.reduce((n, s) => n + s.rows.length, 0);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.frameOuter}>
        <View style={styles.frameInner}>
          {/* paw prints trailing off the banner's left shoulder */}
          <View style={styles.paws} pointerEvents="none">
            <Image source={pawFilled} style={[styles.paw, styles.paw1]} />
            <Image source={pawFilled} style={[styles.paw, styles.paw2]} />
            <Image source={pawFilled} style={[styles.paw, styles.paw3]} />
          </View>

          {/* notched pennant */}
          <View style={styles.bannerWrap}>
            <View style={styles.banner}>
              <Text style={styles.bannerText}>SHOPPING LIST</Text>
            </View>
            <View style={styles.notchRow}>
              <View style={styles.notchLeft} />
              <View style={styles.notchRight} />
            </View>
          </View>

          <Text style={styles.subtitle}>
            {count} {count === 1 ? "THING" : "THINGS"} TO PICK UP
          </Text>

          {sections.map((section) => (
            <View key={section.aisle} style={styles.section}>
              <Text style={styles.aisle}>{section.aisle.toUpperCase()}</Text>
              <View style={styles.aisleRule} />
              {section.rows.map((item) => (
                <View key={item.key} style={styles.rowWrap}>
                  <View style={styles.row}>
                    <View style={styles.bullet} />
                    <Text style={styles.itemText}>
                      {item.amount ? <Text style={styles.qty}>{item.amount} </Text> : null}
                      {item.name}
                      {item.sources?.length ? (
                        <Text style={styles.provenance}> — for {item.sources.join(", ")}</Text>
                      ) : null}
                    </Text>
                  </View>
                  <View style={styles.itemRule} />
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.footer}>Shared from Otto, the quieter kind of cookbook.</Text>
        </View>
      </View>
    </View>
  );
});

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      width: CARD_W,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      padding: SPACING.md,
      // soft drop shadow (bottom-right in the mockup)
      shadowColor: "#000",
      shadowOffset: { width: 2, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },
    frameOuter: {
      borderWidth: 1,
      borderColor: colors.accentSoft,
      borderRadius: 3,
      padding: 3,
    },
    frameInner: {
      borderWidth: 1,
      borderColor: colors.accentSoft,
      borderRadius: 2,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.lg,
    },
    // paw prints — rose-tinted, faint, trailing down-left
    paws: { position: "absolute", top: 0, left: 0, width: 90, height: 150 },
    paw: { position: "absolute", tintColor: colors.accentSoft, opacity: 0.85 },
    paw1: { width: 30, height: 30, top: 34, left: 30, transform: [{ rotate: "-8deg" }] },
    paw2: { width: 28, height: 28, top: 70, left: 6, transform: [{ rotate: "10deg" }] },
    paw3: { width: 32, height: 32, top: 110, left: 26, transform: [{ rotate: "-4deg" }] },

    bannerWrap: { alignItems: "center", marginTop: -SPACING.lg, marginBottom: SPACING.xs },
    banner: {
      backgroundColor: colors.ink,
      paddingHorizontal: SPACING.xl + SPACING.sm,
      paddingVertical: SPACING.sm + 4,
    },
    bannerText: {
      fontFamily: "Lora_700Bold",
      color: colors.background,
      fontSize: 20,
      letterSpacing: 5,
    },
    // downward chevron cut into the pennant's bottom edge
    notchRow: { flexDirection: "row" },
    notchLeft: {
      width: 0,
      height: 0,
      borderTopWidth: 12,
      borderTopColor: colors.ink,
      borderRightWidth: 118,
      borderRightColor: "transparent",
    },
    notchRight: {
      width: 0,
      height: 0,
      borderTopWidth: 12,
      borderTopColor: colors.ink,
      borderLeftWidth: 118,
      borderLeftColor: "transparent",
    },
    subtitle: {
      fontFamily: "Lora_400Regular",
      textAlign: "center",
      color: colors.inkSoft,
      fontSize: 14,
      letterSpacing: 4,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },

    section: { marginTop: SPACING.lg },
    aisle: {
      fontFamily: "Lora_700Bold",
      fontSize: 15,
      letterSpacing: 2,
      color: colors.ink,
    },
    aisleRule: {
      height: 1,
      backgroundColor: colors.accentSoft,
      marginTop: 7,
      marginBottom: SPACING.sm,
    },

    rowWrap: {},
    row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: SPACING.sm },
    bullet: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.inkSoft,
      marginTop: 9,
      marginRight: SPACING.md,
    },
    itemText: {
      flex: 1,
      fontFamily: "Lora_400Regular",
      fontSize: 17,
      lineHeight: 23,
      color: colors.ink,
    },
    qty: { fontFamily: "Lora_700Bold", color: colors.accent },
    provenance: { fontFamily: "Lora_400Regular", fontSize: 13.5, color: colors.inkSoft },
    itemRule: {
      height: 1,
      borderBottomWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.accentSoft,
      opacity: 0.8,
    },

    footer: {
      fontFamily: "Lora_400Regular_Italic",
      textAlign: "center",
      color: colors.inkSoft,
      fontSize: 15,
      marginTop: SPACING.xl,
      marginBottom: SPACING.xs,
    },
  });

export default ShoppingListShareCard;
