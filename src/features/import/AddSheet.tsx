import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { RecipeInput } from './components/RecipeInput';
import { useImportFromText, useImportFromUrl, useScanMeal } from './import.queries';
import { flags } from '@/shared/flags';
import { emptyDraft, setDraft } from './draft';
import { choosePhoto } from '@/shared/imagePicker';
import { ensureAiConsent } from '@/shared/aiConsent';
import { showActionSheet } from '@/shared/actionSheet';

// "Add a recipe" — a pushed full SCREEN with a back button (founder call:
// no longer a bottom modal). A 2×2 tile grid — snap a meal, paste a link,
// write or paste, write it myself — over one Ask Otto button. The camera scans
// MEALS only (ADR-0015); it appears once scan-meal is live (flags.flowV2) (UX audit 07: no
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
  const navigation = useNavigation();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Pasted text is the one thing here that's work to redo; back / edge-swipe
  // asks before throwing it away. `handingOff` lets the editor hand-off
  // through — the text was used, not lost (a state reset lands too late).
  const handingOff = useRef(false);
  usePreventRemove(text.trim() !== '', ({ data }) => {
    if (handingOff.current) return navigation.dispatch(data.action);
    void showActionSheet({
      options: ['Discard changes'],
      destructiveIndex: 0,
      cancelLabel: 'Keep editing',
    }).then((i) => i === 0 && navigation.dispatch(data.action));
  });
  const importMut = useImportFromUrl();
  const scanMut = useScanMeal();
  const textMut = useImportFromText();
  // Free tier: the three AI-backed paths below are counted. "Write it myself"
  // is not, and must never be — manual entry is free forever, and it is also
  // the honest fallback we offer when a gate closes.
  const busy = importMut.isPending || scanMut.isPending || textMut.isPending;

  // Hand a draft to the editor and open it. Reset local state so a re-opened
  // sheet starts clean.
  const openEditor = (draft: Parameters<typeof setDraft>[0]) => {
    handingOff.current = true;
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

  // Snap a meal → Otto works out the recipe of the whole dish → the same
  // review-first editor. Consent before the camera opens; a denied camera gets
  // the way back to Settings, so the ＋ never dead-ends.
  const snapMeal = async () => {
    setError(null);
    if (!(await ensureAiConsent())) return;
    const picked = await choosePhoto({ base64: true });
    if (picked === 'denied') {
      toast.show('Otto needs the camera to see your meal.', 'info', {
        actionLabel: 'Open Settings',
        onAction: () => void Linking.openSettings(),
      });
      return;
    }
    if (picked === 'cancelled') return;
    if (!picked.base64) {
      setError("Otto couldn't see that photo. Try another shot.");
      return;
    }
    try {
      const draft = await scanMut.mutateAsync({
        image: picked.base64,
        mimeType: picked.mimeType ?? 'image/jpeg',
      });
      openEditor(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Otto couldn't work that dish out. Try another shot.");
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
          <Text role="title">{scanMut.isPending ? 'Otto’s working out the recipe…' : 'Otto’s reading it…'}</Text>
        </View>
      ) : (
        <View style={{ gap: space[4] }}>
          <Text role="display">Add a recipe</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
            {flags.flowV2 && <Tile icon="camera-outline" label="Snap a meal" onPress={snapMeal} />}
            <Tile icon="link" label="Paste a link" active={mode === 'link'} onPress={() => tap('link')} />
            <Tile
              icon="document-text-outline"
              label="Write or paste"
              active={mode === 'text'}
              onPress={() => tap('text')}
            />
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
