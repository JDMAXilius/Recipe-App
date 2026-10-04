import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { RecipeInput } from './components/RecipeInput';
import { useImportFromText, useImportFromUrl, useImportFromPhoto } from './import.queries';
import { emptyDraft, setDraft } from './draft';
import { pickFromLibrary, takePhoto } from '@/shared/imagePicker';
import { ensureAiConsent } from '@/shared/aiConsent';

// "Add a recipe" — a pushed full SCREEN with a back button (founder call:
// no longer a bottom modal). A 2×2 tile grid — paste a link, paste text, snap
// a photo, write it myself — over one Ask Otto button (UX audit 07: no
// mascot, no captions; the hint lives in the placeholder). Every path ALWAYS lands the user in the editor (or the
// chat tab): an import failure carries its URL into manual entry, so it never
// dead-ends.
export interface AddSheetProps {
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

export function AddSheet({ onClose }: AddSheetProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const importMut = useImportFromUrl();
  const photoMut = useImportFromPhoto();
  const textMut = useImportFromText();
  // Free tier: the three AI-backed paths below are counted. "Write it myself"
  // is not, and must never be — manual entry is free forever, and it is also
  // the honest fallback we offer when a gate closes.
  const busy = importMut.isPending || photoMut.isPending || textMut.isPending;

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
      setError("That doesn't look like a link. Paste the full address, http and all.");
      return;
    }
    setError(null);
    if (!(await ensureAiConsent())) return;
    try {
      const draft = await importMut.mutateAsync(target);
      openEditor(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't read that page.");
    }
  };

  // Paste-text import: generate-recipe's {text} mode transcribes the pasted
  // block (a DM, a note, a caption) as written, landing in the same
  // review-first editor. Source is 'manual' (not 'otto'): the words are someone
  // else's, Otto just tidied them, so the editor shows "Did Otto get this
  // right?" not "Otto dreamed this up".
  const startTextImport = async () => {
    const body = text.trim();
    if (body.length < 40) {
      setError('Paste the whole thing, ingredients and steps, so Otto has enough to sort.');
      return;
    }
    setError(null);
    if (!(await ensureAiConsent())) return;
    try {
      const draft = await textMut.mutateAsync(body);
      openEditor(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't sort that into a recipe.");
    }
  };

  // Snap a recipe → Claude reads the photo → same review-first editor. Camera
  // first, library as the fallback; a null pick (cancel or denied permission)
  // just backs out — the ＋ never dead-ends.
  const snapRecipe = async () => {
    setError(null);
    // Consent BEFORE the camera opens: ask before the shutter, never after the shot.
    if (!(await ensureAiConsent())) return;
    const picked = (await takePhoto({ base64: true })) ?? (await pickFromLibrary({ base64: true }));
    if (!picked) return;
    if (!picked.base64) {
      setError("Otto couldn't read that photo. Try a clearer shot.");
      return;
    }
    try {
      const draft = await photoMut.mutateAsync({
        image: picked.base64,
        mimeType: picked.mimeType ?? 'image/jpeg',
      });
      openEditor(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't read that photo. Try a clearer shot.");
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
    <Screen onBack={onClose}>
      <ScrollView contentContainerStyle={{ padding: space[4], paddingBottom: space[7], gap: space[4] }}>
      {busy ? (
        <View style={{ paddingVertical: space[5], gap: space[3], alignItems: 'center' }}>
          <ActivityIndicator color={colors.terracotta} />
          <Text role="title">Otto&apos;s reading it…</Text>
        </View>
      ) : (
        <View style={{ gap: space[4] }}>
          <Text role="display">Add a recipe</Text>

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
              <RecipeInput
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setError(null);
                }}
                placeholder="Paste a link (website, TikTok, Instagram)"
                accessibilityLabel="Recipe link"
                keyboardType="url"
                autoFocus
              />
              <Button title="Import it" onPress={startImport} variant="primary" size="lg" />
            </View>
          )}

          {mode === 'text' && (
            <View style={{ gap: space[3] }}>
              <RecipeInput
                value={text}
                onChangeText={(t) => {
                  setText(t);
                  setError(null);
                }}
                placeholder="Paste a recipe from a note, DM or email"
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

          <Button
            title="Ask Otto to write one"
            onPress={() => router.replace('/create')}
            variant="secondary"
            size="lg"
          />
        </View>
      )}
      </ScrollView>
    </Screen>
  );
}
