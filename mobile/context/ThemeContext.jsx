import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, NUTRITION_COLORS } from "../constants/colors";

// Reactive theming for the app. Holds the active niche ("base" | "lean" | "keto" | "bulk")
// and the appearance mode ("light" | "dark" | "system"), persisted in AsyncStorage.
// New components should read colors via useTheme(); legacy screens still use the static
// COLORS export from constants/colors and will not react to changes until migrated.

const STORAGE_KEY = "app.theme.v1";

const ThemeContext = createContext({
  colors: THEMES.base.light,
  nutrition: NUTRITION_COLORS,
  niche: "base",
  mode: "system",
  isDark: false,
  loaded: false,
  setNiche: () => {},
  setMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [niche, setNicheState] = useState("base");
  const [mode, setModeState] = useState("system"); // "light" | "dark" | "system"
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            if (saved.niche && THEMES[saved.niche]) setNicheState(saved.niche);
            if (["light", "dark", "system"].includes(saved.mode)) setModeState(saved.mode);
          } catch {
            // ignore malformed value
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = (next) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const setNiche = (next) => {
    if (!THEMES[next]) return;
    setNicheState(next);
    persist({ niche: next, mode });
  };

  const setMode = (next) => {
    setModeState(next);
    persist({ niche, mode: next });
  };

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const themeSet = THEMES[niche] || THEMES.base;
  const colors = isDark ? themeSet.dark : themeSet.light;

  return (
    <ThemeContext.Provider
      value={{ colors, nutrition: NUTRITION_COLORS, niche, mode, isDark, loaded, setNiche, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
