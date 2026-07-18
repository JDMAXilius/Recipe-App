// The shopping list, painted as a shareable card (mirrors app/shopping.jsx's
// pad): black "SHOPPING LIST" banner, rose double-frame, aisle sections, and
// the Otto sign-off. Rendered off-screen and snapshotted by
// lib/shareCard.js#captureAndShareTallCard so the share is a picture of the
// list — not the plain-text dump the recipient used to get.
import { forwardRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";
import { SPACING } from "../constants/tokens";

const pawFilled = require("../assets/mascot/paw-filled.png");

const CARD_W = 380;

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
    sections.push({ aisle: "Extras", rows: extras.map((e) => ({ ...e, name: e.name })) });
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

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.frame}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>SHOPPING LIST</Text>
        </View>

        {sections.map((section) => (
          <View key={section.aisle} style={styles.section}>
            <Text style={styles.aisle}>{section.aisle.toUpperCase()}</Text>
            <View style={styles.rule} />
            {section.rows.map((item) => (
              <View key={item.key} style={styles.row}>
                <View style={styles.circle} />
                <View style={styles.rowBody}>
                  <Text style={styles.itemName}>
                    {item.amount ? <Text style={styles.qty}>{item.amount} </Text> : null}
                    {item.name}
                  </Text>
                  {item.sources?.length ? (
                    <Text style={styles.provenance}>for {item.sources.join(" · ")}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Image source={pawFilled} style={styles.paw} contentFit="contain" />
          <Text style={styles.footerText}>Otto — the quieter kind of cookbook</Text>
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
      padding: SPACING.md,
    },
    frame: {
      borderWidth: 1.5,
      borderColor: colors.accentSoft,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.lg,
    },
    banner: {
      alignSelf: "center",
      marginTop: -1, // sit the flag on the frame's top edge
      backgroundColor: colors.ink,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + 2,
      marginBottom: SPACING.md,
    },
    bannerText: {
      color: colors.background,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 3,
    },
    section: { marginTop: SPACING.md },
    aisle: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 2,
      color: colors.ink,
    },
    rule: {
      height: 1,
      backgroundColor: colors.accentSoft,
      marginTop: 6,
      marginBottom: SPACING.sm,
    },
    row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 6 },
    circle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: colors.accent,
      marginTop: 2,
      marginRight: SPACING.sm,
    },
    rowBody: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: "600", color: colors.ink },
    qty: { fontWeight: "700", color: colors.accent, fontVariant: ["tabular-nums"] },
    provenance: { fontSize: 12, color: colors.inkSoft, marginTop: 1 },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginTop: SPACING.lg,
    },
    paw: { width: 18, height: 18 },
    footerText: { fontSize: 12, color: colors.inkSoft },
  });

export default ShoppingListShareCard;
