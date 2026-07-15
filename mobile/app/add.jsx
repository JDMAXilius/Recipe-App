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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { createAddStyles } from "../assets/styles/add.styles";
import { UserRecipeAPI } from "../services/userRecipes";
import { setDraft } from "../lib/draftStore";
import OttoIdle from "../components/OttoIdle";
import Bounceable from "../components/Bounceable";

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
  const [fromClipboard, setFromClipboard] = useState(false);
  const [phase, setPhase] = useState("pick"); // pick | parsing | failed
  const [failMessage, setFailMessage] = useState("");

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
      setFailMessage(
        error.message === "No recipe found on that page"
          ? "That page keeps its recipe well hidden — Otto couldn't find one."
          : "Otto couldn't read that page. Some sites just won't open the kitchen door."
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

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
                A recipe page from anywhere on the web — Otto reads the ingredients and steps.
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

            <View style={styles.comingRow}>
              <Ionicons name="logo-tiktok" size={13} color={colors.inkSoft} />
              <Ionicons name="logo-instagram" size={13} color={colors.inkSoft} />
              <Text style={styles.comingText}>TikTok & Instagram share-in — coming soon.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};
export default AddScreen;
