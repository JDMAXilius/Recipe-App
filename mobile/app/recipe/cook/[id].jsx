import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  Platform,
  Animated as RNAnimated,
  Easing,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKeepAwake } from "expo-keep-awake";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MealAPI } from "../../../services/mealAPI";
import { UserRecipeAPI, transformUserRecipe, isUserRecipeId } from "../../../services/userRecipes";
import { useTheme } from "../../../context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../../../constants/tokens";
import { splitSteps, matchStepIngredients } from "../../../lib/cookSession";
import { segmentStep } from "../../../lib/stepEnrich";
import { detectStepAction, ACTION_ART } from "../../../lib/stepAction";
import { scaledIngredient } from "../../../lib/ingredientParser";
import { useUnitSystem } from "../../../hooks/useUnitSystem";
import LoadingSpinner from "../../../components/LoadingSpinner";
import OttoIdle from "../../../components/OttoIdle";
import Bounceable from "../../../components/Bounceable";

// Cook Mode v2 (Mobbin deep-dive blueprint, 2026-07-15):
// mise en place → step screens with You'll-need chips + semantic step text
// (tap a duration = start a NAMED timer) → floating timer card (+1/+5, done
// modal with the undercooked escape hatch) → this-step/everything ingredient
// sheet → swipe or Next → Proud-Otto finish arc with "cook it again?" thumbs.
// Deliberately NOT built (blueprint): voice control, per-step video, in-cook AI.

const BASE_SERVINGS = 4;

const CookModeScreen = () => {
  useKeepAwake();
  const { id: recipeId, step: stepParam, servings: servingsParam } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, SPACING.lg);
  const [unitSystem] = useUnitSystem();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(parseInt(servingsParam) || BASE_SERVINGS);
  const [phase, setPhase] = useState(stepParam != null ? "steps" : "prep"); // prep | steps | done
  const [step, setStep] = useState(parseInt(stepParam) || 0);
  const [prepChecked, setPrepChecked] = useState({});
  const [sheetOpen, setSheetOpen] = useState(null); // null | "ingredients" | "timers" | "jump"
  const [sheetFilter, setSheetFilter] = useState("step"); // step | all
  const [exitConfirm, setExitConfirm] = useState(false);
  const [thumbs, setThumbs] = useState(null);
  const [platePhoto, setPlatePhoto] = useState(null);

  // ---- timers ------------------------------------------------------------
  const [timers, setTimers] = useState([]); // {id,label,total,remaining,running,done}
  const [doneTimer, setDoneTimer] = useState(null);
  const timersRef = useRef(timers);
  timersRef.current = timers;

  useEffect(() => {
    const tick = setInterval(() => {
      const prev = timersRef.current;
      if (!prev.some((t) => t.running)) return;
      // compute next state OUTSIDE the updater — updaters must stay pure
      const finished = [];
      const next = prev.map((t) => {
        if (!t.running) return t;
        const remaining = t.remaining - 1;
        if (remaining <= 0) {
          finished.push(t);
          return { ...t, remaining: 0, running: false, done: true };
        }
        return { ...t, remaining };
      });
      setTimers(next);
      if (finished.length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setDoneTimer({ ...finished[0], remaining: 0 });
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const startTimer = (label, minutes) => {
    Haptics.selectionAsync().catch(() => {});
    setTimers((prev) => {
      if (prev.some((t) => t.label === label && (t.running || t.done))) return prev;
      return [
        ...prev,
        {
          id: `${label}-${prev.length}`,
          label,
          total: minutes * 60,
          remaining: minutes * 60,
          running: true,
          done: false,
        },
      ];
    });
  };

  const extendTimer = (id, minutes) => {
    Haptics.selectionAsync().catch(() => {});
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, remaining: t.remaining + minutes * 60, running: true, done: false }
          : t
      )
    );
  };

  const dismissTimer = (id) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const mmss = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ---- data --------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        if (isUserRecipeId(recipeId)) {
          const row = await UserRecipeAPI.get(recipeId);
          setRecipe(transformUserRecipe(row));
        } else {
          const mealData = await MealAPI.getMealById(recipeId);
          if (mealData) setRecipe(MealAPI.transformMealData(mealData));
        }
      } catch (error) {
        console.error("Error loading cook mode:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [recipeId]);

  const steps = useMemo(() => (recipe ? splitSteps(recipe.instructions) : []), [recipe]);
  const pairs = recipe?.ingredientPairs?.length
    ? recipe.ingredientPairs
    : (recipe?.ingredients || []).map((s) => ({ measure: "", name: s }));
  const scaleFactor = servings / (recipe?.servings || BASE_SERVINGS);

  // step advance animation
  const stepAnim = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    stepAnim.setValue(0);
    RNAnimated.timing(stepAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [step, phase, stepAnim]);

  const goTo = (next) => {
    if (next < 0 || next >= steps.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setStep(next);
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPhase("done");
    try {
      await AsyncStorage.setItem(`otto.cooked.${recipeId}`, new Date().toISOString());
    } catch {}
  };

  const advance = () => {
    if (step === steps.length - 1) finish();
    else goTo(step + 1);
  };

  const goBackStep = () => goTo(step - 1);

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .onEnd((e) => {
      "worklet";
      if (e.translationX < -60) runOnJS(advance)();
      else if (e.translationX > 60) runOnJS(goBackStep)();
    });

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/recipe/${recipeId}`);
  };

  const requestExit = () => {
    const hasProgress = step > 0 || timers.some((t) => t.running);
    if (phase === "steps" && hasProgress) setExitConfirm(true);
    else leave();
  };

  const rateThumb = async (up) => {
    Haptics.selectionAsync().catch(() => {});
    setThumbs(up);
    try {
      await AsyncStorage.setItem(`otto.cookAgain.${recipeId}`, up ? "yes" : "no");
    } catch {}
  };

  // "I cooked this" — private journal snap (roadmap Phase 5: celebrate →
  // snap → journal; life before any public feed). Camera on device, library
  // fallback (web/sim have no camera).
  const snapPlate = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      let result;
      if (Platform.OS !== "web") {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        result = granted
          ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
      }
      if (result?.canceled || !result?.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri;
      setPlatePhoto(uri);
      await AsyncStorage.setItem(
        `otto.journal.${recipeId}`,
        JSON.stringify({ uri, at: Date.now(), title: recipe?.title })
      );
    } catch {
      // no camera, no drama — the button just stays
    }
  };

  // Bail out via effect, never during render (double-invoke would pop twice).
  const mustLeave = !loading && (!recipe || steps.length === 0);
  useEffect(() => {
    if (mustLeave) leave();
  }, [mustLeave]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep links can carry an out-of-range ?step= — clamp once steps exist.
  useEffect(() => {
    if (steps.length > 0 && step >= steps.length) setStep(steps.length - 1);
  }, [steps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner message="Setting up your station..." />;
  if (mustLeave) return null;

  const runningTimers = timers.filter((t) => t.running);
  const floatingTimer = timers.find((t) => t.running) || timers.find((t) => t.done);
  const stepIngredients = matchStepIngredients(steps[step] || "", pairs);
  const isLast = step === steps.length - 1;

  // ---------------------------------------------------------------- FINISH
  if (phase === "done") {
    return (
      <View style={[styles.container, styles.finishContainer]}>
        <OttoIdle
          source={require("../../../assets/mascot/otto-proud-cut.png")}
          style={styles.finishOtto}
          entrance
        />
        <Text style={styles.finishTitle}>Dinner, done.</Text>
        <Text style={styles.finishBody}>Otto's proud of you.</Text>

        <Text style={styles.thumbsQuestion}>Would you cook it again?</Text>
        <View style={styles.thumbsRow}>
          <TouchableOpacity
            style={[styles.thumbButton, thumbs === true && styles.thumbActive]}
            onPress={() => rateThumb(true)}
            accessibilityRole="button"
            accessibilityLabel="Yes, I'd cook it again"
          >
            <Ionicons
              name={thumbs === true ? "thumbs-up" : "thumbs-up-outline"}
              size={26}
              color={thumbs === true ? colors.white : colors.ink}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thumbButton, thumbs === false && styles.thumbActive]}
            onPress={() => rateThumb(false)}
            accessibilityRole="button"
            accessibilityLabel="No, not again"
          >
            <Ionicons
              name={thumbs === false ? "thumbs-down" : "thumbs-down-outline"}
              size={26}
              color={thumbs === false ? colors.white : colors.ink}
            />
          </TouchableOpacity>
        </View>

        {/* Private journal snap — celebrate, then capture (Blue Apron moment) */}
        {platePhoto ? (
          <View style={styles.plateRow}>
            <Image source={{ uri: platePhoto }} style={styles.plateThumb} />
            <Text style={styles.plateText}>In your journal. It looks great.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.plateButton}
            onPress={snapPlate}
            accessibilityRole="button"
            accessibilityLabel="Snap a photo of your plate"
          >
            <Ionicons name="camera-outline" size={18} color={colors.accent} />
            <Text style={styles.plateButtonText}>Snap your plate</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.finishButton}
          onPress={leave}
          accessibilityRole="button"
          accessibilityLabel="Back to recipe"
        >
          <Text style={styles.primaryButtonText}>Back to the recipe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ----------------------------------------------------------------- PREP
  if (phase === "prep") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={leave}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.prepHeading}>Mise en place</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.prepContent} showsVerticalScrollIndicator={false}>
          <View style={styles.prepOttoRow}>
            <OttoIdle
              source={require("../../../assets/mascot/otto-happy-cut.png")}
              style={styles.prepOtto}
            />
            <Text style={styles.prepLead}>
              Everything on the counter before the heat goes on.
            </Text>
          </View>

          <View style={styles.servesBand}>
            <Text style={styles.servesText}>
              For <Text style={styles.servesCount}>{servings}</Text>{" "}
              {servings === 1 ? "serving" : "servings"}
            </Text>
            <View style={styles.servesControls}>
              <TouchableOpacity
                style={styles.servesButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => servings > 1 && setServings(servings - 1)}
                accessibilityRole="button"
                accessibilityLabel="Decrease servings"
              >
                <Text style={styles.servesButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.servesButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => servings < 24 && setServings(servings + 1)}
                accessibilityRole="button"
                accessibilityLabel="Increase servings"
              >
                <Text style={styles.servesButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {pairs.map((pair, i) => {
            const s = scaledIngredient(pair, scaleFactor, unitSystem);
            const checked = !!prepChecked[i];
            return (
              <TouchableOpacity
                key={i}
                style={styles.prepRow}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setPrepChecked((prev) => ({ ...prev, [i]: !prev[i] }));
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <Ionicons
                  name={checked ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={checked ? colors.accent : colors.border}
                />
                <Text style={[styles.prepQty, checked && styles.prepDone]}>{s.display}</Text>
                <Text style={[styles.prepName, checked && styles.prepDone]}>{s.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.footerBar, { paddingBottom: safeBottom }]}>
          <Bounceable
            onPress={() => setPhase("steps")}
            style={styles.primaryButton}
            containerStyle={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="Start cooking"
          >
            <Text style={styles.primaryButtonText}>Start cooking</Text>
          </Bounceable>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------------------- STEPS
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={requestExit}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Exit cooking mode"
        >
          <Ionicons name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.stepHeading}>
          Step {step + 1} <Text style={styles.stepHeadingSoft}>of {steps.length}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSheetOpen("timers");
            Haptics.selectionAsync().catch(() => {});
          }}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Timers"
        >
          <Ionicons name="stopwatch-outline" size={24} color={colors.ink} />
          {runningTimers.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{runningTimers.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* PROGRESS DAUBS (tap = step jump) */}
      <TouchableOpacity
        style={styles.progressTrack}
        onPress={() => setSheetOpen("jump")}
        accessibilityRole="button"
        accessibilityLabel="Jump to a step"
      >
        {steps.map((_, i) => (
          <View key={i} style={[styles.daub, i <= step && styles.daubDone]} />
        ))}
      </TouchableOpacity>

      {/* FLOATING TIMER CARD */}
      {floatingTimer && (
        <View style={[styles.timerCard, floatingTimer.done && styles.timerCardDone]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.timerLabel} numberOfLines={1}>
              {floatingTimer.label}
            </Text>
            <Text style={[styles.timerTime, floatingTimer.done && styles.timerTimeDone]}>
              {mmss(floatingTimer.remaining)}
            </Text>
          </View>
          <TouchableOpacity style={styles.timerChip} onPress={() => extendTimer(floatingTimer.id, 1)}>
            <Text style={styles.timerChipText}>+1 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timerChip} onPress={() => extendTimer(floatingTimer.id, 5)}>
            <Text style={styles.timerChipText}>+5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => dismissTimer(floatingTimer.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss timer"
          >
            <Ionicons name="close" size={18} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>
      )}

      {/* STEP BODY (swipeable) */}
      <GestureDetector gesture={swipe}>
        <View style={{ flex: 1 }}>
          {stepIngredients.length > 0 && (
            <View style={styles.needStrip}>
              {stepIngredients.slice(0, 4).map((p, i) => {
                const s = scaledIngredient(p, scaleFactor, unitSystem);
                return (
                  <View key={i} style={styles.needChip}>
                    <Text style={styles.needChipText} numberOfLines={1}>
                      {`${s.display} ${s.name}`.trim()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent}>
            <RNAnimated.View
              style={{
                opacity: stepAnim,
                transform: [
                  { translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              }}
            >
              <Text style={styles.stepText}>
                {segmentStep(steps[step]).map((seg, i) => {
                  if (seg.type === "duration")
                    return (
                      <Text
                        key={i}
                        style={styles.stepDuration}
                        onPress={() => startTimer(`Step ${step + 1} — ${seg.text}`, seg.minutes)}
                        suppressHighlighting
                      >
                        {" "}◷ {seg.text}{" "}
                      </Text>
                    );
                  if (seg.type === "temp")
                    return (
                      <Text key={i} style={styles.stepTemp}>
                        {seg.text}
                      </Text>
                    );
                  return <Text key={i}>{seg.text}</Text>;
                })}
              </Text>
              {segmentStep(steps[step]).some((s) => s.type === "duration") && (
                <Text style={styles.timerHint}>Tap a time to start a timer</Text>
              )}
              {/* Otto acting out this step (deterministic: lib/stepAction) */}
              <Image
                source={ACTION_ART[detectStepAction(steps[step])]}
                style={styles.actionArt}
                resizeMode="contain"
                accessible={false}
              />
            </RNAnimated.View>
          </ScrollView>
        </View>
      </GestureDetector>

      {/* CONTROLS */}
      <View style={[styles.footerBar, { paddingBottom: safeBottom }]}>
        <TouchableOpacity
          onPress={() => {
            setSheetFilter("step");
            setSheetOpen("ingredients");
          }}
          style={styles.squareButton}
          accessibilityRole="button"
          accessibilityLabel="Show ingredients"
        >
          <Ionicons name="list-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
        {step > 0 && (
          <TouchableOpacity
            onPress={goBackStep}
            style={styles.squareButton}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        <Bounceable
          onPress={advance}
          style={styles.primaryButton}
          containerStyle={{ flex: 1 }}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Finish cooking" : "Next step"}
        >
          <Text style={styles.primaryButtonText}>{isLast ? "Finish" : "Next step"}</Text>
        </Bounceable>
      </View>

      {/* Ingredients sheet — This step / Everything */}
      <Modal
        visible={sheetOpen === "ingredients"}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(null)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheetOpen(null)} />
        <View style={[styles.sheet, { paddingBottom: safeBottom + SPACING.md }]}>
          <View style={styles.handle} />
          <View style={styles.filterRow}>
            {[
              ["step", "This step"],
              ["all", "Everything"],
            ].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSheetFilter(key);
                }}
                style={[styles.filterPill, sheetFilter === key && styles.filterPillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: sheetFilter === key }}
              >
                <Text
                  style={[styles.filterPillText, sheetFilter === key && styles.filterPillTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView style={{ maxHeight: 380 }}>
            {(sheetFilter === "step" ? stepIngredients : pairs).map((p, i) => {
              const s = scaledIngredient(p, scaleFactor, unitSystem);
              return (
                <View key={i} style={styles.sheetRow}>
                  <Text style={styles.sheetQty}>{s.display}</Text>
                  <Text style={styles.sheetName}>{s.name}</Text>
                </View>
              );
            })}
            {sheetFilter === "step" && stepIngredients.length === 0 && (
              <Text style={styles.sheetEmpty}>Nothing specific for this step.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Timers hub */}
      <Modal
        visible={sheetOpen === "timers"}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(null)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheetOpen(null)} />
        <View style={[styles.sheet, { paddingBottom: safeBottom + SPACING.md }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Otto's timers</Text>
          <ScrollView style={{ maxHeight: 380 }}>
            {timers.map((t) => (
              <View key={t.id} style={styles.timerHubRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName} numberOfLines={1}>
                    {t.label}
                  </Text>
                  <Text style={[styles.timerTime, t.done && styles.timerTimeDone]}>
                    {t.done ? "done" : mmss(t.remaining)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.timerChip} onPress={() => extendTimer(t.id, 1)}>
                  <Text style={styles.timerChipText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => dismissTimer(t.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={colors.inkSoft} />
                </TouchableOpacity>
              </View>
            ))}
            {steps
              .flatMap((text, i) =>
                segmentStep(text)
                  .filter((s) => s.type === "duration")
                  .map((s, j) => ({ stepIndex: i, seg: s, key: `${i}-${j}` }))
              )
              .filter(
                ({ stepIndex, seg }) =>
                  !timers.some((t) => t.label === `Step ${stepIndex + 1} — ${seg.text}`)
              )
              .map(({ stepIndex, seg, key }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.timerHubRow}
                  onPress={() => startTimer(`Step ${stepIndex + 1} — ${seg.text}`, seg.minutes)}
                  accessibilityRole="button"
                >
                  <Ionicons name="play-circle-outline" size={20} color={colors.accent} />
                  <Text style={[styles.sheetName, { flex: 1 }]}>
                    Step {stepIndex + 1} — {seg.text}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Step jump */}
      <Modal
        visible={sheetOpen === "jump"}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(null)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheetOpen(null)} />
        <View style={[styles.sheet, { paddingBottom: safeBottom + SPACING.md }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Jump to a step</Text>
          <ScrollView style={{ maxHeight: 420 }}>
            {steps.map((text, i) => (
              <TouchableOpacity
                key={i}
                style={styles.jumpRow}
                onPress={() => {
                  setSheetOpen(null);
                  goTo(i);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.jumpNumber, i === step && { color: colors.accent }]}>
                  {i + 1}
                </Text>
                <Text
                  style={[styles.jumpText, i === step && { color: colors.accent }]}
                  numberOfLines={1}
                >
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Timer-done modal — the undercooked escape hatch */}
      <Modal visible={!!doneTimer} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.doneModal}>
            <Text style={styles.doneTitle}>Otto sniffs the pan…</Text>
            <Text style={styles.doneBody}>{doneTimer?.label} is up. Done, or a little longer?</Text>
            <View style={styles.doneRow}>
              <TouchableOpacity
                style={styles.doneSecondary}
                onPress={() => {
                  if (doneTimer) extendTimer(doneTimer.id, 1);
                  setDoneTimer(null);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.doneSecondaryText}>A bit more (+1 min)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.donePrimary}
                onPress={() => {
                  if (doneTimer) dismissTimer(doneTimer.id);
                  setDoneTimer(null);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit confirm */}
      <Modal visible={exitConfirm} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.doneModal}>
            <OttoIdle
              source={require("../../../assets/mascot/otto-sad-cut.png")}
              style={styles.exitOtto}
            />
            <Text style={styles.doneTitle}>Leave the kitchen?</Text>
            <Text style={styles.doneBody}>Your timers will stop.</Text>
            <View style={styles.doneRow}>
              <TouchableOpacity
                style={styles.doneSecondary}
                onPress={() => {
                  setExitConfirm(false);
                  leave();
                }}
                accessibilityRole="button"
              >
                <Text style={styles.doneSecondaryText}>Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.donePrimary}
                onPress={() => setExitConfirm(false)}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Keep cooking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
    stepHeading: { ...TYPE.title, fontSize: 20, color: colors.ink },
    stepHeadingSoft: { color: colors.inkSoft, fontWeight: "400" },
    prepHeading: { ...TYPE.title, fontSize: 20, color: colors.ink },

    progressTrack: {
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    daub: {
      flex: 1,
      height: 6,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.border,
    },
    daubDone: { backgroundColor: colors.accent },

    timerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.button,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    timerCardDone: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    timerLabel: { ...TYPE.caption, color: colors.inkSoft },
    timerTime: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    timerTimeDone: { color: colors.accent },
    timerChip: {
      minHeight: 40,
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    timerChipText: { ...TYPE.label, color: colors.ink },

    needStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
    },
    needChip: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      maxWidth: "100%",
    },
    needChipText: { ...TYPE.label, fontSize: 12, color: colors.ink },

    stepContent: { padding: SPACING.xl },
    stepText: { ...TYPE.step, color: colors.ink },
    stepDuration: {
      color: colors.accent,
      fontWeight: "800",
      backgroundColor: colors.accentSoft,
    },
    stepTemp: { color: colors.secondary, fontWeight: "800" },
    timerHint: { ...TYPE.caption, color: colors.inkSoft, marginTop: SPACING.md },
    actionArt: {
      width: "68%",
      maxWidth: 300,
      aspectRatio: 1,
      alignSelf: "center",
      marginTop: SPACING.xl,
      opacity: 0.95,
    },

    footerBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },
    squareButton: {
      width: 52,
      height: 52,
      borderRadius: RADIUS.button,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButton: {
      height: 56,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: { ...TYPE.body, fontSize: 17, fontWeight: "700", color: colors.white },

    prepContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
    prepOttoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    prepOtto: { width: 72, height: 72 },
    prepLead: { ...TYPE.body, color: colors.inkSoft, flex: 1 },
    servesBand: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    servesText: { ...TYPE.body, color: colors.ink },
    servesCount: { fontWeight: "700", color: colors.accent, fontVariant: ["tabular-nums"] },
    servesControls: { flexDirection: "row", gap: SPACING.md },
    servesButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    servesButtonText: { fontSize: 20, fontWeight: "700", color: colors.ink, lineHeight: 22 },
    prepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    prepQty: {
      ...TYPE.body,
      fontWeight: "700",
      color: colors.accent,
      minWidth: 76,
      fontVariant: ["tabular-nums"],
    },
    prepName: { ...TYPE.body, color: colors.ink, flex: 1 },
    prepDone: { opacity: 0.4, textDecorationLine: "line-through" },

    backdrop: { flex: 1, backgroundColor: "rgba(42,33,27,0.35)" },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.sheet,
      borderTopRightRadius: RADIUS.sheet,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.border,
      marginTop: SPACING.sm,
      marginBottom: SPACING.md,
    },
    sheetTitle: { ...TYPE.title, fontSize: 18, color: colors.ink, marginBottom: SPACING.md },
    filterRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
    filterPill: {
      backgroundColor: colors.surfaceWarm,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    filterPillActive: { backgroundColor: colors.accent },
    filterPillText: { ...TYPE.label, color: colors.ink },
    filterPillTextActive: { color: colors.white },
    sheetRow: {
      flexDirection: "row",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetQty: {
      ...TYPE.body,
      fontSize: 16,
      fontWeight: "700",
      color: colors.accent,
      minWidth: 84,
      fontVariant: ["tabular-nums"],
    },
    sheetName: { ...TYPE.body, fontSize: 16, color: colors.ink, flexShrink: 1 },
    sheetEmpty: { ...TYPE.body, color: colors.inkSoft, paddingVertical: SPACING.lg },
    timerHubRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    jumpRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
    },
    jumpNumber: {
      ...TYPE.label,
      color: colors.inkSoft,
      width: 22,
      textAlign: "right",
      fontVariant: ["tabular-nums"],
    },
    jumpText: { ...TYPE.body, color: colors.ink, flex: 1 },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(42,33,27,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: SPACING.xl,
    },
    doneModal: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      padding: SPACING.xl,
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      gap: SPACING.sm,
    },
    doneTitle: { ...TYPE.title, fontSize: 20, color: colors.ink, textAlign: "center" },
    doneBody: { ...TYPE.body, color: colors.inkSoft, textAlign: "center" },
    doneRow: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.md },
    doneSecondary: {
      height: 48,
      borderRadius: RADIUS.button,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.lg,
    },
    doneSecondaryText: { ...TYPE.body, fontWeight: "700", color: colors.ink },
    donePrimary: {
      height: 48,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xl,
    },
    exitOtto: { width: 96, height: 96 },

    finishContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: SPACING.xxl,
      gap: SPACING.sm,
    },
    finishOtto: { width: 200, height: 200, marginBottom: SPACING.md },
    finishTitle: { ...TYPE.display, color: colors.ink },
    finishBody: { ...TYPE.body, color: colors.inkSoft },
    thumbsQuestion: { ...TYPE.body, color: colors.ink, marginTop: SPACING.lg },
    thumbsRow: { flexDirection: "row", gap: SPACING.lg, marginBottom: SPACING.lg },
    thumbButton: {
      width: 56,
      height: 56,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.surfaceWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbActive: { backgroundColor: colors.accent },
    plateButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: RADIUS.button,
      paddingHorizontal: SPACING.xl,
      height: 46,
      marginBottom: SPACING.lg,
    },
    plateButtonText: { ...TYPE.body, fontWeight: "700", color: colors.accent },
    plateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    plateThumb: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.surfaceWarm,
    },
    plateText: { ...TYPE.body, color: colors.inkSoft },
    finishButton: {
      height: 56,
      paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.button,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default CookModeScreen;
