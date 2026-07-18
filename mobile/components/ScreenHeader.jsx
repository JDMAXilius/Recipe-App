import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";

// One header for every pushed screen (shopping, household, preferences,
// reminders, faq, add, journal…) so the back/close button, its 44×44
// surfaceWarm circle, the title, and the padding never drift screen to
// screen again. Right side is a slot; when empty it's a 44px spacer that
// keeps the title centered against the left button.
//
//   <ScreenHeader title="Reminders" onBack={() => router.back()} />
//   <ScreenHeader leftIcon="close" onClose={close} right={<Save/>} />
export default function ScreenHeader({
  title,
  onBack,
  leftIcon = "arrow-back",
  leftLabel = "Back",
  right = null,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={leftLabel}
        >
          <Ionicons name={leftIcon} size={22} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}

      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceWarm,
    },
    spacer: { width: 44, height: 44 },
    title: {
      ...TYPE.title,
      color: colors.ink,
    },
  });
