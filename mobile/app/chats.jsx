import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";
import { loadChats } from "../lib/chatHistory";
import { groupChats, summarize, whenLabel } from "../lib/chatSummary";
import OttoIdle from "../components/OttoIdle";
import ScreenHeader from "../components/ScreenHeader";

// Recent chats (Figma 200:24) — reached from the clock in the ＋ tab header.
// Read-only list: tapping a row reopens that thread in the chat so it can be
// picked back up. Everything here is on-device (lib/chatHistory.js).
const ChatsScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [chats, setChats] = useState(null); // null = still loading

  useFocusEffect(
    useCallback(() => {
      loadChats().then(setChats).catch(() => setChats([]));
    }, [])
  );

  const groups = useMemo(() => groupChats(chats || []), [chats]);

  return (
    <View style={styles.container}>
      <ScreenHeader leftIcon="close" leftLabel="Close" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recent chats</Text>
        <Text style={styles.subtitle}>Otto keeps the last 30 days. Tap one to pick it back up.</Text>

        {chats && chats.length === 0 ? (
          <View style={styles.empty}>
            <OttoIdle
              source={require("../assets/mascot/otto-sleepy-cut.png")}
              style={styles.emptyOtto}
            />
            <Text style={styles.emptyText}>
              Nothing here yet.{"\n"}Ask Otto for a recipe and it&apos;ll show up.
            </Text>
          </View>
        ) : null}

        {groups.map((g) => (
          <View key={g.label} style={styles.group}>
            <Text style={styles.groupLabel}>{g.label}</Text>
            {g.rows.map((chat) => {
              const { title, subtitle } = summarize(chat);
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.row}
                  onPress={() => router.push(`/create?chat=${chat.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Reopen chat: ${title}`}
                >
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    <Text style={styles.rowSub}>{subtitle}</Text>
                  </View>
                  <Text style={styles.rowWhen}>{whenLabel(chat.updatedAt)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {chats && chats.length ? (
          <Text style={styles.footer}>
            Older chats fade away — anything you saved stays in your cookbook.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: SPACING.lg, paddingBottom: SPACING.xxl * 2 },
    title: {
      ...TYPE.display,
      fontSize: 26,
      lineHeight: 32,
      color: colors.ink,
    },
    subtitle: {
      ...TYPE.body,
      color: colors.inkSoft,
      marginTop: SPACING.sm,
    },
    group: { marginTop: SPACING.xl, gap: SPACING.sm },
    groupLabel: {
      ...TYPE.body,
      fontSize: 12,
      fontWeight: "600",
      color: colors.inkSoft,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.card,
      paddingVertical: SPACING.md + 2,
      paddingHorizontal: SPACING.lg,
    },
    rowCopy: { flex: 1, gap: SPACING.xs },
    rowTitle: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.ink,
    },
    rowSub: {
      ...TYPE.body,
      fontSize: 13,
      lineHeight: 18,
      color: colors.inkSoft,
    },
    rowWhen: {
      ...TYPE.body,
      fontSize: 12,
      color: colors.inkSoft,
    },
    empty: { alignItems: "center", gap: SPACING.lg, paddingTop: SPACING.xxl },
    emptyOtto: { width: 120, height: 120 },
    emptyText: {
      ...TYPE.body,
      color: colors.inkSoft,
      textAlign: "center",
    },
    footer: {
      ...TYPE.body,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkSoft,
      textAlign: "center",
      marginTop: SPACING.xl,
    },
  });

export default ChatsScreen;
