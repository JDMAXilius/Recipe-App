import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { createProfileStyles } from "../../assets/styles/profile.styles";

// Light-only (D2): the Appearance + Theme pickers are gone. This screen is a
// placeholder until the Phase-4 Account redesign (subscription slot, units,
// support rows — see docs/DESIGN_SYSTEM.md B8 / MOBBIN_COMPARISON.md §2.6).

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const profileStyles = useMemo(() => createProfileStyles(colors), [colors]);

  const handleSignOut = () => {
    // Alert.alert buttons are no-ops on web — confirm() keeps web usable.
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) signOut();
      return;
    }
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
        <Text style={profileStyles.title}>Account</Text>

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
