import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Text as RNText, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Text } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space, type } from '@/shared/theme/tokens';

// Help — an accordion of what people actually ask. Nine questions, each
// answer 35 words or fewer, stating what Otto does TODAY.
const FAQS = [
  {
    q: 'Where do Otto’s recipes come from?',
    a: 'Otto’s own curated recipes, recipes you write, and recipes you import. Nutrition is matched against USDA FoodData Central. When a recipe has an original page, its source link stays with it.',
  },
  {
    q: 'How accurate is the nutrition?',
    a: 'It’s an estimate built from the ingredients with USDA FoodData Central, which doesn’t endorse Otto. Rough figures are labeled. It isn’t dietary or medical advice, so weigh food when it matters.',
  },
  {
    q: 'Can I trust an AI recipe?',
    a: 'Check it first. Imports and AI recipes open for review before they’re saved. AI can misread a temperature or miss an allergen, so allergies, raw eggs and cooking temperatures are yours to check.',
  },
  {
    q: 'How do I import a recipe?',
    a: 'Tap + and paste a link (website, TikTok, Instagram), paste text, or add a photo. From social posts Otto reads the caption; if the recipe isn’t there, Otto says so.',
  },
  {
    q: 'Can my household share one list?',
    a: 'Yes. From your shopping list, tap the people icon and send the invite. Everyone who joins adds to and checks off the same list.',
  },
  {
    q: 'How does Otto Club work?',
    a: 'Otto is a subscription. Start with a 7-day free trial, then Otto Club renews monthly or yearly until you cancel. Cancel anytime in iPhone Settings › your name › Subscriptions.',
  },
  {
    q: 'How do I restore my subscription?',
    a: 'Sign in to the same Otto account, open the Otto Club screen and tap Restore. Use the Apple ID you subscribed with.',
  },
  {
    q: 'What happens to my data and AI?',
    a: 'Your recipes, saves and plan live in your account. AI features send only what you give them to Claude, by Anthropic, after you allow it. Turn them off in Account › AI features.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Account › Delete my account erases your recipes, saves and plan for good. Your subscription is billed by Apple, so cancel it in iPhone Settings too.',
  },
];

const SUPPORT_EMAIL = 'juandiego@ottosapp.com';

export function FaqScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (index: number) => {
    haptics.select();
    setOpen((prev) => (prev === index ? null : index));
  };
  return (
    <Screen title="Help" onBack={() => router.back()}>
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
        <Pressable
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
          accessibilityRole="link"
          hitSlop={8}
        >
          {/* Same link treatment as the AI consent sheet's policy link. */}
          <RNText style={{ ...type.caption, color: colors.inkSoft }}>
            Still stuck? <RNText style={{ textDecorationLine: 'underline' }}>Contact us</RNText>
          </RNText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles: Record<string, ViewStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7], gap: space[2] },
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: space[4], gap: space[2] },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: 44 },
};
