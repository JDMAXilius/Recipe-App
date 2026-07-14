// Design system — "Otto" (see docs/DESIGN_SYSTEM.md)
// Tokens derived from the otter-chef mascot's palette: terracotta apron (accent),
// chestnut fur (secondary), cream belly/world (surfaces), warm ink.
//
// Each theme exposes BOTH the legacy keys the existing screens already use
// (primary, background, text, textLight, border, white, card, shadow, gray)
// AND the richer design-system keys (accent, accentSoft, secondary, gold,
// bg, surface, surfaceWarm, ink, inkSoft). New components should prefer the
// design-system keys via useTheme(); legacy keys keep the current screens working.

// Build a full token set (light + dark) from a niche accent.
// Neutrals stay warm and shared across niches — only the accent changes.
const makeTheme = ({ accent, accentSoft, accentDark, accentSoftDark }) => ({
  light: {
    // brand
    primary: accent,
    accent,
    accentSoft,
    secondary: "#8A5A3B", // chestnut fur
    gold: "#E8B04B", // golden light — ratings, streaks, celebrations
    // surfaces
    background: "#FAF4EA",
    bg: "#FAF4EA",
    card: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceWarm: "#F3E9DA", // cream belly — grouped rows, wells
    white: "#FFFFFF",
    // ink
    text: "#2A211B",
    ink: "#2A211B",
    textLight: "#6E6055",
    inkSoft: "#6E6055",
    // lines & misc
    border: "#E8DECF",
    gray: "#B9A895", // disabled / muted warm grey
    shadow: "#2A211B",
    destructive: "#D64545", // outline sign-out / delete actions
  },
  dark: {
    // warm espresso — never grey-black, so the mascot's world holds at night
    primary: accentDark,
    accent: accentDark,
    accentSoft: accentSoftDark,
    secondary: "#B98A66",
    gold: "#E8B04B",
    background: "#1E1712",
    bg: "#1E1712",
    card: "#2A211B",
    surface: "#2A211B",
    surfaceWarm: "#332822",
    white: "#FFFFFF", // stays white: text on colored buttons / gradients
    text: "#F3E9DA",
    ink: "#F3E9DA",
    textLight: "#B9A895",
    inkSoft: "#B9A895",
    border: "#3E322A",
    gray: "#6E6055",
    shadow: "#000000",
    destructive: "#D64545",
  },
});

export const THEMES = {
  base: makeTheme({ accent: "#C4562E", accentSoft: "#F3D9CD", accentDark: "#E0774E", accentSoftDark: "#4A2E20" }),
  lean: makeTheme({ accent: "#10B3A3", accentSoft: "#CDEEEA", accentDark: "#3FD0C1", accentSoftDark: "#123C38" }),
  keto: makeTheme({ accent: "#2E8B4E", accentSoft: "#D2E9D8", accentDark: "#54B473", accentSoftDark: "#153A24" }),
  bulk: makeTheme({ accent: "#F5793B", accentSoft: "#FBE0D2", accentDark: "#FB9160", accentSoftDark: "#4A2C1C" }),
};

// Functional nutrition colors — FIXED, never re-skinned by theme or niche.
// Fat = purple is the one convention shared by MyFitnessPal + Lifesum (see MOBBIN_COMPARISON.md).
export const NUTRITION_COLORS = {
  protein: "#3B82F6", // blue
  carbs: "#F0A020", // amber
  fat: "#8B5CF6", // purple
};

// Legacy static export (base app, light mode). All screens/components now read
// colors reactively via useTheme() from context/ThemeContext — kept only for
// scripts/back-compat. Do not import this in app code.
export const COLORS = THEMES.base.light;
