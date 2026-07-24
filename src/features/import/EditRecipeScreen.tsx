import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button, OttoArt, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth } from '@/features/auth';
import { pickFromLibrary } from '@/shared/imagePicker';
import { RecipeInput } from './components/RecipeInput';
import {
  cloneDraft,
  draftToAsk,
  emptyDraft,
  emptyIngredient,
  isDirty,
  parseEditId,
  setOttoAsk,
  takeDraft,
  toSavePayload,
  type Draft,
} from './draft';
import {
  useDeleteRecipe,
  useRecipeDraft,
  useSaveRecipe,
  useUploadRecipePhoto,
} from './import.queries';

// ONE editor, two fill states (Crouton pattern): import-review arrives
// pre-filled ("Did Otto get this right?"), manual arrives blank. Steps are
// optional at save. Provenance is read-only — attribution never edits away.
// Loads from three sources, in order: an ?id= (edit an existing row) → the
// hand-off draft slot (import / write-it-myself from AddSheet) → blank manual.

const rowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: space[2] };
const addRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: space[1],
  marginTop: space[3],
  alignSelf: 'flex-start',
  paddingVertical: space[2],
};
const deleteRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space[2],
  paddingVertical: space[3],
};
// Compact Ask-Otto entry (mirrors the Discover dashboard row): tap → chat,
// carrying whatever's already typed. Row is ≥48pt tall via the art + padding.
const askOttoRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: space[3],
  backgroundColor: colors.creamDeep,
  borderRadius: radii.card,
  padding: space[3],
  paddingRight: space[4],
  marginBottom: space[4],
};
const askOttoArrow: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: radii.pill,
  backgroundColor: colors.terracotta,
  alignItems: 'center',
  justifyContent: 'center',
};
const photoDrop: ViewStyle = {
  backgroundColor: colors.accentSoft,
  borderRadius: radii.card,
  borderWidth: 1.5,
  borderStyle: 'dashed',
  borderColor: colors.terracotta,
  paddingVertical: space[6],
  alignItems: 'center',
  gap: space[1],
};

export function EditRecipeScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { user } = useAuth();
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const editId = parseEditId(idParam);

  const draftQuery = useRecipeDraft(editId);
  const saveMut = useSaveRecipe();
  const deleteMut = useDeleteRecipe();
  const uploadMut = useUploadRecipePhoto();

  // Non-edit: take the hand-off slot exactly once (or start blank). Edit mode
  // seeds from the query below.
  const [form, setForm] = useState<Draft | null>(() =>
    editId == null ? (takeDraft() ?? emptyDraft()) : null,
  );
  const [baseline, setBaseline] = useState<Draft | null>(() => (form ? cloneDraft(form) : null));

  useEffect(() => {
    if (editId != null && draftQuery.data && baseline == null) {
      setForm(draftQuery.data);
      setBaseline(cloneDraft(draftQuery.data));
    }
  }, [editId, draftQuery.data, baseline]);

  const [armDelete, setArmDelete] = useState(false);

  if (!form) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text role="body">Opening the recipe…</Text>
      </View>
    );
  }

  const patch = (next: Partial<Draft>) => setForm((f) => (f ? { ...f, ...next } : f));
  const dirty = baseline ? isDirty(form, baseline) : true;

  const setIngredient = (index: number, field: 'measure' | 'name', value: string) =>
    patch({
      ingredients: form.ingredients.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    });
  const removeIngredient = (index: number) =>
    patch({
      ingredients:
        form.ingredients.length > 1 ? form.ingredients.filter((_, i) => i !== index) : form.ingredients,
    });
  const setStep = (index: number, value: string) =>
    patch({ steps: form.steps.map((r, i) => (i === index ? value : r)) });
  const removeStep = (index: number) =>
    patch({ steps: form.steps.length > 1 ? form.steps.filter((_, i) => i !== index) : form.steps });

  // Ask Otto = hop to chat (the ＋ tab), carrying whatever's typed so far.
  // The rendered ask rides the same consume-once shelf pattern as the AddSheet
  // hand-off; the chat composer takes it on focus. An empty form just opens
  // a fresh chat — nothing to carry.
  const askOtto = () => {
    haptics.select();
    const ask = draftToAsk(form);
    if (ask) setOttoAsk(ask);
    router.push('/create');
  };

  // Pick a photo of the dish from the library → upload to the recipe-photos
  // bucket → set the public URL into the photo field (which the whole app already
  // renders). Library-only, matching the "choose from your library" copy; the
  // PHOTO LINK field below stays for pasting a picture URL instead.
  const addPhoto = async () => {
    const picked = await pickFromLibrary({ base64: true });
    if (!picked) return; // cancelled or permission denied — no error to throw
    if (!picked.base64) {
      show("Couldn't read that photo — try another.", 'error');
      return;
    }
    try {
      const url = await uploadMut.mutateAsync({ base64: picked.base64, mimeType: picked.mimeType });
      patch({ image: url });
      show('Photo added.', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : "Couldn't upload the photo. Try again.", 'error');
    }
  };

  const save = async () => {
    const result = toSavePayload(form);
    if (!result.ok) {
      show(result.error, 'error');
      return;
    }
    if (!user) {
      show('Sign in to save recipes to your cookbook.', 'error');
      return;
    }
    try {
      const id = await saveMut.mutateAsync({ id: editId, userId: user.id, recipe: result.recipe });
      haptics.notify('success');
      show(editId != null ? 'Changes saved.' : "On the shelf — it's in your cookbook.", 'success');
      if (editId != null) router.back();
      else router.replace(`/recipe/u-${id}`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Couldn’t save. Try again.', 'error');
    }
  };

  // Delete = two taps (native Alert is a web no-op): first arms with a toast,
  // second within 4s actually deletes.
  const confirmDelete = async () => {
    if (editId == null) return;
    if (!armDelete) {
      setArmDelete(true);
      show('Tap delete again to remove this recipe for good.', 'info');
      setTimeout(() => setArmDelete(false), 4000);
      return;
    }
    if (!user) return;
    try {
      await deleteMut.mutateAsync({ id: editId, userId: user.id });
      haptics.notify('warning');
      show('Gone — Otto tore out the page.', 'success');
      router.replace('/cookbook');
    } catch (err) {
      show(err instanceof Error ? err.message : "Couldn’t delete it. Try again.", 'error');
    }
  };

  const heading = form.mode === 'edit' ? 'Edit recipe' : form.mode === 'import' ? "Check Otto's work" : 'New recipe';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.cream }}
    >
      <ScrollView
        contentContainerStyle={{ padding: space[5], paddingBottom: space[7] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: space[4] }}>
          <Text role="display">{heading}</Text>
        </View>

        {/* Manual creation only — not import review ("Check Otto's work") or edit. */}
        {editId == null && form.mode !== 'import' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask Otto — he picks up from what you have typed"
            onPress={askOtto}
            style={askOttoRow}
          >
            <OttoArt name="happy" size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text role="body">Ask Otto</Text>
              <Text role="caption">He’ll pick up from whatever you’ve typed here.</Text>
            </View>
            <View style={askOttoArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </View>
          </Pressable>
        )}

        {form.mode === 'import' && (
          <View style={{ marginBottom: space[4] }}>
            <Text role="body">
              {form.source === 'otto'
                ? 'Otto dreamed this one up. Tweak anything, then save it to the shelf.'
                : 'Did Otto get this right? Fix anything that reads oddly, then save it.'}
            </Text>
          </View>
        )}

        <RecipeInput
          value={form.title}
          onChangeText={(t) => patch({ title: t })}
          placeholder="What's it called?"
          label="TITLE"
          accessibilityLabel="Recipe title"
        />

        <View style={{ marginTop: space[4], marginBottom: space[2] }}>
          <Text role="caption">PHOTO</Text>
        </View>
        {form.image.trim() ? (
          <Pressable
            onPress={addPhoto}
            disabled={uploadMut.isPending}
            accessibilityRole="button"
            accessibilityLabel="Change the recipe photo"
          >
            <Image
              source={{ uri: form.image }}
              style={{ width: '100%', height: 180, borderRadius: radii.card }}
              contentFit="cover"
            />
          </Pressable>
        ) : (
          <Pressable
            style={photoDrop}
            onPress={addPhoto}
            disabled={uploadMut.isPending}
            accessibilityRole="button"
            accessibilityLabel="Upload a photo of the dish"
          >
            <Ionicons
              name={uploadMut.isPending ? 'cloud-upload-outline' : 'camera-outline'}
              size={26}
              color={colors.terracotta}
            />
            <Text role="computed">
              {uploadMut.isPending ? 'Uploading…' : 'Upload a photo of the dish'}
            </Text>
            <Text role="caption">Tap to choose from your library</Text>
          </Pressable>
        )}

        <View style={{ marginTop: space[3], marginBottom: space[2] }}>
          <Text role="caption">Or paste a link to a picture</Text>
        </View>
        <RecipeInput
          value={form.image}
          onChangeText={(t) => patch({ image: t })}
          placeholder="https://… a picture of the dish"
          accessibilityLabel="Photo link"
          keyboardType="url"
        />

        <RecipeInput
          value={form.category}
          onChangeText={(t) => patch({ category: t })}
          placeholder="Chicken, Dessert…"
          label="KIND OF DISH"
          accessibilityLabel="Category"
        />

        <RecipeInput
          value={form.area}
          onChangeText={(t) => patch({ area: t })}
          placeholder="Italian, Thai…"
          label="CUISINE"
          accessibilityLabel="Cuisine"
        />

        <View style={{ marginTop: space[4], marginBottom: space[2] }}>
          <Text role="caption">SERVINGS</Text>
        </View>
        <View style={[rowStyle, { gap: space[4] }]}>
          <Button
            title="−"
            onPress={() => patch({ servings: Math.max(1, form.servings - 1) })}
            variant="secondary"
          />
          <Text role="title">{String(form.servings)}</Text>
          <Button
            title="+"
            onPress={() => patch({ servings: Math.min(24, form.servings + 1) })}
            variant="secondary"
          />
        </View>

        <View style={{ marginTop: space[5], marginBottom: space[2] }}>
          <Text role="caption">INGREDIENTS</Text>
        </View>
        {form.ingredients.map((row, index) => (
          <View key={index} style={[rowStyle, { marginBottom: space[2] }]}>
            <View style={{ width: 96 }}>
              <RecipeInput
                value={row.measure}
                onChangeText={(t) => setIngredient(index, 'measure', t)}
                placeholder={row.name.trim() ? 'amount' : '500 g'}
                accessibilityLabel={`Ingredient ${index + 1} amount`}
              />
            </View>
            <View style={{ flex: 1 }}>
              <RecipeInput
                value={row.name}
                onChangeText={(t) => setIngredient(index, 'name', t)}
                placeholder="plain flour"
                accessibilityLabel={`Ingredient ${index + 1} name`}
              />
            </View>
            <Pressable
              onPress={() => {
                haptics.select();
                removeIngredient(index);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Remove ingredient ${index + 1}`}
              style={{ padding: space[2] }}
            >
              <Ionicons name="close-circle" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={addRow}
          onPress={() => {
            haptics.select();
            patch({ ingredients: [...form.ingredients, emptyIngredient()] });
          }}
          accessibilityRole="button"
          accessibilityLabel="Add an ingredient"
        >
          <Ionicons name="add" size={18} color={colors.terracotta} />
          <Text role="computed">Add ingredient</Text>
        </Pressable>

        <View style={{ marginTop: space[5], marginBottom: space[2] }}>
          <Text role="caption">STEPS (OPTIONAL)</Text>
        </View>
        {form.steps.map((step, index) => (
          <View key={index} style={[rowStyle, { marginBottom: space[2], alignItems: 'flex-start' }]}>
            <View style={{ paddingTop: space[3] }}>
              <Text role="computed">{String(index + 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <RecipeInput
                value={step}
                onChangeText={(t) => setStep(index, t)}
                placeholder="What happens next?"
                accessibilityLabel={`Step ${index + 1}`}
                multiline
              />
            </View>
            <Pressable
              onPress={() => {
                haptics.select();
                removeStep(index);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Remove step ${index + 1}`}
              style={{ padding: space[2], paddingTop: space[3] }}
            >
              <Ionicons name="close-circle" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={addRow}
          onPress={() => {
            haptics.select();
            patch({ steps: [...form.steps, ''] });
          }}
          accessibilityRole="button"
          accessibilityLabel="Add a step"
        >
          <Ionicons name="add" size={18} color={colors.terracotta} />
          <Text role="computed">Add step</Text>
        </Pressable>

        {form.sourceUrl != null ? (
          <View style={{ marginTop: space[5] }}>
            <Text role="caption">
              From {form.sourceName ?? form.sourceUrl} — the credit stays with the recipe.
            </Text>
          </View>
        ) : form.source === 'otto' ? (
          <View style={{ marginTop: space[5] }}>
            <Text role="caption">Cooked up with Otto — checked and kept by you.</Text>
          </View>
        ) : null}

        <View style={{ marginTop: space[6], gap: space[3] }}>
          <Button
            title={
              saveMut.isPending
                ? 'Saving…'
                : editId != null
                  ? 'Save changes'
                  : 'Save to my cookbook'
            }
            onPress={save}
            variant="primary"
            size="lg"
            loading={saveMut.isPending}
            disabled={editId != null && !dirty}
          />
          {editId != null && (
            <Pressable
              style={deleteRow}
              onPress={confirmDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete recipe"
            >
              <Ionicons
                name={armDelete ? 'trash' : 'trash-outline'}
                size={20}
                color={colors.danger}
              />
              <Text role="body">{armDelete ? 'Tap again to delete' : 'Delete recipe'}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
