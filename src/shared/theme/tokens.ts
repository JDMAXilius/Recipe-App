// Otto v2 design tokens — docs/contracts/ui-components.md, frozen at M0.
// Plain module, light-only lock. NOT a context, no providers, no dark mode.
// Semantic ink rule: terracotta = computed values + interactive elements ONLY;
// ink = authored content. Callers pick meaning via component variants, never hex.

export const colors = {
  terracotta: '#C4562E', // computed values + interactive elements ONLY
  ink: '#2A2320', // authored content (titles, body, user text)
  inkSoft: '#6B5F58', // secondary authored text
  cream: '#FAF5EC', // paper surfaces
  creamDeep: '#F2E9DA', // raised/inset surfaces
  white: '#FFFFFF',
  danger: '#B3402A',
  success: '#5A7A4F',
} as const;

export const fonts = { display: 'Lora', body: 'system' } as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48] as const; // index-addressed

export const radii = { card: 16, sheet: 24, pill: 999 } as const;
