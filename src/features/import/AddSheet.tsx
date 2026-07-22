import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Sheet, Text } from '@/shared/ui';
import { space } from '@/shared/theme/tokens';
import { RecipeInput } from './components/RecipeInput';
import { useImportFromUrl, useImportFromPhoto } from './import.queries';
import { emptyDraft, setDraft } from './draft';
import { pickFromLibrary, takePhoto } from '@/shared/imagePicker';

// The ＋ sheet (feature-module.md allowlist: a shared component, mounted by the
// app add route — NOT a screen). Two live modes: paste a link (deterministic
// server-side JSON-LD import) and write it myself. Every path ALWAYS lands the
// user in the editor: an import failure carries its URL into manual entry, so
// the ＋ never dead-ends.
export interface AddSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LOOKS_LIKE_URL = /^https?:\/\/\S+\.\S+/i;

export function AddSheet({ visible, onClose }: AddSheetProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const importMut = useImportFromUrl();
  const photoMut = useImportFromPhoto();

  // Hand a draft to the editor and open it. Reset local state so a re-opened
  // sheet starts clean.
  const openEditor = (draft: Parameters<typeof setDraft>[0]) => {
    setDraft(draft);
    setUrl('');
    setError(null);
    onClose();
    router.push('/recipe/edit');
  };

  const writeMyself = (carryUrl: string | null = null) => openEditor(emptyDraft(carryUrl));

  const startImport = async () => {
    const target = url.trim();
    if (!LOOKS_LIKE_URL.test(target)) {
      setError("That doesn't look like a link — paste the full address, http and all.");
      return;
    }
    setError(null);
    try {
      const draft = await importMut.mutateAsync(target);
      openEditor(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't read that page.");
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

  return (
    <Sheet visible={visible} onClose={onClose} title="Bring in a recipe">
      {importMut.isPending || photoMut.isPending ? (
        <View style={{ paddingVertical: space[5], gap: space[3] }}>
          <Text role="title">Otto&apos;s reading it…</Text>
          <Text role="body">
            He&apos;ll pull out the ingredients and steps — check his work before it goes on the
            shelf.
          </Text>
        </View>
      ) : (
        <View style={{ gap: space[3] }}>
          <Text role="body">Found something good? Paste the link and Otto will copy it down.</Text>
          <RecipeInput
            value={url}
            onChangeText={(t) => {
              setUrl(t);
              setError(null);
            }}
            placeholder="https://…"
            accessibilityLabel="Recipe link"
            keyboardType="url"
          />
          {error != null && (
            <View accessibilityRole="alert">
              <Text role="computed">{error}</Text>
            </View>
          )}
          <Button title="Import it" onPress={startImport} variant="primary" size="lg" />
          <View style={{ marginTop: space[2] }}>
            <Text role="caption">Got it on paper? Snap a photo and Otto will read it in.</Text>
          </View>
          <Button
            title="Snap a recipe"
            onPress={snapRecipe}
            variant="secondary"
            size="lg"
          />
          <View style={{ marginTop: space[2] }}>
            <Text role="caption">Nothing to bring in? Write it yourself.</Text>
          </View>
          <Button
            title="Write it myself"
            onPress={() => writeMyself()}
            variant="secondary"
            size="lg"
          />
          <View style={{ marginTop: space[2] }}>
            <Text role="caption">Not sure yet? Chat it through with Otto.</Text>
          </View>
          <Button
            title="Ask Otto"
            onPress={() => {
              onClose();
              router.push('/ask');
            }}
            variant="secondary"
            size="lg"
          />
        </View>
      )}
    </Sheet>
  );
}
