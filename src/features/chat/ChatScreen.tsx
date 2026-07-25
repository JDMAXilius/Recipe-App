import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, OttoIdle, Screen, Text, useToast } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { useAuth } from '@/features/auth';
import { stageOttoRecipe, takeOttoAsk } from '@/features/import';
import { ChatEmptyState } from './components/ChatEmptyState';
import { Composer } from './components/Composer';
import { Transcript } from './components/Transcript';
import { useChat } from './useChat';
import { useSpeechInput } from './useSpeechInput';
import type { ChatRecipe } from './chat.types';

// Chat with Otto — the ＋ (create) tab. The primary way to make
// a recipe: describe a dish, Otto writes it inline, you save. Header doors reach
// Recent chats (clock → /chats) and Bring-in-a-recipe (import → /add). This file
// is the conductor only: the empty state, the transcript and the composer card
// are their own components, so what lives here is state, hand-offs and layout.
// Every server state (loading/error/clarify/recipe/decline) renders inline —
// never a crash.

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

export function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { isSignedIn } = useAuth();
  // ?chat=<id> — arriving from Recent chats reopens that thread.
  const { chat: chatParam } = useLocalSearchParams<{ chat?: string }>();
  const chat = useChat({ threadId: chatParam });
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // Destructured so the callbacks below can depend on the stable pieces (the
  // hooks' objects are new every render): that keeps the memoized Transcript
  // out of the keystroke path.
  const { send, pickOption, isSending } = chat;

  // The recipe editor's Ask-Otto hand-off: arriving with a part-filled form,
  // its rendered ask lands in the composer — visible and editable, so the cook
  // sees exactly what Otto will start from. On focus (not mount) because the
  // create tab stays mounted between visits; the slot is consume-once, so a
  // plain ＋ tap later never resurrects an old ask.
  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn) return; // leave it for after sign-in — don't burn the slot
      const ask = takeOttoAsk();
      if (ask) setDraft(ask);
    }, [isSignedIn]),
  );

  const toBottom = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  // Speak to Otto (Phase 1): on-device speech streams interim text into the
  // draft; the cook edits and sends like typed text. Where the module or the
  // Web Speech API is missing, keep v1's warm "coming soon" instead of a dead tap.
  const speech = useSpeechInput(setDraft, (kind) => {
    if (kind === 'denied') {
      show('Otto needs the microphone for that. You can allow it in Settings.', 'error');
    } else {
      show('Otto couldn’t hear that. Try again.', 'error');
    }
  });
  const { listening, available: canSpeak, stop: stopSpeech, toggle: toggleSpeech } = speech;

  const onSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    // Send can land mid-dictation (the Speak pill now stays put beside it): stop
    // the session first so trailing results can't repopulate the sent text.
    if (listening) stopSpeech();
    haptics.select();
    setDraft('');
    send(text);
    toBottom();
  }, [draft, listening, stopSpeech, send, toBottom]);

  const onSpeak = useCallback(() => {
    haptics.impact();
    if (!canSpeak) {
      show('Talking to Otto is coming soon. Type it to him for now.', 'info');
      return;
    }
    toggleSpeech(draft); // live draft becomes the prefix dictation appends to
  }, [canSpeak, toggleSpeech, draft, show]);

  // Review-first (founder call 2026-07-24): Otto's recipe opens in the editor
  // as "Check Otto's work" so the cook changes or approves it before it lands.
  // The editor's Save owns persistence (one compute-at-save path).
  const onReview = useCallback(
    (recipe: ChatRecipe) => {
      haptics.select();
      stageOttoRecipe(recipe);
      router.push('/recipe/edit');
    },
    [router],
  );

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

  const empty = chat.messages.length === 0 && !isSending;

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
          // paddingBottom space[5] keeps the last bubble clear of the taller
          // composer card; the card's own well below adds the rest.
          contentContainerStyle={{ padding: space[4], paddingBottom: space[5] }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={toBottom}
        >
          {empty ? (
            <ChatEmptyState />
          ) : (
            <Transcript
              messages={chat.messages}
              response={chat.response}
              isSending={isSending}
              streamingText={chat.streamingText}
              error={chat.error}
              onPickOption={pickOption}
              onReview={onReview}
            />
          )}
        </ScrollView>

        {/* The composer's well: same space[4] gutter as the transcript, so the
            card's edges line up with the bubbles above it. */}
        <View style={{ paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[4] }}>
          <Composer
            value={draft}
            onChangeText={setDraft}
            onSend={onSend}
            onSpeak={onSpeak}
            listening={listening}
            sending={isSending}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
