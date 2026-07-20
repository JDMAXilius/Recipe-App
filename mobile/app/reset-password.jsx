import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { createAuthStyles } from "../assets/styles/auth.styles";
import { useTheme } from "../context/ThemeContext";

// Set a new password after following the emailed recovery link.
//
// This screen lives at the ROOT, not under (auth), and that is load-bearing:
// the recovery link signs you in, and (auth)/_layout redirects signed-in users
// straight home — so from in there you could never reach the form.
const MIN_PASSWORD = 8;

// Supabase hands the session back one of two ways depending on flow type:
// implicit puts tokens in the URL fragment, PKCE puts a ?code= in the query.
// Native parses whichever arrived; web has detectSessionInUrl and does it for us.
async function sessionFromUrl(url) {
  if (!url) return false;
  const { queryParams } = Linking.parse(url);
  if (queryParams?.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(String(queryParams.code));
    return !error;
  }
  const fragment = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return !error;
}

const ResetPasswordScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const authStyles = useMemo(() => createAuthStyles(colors), [colors]);
  const url = Linking.useURL();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // null = still working out whether we have a recovery session
  const [ready, setReady] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Web already turned the URL into a session; native has to do it here.
      if (Platform.OS !== "web" && url) await sessionFromUrl(url);
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setReady(Boolean(data?.session));
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleSave = async () => {
    if (password.length < MIN_PASSWORD) {
      setError(`Passwords need at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/");
    } catch (err) {
      setError(err?.message || "Couldn't save that password — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {ready === false ? (
            <>
              <Text style={authStyles.title}>That link has expired</Text>
              <Text style={authStyles.subtitle}>
                Recovery links only last an hour, and each one works once. Ask for a fresh one and
                you&apos;re back in.
              </Text>
              <View style={authStyles.formContainer}>
                <TouchableOpacity
                  style={authStyles.authButton}
                  onPress={() => router.replace("/(auth)/forgot-password")}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.buttonText}>Send a new link</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={authStyles.title}>Set a new password</Text>
              <Text style={authStyles.subtitle}>
                Pick something you&apos;ll remember — Otto will keep you signed in afterwards.
              </Text>

              <View style={authStyles.formContainer}>
                {error && <Text style={authStyles.errorText}>{error}</Text>}

                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="New password"
                    placeholderTextColor={colors.inkSoft}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoFocus
                    accessibilityLabel="New password"
                  />
                  <TouchableOpacity
                    style={authStyles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.inkSoft}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    authStyles.authButton,
                    (loading || ready === null) && authStyles.buttonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={loading || ready === null}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.buttonText}>
                    {loading ? "Saving..." : "Save new password"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default ResetPasswordScreen;
