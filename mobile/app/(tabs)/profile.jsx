import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, TextInput } from "react-native";
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
import { sharePlainText } from "../../lib/shareText";
import { createProfileStyles } from "../../assets/styles/profile.styles";
import {
  displayNameFor,
  hasUsername,
  cleanUsername,
  saveUsername,
  MAX_USERNAME,
} from "../../lib/username";

// "You" — Account v3 (Mobbin account study, 2026-07-15).
// Warm header, cold facts: Otto avatar + plain email caption (Kitchen
// Stories/NYT register). Stats only if EARNED, honest at zero, and every
// number is a door (AllTrails). One inline units toggle, no settings dungeon
// (SideChef). Quiet exits, honest destruction: sign out plain at the bottom,
// delete account visible right below it — never buried under Privacy.
// OMITTED on purpose (fabricated-data trap): followers, streaks, XP, badges,
// notification/appearance rows, subscription rows.

const SUPPORT_EMAIL = "juandlugopro@gmail.com";
// Founder: drop the App Store URL in here at launch — until then the share
// message carries no link (a placeholder link would be a lie).
const TELL_A_FRIEND_URL = null;
// Founder: the store review URL at launch, e.g.
// "https://apps.apple.com/app/idXXXXXXXXX?action=write-review". The Rate
// row stays hidden until this is real — a rating row that goes nowhere
// would be dead-end UI.
const RATE_APP_URL = null;
// Founder input: set these when the pages exist — rows render only when real.
const PRIVACY_URL = "https://ottosapp.com/privacy";
const TERMS_URL = "https://ottosapp.com/terms";

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

  // The name Otto calls you. Lives in Supabase user_metadata, so it needs no
  // table of its own and travels with the session — see lib/username.js.
  // savedName is the optimistic value: updateUser's auth event can land a beat
  // later, and the name flickering back to the old one reads as a failed save.
  const [savedName, setSavedName] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const displayName = savedName || displayNameFor(user);

  const startEditingName = () => {
    Haptics.selectionAsync().catch(() => {});
    // Seed with the real stored name only — never with the guessed fallback,
    // or "Chef" becomes everyone's actual saved name the first time they tap.
    setDraftName(hasUsername(user) ? displayNameFor(user) : savedName || "");
    setEditingName(true);
  };

  // Return + blur both fire on "done", and setState hasn't flushed between
  // them — a ref is what actually dedupes the save, not the editingName state.
  const savingName = useRef(false);
  const commitName = async () => {
    if (savingName.current) return;
    savingName.current = true;
    setEditingName(false);
    const next = cleanUsername(draftName);
    const current = hasUsername(user) ? displayNameFor(user) : savedName || "";
    try {
      if (next === current) return; // nothing typed, or typed back to the same
      const saved = await saveUsername(next);
      setSavedName(saved || null);
      show({ message: saved ? `Otto will call you ${saved}.` : "Name cleared." });
    } catch {
      show({ message: "Couldn't save that name — try again." });
    } finally {
      savingName.current = false;
    }
  };

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

  const tellAFriend = async () => {
    Haptics.selectionAsync().catch(() => {});
    const { copied } = await sharePlainText(
      "I’ve been cooking with Otto — the quieter kind of cookbook. Dinner plans, one shopping list, zero feed. Ask me to show you!",
      "Otto",
      TELL_A_FRIEND_URL
    );
    if (copied) show({ message: "Copied — paste it to a friend." });
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

  // Apple/Google-only accounts have no password, so the row would be a dead end.
  const hasPasswordLogin =
    user?.identities?.some((i) => i.provider === "email") ??
    user?.app_metadata?.provider === "email";

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
            {editingName ? (
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={setDraftName}
                onSubmitEditing={commitName}
                onBlur={commitName}
                maxLength={MAX_USERNAME}
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                placeholder="What should Otto call you?"
                placeholderTextColor={colors.inkSoft}
                accessibilityLabel="Your name"
              />
            ) : (
              <TouchableOpacity
                onPress={startEditingName}
                accessibilityRole="button"
                accessibilityLabel={`Your name, ${displayName}. Tap to change.`}
              >
                <View style={styles.nameRow}>
                  <Text style={styles.identityName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Ionicons name="pencil" size={14} color={colors.inkSoft} />
                </View>
                <Text style={styles.email} numberOfLines={1}>
                  {hasUsername(user) ? "Tap to change your name" : "Tap to add your name"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* MEMBERSHIP — factual row + painted card (KS two-piece pattern).
            One component, three states; pre-IAP shows the honest free state. */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Membership</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="ribbon-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Current plan</Text>
              <Text style={styles.rowValue}>Free</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.clubCard}
            onPress={() => router.push("/otto-club")}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Otto Club — see how it works"
          >
            <View style={styles.clubCopy}>
              <Text style={styles.clubTitle}>Otto Club</Text>
              <Text style={styles.clubBody}>
                Everything Otto can do, one simple membership. Opening soon.
              </Text>
              <View style={styles.clubPill}>
                <Text style={styles.clubPillText}>See how it works</Text>
              </View>
            </View>
            <Image
              source={require("../../assets/mascot/otto-floating-cut.png")}
              style={styles.clubArt}
              contentFit="contain"
            />
          </TouchableOpacity>
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
            {hasPasswordLogin && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/change-password")}
                accessibilityRole="button"
                accessibilityLabel="Change password"
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.inkSoft} />
                <Text style={styles.rowText}>Change password</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.row, hasPasswordLogin && styles.rowDivider]}
              onPress={() => router.push("/preferences")}
              accessibilityRole="button"
              accessibilityLabel="Food preferences"
            >
              <Ionicons name="restaurant-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Food preferences</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowDivider]}
              onPress={() => router.push("/notifications")}
              accessibilityRole="button"
              accessibilityLabel="Reminders"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Reminders</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            <View style={styles.row}>
              <Ionicons name="scale-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Units</Text>
              {/* Weight-first is the standard; cups is the alternative, and
                  this is the ONLY place to switch (founder decision). */}
              <View style={styles.unitToggle}>
                {["weight", "us"].map((system) => (
                  <TouchableOpacity
                    key={system}
                    style={[styles.unitOption, unitSystem === system && styles.unitOptionActive]}
                    onPress={() => pickUnits(system)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: unitSystem === system }}
                    accessibilityLabel={system === "weight" ? "Weight units" : "US cups"}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        unitSystem === system && styles.unitOptionTextActive,
                      ]}
                    >
                      {system === "weight" ? "Weight" : "US cups"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* SPREAD THE WORD */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Spread the word</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={tellAFriend}
              accessibilityRole="button"
              accessibilityLabel="Tell a friend about Otto"
            >
              <Ionicons name="gift-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Tell a friend</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            {RATE_APP_URL && (
              <TouchableOpacity
                style={[styles.row, styles.rowDivider]}
                onPress={() => Linking.openURL(RATE_APP_URL).catch(() => {})}
                accessibilityRole="link"
                accessibilityLabel="Rate Otto on the App Store"
              >
                <Ionicons name="star-outline" size={20} color={colors.inkSoft} />
                <Text style={styles.rowText}>Rate Otto</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* THE BORING-BUT-IMPORTANT BITS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>The boring-but-important bits</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/faq")}
              accessibilityRole="button"
              accessibilityLabel="Little questions — FAQs"
            >
              <Ionicons name="help-buoy-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Little questions</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            {/* feedback and bug reports arrive pre-labeled — a bug mail
                carries version + platform so it lands diagnosable */}
            <TouchableOpacity
              style={[styles.row, styles.rowDivider]}
              onPress={() =>
                Linking.openURL(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("A thought about Otto")}`
                ).catch(() => {})
              }
              accessibilityRole="button"
              accessibilityLabel="Send feedback by email"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Send a thought</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowDivider]}
              onPress={() =>
                Linking.openURL(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Otto bug report")}&body=${encodeURIComponent(
                    `What happened?\n\n\nWhat did you expect?\n\n\n—\nOtto v${Constants.expoConfig?.version || "1.0.0"} · ${Platform.OS}`
                  )}`
                ).catch(() => {})
              }
              accessibilityRole="button"
              accessibilityLabel="Report a bug by email"
            >
              <Ionicons name="bug-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.rowText}>Report a bug</Text>
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
