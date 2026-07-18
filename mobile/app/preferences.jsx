import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import ScreenHeader from "../components/ScreenHeader";
import { createPreferencesStyles } from "../assets/styles/preferences.styles";
import { MealAPI } from "../services/mealAPI";
import { loadPrefs, savePrefs, DIETS, FALLBACK_AREAS } from "../lib/prefs";
import LoadingSpinner from "../components/LoadingSpinner";

// Food preferences — diet (single choice) + cuisines (any number), saved
// explicitly (KS pattern: prefs re-rank Discover, so they commit once).
// The scope copy below promises exactly what lib/prefs.js delivers — no
// more, no less.
const PreferencesScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const styles = useMemo(() => createPreferencesStyles(colors), [colors]);

  const [prefs, setPrefs] = useState(null);
  const [areas, setAreas] = useState(FALLBACK_AREAS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadPrefs().then(setPrefs);
    // live list when reachable; the fallback mirrors the same vocabulary
    MealAPI.listAreas()
      .then((all) => {
        const clean = all.filter((a) => a && a !== "Unknown");
        if (clean.length) setAreas(clean);
      })
      .catch(() => {});
  }, []);

  if (!prefs) return <LoadingSpinner message="Fetching your tastes..." />;

  const pickDiet = (key) => {
    Haptics.selectionAsync().catch(() => {});
    setPrefs({ ...prefs, diet: key });
    setDirty(true);
  };

  const toggleCuisine = (area) => {
    Haptics.selectionAsync().catch(() => {});
    const on = prefs.cuisines.includes(area);
    setPrefs({
      ...prefs,
      cuisines: on ? prefs.cuisines.filter((c) => c !== area) : [...prefs.cuisines, area],
    });
    setDirty(true);
  };

  const save = async () => {
    if (!dirty) return router.back();
    await savePrefs(prefs);
    show({ message: "Noted — Discover follows your taste now." });
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Food preferences"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            onPress={save}
            style={styles.saveButton}
            accessibilityRole="button"
            accessibilityLabel="Save preferences"
          >
            <Text style={[styles.saveText, !dirty && styles.saveTextIdle]}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* the honesty contract, in user words */}
        <Text style={styles.scopeNote}>
          These shape Otto’s pick and where Discover starts. Search and the
          filters stay fully yours, and your own recipes are never filtered.
        </Text>

        <Text style={styles.sectionLabel}>Diet</Text>
        <View style={styles.card}>
          {DIETS.map((diet, index) => (
            <TouchableOpacity
              key={diet.key}
              style={[styles.dietRow, index === DIETS.length - 1 && styles.dietRowLast]}
              onPress={() => pickDiet(diet.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: prefs.diet === diet.key }}
              accessibilityLabel={diet.label}
            >
              <Text style={styles.dietLabel}>{diet.label}</Text>
              <View style={[styles.radio, prefs.diet === diet.key && styles.radioOn]}>
                {prefs.diet === diet.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.dietFootnote}>
          Only the diets Otto’s recipe shelf can honestly tag today — more
          arrive as richer recipe data lands.
        </Text>

        <Text style={styles.sectionLabel}>Cuisines you love</Text>
        <View style={styles.chipsWrap}>
          {areas.map((area) => {
            const on = prefs.cuisines.includes(area);
            return (
              <TouchableOpacity
                key={area}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggleCuisine(area)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={area}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{area}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};
export default PreferencesScreen;
