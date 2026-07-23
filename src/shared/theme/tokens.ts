// Design tokens — light-only, plain module (NOT a context). Reconciled to the
// v1 values (docs/V1_DESIGN_SPEC.md §1); the rebuild had drifted five colors +
// radii.card and dropped most of the scale. Semantic-ink rule: terracotta =
// computed/interactive, ink = authored. This is the ONE source — no file
// hardcodes a hex, spring, or type size (contract: ui-components.md).

export const colors = {
  // accent / brand
  terracotta: '#C4562E', // computed + interactive ONLY
  accentSoft: '#F3D9CD', // chip fills, selected tiles
  secondary: '#8A5A3B', // chestnut — step temps, minor marks
  gold: '#E8B04B', // ratings / streaks / celebration
  // ink (authored text)
  ink: '#2A211B', // reconciled to v1 (was #2A2320)
  inkSoft: '#6E6055', // reconciled (was #6B5F58)
  // surfaces
  cream: '#FAF4EA', // app bg — reconciled (was #FAF5EC)
  creamDeep: '#F3E9DA', // raised/inset — reconciled (was #F2E9DA)
  white: '#FFFFFF',
  border: '#E8DECF', // hairline
  gray: '#B9A895', // disabled / muted
  danger: '#D64545', // destructive — reconciled (was #B3402A)
  success: '#5A7A4F',
} as const;

// FIXED nutrition macro colors — never re-skinned (protein blue, carbs amber, fat purple).
export const macro = { protein: '#3B82F6', carbs: '#F0A020', fat: '#8B5CF6' } as const;

// Warm-ink overlays, never black.
export const overlay = {
  scrim: 'rgba(42,33,27,0.35)',
  scrimStrong: 'rgba(42,33,27,0.65)',
  textShadow: 'rgba(42,33,27,0.45)',
} as const;

export const fonts = { display: 'Lora', body: 'system' } as const;

// Full type scale. Color is applied by the Text primitive per role (semantic ink).
export const type = {
  display: { fontFamily: 'Lora_700Bold', fontSize: 30, lineHeight: 34 },
  title: { fontFamily: 'Lora_600SemiBold', fontSize: 22, lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18 }, // lowercase secondary — the app's role="caption"
  meta: {
    // uppercase tabular micro-label (v1 TYPE.caption): section eyebrows, macro units
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  step: { fontSize: 24, lineHeight: 32 },
} as const;

// Index-addressed (v1 xs4 sm8 md12 lg16 xl24 xxl32, + 48). space[4] === 16.
export const space = [0, 4, 8, 12, 16, 24, 32, 48] as const;

export const radii = { card: 20, sheet: 24, button: 14, pill: 999, mascot: 24 } as const;

export const shadow = {
  card: {
    shadowColor: '#2A211B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featured: {
    shadowColor: '#2A211B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Motion tokens — consumed ONLY through shared/motion.ts hooks, never inlined.
export const spring = {
  gentle: { damping: 18, stiffness: 120, mass: 1 },
  snappy: { damping: 15, stiffness: 220, mass: 0.8 }, // press feedback → scale 0.97
  pop: { damping: 12, stiffness: 320, mass: 0.7 }, // paw / OttoIdle signature
  sheet: { damping: 22, stiffness: 260, mass: 1 },
} as const;

export const timing = { sweep: 500, fade: 200 } as const; // ring count-up (ease-out cubic), fades
