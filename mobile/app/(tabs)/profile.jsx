import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { THEMES } from "../../constants/colors";
import { createProfileStyles } from "../../assets/styles/profile.styles";

const APPEARANCE_OPTIONS = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

const NICHE_OPTIONS = [
  { key: "base", label: "Otto (Base)" },
  { key: "lean", label: "Lean" },
  { key: "keto", label: "Keto" },
  { key: "bulk", label: "Bulk" },
];

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { colors, niche, mode, setNiche, setMode } = useTheme();
  const profileStyles = useMemo(() => createProfileStyles(colors), [colors]);

  const pick = (fn, value) => {
    Haptics.selectionAsync().catch(() => {});
    fn(value);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={profileStyles.container}>
      <ScrollView
        contentContainerStyle={profileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={profileStyles.title}>Profile</Text>

        {/* IDENTITY */}
        <View style={profileStyles.identityCard}>
          <View style={profileStyles.mascotBadge}>
            <Image
              source={require("../../assets/mascot/otto-happy.png")}
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

        {/* APPEARANCE */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionLabel}>Appearance</Text>
          <View style={profileStyles.card}>
            <View style={profileStyles.chipRow}>
              {APPEARANCE_OPTIONS.map((option) => {
                const selected = mode === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[profileStyles.chip, selected && profileStyles.chipSelected]}
                    onPress={() => pick(setMode, option.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[profileStyles.chipText, selected && profileStyles.chipTextSelected]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* THEME */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionLabel}>Theme</Text>
          <View style={profileStyles.card}>
            {NICHE_OPTIONS.map((option) => {
              const selected = niche === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={profileStyles.themeRow}
                  onPress={() => pick(setNiche, option.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      profileStyles.swatch,
                      { backgroundColor: THEMES[option.key].light.accent },
                    ]}
                  />
                  <Text
                    style={[profileStyles.themeName, selected && profileStyles.themeNameSelected]}
                  >
                    {option.label}
                  </Text>
                  {selected && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={profileStyles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={profileStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
export default ProfileScreen;
