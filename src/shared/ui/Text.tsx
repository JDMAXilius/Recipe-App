import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { colors, type } from '../theme/tokens';

export type TextRole =
  | 'display'
  | 'title'
  | 'body'
  | 'label'
  | 'caption'
  | 'meta'
  | 'computed'
  | 'step';

export interface TextProps {
  children: React.ReactNode;
  role: TextRole;
}

// Role IS the color decision (semantic ink rule). No color/style escape hatch —
// 'computed' is the only way to terracotta text, everything authored is ink.
// Sizes/families come from tokens.type (the one home). 'caption' is lowercase
// secondary (sentences); 'meta' is the uppercase tabular micro-label (eyebrows,
// units) — split so neither is overloaded.
const roleStyles: Record<TextRole, TextStyle> = {
  display: { ...type.display, color: colors.ink },
  title: { ...type.title, color: colors.ink },
  body: { ...type.body, color: colors.ink },
  label: { ...type.label, color: colors.ink },
  caption: { ...type.caption, color: colors.inkSoft },
  meta: { ...type.meta, fontVariant: ['tabular-nums'], color: colors.inkSoft },
  computed: { ...type.body, fontWeight: '600', color: colors.terracotta },
  step: { ...type.step, color: colors.ink },
};

export function Text({ children, role }: TextProps) {
  return <RNText style={roleStyles[role]}>{children}</RNText>;
}
