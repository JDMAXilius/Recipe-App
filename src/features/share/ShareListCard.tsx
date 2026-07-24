// The painted, shareable SHOPPING LIST card — the picture a recipient sees
// (react-native-view-shot target, captured by the planner's ShoppingScreen).
// Mirrors buildShoppingListShareText exactly: open items grouped by aisle,
// custom extras under "Everything else", the same sign-off — so the picture
// and the text share always agree. Checked rows stay home. Bullets, not
// checkboxes: the recipient reads it, they don't tick it here.
import React, { forwardRef } from 'react';
import {
  Image,
  Text as RNText,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { paw } from '@/shared/assets';
import type { ShoppingListState } from './share.types';

const CARD_W = 360;

// Lora's reading cut — loaded app-wide in app/_layout.tsx alongside the token
// display/title cuts (tokens.type only names the bold/semibold ones).
const SERIF_READING = 'Lora_400Regular';

export interface ShareListCardProps {
  list: ShoppingListState;
}

// The stamped SHOPPING LIST ribbon — dark-ink bar, letterspaced Lora, with an
// inverted-V notch cut from the bottom edge (the notch triangle is painted in
// the color of the surface behind it). Exported so the in-app pad and this
// card render the SAME banner and can never drift apart.
export function ShoppingListBanner({ notchColor = colors.white }: { notchColor?: string }) {
  return (
    <View accessibilityRole="header" style={bannerStyles.wrap}>
      <View style={bannerStyles.bar}>
        <RNText style={bannerStyles.text} accessibilityLabel="Shopping list">
          SHOPPING LIST
        </RNText>
        <View style={bannerStyles.notchWrap} pointerEvents="none">
          <View style={[bannerStyles.notch, { borderBottomColor: notchColor }]} />
        </View>
      </View>
    </View>
  );
}

const bannerStyles: Record<string, ViewStyle & TextStyle> = {
  wrap: { alignItems: 'center' },
  bar: {
    backgroundColor: colors.ink,
    paddingHorizontal: space[6],
    paddingTop: space[3],
    paddingBottom: space[4] + space[1],
  },
  text: {
    fontFamily: type.display.fontFamily,
    fontSize: 15,
    letterSpacing: 3.5,
    color: colors.cream,
  },
  notchWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  notch: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
};

// Otto's paw prints wandering in from the top-left corner (real paw art from
// the asset registry, tinted soft — no new assets).
const PAWS: { top: number; left: number; size: number; rotate: string }[] = [
  { top: 16, left: 20, size: 30, rotate: '-16deg' },
  { top: 72, left: 48, size: 38, rotate: '10deg' },
  { top: 134, left: 16, size: 32, rotate: '-6deg' },
];

export const ShareListCard = forwardRef<View, ShareListCardProps>(function ShareListCard(
  { list },
  ref,
) {
  const { items = [], custom = [], checked = {} } = list;
  const open = items.filter((i) => !checked[i.key]);
  const extras = custom.filter((c) => !checked[c.key]);
  const count = open.length + extras.length;
  // Items arrive in AISLES order from buildShoppingList; appearance order keeps it.
  const aisles = [...new Set(open.map((i) => i.aisle))];

  return (
    // Opaque root — view-shot renders a transparent root as black/blank.
    <View ref={ref} collapsable={false} style={styles.page}>
      <View style={styles.card}>
        <View style={styles.frame} pointerEvents="none" />
        {PAWS.map((p, i) => (
          <Image
            key={i}
            source={paw.filled}
            accessible={false}
            resizeMode="contain"
            style={[
              styles.paw,
              {
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                transform: [{ rotate: p.rotate }],
              },
            ]}
          />
        ))}

        <ShoppingListBanner notchColor={colors.white} />

        <RNText style={styles.count}>
          {count} {count === 1 ? 'thing' : 'things'} to pick up
        </RNText>

        {aisles.map((aisle) => (
          <View key={aisle} style={styles.section}>
            <RNText style={styles.aisle}>{aisle}</RNText>
            <View style={styles.rule} />
            {open
              .filter((i) => i.aisle === aisle)
              .map((item) => (
                <View key={item.key}>
                  <View style={styles.row}>
                    <View style={styles.bullet} />
                    <RNText style={styles.line}>
                      {item.amount ? (
                        <RNText style={styles.amount}>{item.amount} </RNText>
                      ) : null}
                      {item.name}
                      {item.sources?.length ? (
                        <RNText style={styles.prov}> · for {item.sources.join(', ')}</RNText>
                      ) : null}
                    </RNText>
                  </View>
                  <View style={styles.sep} />
                </View>
              ))}
          </View>
        ))}

        {extras.length > 0 && (
          <View style={styles.section}>
            <RNText style={styles.aisle}>Everything else</RNText>
            <View style={styles.rule} />
            {extras.map((extra) => (
              <View key={extra.key}>
                <View style={styles.row}>
                  <View style={styles.bullet} />
                  <RNText style={styles.line}>{extra.name}</RNText>
                </View>
                <View style={styles.sep} />
              </View>
            ))}
          </View>
        )}

        <RNText style={styles.footer}>Shared from Otto, the quieter kind of cookbook.</RNText>
      </View>
    </View>
  );
});

const pawStyle: ImageStyle = { position: 'absolute', tintColor: colors.accentSoft };

const styles: Record<string, ViewStyle & TextStyle> & { paw: ImageStyle } = {
  page: {
    width: CARD_W,
    backgroundColor: colors.cream,
    borderRadius: radii.card,
    padding: space[4],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: space[3],
    paddingBottom: space[5],
    paddingHorizontal: space[5],
  },
  frame: {
    position: 'absolute',
    top: space[3],
    left: space[3],
    right: space[3],
    bottom: space[3],
    borderWidth: 1,
    borderColor: colors.terracotta,
    opacity: 0.5,
    borderRadius: radii.button - space[1],
  },
  paw: pawStyle,
  count: {
    fontFamily: type.title.fontFamily,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: space[4],
  },
  section: { marginTop: space[5] },
  aisle: {
    fontFamily: type.display.fontFamily,
    fontSize: 14,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  rule: { borderTopWidth: 1, borderTopColor: colors.terracotta, opacity: 0.5, marginTop: space[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingVertical: space[3],
    paddingLeft: space[1],
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.gray,
    marginTop: 8,
  },
  line: {
    flex: 1,
    fontFamily: SERIF_READING,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
  },
  amount: { fontFamily: type.display.fontFamily, color: colors.terracotta },
  prov: { color: colors.inkSoft, fontSize: 15 },
  sep: {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: colors.gray,
    opacity: 0.7,
  },
  footer: {
    fontFamily: SERIF_READING,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: space[6],
  },
};
