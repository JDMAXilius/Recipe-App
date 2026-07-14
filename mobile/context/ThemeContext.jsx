import { createContext, useContext } from "react";
import { THEMES, NUTRITION_COLORS } from "../constants/colors";

// LIGHT-ONLY LOCK (docs/DESIGN_SYSTEM.md Part B, decision D2):
// the app ships the base light token set and the user cannot change it.
// THEMES keeps the dark + niche sets in code for future niche BUILDS,
// but no runtime switching exists — no mode, no niche, no persistence.
// useTheme() keeps the same read API so screens/components are untouched.

const LOCKED = {
  colors: THEMES.base.light,
  nutrition: NUTRITION_COLORS,
  niche: "base",
  mode: "light",
  isDark: false,
  loaded: true,
};

const ThemeContext = createContext(LOCKED);

export const ThemeProvider = ({ children }) => (
  <ThemeContext.Provider value={LOCKED}>{children}</ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
