import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { colors, type } from '../theme/tokens';

export type TextRole = 'display' | 'title' | 'body' | 'label' | 'caption' | 'computed' | 'step';

export interface TextProps {
  children: React.ReactNode;
  role: TextRole;
}

// Role IS the color decision (semantic ink rule). No color/style escape hatch —
// 'computed' is the only way to terracotta text, everything authored is ink.
// Sizes/families come from tokens.type (the one home). display/title carry the
// Lora weight families; caption stays the app's lowercase secondary style
// (see contract_gap — role="caption" is overloaded with full-sentence text, so
// it does NOT adopt tokens.type.caption's uppercase micro-label treatment).
const roleStyles: Record<TextRole, TextStyle> = {
  display: { ...type.display, color: colors.ink },
  title: { ...type.title, color: colors.ink },
  body: { ...type.body, color: colors.ink },
  label: { ...type.label, color: colors.ink },
  caption: { fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  computed: { ...type.body, fontWeight: '600', color: colors.terracotta },
  step: { ...type.step, color: colors.ink },
};

export function Text({ children, role }: TextProps) {
  return <RNText style={roleStyles[role]}>{children}</RNText>;
}
