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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { createOttoStyles } from "../../assets/styles/otto.styles";
import { UserRecipeAPI } from "../../services/userRecipes";
import { setDraft } from "../../lib/draftStore";
import { loadPrefs } from "../../lib/prefs";
import { getChat, saveChat } from "../../lib/chatHistory";
import OttoIdle from "../../components/OttoIdle";
import Bounceable from "../../components/Bounceable";
import ScreenHeader from "../../components/ScreenHeader";

// "Chat with Otto" — the create (＋) tab. This IS the primary way to make a
// recipe: describe a dish, Otto goes straight to a real recipe (rarely a
// clarifying question) and hands it back as an inline card you save. It lives
// in the tab group so the bottom bar stays put — no top X, the bar is the way
// out. Bringing in an existing recipe (link/photo/text/write) is one tap away
// via the header import button, which opens the /add sheet.

const OttoChatScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const styles = useMemo(() => createOttoStyles(colors), [colors]);
  // ?chat=<id> — arriving from Recent chats reopens that thread
  const { chat: chatParam } = useLocalSearchParams();

  // thread: [{ from: "otto"|"you", text, options?, recipe? }] — starts empty;
  // an empty thread shows the minimal centered prompt, not a greeting bubble.
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const scrollRef = useRef(null);
  // which stored chat this thread writes back to (null until the first turn)
  const chatIdRef = useRef(null);

  useEffect(() => {
    loadPrefs().then(setPrefs).catch(() => {});
  }, []);

  // Reopen a stored chat when Recent chats hands us an id.
  useEffect(() => {
    const id = Array.isArray(chatParam) ? chatParam[0] : chatParam;
    if (!id || chatIdRef.current === id) return;
    getChat(id)
      .then((stored) => {
        if (!stored) return;
        chatIdRef.current = stored.id;
        setThread(stored.thread || []);
      })
      .catch(() => {});
  }, [chatParam]);

  // Persist after every settled turn. Storing mid-flight would leave a chat
  // whose last line is a question Otto never got to answer.
  useEffect(() => {
    if (sending || thread.length === 0) return;
    saveChat({ id: chatIdRef.current, thread })
      .then((id) => {
        if (id) chatIdRef.current = id;
      })
      .catch(() => {});
  }, [thread, sending]);
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

  // Voice needs the on-device speech module, which only rides in the dev build
  // (like the share extension). Until then, say so warmly instead of a dead tap.
  const startSpeaking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    show({
      message: "Talking to Otto is coming soon — type it to him for now.",
      ottoImage: require("../../assets/mascot/otto-happy-cut.png"),
    });
  };

  const saveRecipe = (recipe) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Mark the stored chat as saved so its history row can say so honestly.
    saveChat({ id: chatIdRef.current, thread, savedTitle: recipe.title }).catch(() => {});
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
    router.push("/recipe/edit");
  };

  const hasText = !!input.trim();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Chat with Otto"
        leftIcon="time-outline"
        leftLabel="Recent chats"
        onBack={() => router.push("/chats")}
        right={
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push("/add")}
            accessibilityRole="button"
            accessibilityLabel="Bring in an existing recipe"
          >
            <Ionicons name="download-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={thread.length ? styles.thread : styles.emptyThread}
          keyboardShouldPersistTaps="handled"
        >
          {!thread.length && !sending ? (
            <View style={styles.empty}>
              <OttoIdle source={require("../../assets/mascot/otto-happy-cut.png")} style={styles.emptyOtto} />
              <Text style={styles.emptyText}>
                Tell me what you&apos;re hungry for.{"\n"}I&apos;ll write you the recipe.
              </Text>
            </View>
          ) : null}
          {thread.map((m, i) =>
            m.from === "you" ? (
              <View key={i} style={styles.youRow}>
                <View style={styles.youBubble}>
                  <Text style={styles.youText}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={i} style={styles.ottoRow}>
                <OttoIdle source={require("../../assets/mascot/otto-happy-cut.png")} style={styles.avatar} />
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
              <OttoIdle source={require("../../assets/mascot/otto-thinking-cut.png")} style={styles.avatar} />
              <View style={[styles.ottoBubble, styles.thinking]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.thinkingText}>Otto&apos;s thinking…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
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
            {hasText ? (
              <Bounceable
                style={styles.sendPill}
                onPress={() => send()}
                accessibilityRole="button"
                accessibilityLabel="Send"
              >
                <Ionicons name="arrow-up" size={18} color={colors.white} />
              </Bounceable>
            ) : (
              <Bounceable
                style={styles.speakPill}
                onPress={startSpeaking}
                accessibilityRole="button"
                accessibilityLabel="Speak to Otto"
              >
                <Ionicons name="mic" size={16} color={colors.white} />
                <Text style={styles.speakText}>Speak</Text>
              </Bounceable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
export default OttoChatScreen;
