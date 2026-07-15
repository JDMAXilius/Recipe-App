import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";

const pawOutline = require("../../assets/mascot/paw-outline.png");
const pawFilled = require("../../assets/mascot/paw-filled.png");

// 3 tabs — Discover · Saved · Account (P2-1, MOBBIN_COMPARISON §2.1).
// Saved wears the Otto paw-mark; labels always visible.
// Auth guard: keep Tabs mounted while the session loads so cold-start deep
// links (e.g. /favorites) keep their route — returning null here used to
// reset the initial route to Discover. Unauthed users are replaced out
// after load.

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
        name="favorites"
        options={{
          title: "Saved",
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
