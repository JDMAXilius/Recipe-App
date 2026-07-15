import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useSaved } from "../../context/SavedContext";
import { useUnitSystem } from "../../hooks/useUnitSystem";
import { UserRecipeAPI } from "../../services/userRecipes";
import { authFetch } from "../../lib/api";
import { createProfileStyles } from "../../assets/styles/profile.styles";

// "You" — Account v3 (Mobbin account study, 2026-07-15).
// Warm header, cold facts: Otto avatar + plain email caption (Kitchen
// Stories/NYT register). Stats only if EARNED, honest at zero, and every
// number is a door (AllTrails). One inline units toggle, no settings dungeon
// (SideChef). Quiet exits, honest destruction: sign out plain at the bottom,
// delete account visible right below it — never buried under Privacy.
// OMITTED on purpose (fabricated-data trap): followers, streaks, XP, badges,
// notification/appearance rows, subscription rows.

const SUPPORT_EMAIL = "juandlugopro@gmail.com";
// Founder input: set these when the pages exist — rows render only when real.
const PRIVACY_URL = null;
const TERMS_URL = null;

const AccountScreen = () => {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const { show } = useToast();
  const router = useRouter();
  const { savedList } = useSaved();
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);

  const [mineCount, setMineCount] = useState(0);
  const [cookedCount, setCookedCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      UserRecipeAPI.list()
        .then((rows) => setMineCount(rows.length))
        .catch(() => {});
      AsyncStorage.getAllKeys()
        .then((keys) => {
          setCookedCount(keys.filter((k) => k.startsWith("otto.cooked.")).length);
          setJournalCount(keys.filter((k) => k.startsWith("otto.journal.")).length);
        })
        .catch(() => {});
    }, [])
  );

  const pickUnits = (next) => {
    if (next === unitSystem) return;
    Haptics.selectionAsync().catch(() => {});
    setUnitSystem(next);
  };

  const handleSignOut = () => {
    // Alert.alert buttons no-op on web — confirm() keeps web usable.
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of Otto?")) signOut();
      return;
    }
    // two-tap arm pattern is for destructive-forever actions; sign-out is
    // reversible, one honest tap is enough on native too
    signOut();
  };

  // Delete account: two-tap arm (works on web), then wipe server data.
  const [armDelete, setArmDelete] = useState(false);
  const handleDelete = async () => {
    if (!armDelete) {
      setArmDelete(true);
      show({
        message:
          "This permanently deletes your saved recipes, your own recipes, and your week. Tap again to confirm.",
      });
      setTimeout(() => setArmDelete(false), 6000);
      return;
    }
    try {
      const res = await authFetch("/account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      show({ message: "Everything's deleted. Otto will miss you." });
      signOut();
    } catch {
      show({ message: "Couldn't delete right now — try again, or email us." });
    }
  };

  const stats = [
    { label: "cooked", value: cookedCount, to: "/(tabs)/cookbook?cooked=1" },
    { label: "saved", value: savedList.length, to: "/(tabs)/cookbook?segment=saved" },
    { label: "your recipes", value: mineCount, to: "/(tabs)/cookbook?segment=mine" },
  ];
  const nothingYet = stats.every((s) => s.value === 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>You</Text>

        {/* IDENTITY — warm header, cold facts */}
        <View style={styles.identityCard}>
          <View style={styles.mascotBadge}>
            <Image
              source={require("../../assets/mascot/otto-badge.png")}
              style={styles.mascotImage}
              contentFit="cover"
            />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.identityName}>Chef</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* YOUR KITCHEN SO FAR — earned numbers, each one a door */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your kitchen so far</Text>
          <View style={styles.statsCard}>
            {stats.map((stat, i) => (
              <TouchableOpacity
                key={stat.label}
                style={[styles.statCell, i > 0 && styles.statCellDivider]}
                onPress={() => router.push(stat.to)}
                accessibilityRole="button"
                accessibilityLabel={`${stat.value} ${stat.label} — open`}
              >
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {nothingYet && (
            <Text style={styles.statsEmptyNote}>
              Nothing cooked yet — Otto's ready when you are.
            </Text>
          )}
        </View>

        {/* CONTENT */}
        <View style={styles.section}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/journal")}
              accessibilityRole="button"
              accessibilityLabel={`Cooking journal, ${journalCount} photos`}
            >
              <Ionicons name="camera-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Cooking journal</Text>
              <Text style={styles.rowValue}>{journalCount}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCES — one inline toggle, no settings dungeon */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="scale-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Units</Text>
              <View style={styles.unitToggle}>
                {["us", "metric"].map((system) => (
                  <TouchableOpacity
                    key={system}
                    style={[styles.unitOption, unitSystem === system && styles.unitOptionActive]}
                    onPress={() => pickUnits(system)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: unitSystem === system }}
                    accessibilityLabel={system === "us" ? "US units" : "Metric units"}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        unitSystem === system && styles.unitOptionTextActive,
                      ]}
                    >
                      {system === "us" ? "US" : "Metric"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* THE BORING-BUT-IMPORTANT BITS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>The boring-but-important bits</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Otto%20feedback`).catch(() => {})
              }
              accessibilityRole="button"
              accessibilityLabel="Say hi or get help by email"
            >
              <Ionicons name="mail-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Say hi / get help</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            {PRIVACY_URL && (
              <TouchableOpacity
                style={[styles.row, styles.rowDivider]}
                onPress={() => Linking.openURL(PRIVACY_URL)}
                accessibilityRole="link"
                accessibilityLabel="Privacy policy"
              >
                <Ionicons name="shield-outline" size={20} color={colors.inkSoft} />
                <Text style={styles.rowText}>Privacy policy</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </TouchableOpacity>
            )}
            {TERMS_URL && (
              <TouchableOpacity
                style={[styles.row, styles.rowDivider]}
                onPress={() => Linking.openURL(TERMS_URL)}
                accessibilityRole="link"
                accessibilityLabel="Terms"
              >
                <Ionicons name="document-text-outline" size={20} color={colors.inkSoft} />
                <Text style={styles.rowText}>Terms</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </TouchableOpacity>
            )}
            <View style={[styles.row, styles.rowDivider]}>
              <Ionicons name="paw-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>About Otto</Text>
              <Text style={styles.rowValue}>v{Constants.expoConfig?.version || "1.0.0"}</Text>
            </View>
          </View>
        </View>

        {/* EXITS — quiet, honest, never buried */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteRow}
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
        >
          <Text style={[styles.deleteText, armDelete && styles.deleteTextArmed]}>
            {armDelete ? "Tap again — this is forever" : "Delete my account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
export default AccountScreen;
