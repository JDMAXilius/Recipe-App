import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MealAPI } from "../services/mealAPI";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE, OVERLAY } from "../constants/tokens";

// FilterSheet — one-to-one with the Figma DS component (page "FilterSheet"):
// grab handle · chip groups · footer with Clear all + live-count CTA
// (Beli/eBay/Vivino pattern) · sheet radius on top corners · impactLight on
// open. Deviation from the Figma spec, documented there too: the SORT group is
// omitted — TheMealDB has no popularity/time/kcal data to sort honestly.
export default function FilterSheet({
  visible,
  onClose,
  categories,
  initialCategory,
  initialArea,
  onApply,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [areas, setAreas] = useState([]);
  const [category, setCategory] = useState(initialCategory || null);
  const [area, setArea] = useState(initialArea || null);
  const [count, setCount] = useState(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCategory(initialCategory || null);
      setArea(initialArea || null);
      if (areas.length === 0) {
        MealAPI.listAreas().then(setAreas);
      }
    }
  }, [visible]);

  // Live result count (the Figma CTA shows "Show N recipes")
  useEffect(() => {
    if (!visible) return;
    if (!category && !area) {
      setCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setCounting(true);
      try {
        let n = 0;
        if (category && area) {
          const [byCat, byArea] = await Promise.all([
            MealAPI.filterByCategory(category),
            MealAPI.filterByArea(area),
          ]);
          const ids = new Set(byArea.map((m) => m.idMeal));
          n = byCat.filter((m) => ids.has(m.idMeal)).length;
        } else if (category) {
          n = (await MealAPI.filterByCategory(category)).length;
        } else {
          n = (await MealAPI.filterByArea(area)).length;
        }
        if (!cancelled) setCount(n);
      } catch {
        if (!cancelled) setCount(null);
      } finally {
        if (!cancelled) setCounting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, category, area]);

  const pick = (setter, current, value) => {
    Haptics.selectionAsync().catch(() => {});
    setter(current === value ? null : value);
  };

  const clearAll = () => {
    Haptics.selectionAsync().catch(() => {});
    setCategory(null);
    setArea(null);
  };

  const Chip = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters</Text>

        <ScrollView style={styles.groups} showsVerticalScrollIndicator={false}>
          <Text style={styles.groupLabel}>Category</Text>
          <View style={styles.chipWrap}>
            {categories.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={category === c}
                onPress={() => pick(setCategory, category, c)}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>Cuisine</Text>
          <View style={styles.chipWrap}>
            {areas.map((a) => (
              <Chip key={a} label={a} selected={area === a} onPress={() => pick(setArea, area, a)} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={clearAll} accessibilityRole="button">
            <Text style={styles.clearAll}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.showButton}
            onPress={() => onApply(category, area)}
            accessibilityRole="button"
          >
            <Text style={styles.showButtonText}>
              {counting
                ? "Counting…"
                : count !== null
                  ? `Show ${count} ${count === 1 ? "recipe" : "recipes"}`
                  : "Show recipes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: OVERLAY.scrim,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.sheet,
      borderTopRightRadius: RADIUS.sheet,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
      maxHeight: "80%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.border,
      marginTop: SPACING.sm,
      marginBottom: SPACING.md,
    },
    title: {
      ...TYPE.title,
      color: colors.ink,
      marginBottom: SPACING.md,
    },
    groups: {
      flexGrow: 0,
    },
    groupLabel: {
      ...TYPE.caption,
      color: colors.inkSoft,
      marginBottom: SPACING.sm,
      marginTop: SPACING.sm,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    chip: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm + 2,
    },
    chipSelected: {
      backgroundColor: colors.accent,
    },
    chipText: {
      ...TYPE.label,
      color: colors.ink,
    },
    chipTextSelected: {
      color: colors.white,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: SPACING.lg,
    },
    clearAll: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.accent,
    },
    showButton: {
      flex: 1,
      height: 52,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    showButtonText: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.white,
    },
  });
