import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, OttoIdle, Screen, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { useAuth } from '@/features/auth';
import { useSaveRecipe, type SaveInput } from '@/features/import';
import { useChat } from './useChat';
import type { ChatRecipe, StoredMessage } from './chat.types';

// Ask-Otto: a warm short chat that builds ONE recipe the user saves. Transcript
// (you right / Otto left), clarify chips, an inline recipe preview with
// Save-to-cookbook, and Otto's living presence. Every server state
// (loading/error/clarify/recipe/decline) renders inline — never a crash.

const bubbleBase: ViewStyle = {
  maxWidth: '82%',
  borderRadius: radii.card,
  paddingHorizontal: space[4],
  paddingVertical: space[3],
  marginBottom: space[3],
};

function Bubble({ message }: { message: StoredMessage }) {
  const mine = message.role === 'user';
  return (
    <View
      style={[
        bubbleBase,
        mine
          ? { alignSelf: 'flex-end', backgroundColor: colors.creamDeep }
          : {
              alignSelf: 'flex-start',
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
            },
      ]}
    >
      <Text role="body">{message.content}</Text>
    </View>
  );
}

// Clarify options → tappable pills that send the chosen text as the next turn.
function OptionChips({ options, onPick }: { options: string[]; onPick: (o: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[3] }}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onPick(option)}
          accessibilityRole="button"
          accessibilityLabel={option}
          style={{
            borderWidth: 1,
            borderColor: colors.terracotta,
            borderRadius: radii.pill,
            paddingHorizontal: space[4],
            paddingVertical: space[2],
            backgroundColor: colors.cream,
          }}
        >
          <Text role="computed">{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function RecipePreview({
  recipe,
  onSave,
  saving,
}: {
  recipe: ChatRecipe;
  onSave: () => void;
  saving: boolean;
}) {
  const meta = [recipe.category, recipe.area, `Serves ${recipe.servings}`].filter(Boolean).join(' · ');
  return (
    <View
      style={{
        backgroundColor: colors.creamDeep,
        borderRadius: radii.card,
        padding: space[4],
        gap: space[3],
        marginBottom: space[3],
      }}
    >
      <Text role="title">{recipe.title}</Text>
      {meta ? <Text role="meta">{meta}</Text> : null}
      <View>
        <Text role="caption">
          {recipe.ingredients.length} ingredients · {recipe.steps.length} steps
        </Text>
      </View>
      {recipe.ingredients.slice(0, 6).map((ing, i) => (
        <Text key={i} role="body">
          • {[ing.measure, ing.name].filter(Boolean).join(' ')}
        </Text>
      ))}
      {recipe.ingredients.length > 6 ? (
        <Text role="caption">…and {recipe.ingredients.length - 6} more</Text>
      ) : null}
      <Button
        title={saving ? 'Saving…' : 'Save to cookbook'}
        onPress={onSave}
        variant="primary"
        size="lg"
        loading={saving}
      />
    </View>
  );
}

export function ChatScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { user, isSignedIn } = useAuth();
  const chat = useChat();
  const saveMut = useSaveRecipe();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const toBottom = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    chat.send(text);
    toBottom();
  };

  const onSave = async (recipe: ChatRecipe) => {
    if (!user) {
      show('Sign in to save recipes to your cookbook.', 'error');
      return;
    }
    const input: SaveInput = { id: null, userId: user.id, recipe };
    try {
      const id = await saveMut.mutateAsync(input);
      show("On the shelf — it's in your cookbook.", 'success');
      router.replace(`/recipe/u-${id}`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Couldn’t save. Try again.', 'error');
    }
  };

  if (!isSignedIn) {
    return (
      <Screen title="Ask Otto" onBack={() => router.back()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[4] }}>
          <OttoIdle name="happy" size={140} />
          <Text role="title">Chat with Otto</Text>
          <Text role="body">Sign in and Otto will cook up a recipe with you, one question at a time.</Text>
          <Button title="Sign in" onPress={() => router.push('/sign-in')} variant="primary" size="lg" />
        </View>
      </Screen>
    );
  }

  const empty = chat.messages.length === 0 && !chat.isSending;

  return (
    <Screen title="Ask Otto" onBack={() => router.back()}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: space[4], paddingBottom: space[5] }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={toBottom}
        >
          {empty ? (
            <View style={{ alignItems: 'center', gap: space[3], paddingVertical: space[6] }}>
              <OttoIdle name="happy" size={140} sway />
              <Text role="title">What are you hungry for?</Text>
              <Text role="body">
                Tell Otto a craving, a few ingredients, or a mood — he’ll ask a little, then write you
                a recipe.
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginBottom: space[3] }}>
              <OttoIdle name={chat.isSending ? 'thinking' : 'happy'} size={72} />
            </View>
          )}

          {chat.messages.map((m, i) => (
            <Bubble key={`${m.ts}-${i}`} message={m} />
          ))}

          {chat.response?.mode === 'clarify' && (
            <OptionChips options={chat.response.options} onPick={chat.pickOption} />
          )}

          {chat.response?.mode === 'recipe' && (
            <RecipePreview
              recipe={chat.response.recipe}
              onSave={() => onSave((chat.response as { recipe: ChatRecipe }).recipe)}
              saving={saveMut.isPending}
            />
          )}

          {chat.isSending && (
            <View style={[bubbleBase, { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }]}>
              <Text role="caption">Otto’s thinking…</Text>
            </View>
          )}

          {chat.error != null && (
            <View accessibilityRole="alert" style={{ marginBottom: space[3] }}>
              <Text role="computed">{chat.error}</Text>
            </View>
          )}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: space[2],
            padding: space[3],
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.cream,
          }}
        >
          <View style={{ flex: 1 }}>
            <Input
              value={draft}
              onChangeText={setDraft}
              placeholder="Tell Otto what you’re after…"
              accessibilityLabel="Message Otto"
              multiline
            />
          </View>
          <Button
            title="Send"
            onPress={onSend}
            variant="primary"
            loading={chat.isSending}
            disabled={chat.isSending || draft.trim().length === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
