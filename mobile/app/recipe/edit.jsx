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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { createAddStyles } from "../../assets/styles/add.styles";
import { UserRecipeAPI, isUserRecipeId } from "../../services/userRecipes";
import { uploadRecipePhoto } from "../../lib/uploadRecipePhoto";
import { formatIngredientLine } from "../../lib/foodScale";
import { takeDraft } from "../../lib/draftStore";
import LoadingSpinner from "../../components/LoadingSpinner";
import Bounceable from "../../components/Bounceable";

// ONE editor, two fill states (Crouton pattern): import-review arrives
// pre-filled ("Did Otto get this right?"), manual arrives blank. Steps are
// optional at save (Yazio). Source fields are read-only — attribution never
// edits away.

const emptyIngredient = () => ({ measure: "", name: "" });

// Live weight-first preview: the author sees what readers will see ("2 cups
// flour" → "reads as 240 g") and a parse miss surfaces while typing, not on
// the shelf. Only shown when the conversion actually changes the amount.
const weightPreview = (row) => {
  const measure = (row.measure || "").trim();
  const name = (row.name || "").trim();
  if (!measure || !name) return null;
  try {
    const r = formatIngredientLine(measure, name);
    if (r.kind !== "weight" && r.kind !== "volume-ml") return null;
    if (r.display.replace(/\s+/g, "") === measure.replace(/\s+/g, "")) return null;
    return r.display;
  } catch {
    return null;
  }
};

const RecipeEditScreen = () => {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams();
  const { colors } = useTheme();
  const { show } = useToast();
  const styles = useMemo(() => createAddStyles(colors), [colors]);
  const safeBottom = Math.max(useSafeAreaInsets().bottom, 24);

  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("manual"); // manual | import | edit
  const [source, setSource] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState(null);
  const [sourceName, setSourceName] = useState(null);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [steps, setSteps] = useState([""]);

  useEffect(() => {
    if (editId && !isUserRecipeId(editId)) {
      // stale/foreign deep link — fall through to a blank manual editor
      setLoading(false);
      return;
    }
    if (editId && isUserRecipeId(editId)) {
      (async () => {
        try {
          const row = await UserRecipeAPI.get(editId);
          setMode("edit");
          setSource(row.source);
          setSourceUrl(row.sourceUrl);
          setSourceName(row.sourceName);
          setTitle(row.title || "");
          setImage(row.image || "");
          setCategory(row.category || "");
          setArea(row.area || "");
          setServings(row.servings || 4);
          setIngredients(row.ingredients?.length ? row.ingredients : [emptyIngredient()]);
          setSteps(row.steps?.length ? row.steps : [""]);
        } catch {
          show({ message: "Couldn't open that recipe for editing." });
          router.back();
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    const draft = takeDraft();
    if (draft) {
      setMode(draft.mode);
      setSource(draft.source);
      setSourceUrl(draft.sourceUrl || null);
      setSourceName(draft.sourceName || null);
      setTitle(draft.title || "");
      setImage(draft.image || "");
      setCategory(draft.category || "");
      setArea(draft.area || "");
      setServings(draft.servings || 4);
      setIngredients(draft.ingredients?.length ? draft.ingredients : [emptyIngredient()]);
      setSteps(draft.steps?.length ? draft.steps : [""]);
    }
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setIngredient = (index, field, value) =>
    setIngredients((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  const removeIngredient = (index) =>
    setIngredients((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  const setStep = (index, value) =>
    setSteps((rows) => rows.map((r, i) => (i === index ? value : r)));
  const removeStep = (index) =>
    setSteps((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));

  // Delete = two taps (Alert.alert is a web no-op — QA rule): first arms it
  // with a toast, second within 4s actually deletes.
  const [armDelete, setArmDelete] = useState(false);
  const confirmDelete = async () => {
    if (!armDelete) {
      setArmDelete(true);
      show({ message: "Tap the bin again to delete this recipe for good." });
      setTimeout(() => setArmDelete(false), 4000);
      return;
    }
    try {
      await UserRecipeAPI.remove(editId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      show({ message: "Gone — Otto tore out the page." });
      // pop the whole stack (the detail screen underneath is a ghost now)
      if (router.dismissAll) router.dismissAll();
      router.replace("/(tabs)/cookbook");
    } catch (error) {
      show({ message: error.message || "Couldn't delete it. Try again." });
    }
  };

  // Upload a real photo from the device so the dish has a picture even when
  // there's no link to paste. Library-only (a saved recipe rarely wants the
  // live camera); the pasted-link field below stays as an alternative.
  const pickPhoto = async () => {
    if (uploading) return;
    try {
      const ImagePicker = await import("expo-image-picker");
      if (Platform.OS !== "web") {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          show({ message: "Otto needs photo access — turn it on in Settings to add a picture." });
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });
      const asset = result?.assets?.[0];
      if (result?.canceled || !asset) return;
      if (!asset.base64) {
        show({ message: "Couldn't read that photo — try another." });
        return;
      }
      setUploading(true);
      const ext = (asset.fileName || asset.uri || "").split(".").pop();
      const url = await uploadRecipePhoto(asset.base64, ext);
      setImage(url);
      Haptics.selectionAsync().catch(() => {});
      show({ message: "Photo added." });
    } catch (error) {
      show({ message: error?.message || "Couldn't upload the photo. Try again." });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      show({ message: "Give it a name first — even 'Tuesday soup' works." });
      return;
    }
    setSaving(true);
    const payload = {
      source,
      sourceUrl,
      sourceName,
      title: cleanTitle,
      image: image.trim() || null,
      category: category.trim() || null,
      area: area.trim() || null,
      servings,
      ingredients: ingredients
        .map((p) => ({ measure: p.measure.trim(), name: p.name.trim() }))
        .filter((p) => p.name),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (mode === "edit") {
        await UserRecipeAPI.update(editId, payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        show({ message: "Changes saved." });
        router.back();
      } else {
        const row = await UserRecipeAPI.create(payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        show({ message: "On the shelf — it's in your cookbook." });
        router.replace(`/recipe/u-${row.id}`);
      }
    } catch (error) {
      show({ message: error.message || "We dropped the pan — couldn't save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Opening the recipe..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Ionicons name="close" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.editorHeaderTitle}>
          {mode === "edit" ? "Edit recipe" : mode === "import" ? "Check Otto's work" : "New recipe"}
        </Text>
        {mode === "edit" ? (
          <TouchableOpacity
            onPress={confirmDelete}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Delete recipe"
          >
            <Ionicons
              name={armDelete ? "trash" : "trash-outline"}
              size={20}
              color={armDelete ? colors.accent : colors.inkSoft}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {mode === "import" && (
            <View style={styles.reviewBanner}>
              <Ionicons name="paw" size={16} color={colors.accent} />
              <Text style={styles.reviewBannerText}>
                Did Otto get this right? Fix anything that reads oddly, then save it to the shelf.
              </Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What's it called?"
            placeholderTextColor={colors.inkSoft}
            accessibilityLabel="Recipe title"
          />

          <Text style={styles.fieldLabel}>PHOTO</Text>
          {image ? (
            <TouchableOpacity
              onPress={pickPhoto}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Change the recipe photo"
            >
              <Image source={{ uri: image }} style={styles.heroPreview} contentFit="cover" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.photoDrop}
              onPress={pickPhoto}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Upload a photo of the dish"
            >
              <Ionicons
                name={uploading ? "cloud-upload-outline" : "camera-outline"}
                size={26}
                color={colors.accent}
              />
              <Text style={styles.photoDropText}>
                {uploading ? "Uploading…" : "Upload a photo of the dish"}
              </Text>
              <Text style={styles.photoDropHint}>Tap to choose from your library</Text>
            </TouchableOpacity>
          )}
          {image ? (
            <TouchableOpacity
              style={styles.photoAction}
              onPress={pickPhoto}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Change the recipe photo"
            >
              <Ionicons
                name={uploading ? "cloud-upload-outline" : "swap-horizontal-outline"}
                size={15}
                color={colors.accent}
              />
              <Text style={styles.photoActionText}>
                {uploading ? "Uploading…" : "Change photo"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.photoHint}>Or paste a link to a picture</Text>
          <TextInput
            style={styles.textInput}
            value={image}
            onChangeText={setImage}
            placeholder="https://… a picture of the dish"
            placeholderTextColor={colors.inkSoft}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Photo link"
          />

          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>KIND OF DISH</Text>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="Chicken, Dessert…"
                placeholderTextColor={colors.inkSoft}
                accessibilityLabel="Category"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>CUISINE</Text>
              <TextInput
                style={styles.textInput}
                value={area}
                onChangeText={setArea}
                placeholder="Italian, Thai…"
                placeholderTextColor={colors.inkSoft}
                accessibilityLabel="Cuisine"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>SERVINGS</Text>
          <View style={styles.servesRow}>
            <TouchableOpacity
              style={styles.servesButton}
              onPress={() => setServings((s) => Math.max(1, s - 1))}
              accessibilityRole="button"
              accessibilityLabel="Decrease servings"
            >
              <Text style={styles.servesButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.servesValue}>{servings}</Text>
            <TouchableOpacity
              style={styles.servesButton}
              onPress={() => setServings((s) => Math.min(24, s + 1))}
              accessibilityRole="button"
              accessibilityLabel="Increase servings"
            >
              <Text style={styles.servesButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>INGREDIENTS</Text>
          {ingredients.map((row, index) => (
            <View key={index}>
            <View style={styles.ingRow}>
              <TextInput
                style={styles.measureInput}
                value={row.measure}
                onChangeText={(t) => setIngredient(index, "measure", t)}
                placeholder="500 g"
                placeholderTextColor={colors.inkSoft}
                accessibilityLabel={`Ingredient ${index + 1} amount`}
              />
              <TextInput
                style={styles.nameInput}
                value={row.name}
                onChangeText={(t) => setIngredient(index, "name", t)}
                placeholder="plain flour"
                placeholderTextColor={colors.inkSoft}
                accessibilityLabel={`Ingredient ${index + 1} name`}
              />
              <TouchableOpacity
                style={styles.rowDelete}
                onPress={() => removeIngredient(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ingredient ${index + 1}`}
              >
                <Ionicons name="close-circle" size={20} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>
            {weightPreview(row) ? (
              <Text style={styles.ingPreview}>reads as {weightPreview(row)}</Text>
            ) : null}
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRowButton}
            onPress={() => setIngredients((rows) => [...rows, emptyIngredient()])}
            accessibilityRole="button"
            accessibilityLabel="Add an ingredient"
          >
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.addRowText}>Add ingredient</Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>STEPS (OPTIONAL — ADD THEM LATER IF YOU LIKE)</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.stepInput}
                value={step}
                onChangeText={(t) => setStep(index, t)}
                placeholder="What happens next?"
                placeholderTextColor={colors.inkSoft}
                multiline
                accessibilityLabel={`Step ${index + 1}`}
              />
              <TouchableOpacity
                style={styles.rowDelete}
                onPress={() => removeStep(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove step ${index + 1}`}
              >
                <Ionicons name="close-circle" size={20} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addRowButton}
            onPress={() => setSteps((rows) => [...rows, ""])}
            accessibilityRole="button"
            accessibilityLabel="Add a step"
          >
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.addRowText}>Add step</Text>
          </TouchableOpacity>

          {sourceUrl && (
            <Text style={styles.sourceNote}>
              From {sourceName || sourceUrl} — the credit stays with the recipe.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footerBar, { paddingBottom: safeBottom }]}>
        <Bounceable
          style={styles.primaryButton}
          containerStyle={{ flex: 1 }}
          onPress={saving ? undefined : save}
          accessibilityRole="button"
          accessibilityLabel="Save to my cookbook"
        >
          <Ionicons name="checkmark" size={20} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save to my cookbook"}
          </Text>
        </Bounceable>
      </View>
    </View>
  );
};
export default RecipeEditScreen;
