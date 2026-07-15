import { useEffect } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";

const pawOutline = require("../../assets/mascot/paw-outline.png");
const pawFilled = require("../../assets/mascot/paw-filled.png");

// v2 tab bar (OTTO_V2_ROADMAP Phase 1+4): Discover · Cookbook · ＋ · Plan ·
// Account. The raised terracotta ＋ is an ACTION, not a destination — it opens
// the Add sheet and never claims a selected state (ReciMe-validated).
// Cookbook wears the paw; labels always visible.
// Auth guard: keep Tabs mounted while the session loads so cold-start deep
// links keep their route; unauthed users are replaced out after load.

const AddButton = () => {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={addStyles.slot}>
      <TouchableOpacity
        style={[addStyles.button, { backgroundColor: colors.accent, shadowColor: colors.shadow }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push("/add");
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Add a recipe"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const addStyles = StyleSheet.create({
  slot: {
    flex: 1,
    alignItems: "center",
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22, // raised above the bar
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});

const TabsLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/(auth)/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && !isSignedIn) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync().catch(() => {});
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          title: "Cookbook",
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={focused ? pawFilled : pawOutline}
              style={{ width: size, height: size }}
              contentFit="contain"
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarButton: () => <AddButton />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};
export default TabsLayout;
