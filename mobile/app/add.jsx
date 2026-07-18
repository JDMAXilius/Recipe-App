import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { createAddStyles } from "../assets/styles/add.styles";
import { UserRecipeAPI } from "../services/userRecipes";
import { setDraft } from "../lib/draftStore";
import { shareIntentAvailable } from "../lib/shareIntent";
import OttoIdle from "../components/OttoIdle";
import Bounceable from "../components/Bounceable";
import ShareCoachSheet from "../components/ShareCoachSheet";
import ScreenHeader from "../components/ScreenHeader";

// The ＋ sheet (roadmap Phase 1). Two live modes: Paste a link (deterministic
// JSON-LD import — "Otto's reading it, check his work") and Write it myself.
// Share-in from TikTok/IG needs the dev-build share extension — honest
// "coming soon" line, not a fake button. The ＋ always succeeds at something:
// import failures carry everything captured into manual entry.

const LOOKS_LIKE_URL = /^https?:\/\/\S+\.\S+/i;

const AddScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createAddStyles(colors), [colors]);

  const [url, setUrl] = useState("");
  // Share-sheet arrivals (lib/shareIntent.js) land here as ?url= — prefill
  // the paste box so the user reviews before anything imports.
  const { url: sharedUrl } = useLocalSearchParams();
  useEffect(() => {
    if (typeof sharedUrl === "string" && sharedUrl) setUrl(sharedUrl);
  }, [sharedUrl]);
  const [fromClipboard, setFromClipboard] = useState(false);
  const [phase, setPhase] = useState("pick"); // pick | parsing | failed
  const [failMessage, setFailMessage] = useState("");
  const [coachOpen, setCoachOpen] = useState(false);
  const shareLive = shareIntentAvailable();

  // Clipboard detection — "Otto spotted a link" (Crouton pattern). iOS shows
  // a system paste prompt the moment an app READS the clipboard, so we only
  // CHECK for a URL here (hasUrlAsync never prompts) and read on explicit tap.
  const [clipboardHasLink, setClipboardHasLink] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web") {
          // navigator.clipboard.read needs a permission prompt too — skip
          return;
        }
        setClipboardHasLink(await Clipboard.hasUrlAsync());
      } catch {
        // clipboard quirks — the input still works by hand
      }
    })();
  }, []);

  const pasteFromClipboard = async () => {
    try {
      const text = ((await Clipboard.getUrlAsync()) || (await Clipboard.getStringAsync()))?.trim();
      if (text && LOOKS_LIKE_URL.test(text)) {
        setUrl(text);
        setFromClipboard(true);
      }
    } catch {
      // user declined the paste — nothing to do
    }
  };

  const startImport = async () => {
    const target = url.trim();
    if (!LOOKS_LIKE_URL.test(target)) {
      setFailMessage("That doesn't look like a link — paste the full address, http and all.");
      setPhase("failed");
      return;
    }
    setPhase("parsing");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const draft = await UserRecipeAPI.importFromUrl(target);
      setDraft({
        mode: "import",
        source: "imported",
        sourceUrl: draft.sourceUrl,
        sourceName: draft.sourceName,
        title: draft.title,
        image: draft.image,
        category: draft.category,
        area: draft.area,
        servings: draft.servings || 4,
        ingredients: draft.ingredients,
        steps: draft.steps,
      });
      router.replace("/recipe/edit");
    } catch (error) {
      // Social imports (I1a) return user-ready copy in Otto's voice —
      // show it verbatim instead of flattening it into the generic line.
      setFailMessage(
        error.message?.startsWith("Otto ")
          ? error.message
          : error.message === "No recipe found on that page"
            ? "That page keeps its recipe well hidden — Otto couldn't find one."
            : "Otto couldn't read that page. Some sites just won't open the kitchen door."
      );
      setPhase("failed");
    }
  };

  // Paste-text import: same extraction pipeline as social captions, fed by
  // whatever the user copied (a DM, a note, an email). Source stays
  // "manual" — pasted words carry no link worth attributing.
  const [pastedText, setPastedText] = useState("");
  const startTextImport = async () => {
    const body = pastedText.trim();
    if (body.length < 40) {
      setFailMessage("Otto needs a little more than that — paste the whole recipe, ingredients and steps.");
      setPhase("failed");
      return;
    }
    setPhase("parsing");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const draft = await UserRecipeAPI.importFromText(body);
      setDraft({
        mode: "import",
        source: "manual",
        sourceUrl: null,
        sourceName: null,
        title: draft.title,
        image: null,
        category: draft.category || null,
        area: draft.area || null,
        servings: draft.servings || 4,
        ingredients: draft.ingredients,
        steps: draft.steps,
      });
      router.replace("/recipe/edit");
    } catch (error) {
      setFailMessage(
        error.message?.startsWith("Otto")
          ? error.message
          : "Otto couldn't sort that text into a recipe."
      );
      setPhase("failed");
    }
  };

  const writeMyself = (carryUrl) => {
    setDraft({
      mode: "manual",
      source: "manual",
      sourceUrl: carryUrl || null,
      title: "",
      image: null,
      category: null,
      area: null,
      servings: 4,
      ingredients: [],
      steps: [],
    });
    router.replace("/recipe/edit");
  };

  return (
    <View style={styles.container}>
      <ScreenHeader leftIcon="close" leftLabel="Close" onBack={() => router.back()} />

      {phase === "parsing" ? (
        <View style={styles.parsingWrap}>
          <OttoIdle source={require("../assets/mascot/otto-thinking-cut.png")} style={styles.otto} />
          <Text style={styles.parsingTitle}>Otto's reading it…</Text>
          <Text style={styles.parsingBody}>
            He'll pull out the ingredients and steps — check his work before it goes on the shelf.
          </Text>
        </View>
      ) : phase === "failed" ? (
        <View style={styles.failWrap}>
          <OttoIdle source={require("../assets/mascot/otto-sad-cut.png")} style={styles.otto} />
          <Text style={styles.parsingTitle}>That one got away</Text>
          <Text style={styles.parsingBody}>{failMessage}</Text>
          <Text style={styles.parsingBody}>
            Tip: links straight from the recipe page work best — not search results or videos.
          </Text>
          <Bounceable
            style={styles.primaryButton}
            containerStyle={{ alignSelf: "stretch", marginTop: 8 }}
            onPress={() => writeMyself(url.trim())}
            accessibilityRole="button"
            accessibilityLabel="Write the recipe myself instead"
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>Write it myself instead</Text>
          </Bounceable>
          <TouchableOpacity
            onPress={() => setPhase("pick")}
            accessibilityRole="button"
            accessibilityLabel="Try another link"
          >
            <Text style={styles.clipboardHint}>Try another link</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.ottoRow}>
              <OttoIdle
                source={require("../assets/mascot/otto-happy-cut.png")}
                style={styles.otto}
              />
              <Text style={styles.sheetTitle}>Add to your cookbook</Text>
              <Text style={styles.sheetSubtitle}>
                Found something good? Otto will copy it down.
              </Text>
            </View>

            <View style={styles.modeCard}>
              <View style={styles.modeTitleRow}>
                <Ionicons name="link" size={18} color={colors.accent} />
                <Text style={styles.modeTitle}>Paste a link</Text>
              </View>
              <Text style={styles.modeHint}>
                A recipe page from anywhere on the web — or a TikTok or Instagram post — Otto
                reads the ingredients and steps.
              </Text>
              {fromClipboard ? (
                <Text style={styles.clipboardHint}>Pasted — Otto spotted that link.</Text>
              ) : clipboardHasLink ? (
                <TouchableOpacity
                  onPress={pasteFromClipboard}
                  accessibilityRole="button"
                  accessibilityLabel="Paste the link from your clipboard"
                >
                  <Text style={styles.clipboardHint}>
                    Otto spotted a link on your clipboard — tap to paste it.
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setFromClipboard(false);
                }}
                placeholder="https://…"
                placeholderTextColor={colors.inkSoft}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                accessibilityLabel="Recipe link"
              />
              <Bounceable
                style={styles.primaryButton}
                onPress={startImport}
                accessibilityRole="button"
                accessibilityLabel="Import the recipe"
              >
                <Ionicons name="download-outline" size={18} color={colors.white} />
                <Text style={styles.primaryButtonText}>Import it</Text>
              </Bounceable>
            </View>

            <View style={styles.modeCard}>
              <View style={styles.modeTitleRow}>
                <Ionicons name="reader-outline" size={18} color={colors.accent} />
                <Text style={styles.modeTitle}>Paste the recipe itself</Text>
              </View>
              <Text style={styles.modeHint}>
                Copied out of a DM, a note or an email? Paste the words — Otto sorts them into
                ingredients and steps for you to check.
              </Text>
              <TextInput
                style={[styles.urlInput, styles.textArea]}
                value={pastedText}
                onChangeText={setPastedText}
                placeholder="Paste the whole thing — ingredients, steps and all."
                placeholderTextColor={colors.inkSoft}
                multiline
                accessibilityLabel="Recipe text"
              />
              <Bounceable
                style={styles.primaryButton}
                onPress={startTextImport}
                accessibilityRole="button"
                accessibilityLabel="Draft a recipe from the pasted text"
              >
                <Ionicons name="sparkles-outline" size={18} color={colors.white} />
                <Text style={styles.primaryButtonText}>Draft it</Text>
              </Bounceable>
            </View>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <Bounceable
              style={styles.secondaryButton}
              onPress={() => writeMyself(null)}
              accessibilityRole="button"
              accessibilityLabel="Write a recipe myself"
            >
              <Ionicons name="create-outline" size={18} color={colors.accent} />
              <Text style={styles.secondaryButtonText}>Write it myself</Text>
            </Bounceable>

            <TouchableOpacity
              style={styles.comingRow}
              onPress={() => setCoachOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="How to save recipes from TikTok and Instagram"
            >
              <Ionicons name="logo-tiktok" size={13} color={colors.inkSoft} />
              <Ionicons name="logo-instagram" size={13} color={colors.inkSoft} />
              <Text style={styles.comingText}>
                {shareLive
                  ? "Save straight from TikTok & Instagram — show me how"
                  : "Save straight from TikTok & Instagram — see how it'll work"}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={colors.inkSoft} />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ShareCoachSheet visible={coachOpen} onClose={() => setCoachOpen(false)} live={shareLive} />
    </View>
  );
};
export default AddScreen;
