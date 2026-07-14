// Non-color design tokens — "Otto" design system (docs/DESIGN_SYSTEM.md Part B).
// Color tokens live in constants/colors.js and are read via useTheme().
// These are static: spacing/radius/type/motion do not change with theme.

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  card: 20,
  sheet: 24,
  button: 14,
  pill: 999,
  mascot: 24,
};

// Photo scrims & text shadows — warm ink, never pure black (ledger item B1).
export const OVERLAY = {
  scrim: "rgba(42,33,27,0.35)",
  scrimStrong: "rgba(42,33,27,0.65)",
  textShadow: "rgba(42,33,27,0.45)",
};

// Type scale (docs/DESIGN_SYSTEM.md B2). Display face is Lora (bundled);
// body/label/caption use the platform system font.
export const TYPE = {
  display: { fontFamily: "Lora_700Bold", fontSize: 30, lineHeight: 34 },
  title: { fontFamily: "Lora_600SemiBold", fontSize: 22, lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600" },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontVariant: ["tabular-nums"],
  },
  step: { fontSize: 24, lineHeight: 32 },
};

// Named reanimated spring configs (docs/DESIGN_SYSTEM.md B3).
// Reduced motion: swap any of these for TIMING.fade.
export const SPRING = {
  gentle: { damping: 18, stiffness: 120, mass: 1 },
  snappy: { damping: 15, stiffness: 220, mass: 0.8 },
  pop: { damping: 12, stiffness: 320, mass: 0.7 }, // the paw-pop signature
  sheet: { damping: 22, stiffness: 260, mass: 1 },
};

export const TIMING = {
  sweep: 500, // CalorieRing sweep, ease-out
  fade: 200,
};
