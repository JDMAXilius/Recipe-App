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
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth } from '@/features/auth';
import { RecipeInput } from './components/RecipeInput';
import {
  cloneDraft,
  emptyDraft,
  emptyIngredient,
  isDirty,
  takeDraft,
  toSavePayload,
  type Draft,
} from './draft';
import {
  useDeleteRecipe,
  useGenerateRecipe,
  useRecipeDraft,
  useSaveRecipe,
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
const panel: ViewStyle = {
  backgroundColor: colors.creamDeep,
  borderRadius: radii.card,
  padding: space[4],
  gap: space[3],
  marginBottom: space[4],
};

export function EditRecipeScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { user } = useAuth();
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const editId = idParam != null && /^\d+$/.test(idParam) ? Number(idParam) : null;

  const draftQuery = useRecipeDraft(editId);
  const saveMut = useSaveRecipe();
  const deleteMut = useDeleteRecipe();
  const generateMut = useGenerateRecipe();

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
  const [wish, setWish] = useState('');

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

  const cookWithOtto = async () => {
    const ask = wish.trim();
    if (ask.length < 3) {
      show('Tell Otto a little more — what kind of dish, for how many?', 'info');
      return;
    }
    try {
      const draft = await generateMut.mutateAsync({ prompt: ask, servings: form.servings });
      // Keep the editor open in review mode with Otto's draft filled in.
      setForm({ ...draft, mode: 'import', source: 'otto' });
      setWish('');
      show("Otto wrote it out — check his work, then save it.", 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : "Otto couldn't finish that idea.", 'error');
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

        {form.mode === 'manual' && (
          <View style={panel}>
            <Text role="title">Cook something up with Otto</Text>
            <Text role="caption">
              Describe the dish — Otto writes the whole recipe into this form for you to tweak and
              save.
            </Text>
            <RecipeInput
              value={wish}
              onChangeText={setWish}
              placeholder="What are you hungry for?"
              accessibilityLabel="Describe the recipe you want"
              multiline
            />
            <Button
              title={generateMut.isPending ? 'Otto’s cooking…' : 'Cook it up'}
              onPress={cookWithOtto}
              variant="primary"
              loading={generateMut.isPending}
            />
          </View>
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

        <RecipeInput
          value={form.image}
          onChangeText={(t) => patch({ image: t })}
          placeholder="https://… a picture of the dish"
          label="PHOTO LINK"
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
