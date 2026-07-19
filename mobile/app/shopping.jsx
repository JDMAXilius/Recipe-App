import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { createShoppingStyles } from "../assets/styles/shopping.styles";
import { MealAPI } from "../services/mealAPI";
import { PlanAPI, UserRecipeAPI, transformUserRecipe, isUserRecipeId, ShareAPI } from "../services/userRecipes";
import { buildShoppingList, AISLES } from "../lib/shoppingList";
import { buildShoppingListShareText, sharePlainText } from "../lib/shareText";
import { weekDays } from "../lib/week";
import LoadingSpinner from "../components/LoadingSpinner";
import OttoIdle from "../components/OttoIdle";
import ScreenHeader from "../components/ScreenHeader";
import ShoppingListShareCard from "../components/ShoppingListShareCard";
import { shareCardAvailable, captureAndShareTallCard } from "../lib/shareCard";

// Shopping list (roadmap Phase 4): built by an EXPLICIT push from the plan,
// one row per ingredient with summed quantities + provenance, aisle sections,
// whole-row check-off that never reorders mid-store, inline add-item, source
// recipes as removable chips. The week changing NEVER silently rewrites the
// list — a banner asks first.

const STORE_KEY = "otto.shopping.v1";

const ShoppingScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { show } = useToast();
  const styles = useMemo(() => createShoppingStyles(colors), [colors]);
  // The plan's "Build my list from this week" button passes a fresh nonce so
  // we rebuild from the CURRENT plan instead of showing a stale cached list.
  const { build: buildNonce } = useLocalSearchParams();

  const [state, setState] = useState(null); // {builtAt, planIds, excluded, items, custom, checked}
  const [planEntries, setPlanEntries] = useState([]);
  const [busy, setBusy] = useState(true);
  const [newItem, setNewItem] = useState("");
  const shareCardRef = useRef(null);
  const consumedBuild = useRef(null); // last build-nonce already acted on

  const persist = async (next) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      // list still lives in memory for the session
    }
  };

  const loadPlan = useCallback(async () => {
    const days = weekDays();
    try {
      return await PlanAPI.list(days[0].key, days[6].key);
    } catch {
      return [];
    }
  }, []);

  const build = useCallback(
    async (entries, excluded, previous) => {
      // unique recipes still included
      const wanted = [];
      const seen = new Set();
      for (const entry of entries) {
        if (!entry.recipeId || seen.has(entry.recipeId) || excluded.includes(entry.recipeId)) continue;
        seen.add(entry.recipeId);
        wanted.push(entry);
      }
      // A single flaky/rate-limited fetch used to drop a whole dish — or, on a
      // rebuild, freeze the entire list at its old state. TheMealDB throttles
      // bursts, so retry each recipe once before giving up on it.
      const fetchRecipe = async (entry) => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (isUserRecipeId(entry.recipeId)) {
              return transformUserRecipe(await UserRecipeAPI.get(entry.recipeId));
            }
            const meal = await MealAPI.getMealById(entry.recipeId);
            if (meal) return MealAPI.transformMealData(meal);
          } catch {
            // fall through to the retry
          }
          if (attempt === 0) await new Promise((r) => setTimeout(r, 450));
        }
        return null;
      };

      const recipes = (await Promise.all(wanted.map(fetchRecipe))).filter(Boolean);
      const missing = wanted.length - recipes.length;

      // Only keep the old list if we couldn't load ANY dish (a real outage) and
      // had a list worth keeping. A PARTIAL failure still rebuilds — the plan
      // you can see is the plan the list should reflect. (Old bug: bailed on
      // the first failure, so one bad fetch froze the whole list.)
      if (recipes.length === 0 && wanted.length > 0 && previous) {
        show({ message: "Couldn't reach the pantry — keeping your current list." });
        return previous;
      }

      const items = buildShoppingList(recipes);
      const next = {
        builtAt: Date.now(),
        planIds: entries.map((e) => e.id).sort(),
        excluded,
        items,
        custom: previous?.custom || [],
        checked: previous?.checked || {},
        recipes: recipes.map((r) => ({ id: String(r.id), title: r.title })),
      };
      await persist(next);
      if (missing > 0) {
        show({
          message: `${missing} dish${missing === 1 ? "" : "es"} wouldn't load — tap Update to try again.`,
        });
      }
      return next;
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setBusy(true);
        const entries = await loadPlan();
        setPlanEntries(entries);
        let stored = null;
        try {
          stored = JSON.parse((await AsyncStorage.getItem(STORE_KEY)) || "null");
        } catch {
          stored = null;
        }
        // A fresh nonce from the plan's build button means "rebuild from this
        // week now" — don't just show the cached list. Guard on the nonce so
        // re-focusing the tab later doesn't rebuild again.
        const forceBuild = Boolean(buildNonce) && buildNonce !== consumedBuild.current;
        if (forceBuild) {
          consumedBuild.current = buildNonce;
          await build(entries, stored?.excluded || [], stored);
        } else if (!stored) {
          await build(entries, [], null);
        } else {
          setState(stored);
        }
        setBusy(false);
      })();
    }, [loadPlan, build, buildNonce])
  );

  if (busy || !state) return <LoadingSpinner message="Counting the pantry..." />;

  const currentIds = planEntries.map((e) => e.id).sort();
  const stale = JSON.stringify(currentIds) !== JSON.stringify(state.planIds);

  const toggle = (key) => {
    Haptics.selectionAsync().catch(() => {});
    persist({ ...state, checked: { ...state.checked, [key]: !state.checked[key] } });
  };

  const removeSource = async (recipeId) => {
    const excluded = [...state.excluded, recipeId];
    setBusy(true);
    await build(planEntries, excluded, state);
    setBusy(false);
  };

  const update = async () => {
    setBusy(true);
    await build(planEntries, state.excluded, state);
    setBusy(false);
    show({ message: "List refreshed from this week's plan." });
  };

  const addCustom = () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem("");
    persist({
      ...state,
      // Date.now() key — an index reuses keys after removals (shared checkbox bug)
      custom: [...state.custom, { key: `custom-${Date.now()}`, name }],
    });
  };

  const removeCustom = (key) => {
    const { [key]: _gone, ...checked } = state.checked;
    persist({ ...state, custom: state.custom.filter((c) => c.key !== key), checked });
  };

  const shareList = async () => {
    Haptics.selectionAsync().catch(() => {});
    // Preferred: share the list as a picture of the card (matches the app).
    // Only the current binary carries view-shot; on web/old builds this is a
    // no-op and we fall through to the text + snapshot-link share below.
    if (shareCardAvailable() && (await captureAndShareTallCard(shareCardRef, "Shopping list"))) {
      return;
    }
    // Snapshot link (S2/G2): a read-only page the recipient opens with no
    // account. If minting fails, the plain-text list still shares alone.
    let link = null;
    const openItems = [
      ...state.items
        .filter((i) => !state.checked[i.key])
        .map((i) => ({ name: i.name, amount: i.amount || "", aisle: i.aisle || "", sources: i.sources || [] })),
      ...state.custom
        .filter((c) => !state.checked[c.key])
        .map((c) => ({ name: c.name, amount: "", aisle: "Extras", sources: [] })),
    ];
    if (openItems.length > 0) {
      try {
        link = (await ShareAPI.listSnapshot(openItems))?.url || null;
      } catch {
        // text-only fallback
      }
    }
    const text = buildShoppingListShareText(state);
    const { copied } = await sharePlainText(text, "Shopping list", link);
    if (copied) show({ message: "List copied — paste it anywhere." });
  };

  const grouped = AISLES.map((aisle) => ({
    aisle,
    items: state.items.filter((i) => i.aisle === aisle),
  })).filter((g) => g.items.length > 0);

  const total = state.items.length + state.custom.length;
  const done = [...state.items, ...state.custom].filter((i) => state.checked[i.key]).length;

  return (
    <View style={styles.container}>
      {/* App chrome floats on the cream; the pad's own banner names the
          screen, so no header title. */}
      <ScreenHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/plan"))}
        right={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/household")}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Open the shared list"
            >
              <Ionicons name="people-outline" size={20} color={colors.ink} />
            </TouchableOpacity>
            {total > 0 ? (
              <TouchableOpacity
                onPress={shareList}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Share the shopping list"
              >
                <Ionicons name="share-outline" size={22} color={colors.ink} />
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* The pad grows with its content. The paper + printed frame are
              drawn with Views (not a stretched three-slice image): on iOS New
              Architecture the stretched slices misaligned the frame's side
              rules at the seams. A real inset double-rule can never drift from
              the sheet, at any list length. */}
          <View style={styles.pad}>
            <View style={styles.padArt} pointerEvents="none">
              <View style={styles.padStack} />
              <View style={styles.padSheet}>
                <View style={styles.padFrameOuter} />
                <View style={styles.padFrameInner} />
              </View>
            </View>

            {/* printed banner flag, like the "things to do:" pad */}
            <View style={styles.bannerWrap} accessibilityRole="header">
              <View style={styles.banner}>
                <Text style={styles.bannerText}>SHOPPING LIST</Text>
              </View>
              <View style={styles.bannerNotchRow}>
                <View style={styles.bannerNotchLeft} />
                <View style={styles.bannerNotchRight} />
              </View>
            </View>

          {total > 0 && (
            <View style={styles.countHeader}>
              <Text style={styles.count}>
                {done} of {total} in the basket
              </Text>
            </View>
          )}

          {stale && (
            <View style={styles.staleBanner}>
              <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
              <Text style={styles.staleText}>Your week changed — update the list?</Text>
              <TouchableOpacity onPress={update} accessibilityRole="button" accessibilityLabel="Update the list">
                <Text style={styles.staleAction}>Update it</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Source recipes — removable chips */}
          {state.recipes.length > 0 && (
            <View style={styles.sourceChipsRow}>
              {state.recipes.map((r) => (
                <View key={r.id} style={styles.sourceChip}>
                  <Text style={styles.sourceChipText} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeSource(r.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${r.title} from the list`}
                  >
                    <Ionicons name="close" size={13} color={colors.inkSoft} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {total === 0 ? (
            <View style={styles.emptyList}>
              <OttoIdle
                source={require("../assets/mascot/otto-thinking-cut.png")}
                style={styles.emptyOtto}
              />
              <Text style={styles.emptyWeekText}>
                Nothing to buy yet — put a dish or two on Otto's week and build the list from
                there.
              </Text>
            </View>
          ) : (
            grouped.map((group) => (
              <View key={group.aisle}>
                <Text style={styles.aisleTitle}>{group.aisle}</Text>
                <View style={styles.aisleRule} />
                {group.items.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.itemRow}
                    onPress={() => toggle(item.key)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: Boolean(state.checked[item.key]) }}
                    accessibilityLabel={`${item.amount} ${item.name}`}
                  >
                    <View style={[styles.itemCheck, state.checked[item.key] && styles.itemCheckOn]}>
                      {state.checked[item.key] && (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      )}
                    </View>
                    <View style={styles.itemBody}>
                      <Text
                        style={[styles.itemName, state.checked[item.key] && styles.itemNameChecked]}
                      >
                        {item.amount ? <Text style={styles.itemQty}>{item.amount} </Text> : null}
                        {item.name}
                      </Text>
                      <Text style={styles.itemProvenance} numberOfLines={1}>
                        for {item.sources.join(" · ")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}

          {/* Custom items */}
          {state.custom.length > 0 && (
            <View>
              <Text style={styles.aisleTitle}>Your extras</Text>
              <View style={styles.aisleRule} />
              {state.custom.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.itemRow}
                  onPress={() => toggle(item.key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(state.checked[item.key]) }}
                  accessibilityLabel={item.name}
                >
                  <View style={[styles.itemCheck, state.checked[item.key] && styles.itemCheckOn]}>
                    {state.checked[item.key] && (
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    )}
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemName, state.checked[item.key] && styles.itemNameChecked]}>
                      {item.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeCustom(item.key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                  >
                    <Ionicons name="close" size={16} color={colors.inkSoft} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Inline add-item */}
          <View style={styles.addItemRow}>
            <TextInput
              style={styles.addItemInput}
              value={newItem}
              onChangeText={setNewItem}
              placeholder="Something else? Coffee…"
              placeholderTextColor={colors.inkSoft}
              onSubmitEditing={addCustom}
              returnKeyType="done"
              accessibilityLabel="Add your own item"
            />
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={addCustom}
              accessibilityRole="button"
              accessibilityLabel="Add item"
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

            <View style={styles.padBottomSpace} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Off-screen: the snapshot source for the picture share. Mounted (real
          layout needed for capture), parked out of the viewport. */}
      {shareCardAvailable() && total > 0 ? (
        <View collapsable={false} style={{ position: "absolute", left: -9999, top: 0 }} pointerEvents="none">
          <ShoppingListShareCard ref={shareCardRef} state={state} aisles={AISLES} />
        </View>
      ) : null}
    </View>
  );
};
export default ShoppingScreen;
