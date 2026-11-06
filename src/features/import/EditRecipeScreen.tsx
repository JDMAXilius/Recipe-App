import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button, OttoArt, Sheet, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth } from '@/features/auth';
import { pickFromLibrary } from '@/shared/imagePicker';
import { showActionSheet } from '@/shared/actionSheet';
import { RecipeInput } from './components/RecipeInput';
import { insertAfter, moveBy } from './editor.logic';
import { SnapSummary } from './components/SnapSummary';
import { MAX_SERVINGS, formatYield, parseYield, singular, unitLabel } from '@/shared/yield';
import { flags, openOtto } from '@/shared/flags';
import {
  cloneDraft,
  draftToAsk,
  emptyDraft,
  emptyIngredient,
  isDirty,
  parseEditId,
  setOttoAsk,
  takeDraft,
  splitDataUri,
  toSavePayload,
  type Draft,
} from './draft';
import {
  useDeleteRecipe,
  useRecipeDraft,
  useSaveRecipe,
  useUploadRecipePhoto,
} from './import.queries';
import { track } from '@/shared/track';

// ONE editor, two fill states (Crouton pattern): import-review arrives
// pre-filled ("Review import"), manual arrives blank. Steps are
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
const backBtn: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: radii.pill,
  backgroundColor: colors.creamDeep,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: space[3],
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

// "allrecipes.com" from "https://www.allrecipes.com/recipe/…"; null if unparseable.
function sourceDomain(url: string): string | null {
  const m = /^https?:\/\/(?:www\.)?([^/?#:]+)/i.exec(url.trim());
  return m ? m[1].toLowerCase() : null;
}

export function EditRecipeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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
  // The Makes field's raw text, so typing "2 lo…" isn't fought by parsing.
  const [sizeText, setSizeText] = useState(() => (form?.size ? formatYield(form.size.yield) : ''));

  useEffect(() => {
    if (editId != null && draftQuery.data && baseline == null) {
      setForm(draftQuery.data);
      setSizeText(draftQuery.data.size ? formatYield(draftQuery.data.size.yield) : '');
      setBaseline(cloneDraft(draftQuery.data));
    }
  }, [editId, draftQuery.data, baseline]);

  // Back / edge-swipe with unsaved edits asks first (HIG: confirm before
  // discarding user content). Save and delete leave on purpose, so they set
  // `leaving` and pass straight through — a state reset would land too late.
  const leaving = useRef(false);
  const unsaved = form != null && baseline != null && isDirty(form, baseline);
  usePreventRemove(unsaved, ({ data }) => {
    if (leaving.current) return navigation.dispatch(data.action);
    void showActionSheet({
      options: ['Discard changes'],
      destructiveIndex: 0,
      cancelLabel: 'Keep editing',
    }).then((i) => i === 0 && navigation.dispatch(data.action));
  });

  const [aboutOpen, setAboutOpen] = useState(false);
  // R6.7: the ingredient row a return just added, so its name field opens focused.
  const [focusRow, setFocusRow] = useState<number | null>(null);
  // R6.7: stable row keys (flowV2), moved with their rows, so a moved row keeps
  // its own field and VoiceOver focus follows it. Index keys would hand the
  // focused handle to whichever row slid into its place.
  const ingKeys = useRef<number[]>([]);
  const stepKeys = useRef<number[]>([]);
  const nextKey = useRef(0);
  // The picture-link field hides behind the Add photo tap (UX audit 07).
  const [photoTapped, setPhotoTapped] = useState(false);

  if (!form) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text role="body">Opening the recipe…</Text>
      </View>
    );
  }

  const patch = (next: Partial<Draft>) => setForm((f) => (f ? { ...f, ...next } : f));
  const syncKeys = (ref: { current: number[] }, n: number) => {
    while (ref.current.length < n) ref.current.push(nextKey.current++);
    if (ref.current.length > n) ref.current.length = n;
  };
  syncKeys(ingKeys, form.ingredients.length);
  syncKeys(stepKeys, form.steps.length);

  const setIngredient = (index: number, field: 'measure' | 'name', value: string) =>
    patch({
      ingredients: form.ingredients.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    });
  const removeIngredient = (index: number) => {
    if (form.ingredients.length > 1) ingKeys.current.splice(index, 1);
    patch({
      ingredients:
        form.ingredients.length > 1 ? form.ingredients.filter((_, i) => i !== index) : form.ingredients,
    });
  };
  const setStep = (index: number, value: string) =>
    patch({ steps: form.steps.map((r, i) => (i === index ? value : r)) });
  const removeStep = (index: number) => {
    if (form.steps.length > 1) stepKeys.current.splice(index, 1);
    patch({ steps: form.steps.length > 1 ? form.steps.filter((_, i) => i !== index) : form.steps });
  };

  // R6.7 (flowV2): move a row up or down — long-press the handle, or the
  // VoiceOver actions on it. A drag gesture can come later; this works today
  // and for everyone.
  const announceMove = (what: string, index: number, by: number, count: number) => {
    const to = index + by;
    if (to >= 0 && to < count) AccessibilityInfo.announceForAccessibility(`${what} moved to position ${to + 1}`);
  };
  const moveIngredient = (index: number, by: number) => {
    haptics.select();
    ingKeys.current = moveBy(ingKeys.current, index, by);
    patch({ ingredients: moveBy(form.ingredients, index, by) });
    announceMove('Ingredient', index, by, form.ingredients.length);
  };
  const moveStep = (index: number, by: number) => {
    haptics.select();
    stepKeys.current = moveBy(stepKeys.current, index, by);
    patch({ steps: moveBy(form.steps, index, by) });
    announceMove('Step', index, by, form.steps.length);
  };
  const moveMenu = async (what: string, index: number, count: number, move: (i: number, by: number) => void) => {
    const options = [index > 0 ? 'Move up' : null, index < count - 1 ? 'Move down' : null].filter(Boolean) as string[];
    if (!options.length) return;
    const pick = await showActionSheet({ title: `${what} ${index + 1}`, options });
    if (pick == null) return;
    move(index, options[pick] === 'Move up' ? -1 : 1);
  };

  // Ask Otto = hop to chat (the ＋ tab), carrying whatever's typed so far.
  // The rendered ask rides the same consume-once shelf pattern as the AddSheet
  // hand-off; the chat composer takes it on focus. An empty form just opens
  // a fresh chat — nothing to carry.
  const askOtto = () => {
    haptics.select();
    const ask = draftToAsk(form);
    if (ask) setOttoAsk(ask);
    openOtto(router);
  };

  // Pick a photo of the dish from the library → upload to the recipe-photos
  // bucket → set the public URL into the photo field (which the whole app already
  // renders). Library-only, matching the "choose from your library" copy; the
  // PHOTO LINK field below stays for pasting a picture URL instead.
  const addPhoto = async () => {
    setPhotoTapped(true);
    const picked = await pickFromLibrary({ base64: true });
    if (typeof picked === 'string') return; // cancelled — no error to throw
    if (!picked.base64) {
      show("Couldn't read that photo. Try another.", 'error');
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
    // A snapped meal's photo is uploaded only now, when the user keeps it.
    let toSave = form;
    const pending = splitDataUri(form.image);
    if (pending && user) {
      try {
        const url = await uploadMut.mutateAsync(pending);
        toSave = { ...form, image: url };
        patch({ image: url });
      } catch {
        show('Couldn’t upload the photo. Saving the recipe without it.', 'info');
        toSave = { ...form, image: '' };
      }
    }
    const result = toSavePayload(toSave);
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
      if (form.snap && editId == null) track('recipe_from_photo_saved', { edited: unsaved });
      haptics.notify('success');
      show(editId != null ? 'Changes saved.' : 'Saved to your cookbook.', 'success');
      leaving.current = true;
      if (editId != null) router.back();
      else router.replace(`/recipe/u-${id}`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Couldn’t save. Try again.', 'error');
    }
  };

  // Delete confirms in a native action sheet with a red "Delete recipe" — not a
  // second tap against a timed toast that VoiceOver users can't reach in time.
  const confirmDelete = async () => {
    if (editId == null || !user) return;
    const choice = await showActionSheet({
      message: 'This removes the recipe from your cookbook for good.',
      options: ['Delete recipe'],
      destructiveIndex: 0,
    });
    if (choice !== 0) return;
    try {
      await deleteMut.mutateAsync({ id: editId, userId: user.id });
      haptics.notify('warning');
      show('Gone. Otto tore out the page.', 'success');
      leaving.current = true;
      router.replace('/cookbook');
    } catch (err) {
      show(err instanceof Error ? err.message : "Couldn’t delete it. Try again.", 'error');
    }
  };

  const heading = form.mode === 'edit' ? 'Edit recipe' : form.mode === 'import' ? 'Review import' : 'New recipe';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.cream }}
    >
      <ScrollView
        contentContainerStyle={{ padding: space[5], paddingBottom: space[7] }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/cookbook'))}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>

        <View style={{ marginBottom: space[4] }}>
          <Text role="display">{heading}</Text>
        </View>

        {form.snap && <SnapSummary snap={form.snap} size={form.size ?? null} servings={form.servings} />}

        {/* Manual creation and edit — not import review ("Review import"). */}
        {form.mode !== 'import' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={flags.flowV2 ? 'Otto, fill the gaps. He picks up from what you have typed' : 'Ask Otto. He picks up from what you have typed'}
            onPress={askOtto}
            style={askOttoRow}
          >
            <OttoArt name="happy" size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text role="body">{flags.flowV2 ? 'Otto, fill the gaps' : 'Ask Otto'}</Text>
              <Text role="caption">He’ll pick up from whatever you’ve typed here.</Text>
            </View>
            <View style={askOttoArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </View>
          </Pressable>
        )}

        {form.mode === 'import' && (
          <Pressable
            onPress={() => setAboutOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="AI-read. Check amounts and temperatures. More info"
            hitSlop={8}
            style={[rowStyle, { marginBottom: space[4], alignSelf: 'flex-start' }]}
          >
            <Text role="caption">AI-read · check amounts and temperatures</Text>
            <Ionicons name="information-circle-outline" size={18} color={colors.inkSoft} />
          </Pressable>
        )}
        {/* A8 (ticket §Section A): every recipe on this screen was written or
            read by a machine. Allergens and food safety are the cook's call, and
            that has to be said here — where the AI's work is being reviewed —
            not only in the Terms nobody opens. One line + (i), the full warning
            in the sheet. */}
        <Sheet visible={aboutOpen} onClose={() => setAboutOpen(false)} title="AI-read">
          <Text role="body">
            Otto can misread an ingredient or a temperature. Check anything that matters —
            allergies, raw eggs, cooking temperatures — before you cook it.
          </Text>
        </Sheet>

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
            accessibilityLabel="Add photo"
          >
            <Ionicons
              name={uploadMut.isPending ? 'cloud-upload-outline' : 'camera-outline'}
              size={26}
              color={colors.terracotta}
            />
            <Text role="computed">{uploadMut.isPending ? 'Uploading…' : 'Add photo'}</Text>
          </Pressable>
        )}

        {(photoTapped || form.image.trim() !== '') && (
          <>
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
          </>
        )}

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
          <Text role="caption">
            {form.size ? `SERVINGS · ${unitLabel(form.size.servingUnit, form.servings).toUpperCase()}` : 'SERVINGS'}
          </Text>
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
            onPress={() => patch({ servings: Math.min(MAX_SERVINGS, form.servings + 1) })}
            variant="secondary"
          />
        </View>

        {/* Recipe size (ADR-0013): what the batch is and the unit a serving
            counts in. Editable, so a scan's guess can be put right. */}
        {(flags.flowV2 || form.size) && (
          <View style={[rowStyle, { gap: space[3], marginTop: space[3] }]}>
            <View style={{ flex: 1 }}>
              <RecipeInput
                value={sizeText}
                onChangeText={(t) => {
                  setSizeText(t);
                  const y = parseYield(t);
                  patch({ size: y ? { yield: y, servingUnit: form.size?.servingUnit ?? 'serving' } : null });
                }}
                placeholder="1 loaf"
                label="MAKES"
                accessibilityLabel="What the recipe makes, for example 1 loaf"
              />
            </View>
            <View style={{ flex: 1 }}>
              <RecipeInput
                value={form.size?.servingUnit ?? ''}
                onChangeText={(t) => form.size && patch({ size: { ...form.size, servingUnit: singular(t) || 'serving' } })}
                placeholder="slice"
                label="SERVED AS"
                accessibilityLabel="The unit one serving is counted in, for example slice"
              />
            </View>
          </View>
        )}

        <View style={{ marginTop: space[5], marginBottom: space[2] }}>
          <Text role="caption">INGREDIENTS</Text>
        </View>
        {form.ingredients.map((row, index) => (
          <View key={flags.flowV2 ? ingKeys.current[index] : index} style={[rowStyle, { marginBottom: space[2] }]}>
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
                autoFocus={flags.flowV2 && index === focusRow && index > 0}
                returnKeyType={flags.flowV2 && index === form.ingredients.length - 1 ? 'next' : undefined}
                onSubmitEditing={
                  flags.flowV2 && index === form.ingredients.length - 1 && row.name.trim()
                    ? () => {
                        ingKeys.current = insertAfter(ingKeys.current, index, nextKey.current++);
                        patch({ ingredients: insertAfter(form.ingredients, index, emptyIngredient()) });
                        setFocusRow(index + 1);
                      }
                    : undefined
                }
              />
            </View>
            {flags.flowV2 && form.ingredients.length > 1 && (
              <MoveHandle
                label={`Ingredient ${index + 1}`}
                onMenu={() => void moveMenu('Ingredient', index, form.ingredients.length, moveIngredient)}
                onMove={(by) => moveIngredient(index, by)}
              />
            )}
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
          <View key={flags.flowV2 ? stepKeys.current[index] : index} style={[rowStyle, { marginBottom: space[2], alignItems: 'flex-start' }]}>
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
            {flags.flowV2 && form.steps.length > 1 && (
              <MoveHandle
                label={`Step ${index + 1}`}
                onMenu={() => void moveMenu('Step', index, form.steps.length, moveStep)}
                onMove={(by) => moveStep(index, by)}
              />
            )}
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

        {form.sourceUrl != null && (
          <View style={{ marginTop: space[5] }}>
            <Text role="caption">Source: {sourceDomain(form.sourceUrl) ?? form.sourceName ?? form.sourceUrl}</Text>
          </View>
        )}

        <View style={{ marginTop: space[6], gap: space[3] }}>
          <Button
            title={
              saveMut.isPending
                ? 'Saving…'
                : editId != null
                  ? 'Save changes'
                  : form.mode === 'import'
                    ? 'Looks right, save'
                    : 'Save to my cookbook'
            }
            onPress={save}
            variant="primary"
            size="lg"
            loading={saveMut.isPending}
            disabled={editId != null && !unsaved}
          />
          {editId != null && (
            <Pressable
              style={deleteRow}
              onPress={confirmDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete recipe"
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text role="body">Delete recipe</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// R6.7: the reorder handle. Long-press opens Move up / Move down; VoiceOver
// gets the same two as custom actions (swipe up or down on the handle).
function MoveHandle({ label, onMenu, onMove }: { label: string; onMenu: () => void; onMove: (by: number) => void }) {
  return (
    <Pressable
      onLongPress={onMenu}
      onPress={onMenu}
      hitSlop={8}
      accessibilityRole="adjustable"
      accessibilityLabel={`Move ${label}`}
      accessibilityHint="Swipe up or down to move it"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onMove(e.nativeEvent.actionName === 'decrement' ? 1 : -1)}
      style={{ padding: space[2], paddingTop: space[3] }}
    >
      <Ionicons name="reorder-two" size={20} color={colors.inkSoft} />
    </Pressable>
  );
}
