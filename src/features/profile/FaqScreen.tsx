import React, { useState } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Text } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space } from '@/shared/theme/tokens';

// Little questions — an accordion of what people actually wonder. Every answer
// states what Otto does TODAY; when a capability is still on its way, the
// answer says so instead of pretending. Ported verbatim from v1 faq.jsx.
const FAQS = [
  {
    q: 'Where do Otto’s recipes come from?',
    a: 'Three shelves: a free community cookbook Otto browses for you, recipes you write yourself, and recipes you import from links. Imported ones keep their source — the credit and the live link travel with the recipe, always.',
  },
  {
    q: 'How do I import a recipe from a link?',
    a: 'Paste a food-blog, TikTok or Instagram link on the Add screen. Otto pulls what it honestly can — from blogs that’s usually the full recipe; from social posts it works from the caption, so if the caption hides the recipe, Otto says so instead of guessing.',
  },
  {
    q: 'Will my shopping list change if I change my week?',
    a: 'Never silently. If your week no longer matches the list, a small banner asks whether to update it — your checked-off items and your own additions survive the refresh.',
  },
  {
    q: 'What do food preferences actually change?',
    a: 'Exactly two things on Discover: Otto’s pick and where the grid starts. Search and the filters stay fully yours, and your own recipes are never filtered.',
  },
  {
    q: 'Who can see a recipe or list I share?',
    a: 'Only people holding the link — links are long random strings nobody can guess, and the pages are read-only. A shared shopping list is a snapshot of that moment; it never updates by itself.',
  },
  {
    q: 'Can my household share one list?',
    a: 'Yes — from your shopping list, tap the people icon to start a shared list and send the invite link. Everyone who joins adds and checks off the same list, and each line shows who added it or picked it up.',
  },
  {
    q: 'Where does my data live?',
    a: 'Your recipes, cooking journal and weekly plan live in your account. Your shopping list and food preferences stay on this phone and never leave it.',
  },
  {
    q: 'What is Otto Club?',
    a: 'One simple membership for everything Otto can do — it’s opening soon. The free kitchen stays a real kitchen either way.',
  },
  {
    q: 'How do I leave?',
    a: 'Sign out anytime from your profile, or choose Delete my account — that removes everything, for real. No guilt trip, and Otto will keep the stove warm.',
  },
];

export function FaqScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (index: number) => {
    haptics.select();
    setOpen((prev) => (prev === index ? null : index));
  };
  return (
    <Screen title="Little questions" onBack={() => router.back()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {FAQS.map((item, index) => {
          const isOpen = open === index;
          return (
            <View key={item.q} style={styles.card}>
              <Pressable
                style={styles.questionRow}
                onPress={() => toggle(index)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={item.q}
              >
                <View style={{ flex: 1 }}>
                  <Text role="body">{item.q}</Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.inkSoft}
                />
              </Pressable>
              {isOpen && <Text role="caption">{item.a}</Text>}
            </View>
          );
        })}
        <Text role="caption">
          Something else on your mind? Send a thought from your profile — a human reads every one.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles: Record<string, ViewStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7], gap: space[2] },
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: space[4], gap: space[2] },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: 44 },
};
