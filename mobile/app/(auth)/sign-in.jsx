import { useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { supabase } from "../../lib/supabase";
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
import { createAuthStyles } from "../../assets/styles/auth.styles";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import { useTheme } from "../../context/ThemeContext";

// Sign-in v2 — the everyday screen: compact Otto vignette, the headline does
// the warmth, inline errors (Alert.alert is invisible on web).
const SignInScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const authStyles = useMemo(() => createAuthStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Fill in your email and password first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message || "Sign in failed. Try again.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      // on success the AuthProvider picks up the session and (auth)/_layout redirects home
    } catch (err) {
      setError(err.message || "Sign in failed. Try again.");
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
          {/* Same framed-hero scale as sign-up — the two doors match */}
          <View style={authStyles.heroContainer}>
            <ExpoImage
              source={require("../../assets/mascot/otto-hero.png")}
              style={authStyles.heroImage}
              contentFit="cover"
              contentPosition="top"
              accessible={false}
            />
          </View>

          <Text style={authStyles.title}>Back to the kitchen?</Text>
          <Text style={authStyles.subtitle}>Otto kept your place.</Text>

          <View style={authStyles.formContainer}>
            {error && <Text style={authStyles.errorText}>{error}</Text>}

            {/* social rows render only for providers Supabase has enabled (P10 §3) */}
            <SocialAuthButtons onError={setError} />

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Email"
                placeholderTextColor={colors.inkSoft}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email"
              />
            </View>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Password"
                placeholderTextColor={colors.inkSoft}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                accessibilityLabel="Password"
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
              style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={authStyles.buttonText}>{loading ? "Signing in..." : "Sign in"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
            >
              <Text style={authStyles.linkText}>
                New here? <Text style={authStyles.link}>Pull up a stool</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default SignInScreen;
