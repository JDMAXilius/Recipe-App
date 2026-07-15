import { useEffect } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
        style={[
          addStyles.button,
          { backgroundColor: colors.accent, shadowColor: colors.shadow, borderColor: colors.surface },
        ]}
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
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26, // raised above the bar
    borderWidth: 3, // surface ring so the disc reads over any content
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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    // First run gets the painted showcase; returning visitors go to the stool.
    (async () => {
      let seen = null;
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        seen = await AsyncStorage.getItem("otto.onboarded.v1");
      } catch {}
      router.replace(seen ? "/(auth)/sign-in" : "/onboarding");
    })();
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
          // safe-area aware: 60pt of content + the device's own bottom inset —
          // labels never crowd the home indicator (fixed 80pt did on iPhone)
          height: 60 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
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
