import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useMemo, useState } from "react";
import { createAuthStyles } from "../../assets/styles/auth.styles";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import { useTheme } from "../../context/ThemeContext";

// Sign-up v2 — first contact, the thesis statement: large framed Otto,
// a headline with a feeling, one line that says what the account is FOR.
const SignUpScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const authStyles = useMemo(() => createAuthStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Fill in your email and password first.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Anonymous session → UPGRADE in place (updateUser) so everything the
      // guest already made (imports, plans, saves) keeps its owner. A fresh
      // signUp here would mint a second user and orphan that data.
      const { data: current } = await supabase.auth.getUser();
      const { error: authError } = current?.user?.is_anonymous
        ? await supabase.auth.updateUser({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message || "Couldn't create your account. Try again.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      // email auto-confirm is enabled → session starts and route guards redirect
    } catch (err) {
      setError(err.message || "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        style={authStyles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.heroContainer}>
            <Image
              source={require("../../assets/mascot/otto-hero.png")}
              style={authStyles.heroImage}
              contentFit="cover"
              contentPosition="top"
              accessible={false}
            />
          </View>

          <Text style={authStyles.title}>Pull up a stool.</Text>
          <Text style={authStyles.subtitle}>Save recipes, plan dinners — Otto remembers.</Text>

          <View style={authStyles.formContainer}>
            {error && <Text style={authStyles.errorText}>{error}</Text>}

            {/* same rows, same order as sign-in (P10 §3) — Apple first (4.8) */}
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
              <Text style={authStyles.hint}>6+ characters</Text>
            </View>

            <TouchableOpacity
              style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Setting your place..." : "Join Otto's kitchen"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={authStyles.linkContainer} onPress={() => router.back()}>
              <Text style={authStyles.linkText}>
                Already have an account? <Text style={authStyles.link}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default SignUpScreen;
