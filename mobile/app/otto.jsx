import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { createOttoStyles } from "../assets/styles/otto.styles";
import { UserRecipeAPI } from "../services/userRecipes";
import { setDraft } from "../lib/draftStore";
import { loadPrefs } from "../lib/prefs";
import OttoIdle from "../components/OttoIdle";
import Bounceable from "../components/Bounceable";
import ScreenHeader from "../components/ScreenHeader";

// "Chat with Otto" — the conversational build (redesign, docs/ADD_CREATE_REDESIGN.md).
// You describe a dish; Otto EITHER asks one clarifying question (with tappable
// chip answers) or hands back the finished recipe as an inline card you save to
// the review editor. The whole thread is sent each turn; the backend decides
// ask-vs-cook. Honesty unchanged: every recipe still lands on "Check Otto's work".

const GREETING = {
  from: "otto",
  text: "Hey — I'm Otto. Tell me what you're hungry for and I'll write you a real recipe. The more you tell me, the better I cook.",
  options: ["A cozy chicken dinner for 4", "A low-cal coffee", "Use up what's in my fridge"],
};

const OttoChatScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createOttoStyles(colors), [colors]);

  // thread: [{ from: "otto"|"you", text, options?, recipe? }]
  const [thread, setThread] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadPrefs().then(setPrefs).catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [thread, sending]);

  // The API wants role/content only; options + recipe are UI-side.
  const toApiMessages = (turns) =>
    turns
      .filter((m) => m.from === "you" || (m.from === "otto" && m.text))
      .map((m) => ({ role: m.from === "you" ? "user" : "assistant", content: m.text }));

  const send = async (raw) => {
    const text = String(raw ?? input).trim();
    if (!text || sending) return;
    Haptics.selectionAsync().catch(() => {});
    const next = [...thread, { from: "you", text }];
    setThread(next);
    setInput("");
    setSending(true);
    try {
      const res = await UserRecipeAPI.chat({
        messages: toApiMessages(next),
        ...(prefs?.diet && prefs.diet !== "none" ? { diet: prefs.diet } : {}),
        ...(prefs?.cuisines?.length ? { cuisines: prefs.cuisines } : {}),
      });
      if (res.mode === "recipe") {
        setThread((t) => [...t, { from: "otto", text: res.message, recipe: res.recipe }]);
      } else if (res.mode === "clarify") {
        setThread((t) => [...t, { from: "otto", text: res.message, options: res.options || [] }]);
      } else {
        setThread((t) => [...t, { from: "otto", text: res.message || "Let's try that a different way." }]);
      }
    } catch (error) {
      setThread((t) => [
        ...t,
        { from: "otto", text: error.message?.startsWith("Otto") ? error.message : "Otto lost his train of thought — try that again?" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const saveRecipe = (recipe) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDraft({
      mode: "import",
      source: "otto",
      sourceUrl: null,
      sourceName: null,
      title: recipe.title,
      image: null,
      category: recipe.category || null,
      area: recipe.area || null,
      servings: recipe.servings || 4,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    });
    router.replace("/recipe/edit");
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Chat with Otto" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
        >
          {thread.map((m, i) =>
            m.from === "you" ? (
              <View key={i} style={styles.youRow}>
                <View style={styles.youBubble}>
                  <Text style={styles.youText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={i} style={styles.ottoRow}>
                <OttoIdle source={require("../assets/mascot/otto-happy-cut.png")} style={styles.avatar} />
                <View style={styles.ottoCol}>
                  {m.text ? (
                    <View style={styles.ottoBubble}>
                      <Text style={styles.ottoText}>{m.text}</Text>
                    </View>
                  ) : null}
                  {m.options?.length ? (
                    <View style={styles.chips}>
                      {m.options.map((opt, j) => (
                        <TouchableOpacity
                          key={j}
                          style={styles.chip}
                          onPress={() => send(opt)}
                          disabled={sending}
                          accessibilityRole="button"
                          accessibilityLabel={opt}
                        >
                          <Text style={styles.chipText}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {m.recipe ? (
                    <View style={styles.recipeCard}>
                      <Text style={styles.recipeTitle}>{m.recipe.title}</Text>
                      <Text style={styles.recipeMeta}>
                        {(m.recipe.servings || 4)} servings · {m.recipe.ingredients?.length || 0} ingredients
                        {m.recipe.steps?.length ? ` · ${m.recipe.steps.length} steps` : ""}
                      </Text>
                      <View style={styles.recipeLines}>
                        {(m.recipe.ingredients || []).slice(0, 6).map((ing, k) => (
                          <View key={k} style={styles.recipeLine}>
                            <Text style={styles.recipeMeasure}>{ing.measure || "—"}</Text>
                            <Text style={styles.recipeName} numberOfLines={1}>{ing.name}</Text>
                          </View>
                        ))}
                        {(m.recipe.ingredients?.length || 0) > 6 ? (
                          <Text style={styles.recipeMore}>
                            +{m.recipe.ingredients.length - 6} more — see them all when you save
                          </Text>
                        ) : null}
                      </View>
                      <Bounceable
                        style={styles.saveButton}
                        onPress={() => saveRecipe(m.recipe)}
                        accessibilityRole="button"
                        accessibilityLabel="Save this recipe to my cookbook"
                      >
                        <Ionicons name="bookmark" size={16} color={colors.white} />
                        <Text style={styles.saveText}>Save to cookbook</Text>
                      </Bounceable>
                      <TouchableOpacity
                        style={styles.tweakButton}
                        onPress={() => send("Actually, can you change something?")}
                        disabled={sending}
                        accessibilityRole="button"
                        accessibilityLabel="Ask Otto to change something"
                      >
                        <Text style={styles.tweakText}>Ask for a change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            )
          )}
          {sending ? (
            <View style={styles.ottoRow}>
              <OttoIdle source={require("../assets/mascot/otto-thinking-cut.png")} style={styles.avatar} />
              <View style={[styles.ottoBubble, styles.thinking]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.thinkingText}>Otto&apos;s thinking…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Tell Otto what you're after…"
            placeholderTextColor={colors.inkSoft}
            multiline
            onSubmitEditing={() => send()}
            accessibilityLabel="Message Otto"
          />
          <Bounceable
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendDisabled]}
            onPress={() => send()}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Bounceable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
export default OttoChatScreen;
