import { useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import * as Linking from "expo-linking";
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
import * as Haptics from "expo-haptics";
import { supabase } from "../../lib/supabase";
import { createAuthStyles } from "../../assets/styles/auth.styles";
import { useTheme } from "../../context/ThemeContext";

// "I forgot my password" — the way back in for the 6-in-7 accounts that sign in
// with a password. Without this a forgotten password is a permanently locked
// account, since nothing else in the app can reach it.
const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const authStyles = useMemo(() => createAuthStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Type the email you signed up with.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Lands on /reset-password, which sits OUTSIDE (auth) on purpose: the
      // recovery link signs you in, and (auth) bounces signed-in users home.
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL("/reset-password"),
      });
      if (authError) throw authError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSent(true);
    } catch (err) {
      setError(err?.message || "Couldn't send that just now — try again.");
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
          <View style={authStyles.heroContainer}>
            <ExpoImage
              source={require("../../assets/mascot/otto-hero.png")}
              style={authStyles.heroImage}
              contentFit="cover"
              contentPosition="top"
              accessible={false}
            />
          </View>

          {sent ? (
            <>
              <Text style={authStyles.title}>Check your email</Text>
              <Text style={authStyles.subtitle}>
                If there&apos;s an account for {email.trim()}, Otto just sent it a link to set a new
                password. It expires in an hour.
              </Text>
              <View style={authStyles.formContainer}>
                <TouchableOpacity
                  style={authStyles.authButton}
                  onPress={() => router.replace("/(auth)/sign-in")}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.buttonText}>Back to sign in</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={authStyles.title}>Forgot your password?</Text>
              <Text style={authStyles.subtitle}>
                Happens to everyone. Otto will email you a link to set a new one.
              </Text>

              <View style={authStyles.formContainer}>
                {error && <Text style={authStyles.errorText}>{error}</Text>}

                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Email"
                    placeholderTextColor={colors.inkSoft}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                    accessibilityLabel="Email"
                  />
                </View>

                <TouchableOpacity
                  style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
                  onPress={handleSend}
                  disabled={loading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.buttonText}>
                    {loading ? "Sending..." : "Send me a link"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={authStyles.linkContainer}
                  onPress={() => router.back()}
                  accessibilityRole="button"
                >
                  <Text style={authStyles.linkText}>
                    Remembered it? <Text style={authStyles.link}>Sign in</Text>
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
export default ForgotPasswordScreen;
