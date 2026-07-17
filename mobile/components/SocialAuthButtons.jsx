import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/tokens";
import {
  fetchEnabledProviders,
  signInWithApple,
  signInWithOAuthProvider,
} from "../lib/socialAuth";

// Social sign-in (P10 §3) — a single HORIZONTAL row of equal buttons, one per
// provider, each showing the brand logo. Renders ONLY providers the Supabase
// project actually has enabled (live settings check) — no dead buttons, ever.
// Apple stays first whenever present (App Store 4.8). Same component on
// sign-in and sign-up so the order and layout never drift.
const META = {
  apple: { label: "Continue with Apple", icon: "logo-apple", tint: (c) => c.ink },
  google: { label: "Continue with Google", icon: "logo-google", tint: () => "#4285F4" },
  facebook: { label: "Continue with Facebook", icon: "logo-facebook", tint: () => "#1877F2" },
};

// mode: "sign-in" switches accounts (like the email path); "sign-up" upgrades
// an anonymous guest in place so their data keeps its owner.
export default function SocialAuthButtons({ onError, mode = "sign-in" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [providers, setProviders] = useState([]);
  const [busy, setBusy] = useState(null); // provider id while a flow is open

  useEffect(() => {
    let alive = true;
    fetchEnabledProviders().then((list) => {
      // Apple's native sheet only exists on iOS builds — hide it elsewhere
      const usable = Platform.OS === "ios" ? list : list.filter((p) => p !== "apple");
      if (alive) setProviders(usable);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!providers.length) return null;

  const start = async (provider) => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});
    setBusy(provider);
    try {
      if (provider === "apple") await signInWithApple(mode);
      else await signInWithOAuthProvider(provider, mode);
      // success: AuthProvider sees the session and the layout redirects home
    } catch (err) {
      // user-cancelled Apple sheet arrives as ERR_REQUEST_CANCELED — stay quiet
      if (err?.code !== "ERR_REQUEST_CANCELED") {
        onError?.(err?.message || "Sign-in didn't finish. Try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {providers.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.button, busy && busy !== p && styles.buttonDisabled]}
            onPress={() => start(p)}
            disabled={Boolean(busy)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={META[p].label}
          >
            {busy === p ? (
              <ActivityIndicator size="small" color={colors.inkSoft} />
            ) : (
              <Ionicons name={META[p].icon} size={24} color={META[p].tint(colors)} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    wrap: { marginBottom: SPACING.md },
    row: { flexDirection: "row", gap: SPACING.md },
    button: {
      flex: 1,
      height: 52,
      borderRadius: RADIUS.button,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: { opacity: 0.5 },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginTop: SPACING.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { ...TYPE.caption, textTransform: "none", letterSpacing: 0, color: colors.inkSoft },
  });
