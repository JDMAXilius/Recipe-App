// S1 — the painted share card. Rendered off-screen (mounted, positioned out
// of the viewport — capture needs real layout) and snapshotted by
// lib/shareCard.js. 4:5 portrait; photo, serif title, honest meta, and the
// two fixed lines: attribution (immutable) and the Otto sign-off (the paw is
// Otto's mark — this card IS an Otto artifact, so it stays).
import { forwardRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS } from "../constants/tokens";

const pawFilled = require("../assets/mascot/paw-filled.png");

const CARD_W = 360;
const CARD_H = 450;

const ShareCard = forwardRef(function ShareCard({ recipe }, ref) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!recipe) return null;

  const ingredients = recipe.ingredientPairs?.length ?? recipe.ingredients?.length ?? 0;
  const steps = recipe.instructions?.length ?? 0;
  const meta = [
    ingredients ? `${ingredients} ingredients` : null,
    steps ? `${steps} steps` : null,
    recipe.servings ? `serves ${recipe.servings}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {recipe.image ? (
        <Image source={{ uri: recipe.image }} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={[styles.photo, styles.photoEmpty]} />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={3}>
          {recipe.title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {recipe.source === "imported" && recipe.sourceName ? (
          <Text style={styles.attribution} numberOfLines={1}>
            From {recipe.sourceName}
          </Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Image source={pawFilled} style={styles.paw} contentFit="contain" />
        <Text style={styles.footerText}>Otto — the quieter kind of cookbook</Text>
      </View>
    </View>
  );
});

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      width: CARD_W,
      height: CARD_H,
      backgroundColor: colors.background,
      padding: SPACING.lg,
      justifyContent: "flex-start",
    },
    photo: {
      width: CARD_W - SPACING.lg * 2,
      height: 210,
      borderRadius: RADIUS.card,
      backgroundColor: colors.surfaceWarm,
    },
    photoEmpty: { height: 90 },
    body: { flex: 1, paddingTop: SPACING.md },
    title: {
      fontFamily: "Lora_700Bold",
      fontSize: 26,
      lineHeight: 32,
      color: colors.ink,
    },
    meta: {
      marginTop: SPACING.xs,
      fontSize: 14,
      color: colors.accent,
    },
    attribution: {
      marginTop: SPACING.xs,
      fontSize: 13,
      color: colors.inkSoft,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    paw: { width: 20, height: 20 },
    footerText: { fontSize: 12, color: colors.inkSoft },
  });

export default ShareCard;
