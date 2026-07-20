import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

// Change your password while signed in — deliberately separate from
// /reset-password, which serves people who have FORGOTTEN theirs and so can't
// be asked for it. Keeping them apart is what lets this one demand the current
// password without breaking recovery.
const MIN_PASSWORD = 8;

const ChangePasswordScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const { user } = useAuth();
  const authStyles = useMemo(() => createAuthStyles(colors), [colors]);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!current) return setError("Enter your current password first.");
    if (next.length < MIN_PASSWORD) {
      return setError(`New password needs at least ${MIN_PASSWORD} characters.`);
    }
    if (next === current) return setError("That's the password you already have.");

    setError(null);
    setLoading(true);
    try {
      // Supabase has no "verify password" call, so proving the current one means
      // signing in with it. Same user, so the session just refreshes — but a
      // wrong password fails here, before anything is changed.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: current,
      });
      if (verifyError) {
        setError("That current password doesn't match.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      show({ message: "Password changed." });
      router.back();
    } catch (err) {
      setError(err?.message || "Couldn't change it just now — try again.");
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
          <Text style={authStyles.title}>Change your password</Text>
          <Text style={authStyles.subtitle}>
            Otto asks for the current one first — so a borrowed phone can&apos;t lock you out of
            your own account.
          </Text>

          <View style={authStyles.formContainer}>
            {error && <Text style={authStyles.errorText}>{error}</Text>}

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Current password"
                placeholderTextColor={colors.inkSoft}
                value={current}
                onChangeText={setCurrent}
                secureTextEntry={!reveal}
                autoCapitalize="none"
                autoFocus
                accessibilityLabel="Current password"
              />
            </View>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="New password"
                placeholderTextColor={colors.inkSoft}
                value={next}
                onChangeText={setNext}
                secureTextEntry={!reveal}
                autoCapitalize="none"
                accessibilityLabel="New password"
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setReveal(!reveal)}
                accessibilityRole="button"
                accessibilityLabel={reveal ? "Hide passwords" : "Show passwords"}
              >
                <Ionicons
                  name={reveal ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.inkSoft}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Saving..." : "Save new password"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={authStyles.linkText}>
                <Text style={authStyles.link}>Never mind</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default ChangePasswordScreen;
