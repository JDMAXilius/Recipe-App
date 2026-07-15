import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useSaved } from "../../context/SavedContext";
import { PlanAPI, UserRecipeAPI, transformUserRecipe } from "../../services/userRecipes";
import { createPlanStyles } from "../../assets/styles/plan.styles";
import LoadingSpinner from "../../components/LoadingSpinner";
import OttoIdle from "../../components/OttoIdle";
import Bounceable from "../../components/Bounceable";
import { weekDays } from "../../lib/week";

// Otto's week (roadmap Phase 4): vertical day cards, LOOSE buckets — no meal
// slots, no gray guilt. Empty days are painted invitations. A 2-dinner week
// looks finished. Light "Cooked it" state; the list is built from here.

const PlanScreen = () => {
  const { colors } = useTheme();
  const { show } = useToast();
  const router = useRouter();
  const { savedList } = useSaved();
  const styles = useMemo(() => createPlanStyles(colors), [colors]);
  const safeBottom = Math.max(useSafeAreaInsets().bottom, 24);

  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [pickerDay, setPickerDay] = useState(null); // day key while choosing a recipe
  const [mine, setMine] = useState([]);

  const days = useMemo(() => weekDays(), []);

  const load = useCallback(async () => {
    try {
      const rows = await PlanAPI.list(days[0].key, days[6].key);
      setEntries(rows);
    } catch {
      // keep the last known week — never blank the plan on a flaky request
    } finally {
      setLoaded(true);
    }
  }, [days]);

  useFocusEffect(
    useCallback(() => {
      load();
      UserRecipeAPI.list()
        .then((rows) => setMine(rows.map(transformUserRecipe)))
        .catch(() => {});
    }, [load])
  );

  if (!loaded) return <LoadingSpinner message="Checking Otto's week..." />;

  const byDay = {};
  for (const e of entries) {
    const key = String(e.day).slice(0, 10);
    (byDay[key] = byDay[key] || []).push(e);
  }
  const planned = entries.length;

  // Recipes offered in the picker: your cookbook (own first, then saved).
  const pickerChoices = [
    ...mine,
    ...savedList.map((f) => ({
      id: f.recipeId,
      title: f.title,
      image: f.image,
      category: f.category,
    })),
  ];

  const assign = async (recipe) => {
    const day = pickerDay;
    setPickerDay(null);
    try {
      const created = await PlanAPI.add({
        day,
        recipeId: String(recipe.id),
        title: recipe.title,
        image: recipe.image,
        category: recipe.category,
      });
      setEntries((prev) => [...prev, created]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      show({ message: error.message || "Couldn't add that to the week." });
    }
  };

  const toggleCooked = async (entry) => {
    Haptics.selectionAsync().catch(() => {});
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, cooked: !entry.cooked } : e))
    );
    try {
      await PlanAPI.update(entry.id, { cooked: !entry.cooked });
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, cooked: entry.cooked } : e))
      );
      show({ message: "Couldn't mark that — try again." });
    }
  };

  const remove = async (entry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await PlanAPI.remove(entry.id);
    } catch {
      setEntries((prev) => [...prev, entry]);
      show({ message: "Couldn't remove that — it's back on the card." });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Otto's week</Text>
          {planned > 0 && (
            <Text style={styles.count}>
              {planned} {planned === 1 ? "dish" : "dishes"} planned
            </Text>
          )}
        </View>

        {planned > 0 && (
          <Bounceable
            style={styles.listButton}
            containerStyle={styles.listButtonWrap}
            onPress={() => router.push("/shopping")}
            accessibilityRole="button"
            accessibilityLabel="Build my shopping list from this week"
          >
            <Ionicons name="basket-outline" size={18} color={colors.white} />
            <Text style={styles.listButtonText}>Build my list from this week</Text>
          </Bounceable>
        )}

        {days.map((day, index) => {
          const dayEntries = byDay[day.key] || [];
          return (
            <View key={day.key} style={[styles.dayCard, index === 0 && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, index === 0 && styles.dayLabelToday]}>
                  {day.label}
                </Text>
                <Text style={styles.daySub}>{day.sub}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.dayAdd}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setPickerDay(day.key);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Add a dish to ${day.label}`}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {dayEntries.length === 0 ? (
                <Text style={styles.emptyDay}>
                  {index === 0 ? "Nothing yet — Otto's happy to improvise." : "Open — no plans, no guilt."}
                </Text>
              ) : (
                dayEntries.map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    <TouchableOpacity
                      style={styles.entryMain}
                      onPress={() => entry.recipeId && router.push(`/recipe/${entry.recipeId}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${entry.title}`}
                    >
                      {entry.image ? (
                        <Image source={{ uri: entry.image }} style={styles.entryThumb} contentFit="cover" />
                      ) : (
                        <View style={[styles.entryThumb, styles.entryThumbEmpty]}>
                          <Ionicons name="restaurant-outline" size={16} color={colors.inkSoft} />
                        </View>
                      )}
                      <Text
                        style={[styles.entryTitle, entry.cooked && styles.entryTitleCooked]}
                        numberOfLines={2}
                      >
                        {entry.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleCooked(entry)}
                      style={[styles.cookedMark, entry.cooked && styles.cookedMarkOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: Boolean(entry.cooked) }}
                      accessibilityLabel={entry.cooked ? "Cooked — tap to unmark" : "Mark as cooked"}
                    >
                      <Ionicons
                        name="flame"
                        size={16}
                        color={entry.cooked ? colors.white : colors.inkSoft}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => remove(entry)}
                      style={styles.entryRemove}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${entry.title} from ${day.label}`}
                    >
                      <Ionicons name="close" size={16} color={colors.inkSoft} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}

        {planned === 0 && (
          <View style={styles.emptyWeek}>
            <OttoIdle
              source={require("../../assets/mascot/otto-happy-cut.png")}
              style={styles.emptyOtto}
            />
            <Text style={styles.emptyWeekText}>
              Tap ＋ on any day and pick something from your cookbook — tonight in one tap, a
              list in ten seconds.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Recipe picker — your cookbook, own recipes first */}
      <Modal visible={pickerDay !== null} transparent animationType="slide">
        <View style={styles.sheetScrim}>
          <View style={[styles.sheet, { paddingBottom: safeBottom }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>What's cooking?</Text>
            {pickerChoices.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Text style={styles.sheetEmptyText}>
                  Your cookbook is empty — save a few recipes or add your own first.
                </Text>
              </View>
            ) : (
              <FlatList
                data={pickerChoices}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickRow}
                    onPress={() => assign(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Plan ${item.title}`}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.pickThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.pickThumb, styles.entryThumbEmpty]}>
                        <Ionicons name="restaurant-outline" size={16} color={colors.inkSoft} />
                      </View>
                    )}
                    <Text style={styles.pickTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Ionicons name="add-circle" size={22} color={colors.accent} />
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setPickerDay(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.sheetCloseText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default PlanScreen;
