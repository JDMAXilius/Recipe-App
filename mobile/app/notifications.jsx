import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import ScreenHeader from "../components/ScreenHeader";
import { createNotificationStyles } from "../assets/styles/notifications.styles";
import { PlanAPI } from "../services/userRecipes";
import { toDayKey } from "../lib/week";
import {
  loadNotifPrefs,
  saveNotifPrefs,
  ensurePermission,
  getPermissionState,
  syncTonightReminder,
  syncSundayNudge,
  TONIGHT_HOURS,
} from "../lib/notifications";
import LoadingSpinner from "../components/LoadingSpinner";

const hourLabel = (h) => `${h > 12 ? h - 12 : h}pm`;

// Reminders — local and opt-in. Toggles apply immediately (nothing here
// re-ranks content, so no Save ceremony); every change re-syncs the actual
// scheduled notifications so the UI never claims what isn't booked.
const NotificationsScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const styles = useMemo(() => createNotificationStyles(colors), [colors]);
  const [prefs, setPrefs] = useState(null);
  const [permission, setPermission] = useState("granted");

  useEffect(() => {
    loadNotifPrefs().then(setPrefs);
    getPermissionState().then(setPermission);
  }, []);

  if (!prefs) return <LoadingSpinner message="Checking the kitchen bell..." />;

  const resync = async (next) => {
    await saveNotifPrefs(next);
    const today = toDayKey(new Date());
    const entry = await PlanAPI.list(today, today)
      .then((rows) => rows.find((r) => !r.cooked && r.recipeId) || null)
      .catch(() => null);
    await syncTonightReminder(entry);
    await syncSundayNudge(next.sunday);
  };

  const flip = async (key, value) => {
    Haptics.selectionAsync().catch(() => {});
    if (value) {
      if (Platform.OS === "web") {
        show({ message: "Reminders live on the phone app — this is just the preview." });
        return;
      }
      const ok = await ensurePermission();
      getPermissionState().then(setPermission);
      if (!ok) {
        show({ message: "Your phone has notifications off for Otto — flip them in Settings first." });
        return;
      }
    }
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await resync(next);
  };

  const pickHour = async (hour) => {
    Haptics.selectionAsync().catch(() => {});
    const next = { ...prefs, tonightHour: hour };
    setPrefs(next);
    await resync(next);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reminders" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.scopeNote}>
          Everything here lives on this phone — Otto only reminds you about
          things the phone already knows, and both nudges start off.
        </Text>

        {/* Permission-denied state stays visible with a way out (the
            MyFitnessPal pattern) — never a toggle that silently can't work */}
        {permission === "denied" && (prefs.tonight || prefs.sunday) && (
          <TouchableOpacity
            style={styles.permissionBanner}
            onPress={() => Linking.openSettings().catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel="Notifications are off for Otto — open phone settings"
          >
            <Ionicons name="notifications-off-outline" size={18} color={colors.accent} />
            <Text style={styles.permissionText}>
              Your phone has notifications off for Otto, so these won&apos;t
              arrive. Tap to open Settings.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="moon-outline" size={20} color={colors.inkSoft} />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Tonight&apos;s dinner</Text>
              <Text style={styles.rowHint}>
                On days you planned something — one nudge, with the dish name.
              </Text>
            </View>
            <Switch
              value={prefs.tonight}
              onValueChange={(v) => flip("tonight", v)}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.white}
              activeThumbColor={colors.white}
              accessibilityLabel="Tonight's dinner reminder"
            />
          </View>
          {prefs.tonight && (
            <View style={styles.hourRow}>
              {TONIGHT_HOURS.map((h) => {
                const on = prefs.tonightHour === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourChip, on && styles.hourChipOn]}
                    onPress={() => pickHour(h)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Remind at ${hourLabel(h)}`}
                  >
                    <Text style={[styles.hourChipText, on && styles.hourChipTextOn]}>
                      {hourLabel(h)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={colors.inkSoft} />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Sunday planning nudge</Text>
              <Text style={styles.rowHint}>Sunday, 9am — a fresh week, a gentle poke.</Text>
            </View>
            <Switch
              value={prefs.sunday}
              onValueChange={(v) => flip("sunday", v)}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.white}
              activeThumbColor={colors.white}
              accessibilityLabel="Sunday planning nudge"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
export default NotificationsScreen;
