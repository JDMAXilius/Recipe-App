import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { colors, fonts } from '../theme/tokens';

export type TextRole = 'display' | 'title' | 'body' | 'caption' | 'computed';

export interface TextProps {
  children: React.ReactNode;
  role: TextRole;
}

// Role IS the color decision (semantic ink rule). No color/style escape hatch —
// 'computed' is the only way to terracotta text, everything authored is ink.
const roleStyles: Record<TextRole, TextStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.ink,
  },
  body: { fontSize: 16, lineHeight: 22, color: colors.ink },
  caption: { fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  computed: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.terracotta },
};

export function Text({ children, role }: TextProps) {
  return <RNText style={roleStyles[role]}>{children}</RNText>;
}
