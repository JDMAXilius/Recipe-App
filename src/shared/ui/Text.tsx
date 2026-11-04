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
  // Layout-only passthroughs for nav titles (Screen): one line that shrinks to
  // fit and caps its growth, the way Apple's own bars do. Not a style hatch.
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  maxFontSizeMultiplier?: number;
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

export function Text({ children, role, ...layout }: TextProps) {
  return (
    <RNText
      // display/title ARE the screen and section headings — marking them lets
      // VoiceOver's Headings rotor jump between them (audit P1-8).
      accessibilityRole={role === 'display' || role === 'title' ? 'header' : undefined}
      style={roleStyles[role]}
      {...layout}
    >
      {children}
    </RNText>
  );
}
