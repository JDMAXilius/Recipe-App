import React, { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, OttoArt, Sheet, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { RecipeInput } from './components/RecipeInput';
import { useGenerateRecipe, useImportFromUrl, useImportFromPhoto } from './import.queries';
import { emptyDraft, setDraft } from './draft';
import { pickFromLibrary, takePhoto } from '@/shared/imagePicker';

// The ＋ sheet (feature-module.md allowlist: a shared component, mounted by the
// app add route — NOT a screen). Matches the Figma master (213:1667): a 2×2 tile
// grid — paste a link, paste text, snap a photo, write it myself — over an "Ask
// Otto" chat entry. Every path ALWAYS lands the user in the editor (or chat): an
// import failure carries its URL into manual entry, so the ＋ never dead-ends.
export interface AddSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LOOKS_LIKE_URL = /^https?:\/\/\S+\.\S+/i;

type Mode = 'link' | 'text' | null;

const tile: ViewStyle = {
  flexBasis: '48%',
  flexGrow: 1,
  backgroundColor: colors.white,
  borderRadius: radii.card,
  borderWidth: 1.5,
  borderColor: colors.border,
  padding: space[4],
  gap: space[3],
  minHeight: 96,
  justifyContent: 'space-between',
};
const tileActive: ViewStyle = {
  backgroundColor: colors.accentSoft,
  borderColor: colors.terracotta,
};

export function AddSheet({ visible, onClose }: AddSheetProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const importMut = useImportFromUrl();
  const photoMut = useImportFromPhoto();
  const generateMut = useGenerateRecipe();
  const busy = importMut.isPending || photoMut.isPending || generateMut.isPending;

  // Hand a draft to the editor and open it. Reset local state so a re-opened
  // sheet starts clean.
  const openEditor = (draft: Parameters<typeof setDraft>[0]) => {
    setDraft(draft);
    setUrl('');
    setText('');
    setMode(null);
    setError(null);
    onClose();
    router.push('/recipe/edit');
  };

  const writeMyself = () => openEditor(emptyDraft(null));

  const startImport = async () => {
    const target = url.trim();
    if (!LOOKS_LIKE_URL.test(target)) {
      setError("That doesn't look like a link — paste the full address, http and all.");
      return;
    }
    setError(null);
    try {
      openEditor(await importMut.mutateAsync(target));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't read that page.");
    }
  };

  // Paste-text import: reuse generate-recipe's one-shot {prompt} path — feed the
  // pasted block (a DM, a note, an email) as the prompt and let Otto sort it into
  // a recipe, landing in the same review-first editor. Source is 'manual' (not
  // 'otto'): the words are someone else's, Otto just tidied them, so the editor
  // shows "Did Otto get this right?" not "Otto dreamed this up".
  const startTextImport = async () => {
    const body = text.trim();
    if (body.length < 40) {
      setError('Paste the whole thing — ingredients and steps — so Otto has enough to sort.');
      return;
    }
    setError(null);
    try {
      const draft = await generateMut.mutateAsync({ prompt: body });
      openEditor({ ...draft, source: 'manual' });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't sort that into a recipe.");
    }
  };

  // Snap a recipe → Claude reads the photo → same review-first editor. Camera
  // first, library as the fallback; a null pick (cancel or denied permission)
  // just backs out — the ＋ never dead-ends.
  const snapRecipe = async () => {
    setError(null);
    const picked = (await takePhoto({ base64: true })) ?? (await pickFromLibrary({ base64: true }));
    if (!picked) return;
    if (!picked.base64) {
      setError("Otto couldn't read that photo — try a clearer shot.");
      return;
    }
    try {
      const draft = await photoMut.mutateAsync({
        image: picked.base64,
        mimeType: picked.mimeType ?? 'image/jpeg',
      });
      openEditor(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't read that photo — try a clearer shot.");
    }
  };

  const tap = (m: Exclude<Mode, null>) => {
    setError(null);
    setMode((cur) => (cur === m ? null : m));
  };

  const Tile = ({
    icon,
    label,
    active,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    active?: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      style={[tile, active ? tileActive : null]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={colors.terracotta} />
      <Text role="body">{label}</Text>
    </Pressable>
  );

  return (
    <Sheet visible={visible} onClose={onClose}>
      {busy ? (
        <View style={{ paddingVertical: space[5], gap: space[3], alignItems: 'center' }}>
          <OttoArt name="thinking" size={96} />
          <Text role="title">Otto&apos;s reading it…</Text>
          <Text role="caption">
            He&apos;ll pull out the ingredients and steps — check his work before it goes on the shelf.
          </Text>
        </View>
      ) : (
        <View style={{ gap: space[4] }}>
          <View style={{ alignItems: 'center', gap: space[2] }}>
            <OttoArt name="happy" size={96} />
            <Text role="display">Bring in a recipe</Text>
            <Text role="caption">Found something good? Otto will copy it down.</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
            <Tile icon="link" label="Paste a link" active={mode === 'link'} onPress={() => tap('link')} />
            <Tile
              icon="document-text-outline"
              label="Paste text"
              active={mode === 'text'}
              onPress={() => tap('text')}
            />
            <Tile icon="camera-outline" label="Snap a photo" onPress={snapRecipe} />
            <Tile icon="create-outline" label="Write it myself" onPress={writeMyself} />
          </View>

          {mode === 'link' && (
            <View style={{ gap: space[3] }}>
              <Text role="caption">
                A recipe page, or a TikTok or Instagram post — Otto reads the ingredients and steps.
              </Text>
              <RecipeInput
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setError(null);
                }}
                placeholder="https://…"
                accessibilityLabel="Recipe link"
                keyboardType="url"
                autoFocus
              />
              <Button title="Import it" onPress={startImport} variant="primary" size="lg" />
            </View>
          )}

          {mode === 'text' && (
            <View style={{ gap: space[3] }}>
              <Text role="caption">
                Paste a recipe from a DM, a note, or an email — Otto sorts it into ingredients and steps.
              </Text>
              <RecipeInput
                value={text}
                onChangeText={(t) => {
                  setText(t);
                  setError(null);
                }}
                placeholder="Paste the recipe text here…"
                accessibilityLabel="Recipe text"
                multiline
                autoFocus
              />
              <Button title="Sort it out" onPress={startTextImport} variant="primary" size="lg" />
            </View>
          )}

          {error != null && (
            <View accessibilityRole="alert">
              <Text role="computed">{error}</Text>
            </View>
          )}

          <View style={{ alignItems: 'center', marginTop: space[1] }}>
            <Text role="caption">or</Text>
          </View>

          <View
            style={{
              backgroundColor: colors.creamDeep,
              borderRadius: radii.card,
              padding: space[4],
              gap: space[2],
            }}
          >
            <Text role="title">Nothing to bring in?</Text>
            <Text role="caption">Otto can write you one from scratch.</Text>
            <Button
              title="Chat with Otto"
              onPress={() => {
                onClose();
                router.push('/ask');
              }}
              variant="primary"
              size="lg"
            />
          </View>
        </View>
      )}
    </Sheet>
  );
}
