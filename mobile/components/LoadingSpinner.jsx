import { useMemo } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LoadingSpinner({ message = "Loading...", size = "large" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      backgroundColor: colors.background,
    },
    content: {
      alignItems: "center",
      gap: 16,
    },
    message: {
      fontSize: 16,
      color: colors.textLight,
      textAlign: "center",
    },
  });
