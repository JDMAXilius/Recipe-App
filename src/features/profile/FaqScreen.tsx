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
    a: 'Three shelves: Otto’s own recipe database, recipes you write yourself, and recipes you import from links. Otto’s database is curated in-house — every recipe is read line by line, its ingredients broken into amount and food, and its nutrition matched against USDA FoodData Central rather than guessed. Where a recipe has an original page behind it, that link travels with it and can’t be removed. Imported recipes keep their source the same way.',
  },
  {
    q: 'How accurate is the nutrition?',
    a: 'It’s an estimate, and Otto says which kind. When he can work it out from the ingredients he does, using USDA FoodData Central — a public database that Otto is not endorsed by. When he can’t, you get a rough figure from the kind of dish, marked with a tilde. When he has nothing honest to show, he says that instead of inventing a number. None of it is dietary or medical advice: if a number has to be right for a medical reason, weigh it yourself.',
  },
  {
    q: 'Otto wrote this recipe. Should I trust it?',
    a: 'Read it first — that’s why an imported or generated recipe opens as a draft for you to check rather than landing on your shelf. Otto can misread a temperature, drop an ingredient or miss that something contains nuts. Allergies, raw eggs and cooking temperatures are yours to check, every time.',
  },
  {
    q: 'How do I import a recipe from a link?',
    a: 'Paste a food-blog, TikTok or Instagram link on the Add screen. Otto pulls what it honestly can. From blogs that’s usually the full recipe. From social posts it works from the caption, so if the caption hides the recipe, Otto says so instead of guessing.',
  },
  {
    q: 'Will my shopping list change if I change my week?',
    a: 'Never silently. If your week no longer matches the list, a small banner asks whether to update it. Your checked-off items and your own additions survive the refresh.',
  },
  {
    q: 'What do food preferences actually change?',
    a: 'Exactly two things on Discover: Otto’s pick and where the grid starts. Search and the filters stay fully yours, and your own recipes are never filtered.',
  },
  {
    q: 'Who can see a recipe or list I share?',
    a: 'Only people holding the link. Links are long random strings nobody can guess, and the pages are read-only. A shared shopping list is a snapshot of that moment; it never updates by itself.',
  },
  {
    q: 'Can my household share one list?',
    a: 'Yes. From your shopping list, tap the people icon to start a shared list and send the invite link. Everyone who joins adds and checks off the same list, and each line shows who added it or picked it up.',
  },
  {
    q: 'Where does my data live?',
    a: 'Your recipes, cooking journal and weekly plan live in your account. Your shopping list and food preferences stay on this phone and never leave it.',
  },
  {
    q: 'What is Otto Club?',
    a: 'One simple membership for everything Otto can do. It’s opening soon, and the free kitchen stays a real kitchen either way.',
  },
  {
    q: 'How do I leave?',
    a: 'Sign out anytime from your profile, or choose Delete my account to remove everything, for real. No guilt trip, and Otto will keep the stove warm.',
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
          Something else on your mind? Send a thought from your profile. A human reads every one.
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
