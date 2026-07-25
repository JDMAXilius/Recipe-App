import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Button, OttoIdle, Text } from '@/shared/ui';
import { colors, radii, space } from '@/shared/theme/tokens';
import type { ChatRecipe, ChatResponse, StoredMessage } from '../chat.types';

// The conversation itself: Otto's small presence, the bubbles, the clarify
// chips, the recipe preview, the live streaming bubble and the error row. Moved
// out of ChatScreen whole (behaviour untouched) for one reason that matters —
// it is memoized, so a keystroke in the composer re-renders the composer alone
// and never the transcript.
export interface TranscriptProps {
  messages: StoredMessage[];
  response: ChatResponse | null;
  isSending: boolean;
  /** Otto's prose so far this turn; null before the first delta. */
  streamingText: string | null;
  error: string | null;
  onPickOption: (option: string) => void;
  onReview: (recipe: ChatRecipe) => void;
}

const PRESENCE = 72;

const bubbleBase: ViewStyle = {
  maxWidth: '82%',
  borderRadius: radii.card,
  paddingHorizontal: space[4],
  paddingVertical: space[3],
  marginBottom: space[3],
};

const ottoBubble: ViewStyle = {
  ...bubbleBase,
  alignSelf: 'flex-start',
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.border,
};

const myBubble: ViewStyle = {
  ...bubbleBase,
  alignSelf: 'flex-end',
  backgroundColor: colors.creamDeep,
};

function Bubble({ message }: { message: StoredMessage }) {
  return (
    <View style={message.role === 'user' ? myBubble : ottoBubble}>
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

function RecipePreview({ recipe, onReview }: { recipe: ChatRecipe; onReview: () => void }) {
  const meta = [recipe.category, recipe.area, `Serves ${recipe.servings}`]
    .filter(Boolean)
    .join(' · ');
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
      <Button title="Review and save" onPress={onReview} variant="primary" size="lg" />
    </View>
  );
}

export const Transcript = React.memo(function Transcript({
  messages,
  response,
  isSending,
  streamingText,
  error,
  onPickOption,
  onReview,
}: TranscriptProps) {
  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: space[3] }}>
        <OttoIdle name={isSending ? 'thinking' : 'happy'} size={PRESENCE} />
      </View>

      {messages.map((m, i) => (
        <Bubble key={`${m.ts}-${i}`} message={m} />
      ))}

      {response?.mode === 'clarify' && (
        <OptionChips options={response.options} onPick={onPickOption} />
      )}

      {response?.mode === 'recipe' && (
        <RecipePreview recipe={response.recipe} onReview={() => onReview(response.recipe)} />
      )}

      {isSending && (
        <View style={ottoBubble}>
          {/* Streamed prose fills this bubble live; before the first delta (or on
              the non-streaming fallback) it's the thinking line. Scroll keeps up
              via the ScrollView's onContentSizeChange. */}
          {streamingText ? (
            <Text role="body">{streamingText}</Text>
          ) : (
            <Text role="caption">Otto’s thinking…</Text>
          )}
        </View>
      )}

      {error != null && (
        <View accessibilityRole="alert" style={{ marginBottom: space[3] }}>
          <Text role="computed">{error}</Text>
        </View>
      )}
    </View>
  );
});
