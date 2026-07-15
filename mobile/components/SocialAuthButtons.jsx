import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import {
  fetchEnabledProviders,
  signInWithApple,
  signInWithOAuthProvider,
} from "../lib/socialAuth";

// Social sign-in rows (P10 §3). Renders ONLY providers the Supabase project
// actually has enabled (live settings check) — no dead buttons, ever. Apple
// stays first whenever present (App Store 4.8). Same component on sign-in
// and sign-up so the order never drifts.
const LABELS = {
  apple: { label: "Continue with Apple", icon: "logo-apple" },
  google: { label: "Continue with Google", icon: "logo-google" },
  facebook: { label: "Continue with Facebook", icon: "logo-facebook" },
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
      // Apple's native sheet only exists on iOS builds — hide the row elsewhere
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
      {providers.map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.row, busy && busy !== p && styles.rowDisabled]}
          onPress={() => start(p)}
          disabled={Boolean(busy)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={LABELS[p].label}
        >
          <Ionicons name={LABELS[p].icon} size={20} color={colors.ink} />
          <Text style={styles.rowText}>
            {busy === p ? "Opening…" : LABELS[p].label}
          </Text>
        </TouchableOpacity>
      ))}
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
    wrap: { gap: 10, marginBottom: 14 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowDisabled: { opacity: 0.5 },
    rowText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.ink,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.inkSoft },
  });
