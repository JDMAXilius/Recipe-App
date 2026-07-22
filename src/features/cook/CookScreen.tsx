import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, OttoArt, Sheet, Text, useToast } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { colors, radii, space } from '@/shared/theme/tokens';
import { toUserRecipeId } from '@/types/ids';
import { pickFromLibrary, takePhoto } from '@/shared/imagePicker';
import { usePlan } from '@/features/planner';
import { useJournal } from '@/features/journal';
import { NutritionCard, type NutritionRecipe } from '@/features/nutrition';
import { fetchCookRecipe } from './cook.queries';
import { splitSteps, matchStepIngredients, mmss } from './session';
import { segmentStep } from './stepEnrich';
import { StepCard } from './components/StepCard';
import { TimerHub, type AvailableTimer } from './components/TimerHub';
import type { CookTimer } from './cook.types';

type Phase = 'prep' | 'steps' | 'done';
type OpenSheet = null | 'ingredients' | 'timers' | 'jump';

// Cook mode: mise-en-place → big-type step screens (tap a duration = named
// timer) → multi-timer hub → swipe/Next nav → exit protection → Proud-Otto
// finish. Ported from mobile/app/recipe/cook/[id].jsx onto @/shared/ui + tokens.
// Deliberately NOT ported (no v2 deps): timer sound/vibration/keep-awake, camera
// plate snap, live ingredient rescaling. Noted in the packet gaps. (Haptics +
// step-advance animation restored in Wave F1.)
export function CookScreen() {
  const { id, step: stepParam, servings: servingsParam } = useLocalSearchParams<{
    id: string;
    step?: string;
    servings?: string;
  }>();
  const recipeId = String(id);
  const router = useRouter();
  const { entries, setCooked } = usePlan();
  const { addEntry: addJournalEntry } = useJournal();
  const { show: showToast } = useToast();
  const [snapped, setSnapped] = useState(false);

  // Snap-your-plate (P4): optional, never blocks finishing. Try the camera,
  // fall back to the library; a null means cancel OR a denied permission —
  // imagePicker doesn't distinguish, so we just nudge, never crash.
  const snapPlate = async () => {
    const image = (await takePhoto()) ?? (await pickFromLibrary());
    if (!image) {
      showToast('No worries — snap your plate any time.', 'info');
      return;
    }
    addJournalEntry({ recipeId, title: recipe?.title ?? 'A dish', image });
    setSnapped(true);
    showToast('Saved to your journal', 'success', { ottoImage: 'excited' });
  };

  const recipeQuery = useQuery({
    queryKey: ['cookRecipe', recipeId],
    queryFn: () => fetchCookRecipe(recipeId),
  });
  const recipe = recipeQuery.data ?? null;

  const steps = useMemo(() => (recipe ? splitSteps(recipe.steps) : []), [recipe]);
  const pairs = recipe?.ingredientPairs ?? [];

  const [phase, setPhase] = useState<Phase>(stepParam != null ? 'steps' : 'prep');
  const [step, setStep] = useState<number>(parseInt(String(stepParam ?? ''), 10) || 0);
  const [servings, setServings] = useState<number>(parseInt(String(servingsParam ?? ''), 10) || 0);
  const [prepChecked, setPrepChecked] = useState<Record<number, boolean>>({});
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [sheetFilter, setSheetFilter] = useState<'step' | 'all'>('step');
  const [exitConfirm, setExitConfirm] = useState(false);

  // Default servings once the recipe lands (recipe.servings, else 1).
  useEffect(() => {
    if (recipe && servings === 0) setServings(recipe.servings ?? 1);
  }, [recipe, servings]);

  // Clamp a deep-linked out-of-range ?step= once steps exist.
  useEffect(() => {
    if (steps.length > 0 && step >= steps.length) setStep(steps.length - 1);
  }, [steps.length, step]);

  // ---- timers ------------------------------------------------------------
  const [timers, setTimers] = useState<CookTimer[]>([]);
  const [doneTimer, setDoneTimer] = useState<CookTimer | null>(null);
  const timersRef = useRef(timers);
  timersRef.current = timers;

  useEffect(() => {
    const tick = setInterval(() => {
      const prev = timersRef.current;
      if (!prev.some((t) => t.running)) return;
      const finished: CookTimer[] = [];
      const next = prev.map((t) => {
        if (!t.running) return t;
        const remaining = t.remaining - 1;
        if (remaining <= 0) {
          const done = { ...t, remaining: 0, running: false, done: true };
          finished.push(done);
          return done;
        }
        return { ...t, remaining };
      });
      setTimers(next);
      if (finished.length) {
        const t = finished[0];
        haptics.notify('success');
        setDoneTimer(t);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const startTimer = (label: string, minutes: number) => {
    haptics.select();
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

  const extendTimer = (timerId: string, minutes: number) => {
    haptics.select();
    setTimers((prev) =>
      prev.map((t) =>
        t.id === timerId
          ? { ...t, remaining: t.remaining + minutes * 60, running: true, done: false }
          : t,
      ),
    );
  };

  const dismissTimer = (timerId: string) =>
    setTimers((prev) => prev.filter((t) => t.id !== timerId));

  const runningTimers = timers.filter((t) => t.running);
  const floatingTimer = timers.find((t) => t.running) || timers.find((t) => t.done) || null;

  // Every step duration not already a running/finished timer → TimerHub launcher.
  const availableTimers: AvailableTimer[] = useMemo(() => {
    const out: AvailableTimer[] = [];
    steps.forEach((text, i) => {
      segmentStep(text).forEach((seg) => {
        if (seg.type !== 'duration') return;
        const label = `Step ${i + 1} — ${seg.text}`;
        if (!timers.some((t) => t.label === label)) out.push({ label, minutes: seg.minutes });
      });
    });
    return out;
  }, [steps, timers]);

  // ---- navigation --------------------------------------------------------
  const goTo = (nextStep: number) => {
    if (nextStep < 0 || nextStep >= steps.length) return;
    haptics.impact('medium');
    setStep(nextStep);
  };

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/recipe/${recipeId}`);
  };

  const finish = () => {
    haptics.notify('success');
    setPhase('done');
    // Cook-completion (planner allowlist): mark every plan entry for this recipe
    // cooked. usePlan invalidates ['plan', userId] → useCookedState updates.
    entries
      .filter((e) => String(e.recipe_id) === recipeId && !e.cooked)
      .forEach((e) => {
        void setCooked(e.id, true);
      });
  };

  const advance = () => (step === steps.length - 1 ? finish() : goTo(step + 1));
  const goBackStep = () => goTo(step - 1);

  const requestExit = () => {
    haptics.impact('light');
    const hasProgress = step > 0 || timers.some((t) => t.running);
    if (phase === 'steps' && hasProgress) setExitConfirm(true);
    else leave();
  };

  // Swipe nav — core PanResponder (no gesture-handler dep). Left = next, right = back.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -60) advanceRef.current();
        else if (g.dx > 60) goBackRef.current();
      },
    }),
  ).current;
  // Keep the responder's closures pointed at the latest step handlers.
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const goBackRef = useRef(goBackStep);
  goBackRef.current = goBackStep;

  // Bail out (via effect, never during render) when the recipe can't be cooked.
  const mustLeave = !recipeQuery.isLoading && (!recipe || steps.length === 0);
  useEffect(() => {
    if (mustLeave) leave();
  }, [mustLeave]); // eslint-disable-line react-hooks/exhaustive-deps

  if (recipeQuery.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', gap: space[4] }}>
        <OttoArt name="scene-loading" size={120} />
        <Text role="body">Setting up your station…</Text>
      </View>
    );
  }
  if (mustLeave || !recipe) return null;

  const stepIngredients = matchStepIngredients(steps[step] || '', pairs);
  const isLast = step === steps.length - 1;

  // ---------------------------------------------------------------- FINISH
  if (phase === 'done') {
    // cook loads user recipes from the `recipes` table, so the id is a user
    // recipe ref ("u-<id>") — NOT a seed id. Using toSeedId here would key the
    // nutrition cache into seed_nutrition's TheMealDB namespace and could serve
    // an unrelated seed's macros (review finding). u- keeps the id spaces apart.
    const nutritionRecipe: NutritionRecipe = {
      id: toUserRecipeId(`u-${recipe.id}`),
      ingredients: recipe.ingredientPairs,
      servings: recipe.servings,
      category: recipe.category,
      steps: recipe.steps,
    };
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[3] }}>
        <OttoArt name="proud" size={200} />
        <Text role="display">Dinner, done.</Text>
        <Text role="body">Otto&apos;s proud of you.</Text>
        {/* The shared honest card — labelled estimate, no daily-goal denominator,
            FDA-rounded kcal. Replaces hand-rolled Rings that showed "415 / 2000"
            unlabelled (review: honesty-law violation). */}
        <View style={{ alignSelf: 'stretch', marginTop: space[4] }}>
          <NutritionCard recipe={nutritionRecipe} />
        </View>
        <View style={{ marginTop: space[4], alignSelf: 'stretch' }}>
          {snapped ? (
            <View style={{ alignItems: 'center' }}>
              <Text role="caption">Plate saved to your journal.</Text>
            </View>
          ) : (
            <Button title="Snap your plate" variant="secondary" size="lg" onPress={snapPlate} />
          )}
        </View>
        <View style={{ marginTop: space[3], alignSelf: 'stretch' }}>
          <Button title="Back to the recipe" variant="primary" size="lg" onPress={leave} />
        </View>
      </View>
    );
  }

  // ----------------------------------------------------------------- PREP
  if (phase === 'prep') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <Header
          left={<CloseButton onPress={leave} label="Close" />}
          title="Mise en place"
        />
        <ScrollView contentContainerStyle={{ padding: space[4], paddingBottom: space[7] }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], marginBottom: space[4] }}>
            <OttoArt name="happy" size={72} />
            <View style={{ flex: 1 }}>
              <Text role="body">Everything on the counter before the heat goes on.</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[3] }}>
            <Text role="body">
              For {servings} {servings === 1 ? 'serving' : 'servings'}
            </Text>
            <View style={{ flexDirection: 'row', gap: space[3] }}>
              <Stepper label="Decrease servings" symbol="−" onPress={() => setServings((s) => Math.max(1, s - 1))} />
              <Stepper label="Increase servings" symbol="+" onPress={() => setServings((s) => Math.min(24, s + 1))} />
            </View>
          </View>

          {pairs.map((pair, i) => {
            const checked = !!prepChecked[i];
            return (
              <Pressable
                key={`${pair.name}-${i}`}
                onPress={() => { haptics.select(); setPrepChecked((prev) => ({ ...prev, [i]: !prev[i] })); }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  minHeight: 44,
                  paddingVertical: space[2],
                  borderBottomWidth: 1,
                  borderBottomColor: colors.creamDeep,
                  opacity: checked ? 0.45 : 1,
                }}
              >
                <Ionicons
                  name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={checked ? colors.terracotta : colors.inkSoft}
                />
                <RNText style={{ fontWeight: '700', color: colors.terracotta, minWidth: 76, fontVariant: ['tabular-nums'] }}>
                  {pair.measure}
                </RNText>
                <RNText style={{ flex: 1, color: colors.ink, textDecorationLine: checked ? 'line-through' : 'none' }}>
                  {pair.name}
                </RNText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ padding: space[4], borderTopWidth: 1, borderTopColor: colors.creamDeep }}>
          <Button title="Start cooking" variant="primary" size="lg" onPress={() => setPhase('steps')} />
        </View>
      </View>
    );
  }

  // ----------------------------------------------------------------- STEPS
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header
        left={<CloseButton onPress={requestExit} label="Exit cooking mode" />}
        title={`Step ${step + 1} of ${steps.length}`}
        right={
          <Pressable
            onPress={() => { haptics.select(); setOpenSheet('timers'); }}
            accessibilityRole="button"
            accessibilityLabel="Timers"
            style={{ width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="stopwatch-outline" size={24} color={colors.ink} />
            {runningTimers.length > 0 && (
              <View style={{ position: 'absolute', top: 4, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <RNText style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>{runningTimers.length}</RNText>
              </View>
            )}
          </Pressable>
        }
      />

      {/* Progress daubs — tap to jump */}
      <Pressable
        onPress={() => setOpenSheet('jump')}
        accessibilityRole="button"
        accessibilityLabel="Jump to a step"
        style={{ flexDirection: 'row', gap: 4, paddingHorizontal: space[4], paddingVertical: space[2] }}
      >
        {steps.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: radii.pill, backgroundColor: i <= step ? colors.terracotta : colors.creamDeep }} />
        ))}
      </Pressable>

      {/* Floating timer card */}
      {floatingTimer && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], marginHorizontal: space[4], backgroundColor: colors.white, borderWidth: 1, borderColor: floatingTimer.done ? colors.terracotta : colors.creamDeep, borderRadius: radii.card, paddingHorizontal: space[3], paddingVertical: space[2] }}>
          <View style={{ flex: 1 }}>
            <RNText style={{ fontSize: 13, color: colors.inkSoft }} numberOfLines={1}>{floatingTimer.label}</RNText>
            <RNText style={{ fontSize: 18, fontWeight: '800', color: colors.terracotta, fontVariant: ['tabular-nums'] }}>
              {mmss(floatingTimer.remaining)}
            </RNText>
          </View>
          <Pressable onPress={() => extendTimer(floatingTimer.id, 1)} accessibilityRole="button" accessibilityLabel="Add a minute" hitSlop={8} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: space[3], backgroundColor: colors.creamDeep, borderRadius: radii.pill }}>
            <RNText style={{ fontWeight: '600', color: colors.ink }}>+1 min</RNText>
          </Pressable>
          <Pressable onPress={() => extendTimer(floatingTimer.id, 5)} accessibilityRole="button" accessibilityLabel="Add five minutes" hitSlop={8} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: space[3], backgroundColor: colors.creamDeep, borderRadius: radii.pill }}>
            <RNText style={{ fontWeight: '600', color: colors.ink }}>+5</RNText>
          </Pressable>
          <Pressable onPress={() => dismissTimer(floatingTimer.id)} accessibilityRole="button" accessibilityLabel="Dismiss timer" hitSlop={8} style={{ minHeight: 40, minWidth: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>
      )}

      {/* Step body — swipeable */}
      <View style={{ flex: 1 }} {...pan.panHandlers}>
        <StepCard stepIndex={step} text={steps[step]} ingredients={stepIngredients} onStartTimer={startTimer} />
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderTopWidth: 1, borderTopColor: colors.creamDeep }}>
        <Pressable
          onPress={() => { setSheetFilter('step'); setOpenSheet('ingredients'); }}
          accessibilityRole="button"
          accessibilityLabel="Show ingredients"
          style={{ width: 52, height: 52, borderRadius: radii.card, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="list-outline" size={22} color={colors.ink} />
        </Pressable>
        {step > 0 && (
          <Pressable
            onPress={goBackStep}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
            style={{ width: 52, height: 52, borderRadius: radii.card, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Button title={isLast ? 'Finish' : 'Next step'} variant="primary" size="lg" onPress={advance} />
        </View>
      </View>

      {/* Ingredients sheet — This step / Everything */}
      <Sheet visible={openSheet === 'ingredients'} onClose={() => setOpenSheet(null)}>
        <View style={{ flexDirection: 'row', gap: space[2], marginBottom: space[3] }}>
          {([['step', 'This step'], ['all', 'Everything']] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { haptics.select(); setSheetFilter(key); }}
              accessibilityRole="button"
              accessibilityState={{ selected: sheetFilter === key }}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space[4], borderRadius: radii.pill, backgroundColor: sheetFilter === key ? colors.terracotta : colors.creamDeep }}
            >
              <RNText style={{ fontWeight: '600', color: sheetFilter === key ? colors.white : colors.ink }}>{label}</RNText>
            </Pressable>
          ))}
        </View>
        <ScrollView style={{ maxHeight: 360 }}>
          {(sheetFilter === 'step' ? stepIngredients : pairs).map((p, i) => (
            <View key={`${p.name}-${i}`} style={{ flexDirection: 'row', gap: space[3], paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: colors.creamDeep }}>
              <RNText style={{ fontWeight: '700', color: colors.terracotta, minWidth: 84, fontVariant: ['tabular-nums'] }}>{p.measure}</RNText>
              <RNText style={{ color: colors.ink, flexShrink: 1 }}>{p.name}</RNText>
            </View>
          ))}
          {sheetFilter === 'step' && stepIngredients.length === 0 && (
            <View style={{ paddingVertical: space[4] }}>
              <Text role="caption">Nothing specific for this step.</Text>
            </View>
          )}
        </ScrollView>
      </Sheet>

      {/* Multi-timer hub */}
      <TimerHub
        visible={openSheet === 'timers'}
        onClose={() => setOpenSheet(null)}
        timers={timers}
        available={availableTimers}
        onStart={startTimer}
        onExtend={extendTimer}
        onDismiss={dismissTimer}
      />

      {/* Step jump */}
      <Sheet visible={openSheet === 'jump'} onClose={() => setOpenSheet(null)} title="Jump to a step">
        <ScrollView style={{ maxHeight: 420 }}>
          {steps.map((text, i) => (
            <Pressable
              key={i}
              onPress={() => { setOpenSheet(null); goTo(i); }}
              accessibilityRole="button"
              accessibilityLabel={`Step ${i + 1}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 44, paddingVertical: space[2] }}
            >
              <RNText style={{ width: 22, textAlign: 'right', color: i === step ? colors.terracotta : colors.inkSoft, fontVariant: ['tabular-nums'] }}>{i + 1}</RNText>
              <RNText style={{ flex: 1, color: i === step ? colors.terracotta : colors.ink }} numberOfLines={1}>{text}</RNText>
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>

      {/* Timer-done — the undercooked escape hatch */}
      <CenterModal visible={!!doneTimer}>
        <Text role="title">Otto sniffs the pan…</Text>
        <Text role="body">{doneTimer?.label} is up. Done, or a little longer?</Text>
        <View style={{ flexDirection: 'row', gap: space[3], marginTop: space[4] }}>
          <View style={{ flex: 1 }}>
            <Button title="A bit more (+1 min)" variant="secondary" onPress={() => { if (doneTimer) extendTimer(doneTimer.id, 1); setDoneTimer(null); }} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Done" variant="primary" onPress={() => { if (doneTimer) dismissTimer(doneTimer.id); setDoneTimer(null); }} />
          </View>
        </View>
      </CenterModal>

      {/* Exit confirm — protects in-progress timers/steps */}
      <CenterModal visible={exitConfirm}>
        <OttoArt name="sad" size={96} />
        <Text role="title">Leave the kitchen?</Text>
        <Text role="body">Your timers will stop.</Text>
        <View style={{ flexDirection: 'row', gap: space[3], marginTop: space[4] }}>
          <View style={{ flex: 1 }}>
            <Button title="Leave" variant="secondary" onPress={() => { setExitConfirm(false); leave(); }} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Keep cooking" variant="primary" onPress={() => setExitConfirm(false)} />
          </View>
        </View>
      </CenterModal>
    </View>
  );
}

// --- small local chrome (nothing a shared primitive covers) ------------------
function Header({ left, title, right }: { left?: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[2] }}>
      <View style={{ width: 44 }}>{left}</View>
      <Text role="title">{title}</Text>
      <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

function CloseButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="close" size={24} color={colors.ink} />
    </Pressable>
  );
}

function Stepper({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={{ width: 44, height: 44, borderRadius: radii.card, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }}>
      <RNText style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{symbol}</RNText>
    </Pressable>
  );
}

function CenterModal({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(42,35,32,0.45)', alignItems: 'center', justifyContent: 'center', padding: space[6] }}>
        <View style={{ backgroundColor: colors.cream, borderRadius: radii.card, padding: space[6], width: '100%', maxWidth: 420, alignItems: 'center', gap: space[2] }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}
