import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Linking } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { createProfileStyles } from "../../assets/styles/profile.styles";

// Account v2 — minimal and honest (MOBBIN_COMPARISON §2.6): identity header
// with the badge-safe Otto bust (D6 fix), a RESERVED slot for the subscription
// card (D8 — renders nothing until the paywall ships), a Support group, and
// sign-out. No theme controls (D2). Rows we can't honor yet (units, legal,
// delete-account) intentionally don't exist — they arrive with real features.

const SUPPORT_EMAIL = "juandlugopro@gmail.com";

const AccountScreen = () => {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const profileStyles = useMemo(() => createProfileStyles(colors), [colors]);

  const handleSignOut = () => {
    // Alert.alert buttons no-op on web — confirm() keeps web usable.
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) signOut();
      return;
    }
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleContact = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Recipe%20App%20feedback`).catch(() => {});
  };

  return (
    <View style={profileStyles.container}>
      <ScrollView
        contentContainerStyle={profileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={profileStyles.title}>Account</Text>

        {/* IDENTITY — badge-safe bust, hat intact (D6) */}
        <View style={profileStyles.identityCard}>
          <View style={profileStyles.mascotBadge}>
            <Image
              source={require("../../assets/mascot/otto-badge.png")}
              style={profileStyles.mascotImage}
              contentFit="cover"
            />
          </View>
          <View style={profileStyles.identityText}>
            <Text style={profileStyles.email} numberOfLines={1}>
              {user?.email}
            </Text>
            <Text style={profileStyles.identityCaption}>SIGNED IN WITH EMAIL</Text>
          </View>
        </View>

        {/* SUBSCRIPTION SLOT (D8) — reserved: the "Try Pro" card renders here
            when the paywall ships. Free = illustrated card, paying = quiet
            "Manage subscription" row. See MOBBIN_COMPARISON §2.6. */}

        {/* SUPPORT */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionLabel}>Support</Text>
          <View style={profileStyles.card}>
            <TouchableOpacity
              style={profileStyles.row}
              onPress={handleContact}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Contact us by email"
            >
              <Ionicons name="mail-outline" size={20} color={colors.inkSoft} />
              <Text style={profileStyles.rowText}>Contact us</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={profileStyles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={profileStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={profileStyles.version}>
          Version {Constants.expoConfig?.version || "1.0.0"}
        </Text>
      </ScrollView>
    </View>
  );
};
export default AccountScreen;
