import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, OttoIdle, Screen, Text, useToast } from '@/shared/ui';
import { colors, fonts, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth } from '@/features/auth';
import { useSaveRecipe, type SaveInput } from '@/features/import';
import { useChat } from './useChat';
import type { ChatRecipe, StoredMessage } from './chat.types';

// Chat with Otto — the ＋ (create) tab. The primary way to make
// a recipe: describe a dish, Otto writes it inline, you save. Header doors reach
// Recent chats (clock → /chats) and Bring-in-a-recipe (import → /add). Transcript
// (you right / Otto left), clarify chips, an inline recipe preview with
// Save-to-cookbook, and Otto's living presence. Every server state
// (loading/error/clarify/recipe/decline) renders inline — never a crash.

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Header door: a soft circular icon button (Figma create/chats headers).
function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.pill,
        backgroundColor: colors.creamDeep,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

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
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { user, isSignedIn } = useAuth();
  // ?chat=<id> — arriving from Recent chats reopens that thread.
  const { chat: chatParam } = useLocalSearchParams<{ chat?: string }>();
  const chat = useChat({ threadId: chatParam });
  const saveMut = useSaveRecipe();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const toBottom = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    haptics.select();
    setDraft('');
    chat.send(text);
    toBottom();
  };

  // Voice rides the dev build only (on-device speech module); say so warmly
  // instead of a dead tap — matches v1's "coming soon".
  const onSpeak = () => {
    haptics.impact();
    show('Talking to Otto is coming soon — type it to him for now.', 'info');
  };

  const onSave = async (recipe: ChatRecipe) => {
    if (!user) {
      show('Sign in to save recipes to your cookbook.', 'error');
      return;
    }
    const input: SaveInput = { id: null, userId: user.id, recipe };
    try {
      const id = await saveMut.mutateAsync(input);
      haptics.notify('success');
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
  const hasText = draft.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space[3],
        }}
      >
        <HeaderButton icon="time-outline" label="Recent chats" onPress={() => router.push('/chats')} />
        <View accessibilityRole="header" style={{ flex: 1, alignItems: 'center' }}>
          <Text role="title">Chat with Otto</Text>
        </View>
        <HeaderButton
          icon="download-outline"
          label="Bring in a recipe"
          onPress={() => router.push('/add')}
        />
      </View>
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

        <View style={{ padding: space[3] }}>
          {/* One rounded field with a trailing pill (Figma): Speak when empty,
              send arrow once there's text. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: space[2],
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.card,
              paddingLeft: space[4],
              paddingRight: space[2],
              paddingVertical: space[2],
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Tell Otto what you’re after…"
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel="Message Otto"
              multiline
              onSubmitEditing={onSend}
              style={{
                flex: 1,
                fontFamily: fonts.body,
                fontSize: 16,
                color: colors.ink,
                paddingVertical: space[2],
                maxHeight: 120,
              }}
            />
            {hasText ? (
              <Pressable
                onPress={onSend}
                disabled={chat.isSending}
                accessibilityRole="button"
                accessibilityLabel="Send"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radii.pill,
                  backgroundColor: colors.terracotta,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-up" size={20} color={colors.white} />
              </Pressable>
            ) : (
              <Pressable
                onPress={onSpeak}
                accessibilityRole="button"
                accessibilityLabel="Speak to Otto"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[1],
                  height: 40,
                  paddingHorizontal: space[4],
                  borderRadius: radii.pill,
                  backgroundColor: colors.ink,
                }}
              >
                <Ionicons name="mic" size={16} color={colors.white} />
                {/* Pill label is white-on-dark — no ink Text role fits (like
                    Button's own label), so it's a raw token-colored string. */}
                <RNText style={{ fontSize: 13, fontWeight: '600', color: colors.white }}>Speak</RNText>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
