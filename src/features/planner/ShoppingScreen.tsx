import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text as RNText,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Text, OttoArt, OttoIdle, OttoLoading, OttoError, Screen, useToast } from '@/shared/ui';
import { haptics } from '@/shared/haptics';
import { sound } from '@/shared/sound';
import { colors, radii, space } from '@/shared/theme/tokens';
import { kv } from '@/shared/storage';
import { buildShoppingListShareText, ShareListCard, ShoppingListBanner } from '@/features/share';
import { useHousehold, useSharedList, getHouseholdWeekDishes } from '@/features/household';
import { usePlan } from './usePlan';
import { getListRecipes } from './plan.queries';
import {
  buildShoppingList,
  isRemoved,
  normalizeRemoved,
  pruneRemoved,
  sameSources,
  AISLES,
  type RemovedEntry,
  type ShoppingItem,
} from './shoppingList';
import { HoldToRemoveRow } from './components/HoldToRemoveRow';

// Shopping list (roadmap Phase 4): built from the current week, one row per
// ingredient with summed quantities + provenance, aisle sections, whole-row
// check-off that never reorders. Check state is client-only (a boolean map)
// and is NOT an input to buildShoppingList — so ticking an item can never
// move it. Check state + custom extras persist to kv ('shoppingState') so the
// list survives leaving the screen; the derived rows always rebuild from plan.
//
// Three grades of "I don't need this": drop a whole DISH (chip ×), delete a
// custom extra (its ×), or throw ONE ingredient off by holding the row and
// dragging it away (HoldToRemoveRow). Removals live in `removed` beside
// `excluded` — filtered out of the rows, the basket count, and the share — and
// each one remembers the DISHES it came from, so it hides that removal and not
// the ingredient's name forever (see shoppingList.ts). Nothing is hidden
// without a way back: the "N hidden · Show them" line is always there while
// anything is hidden, not just for the 5s the undo toast lives.

// Bump when the MEANING of a removal's `sources` changes. 2 = recipe ids.
const REMOVED_IDENTITY_V = 2;

// The kv blob, validated before trust (storage.ts:24-26 rule): a corrupt or
// hand-edited value must degrade per FIELD (catch), never throw mid-hydration —
// a stored `null` used to crash the async hydrate and nothing persisted for the
// whole session. `removed` stays unknown here; normalizeRemoved is its guard.
const storedStateSchema = z
  .object({
    checked: z.record(z.string(), z.boolean()).catch({}),
    custom: z.array(z.object({ key: z.string(), name: z.string() })).catch([]),
    excluded: z.array(z.string()).catch([]),
    removed: z.unknown().optional(),
    // Removal-identity version. v1 (or absent) = sources were dish TITLES, as
    // shipped in builds 33/34; those entries can never match id-keyed sources
    // again, so they are dropped on read rather than left to rot in the blob.
    // Fail-open by design: the shopper sees their rows back, not data lost.
    removedV: z.number().optional(),
  })
  .catch({ checked: {}, custom: [], excluded: [], removed: [], removedV: REMOVED_IDENTITY_V });
type StoredShoppingState = z.infer<typeof storedStateSchema>;
const EMPTY_STORED: StoredShoppingState = {
  checked: {},
  custom: [],
  excluded: [],
  removed: [],
  removedV: REMOVED_IDENTITY_V,
};

export function ShoppingScreen() {
  const router = useRouter();
  const { show } = useToast();
  const {
    entries,
    days,
    isLoading: planLoading,
    isSuccess: planSuccess,
    isError: planError,
  } = usePlan();
  // The offscreen ShareListCard (the recipient-facing picture) — captured by
  // react-native-view-shot when sharing on native.
  const shareCardRef = useRef<View>(null);
  const qc = useQueryClient();

  // Refresh on every open. staleTime is 60s app-wide, so without this a reopened
  // list could show a stale plan or stale shared check-state (Juan: "needs to
  // update properly every time I open it"). Invalidate the sources on focus; the
  // derived ingredient rows rebuild from them.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['household-week'] });
      qc.invalidateQueries({ queryKey: ['household-list'] });
      qc.invalidateQueries({ queryKey: ['plan-list'] });
    }, [qc]),
  );

  // Shared kitchen: when the user is in a household the list aggregates EVERY
  // member's week and the check-offs + custom items are shared in realtime
  // (household_list_state). Otherwise it's the personal week with local state.
  const { household, memberIds, isLoading: householdLoading } = useHousehold();
  const shared = useSharedList(household?.id ?? null);
  const isShared = !!household;

  // Source dishes (id + title): everyone's week when shared, else mine.
  const myDishes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) if (e.recipe_id && !seen.has(e.recipe_id)) seen.set(e.recipe_id, e.title);
    return [...seen].map(([recipeId, title]) => ({ recipeId, title }));
  }, [entries]);
  const householdQuery = useQuery({
    queryKey: ['household-week', household?.id, memberIds, days[0]?.key, days[6]?.key],
    enabled: isShared && memberIds.length > 0,
    queryFn: () => getHouseholdWeekDishes(memberIds, days[0].key, days[6].key),
    placeholderData: keepPreviousData,
  });
  const dishes = useMemo(
    () => (isShared ? (householdQuery.data ?? []) : myDishes),
    [isShared, householdQuery.data, myDishes],
  );
  const recipeIds = useMemo(() => dishes.map((d) => d.recipeId), [dishes]);
  const recipeTitles = useMemo(
    () => new Map(dishes.map((d) => [d.recipeId, d.title])),
    [dishes],
  );

  // Source recipes the shopper dropped (chip ×). Persisted, and pruned to what's
  // actually on the week so a removed-then-replanned dish comes back.
  const [excluded, setExcluded] = useState<string[]>([]);
  const activeRecipeIds = useMemo(
    () => recipeIds.filter((id) => !excluded.includes(id)),
    [recipeIds, excluded],
  );

  const listQuery = useQuery({
    queryKey: ['plan-list', activeRecipeIds],
    enabled: activeRecipeIds.length > 0,
    queryFn: () => getListRecipes(activeRecipeIds),
    // Keep the current rows visible while a changed week refetches, so adding
    // or removing a dish updates the list without a blank flash.
    placeholderData: keepPreviousData,
  });

  // When the week is empty the query is disabled and RETAINS its last data —
  // so the list must be forced empty here, or removing every dish would leave
  // the old ingredients on screen (the "doesn't update" bug).
  const allItems = useMemo(
    () => (activeRecipeIds.length === 0 ? [] : buildShoppingList(listQuery.data ?? [])),
    [activeRecipeIds.length, listQuery.data],
  );

  // Single ingredient rows the shopper threw off the list (hold-then-drag, or
  // the VoiceOver action). Each removal remembers the row's key AND its source
  // recipe IDS. Personal list: local state, persisted like `excluded`. Shared
  // household: removals are rows in household_list_state (removed=true) so a
  // partner's phone hides the same row in realtime — the local state is not
  // consulted at all in shared mode. Every consumer below — rows, counts,
  // share text, share card — reads `items`, so a removed thing is gone from ALL
  // of them, not just hidden on screen.
  const [localRemoved, setLocalRemoved] = useState<RemovedEntry[]>([]);
  const sharedRemoved = useMemo<RemovedEntry[]>(
    () =>
      shared.rows
        .filter((r) => r.removed)
        .map((r) => ({ key: r.item_key, sources: r.removed_sources ?? [] })),
    [shared.rows],
  );
  const removed = isShared ? sharedRemoved : localRemoved;
  const items = useMemo(
    () => (removed.length === 0 ? allItems : allItems.filter((i) => !isRemoved(i, removed))),
    [allItems, removed],
  );
  // What this build is currently hiding — drives the restore line, and is the
  // exact set "Show them" puts back (a removal for some OTHER week's version of
  // the same ingredient is left alone).
  const hiddenItems = useMemo(
    () => (removed.length === 0 ? [] : allItems.filter((i) => isRemoved(i, removed))),
    [allItems, removed],
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<{ key: string; name: string }[]>([]);

  // Unified check/custom access — the household's realtime state when shared,
  // local state otherwise. The rest of the screen reads only these.
  const checkedMap: Record<string, boolean> = isShared
    ? Object.fromEntries(shared.rows.map((r) => [r.item_key, r.checked]))
    : checked;
  const isChecked = (key: string) => !!checkedMap[key];
  const customList = isShared
    ? shared.rows.filter((r) => r.custom_name).map((r) => ({ key: r.item_key, name: r.custom_name as string }))
    : custom;

  // Persistence (contract: persistence.md). Hydrate once on mount, then mirror
  // every change back to kv. `hydrated` is STATE, not a ref: rows must not
  // render (and removals must not be pruned) against the empty defaults while
  // the load is still in flight — a removal made in that window was silently
  // overwritten by the resolving hydrate.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    (async () => {
      const saved = await kv.get('shoppingState', EMPTY_STORED, storedStateSchema);
      setChecked(saved.checked);
      setCustom(saved.custom);
      setExcluded(saved.excluded);
      // `removed` landed after the first shipped shape — normalizeRemoved
      // absorbs anything (missing field, pre-release `string[]`, junk):
      // dropped, never guessed at — a bare name carries no source set, and
      // inventing one would resurrect the hide-that-ingredient-forever bug.
      // Pre-v2 blobs keyed removals on dish TITLES — dead weight against
      // id-keyed rows, so they're dropped rather than silently kept forever.
      setLocalRemoved(saved.removedV === REMOVED_IDENTITY_V ? normalizeRemoved(saved.removed) : []);
      setHydrated(true);
    })();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    kv.set('shoppingState', {
      checked,
      custom,
      excluded,
      removed: localRemoved,
      removedV: REMOVED_IDENTITY_V,
    });
  }, [hydrated, checked, custom, excluded, localRemoved]);
  // Prune exclusions to dishes still on the week — but only once the week's
  // source has genuinely LOADED. A momentary short member list (a refetch, a
  // placeholder) used to resurrect a dish the shopper dropped; and `!isLoading`
  // is NOT "loaded" — an errored or disabled plan query reports isLoading false
  // with entries [], which would wipe every exclusion (and persist the wipe)
  // for an offline shopper. Success only.
  // householdLoading gates BOTH branches: `isShared` is false for the whole
  // membership round-trip, so a household user's first render took the personal
  // branch — and with a warm ['plan'] cache planSuccess is already true, so it
  // pruned a housemate's dropped dish against MY dishes only and persisted the
  // wipe. Membership has to be known before "the week" means anything.
  const weekSettled =
    !householdLoading &&
    (isShared
      ? householdQuery.isSuccess && !householdQuery.isFetching && !householdQuery.isPlaceholderData
      : planSuccess);
  useEffect(() => {
    if (!weekSettled || !hydrated) return;
    setExcluded((prev) => {
      const next = prev.filter((id) => recipeIds.includes(id));
      return next.length === prev.length ? prev : next;
    });
  }, [weekSettled, hydrated, recipeIds]);
  // Same prune for hand-removed rows, against the ingredients the week actually
  // produces now. getListRecipes is best-effort per dish (a failed fetch yields
  // fewer recipes), so pruning is gated PER ENTRY inside pruneRemoved: an entry
  // goes only when every dish it names either resolved in this build or is off
  // the active week — a dish that failed to come back keeps its removals. This
  // replaces the old whole-build completeness gate, which one permanently
  // unresolvable dish could hold shut forever (making every removal immortal).
  // Shared mode: removals live server-side; a stale removed row simply stops
  // matching (isRemoved) — ponytail: no server-side prune until it costs something.
  const listSettled =
    listQuery.isSuccess && !listQuery.isFetching && !listQuery.isPlaceholderData;
  useEffect(() => {
    if (isShared || !listSettled || !weekSettled || !hydrated) return;
    const liveKeys = allItems.map((i) => i.key);
    const build = {
      resolvedIds: (listQuery.data ?? []).map((r) => r.id),
      activeIds: activeRecipeIds,
    };
    setLocalRemoved((prev) => pruneRemoved(prev, liveKeys, build));
  }, [isShared, listSettled, weekSettled, hydrated, allItems, listQuery.data, activeRecipeIds]);

  // The shared-household hooks hand back fresh function identities every
  // render, which would defeat the memoized rows below. Read them through a
  // latest ref so the row callbacks can be stable AND always act on current
  // state (a stale closure here would toggle the wrong row).
  const liveRef = useRef({ isShared, shared });
  liveRef.current = { isShared, shared };

  const toggle = useCallback((key: string) => {
    haptics.select();
    const { isShared: sharedNow, shared: list } = liveRef.current;
    if (sharedNow) {
      const on = list.rows.some((r) => r.item_key === key && r.checked);
      list.toggle(key, !on);
    } else setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const addCustom = useCallback((name: string) => {
    haptics.impact('light'); // a commit (motion.md §2)
    const { isShared: sharedNow, shared: list } = liveRef.current;
    if (sharedNow) list.addCustom(name);
    // Date.now() key — a re-used index would collide checkboxes after removals.
    else setCustom((prev) => [...prev, { key: `custom-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name }]);
  }, []);

  // The undo toast outlives this screen (ToastHost is app-root): tapping Undo
  // after navigating away used to call setState on an unmounted screen — React
  // dropped it silently, the toast dismissed as if it worked, and kv kept the
  // removal. Local-mode changes therefore write THROUGH to kv when the screen
  // is gone; shared-mode changes are mutations on the app-level query client
  // and survive unmount on their own.
  const unmounted = useRef(false);
  useEffect(
    () => () => {
      unmounted.current = true;
    },
    [],
  );
  const applyLocalRemoved = useCallback((fn: (prev: RemovedEntry[]) => RemovedEntry[]) => {
    if (!unmounted.current) {
      setLocalRemoved(fn);
      return;
    }
    void (async () => {
      const saved = await kv.get('shoppingState', EMPTY_STORED, storedStateSchema);
      const current = saved.removedV === REMOVED_IDENTITY_V ? normalizeRemoved(saved.removed) : [];
      await kv.set('shoppingState', {
        ...saved,
        removed: fn(current),
        removedV: REMOVED_IDENTITY_V,
      });
    })();
  }, []);

  // Hold-then-drag committed (or the accessibility action fired): the row goes,
  // the basket count drops with it, and a toast holds the door open for a
  // change of mind. Shared households: the removal is a row write, so every
  // member's phone drops the row in realtime (item 2 of the BUILD34 ticket).
  //
  // There is only one toast slot, so two removals in a row used to leave the
  // first one un-undoable. Removals inside the toast's own lifetime therefore
  // accumulate into ONE batch: the toast counts them and Undo puts the whole
  // batch back. (Anything older is still recoverable from "Show them".)
  const undoBatch = useRef<{ entries: RemovedEntry[]; at: number }>({ entries: [], at: 0 });
  const removeItem = useCallback(
    (item: ShoppingItem) => {
      haptics.impact('light'); // the removal COMMITS here (the hold only armed it)
      const entry: RemovedEntry = { key: item.key, sources: item.sources, at: Date.now() };
      const { isShared: sharedNow, shared: list } = liveRef.current;
      if (sharedNow) list.setRemoved(item.key, true, item.sources);
      else applyLocalRemoved((prev) => (isRemoved(item, prev) ? prev : [...prev, entry]));

      const now = Date.now();
      const stillUp = now - undoBatch.current.at < UNDO_TOAST_MS;
      const batch = [...(stillUp ? undoBatch.current.entries : []), entry];
      undoBatch.current = { entries: batch, at: now };

      const label = item.name.charAt(0).toUpperCase() + item.name.slice(1);
      show(batch.length === 1 ? `${label} — off the list.` : `${batch.length} off the list.`, 'info', {
        actionLabel: 'Undo',
        onAction: () => {
          undoBatch.current = { entries: [], at: 0 };
          const { isShared: sharedUndo, shared: listUndo } = liveRef.current;
          if (sharedUndo) for (const b of batch) listUndo.setRemoved(b.key, false, null);
          else
            applyLocalRemoved((prev) =>
              prev.filter(
                (r) => !batch.some((b) => b.key === r.key && sameSources(b.sources, r.sources)),
              ),
            );
        },
      });
    },
    [show, applyLocalRemoved],
  );

  // The always-available way back: put every row this build is hiding back on
  // the list — unticked (a restored row still marked "got it" is a lie), and
  // itself undoable, because "Show them" is all-or-nothing: 8 hidden, wanted 1,
  // the toast's Undo re-hides the other 7 instead of leaving them lost.
  // Removals belonging to a different source set (another week's version of
  // the same ingredient) are left untouched.
  const restoreHidden = useCallback(() => {
    haptics.impact('light'); // putting N rows back is a commit, not a selection
    undoBatch.current = { entries: [], at: 0 };
    const restoring = hiddenItems.map((h) => ({ key: h.key, sources: h.sources }));
    const { isShared: sharedNow, shared: list } = liveRef.current;
    const uncheck = (keys: string[]) => {
      if (sharedNow) {
        for (const key of keys)
          if (list.rows.some((r) => r.item_key === key && r.checked)) list.toggle(key, false);
      } else {
        setChecked((prev) => {
          const next = { ...prev };
          for (const key of keys) delete next[key];
          return next;
        });
      }
    };
    if (sharedNow) for (const r of restoring) list.setRemoved(r.key, false, null);
    else
      applyLocalRemoved((prev) =>
        prev.filter((p) => !restoring.some((h) => h.key === p.key && sameSources(h.sources, p.sources))),
      );
    uncheck(restoring.map((r) => r.key));
    show(restoring.length === 1 ? 'Back on the list.' : `${restoring.length} back on the list.`, 'info', {
      actionLabel: 'Undo',
      onAction: () => {
        const { isShared: sharedUndo, shared: listUndo } = liveRef.current;
        if (sharedUndo) for (const r of restoring) listUndo.setRemoved(r.key, true, r.sources);
        else
          applyLocalRemoved((prev) => [
            ...prev,
            ...restoring
              .filter((h) => !prev.some((p) => p.key === h.key && sameSources(p.sources, h.sources)))
              .map((h) => ({ ...h, at: Date.now() })),
          ]);
      },
    });
  }, [hiddenItems, show, applyLocalRemoved]);

  // Custom extras leave through the SAME door as ingredients (one remove
  // affordance, founder: "swipe to remove but no button") — and never silently:
  // the shared-mode removal is a real DB delete, so the undo toast is the only
  // thing standing between a brushed thumb and a lost "Coffee". Undo re-adds by
  // name (a re-created row: new key, unchecked — the honest reconstruction).
  const removeCustom = useCallback(
    (key: string, name: string) => {
      haptics.impact('light'); // a commit — and this one is a real DB delete
      const { isShared: sharedNow, shared: list } = liveRef.current;
      if (sharedNow) list.removeCustom(key);
      else setCustom((prev) => prev.filter((c) => c.key !== key));
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      show(`${label} — off the list.`, 'info', {
        actionLabel: 'Undo',
        onAction: () => {
          const { isShared: sharedUndo, shared: listUndo } = liveRef.current;
          if (sharedUndo) {
            listUndo.addCustom(name); // a query mutation — survives unmount
            return;
          }
          // The toast outlives this screen, so the local path writes through
          // to kv when we're gone (same law as the ingredient undo), and the
          // row comes back UNTICKED — a restored row still marked "got it"
          // is a lie.
          if (!unmounted.current) {
            setChecked((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
            setCustom((prev) => [...prev, { key, name }]);
            return;
          }
          void (async () => {
            const saved = await kv.get('shoppingState', EMPTY_STORED, storedStateSchema);
            const checkedNext = { ...saved.checked };
            delete checkedNext[key];
            await kv.set('shoppingState', {
              ...saved,
              checked: checkedNext,
              custom: [...saved.custom, { key, name }],
            });
          })();
        },
      });
    },
    [show],
  );

  const grouped = AISLES.map((aisle) => ({
    aisle,
    items: items.filter((i) => i.aisle === aisle),
  })).filter((g) => g.items.length > 0);

  const total = items.length + customList.length;
  const done =
    items.filter((i) => isChecked(i.key)).length +
    customList.filter((c) => isChecked(c.key)).length;

  // MOMENT 2 (motion.md §4): the last item goes in the basket. The count line
  // resolves to a sentence, the reserved completion haptic fires and the proud
  // chime plays — once per crossing, not on every re-render, and never on a
  // list that was already complete when the screen opened (that's not a
  // moment, that's a memory).
  const allDone = total > 0 && done === total;
  const lastSeen = useRef<{ allDone: boolean; done: number } | null>(null);
  // Arm only once the ROWS have arrived, not merely once kv has. kv resolves
  // first, so arming on `hydrated` armed against an empty list (total 0,
  // allDone false) and then "crossed" the moment the finished list loaded —
  // chiming for a list completed yesterday, or by a partner. Shared mode was
  // worse: shared.rows always arrive after mount.
  const listReady = isShared ? !shared.isLoading : listSettled || allItems.length === 0;
  useEffect(() => {
    if (!hydrated || !listReady) return;
    const prev = lastSeen.current;
    lastSeen.current = { allDone, done };
    if (!prev) return; // first observation arms, never fires
    // The crossing must come from CHECKING something off. Throwing the last
    // unchecked row off the list also makes done === total — a removal is not
    // an achievement, and celebrating it would dilute the reserved signal
    // (motion.md §2/§4).
    if (allDone && !prev.allDone && done > prev.done) {
      haptics.notify('success');
      sound.play('allDone');
    }
  }, [allDone, done, hydrated, listReady]);

  // Share: on native snapshot the offscreen ShareListCard (the recipient-facing
  // picture — bullets, open items only, Otto sign-off) to a PNG via
  // react-native-view-shot and hand it to the OS share sheet (expo-sharing); on
  // web use navigator.share or the OS text share. Native modules are require()'d
  // only on the native branch so the web bundle never executes them (mirrors
  // src/features/share).
  // The share surfaces print `sources` verbatim — hand them TITLES, not the
  // recipe ids the engine keys removals on.
  const shareItems = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        sources: i.sources
          .map((id) => recipeTitles.get(id))
          .filter((t): t is string => Boolean(t)),
      })),
    [items, recipeTitles],
  );

  const shareList = async () => {
    haptics.select();
    const text = buildShoppingListShareText({ items: shareItems, custom: customList, checked: checkedMap });
    if (Platform.OS !== 'web' && shareCardRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; keeps view-shot out of the web runtime
        const Sharing = require('expo-sharing');
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; web branch never reaches this
        const { captureRef } = require('react-native-view-shot');
        if (await Sharing.isAvailableAsync()) {
          const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Shopping list',
          });
          return;
        }
      } catch {
        // capture/sharing unavailable → fall through to the text share
      }
    }
    const nav = (globalThis as { navigator?: { share?: (d: { text: string }) => Promise<void> } })
      .navigator;
    if (Platform.OS === 'web' && nav?.share) {
      await nav.share({ text }).catch(() => {});
      return;
    }
    await Share.share({ message: text }).catch(() => {});
  };

  // !hydrated: rows must not render against the empty defaults while the kv
  // load is in flight — a removal made in that window was overwritten (4g).
  const loading = planLoading || listQuery.isLoading || !hydrated;

  if (loading) {
    return (
      <Screen title="Shopping list" onBack={() => router.back()}>
        <OttoLoading message="Counting the pantry…" />
      </Screen>
    );
  }

  // A failed WEEK is as honest a failure as a failed ingredient fetch — without
  // this the screen renders "Nothing to buy yet" over a week it simply couldn't
  // read (the same honesty-law violation as the household reads, personal path).
  // But only when there is NOTHING to show: TanStack keeps data through a failed
  // REFETCH, and this screen refetches on every focus — blanking a working list
  // because one background poll failed in a shop basement is its own dishonesty.
  const nothingToShow = allItems.length === 0 && customList.length === 0;
  if ((planError && nothingToShow && !isShared) || (listQuery.isError && nothingToShow)) {
    return (
      <Screen title="Shopping list" onBack={() => router.back()}>
        <OttoError onRetry={() => (planError ? qc.invalidateQueries({ queryKey: ['plan'] }) : listQuery.refetch())} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Shopping list"
      onBack={() => router.back()}
      right={
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Our shared list"
            hitSlop={8}
            onPress={() => {
              haptics.select();
              router.push('/household');
            }}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="people-outline" size={22} color={colors.ink} />
          </Pressable>
          {total > 0 && done < total && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share the shopping list"
              hitSlop={8}
              onPress={shareList}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="share-outline" size={22} color={colors.ink} />
            </Pressable>
          )}
        </>
      }
    >
      <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
        {/* The printed stationery pad — a warm sheet inset with a thin DOUBLE
            terracotta frame, headed by the ribbon banner that overlaps the pad's
            top edge (its notch is cut in the sheet color). Frames are absolute
            Views so they track the pad's height at any list length. */}
        <View style={styles.pad}>
          <View style={styles.padSheet} pointerEvents="none" />
          <View style={styles.padFrameOuter} pointerEvents="none" />
          <View style={styles.padFrameInner} pointerEvents="none" />

          <View style={styles.padContent}>
            <View style={styles.bannerWrap}>
              <ShoppingListBanner notchColor={colors.white} />
            </View>

            {total > 0 && (
              <RNText style={styles.countHeader}>
                {allDone ? 'All in the basket.' : `${done} of ${total} in the basket`}
              </RNText>
            )}

            {/* The moment's VISUAL half (motion.md §4 asks for an Otto nod).
                Without it the celebration was a haptic and a chime, which is
                nothing at all under reduced motion or with Sounds off — the two
                off-ramps most likely to be on for the people who need them. */}
            {allDone && (
              <View style={styles.doneBeat}>
                <OttoArt name="pleased" size={112} />
              </View>
            )}

            {/* Source-recipe chips — tap × to drop that dish from the list. */}
            {activeRecipeIds.length > 0 && (
              <View style={styles.chipsRow}>
                {activeRecipeIds.map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => {
                      haptics.select();
                      setExcluded((prev) => [...prev, id]);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${recipeTitles.get(id) ?? 'this dish'} from the list`}
                    style={styles.chip}
                  >
                    <RNText style={styles.chipText} numberOfLines={1}>
                      {recipeTitles.get(id) ?? 'Recipe'}
                    </RNText>
                    <Ionicons name="close" size={15} color={colors.ink} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* The way back. Always on screen while anything is hidden — the
                undo toast lives 5 seconds, a shopper's change of mind doesn't. */}
            {hiddenItems.length > 0 && (
              <Pressable
                onPress={restoreHidden}
                accessibilityRole="button"
                accessibilityLabel={
                  hiddenItems.length === 1
                    ? 'Show the item you took off the list'
                    : `Show the ${hiddenItems.length} items you took off the list`
                }
                style={styles.restoreRow}
              >
                <Ionicons name="arrow-undo-outline" size={16} color={colors.inkSoft} />
                <RNText style={styles.restoreText}>
                  {hiddenItems.length} hidden ·{' '}
                  <RNText style={styles.restoreAction}>
                    Show {hiddenItems.length === 1 ? 'it' : 'them'}
                  </RNText>
                </RNText>
              </Pressable>
            )}

            {allItems.length === 0 && customList.length === 0 ? (
              // Genuinely nothing planned.
              <View style={styles.empty}>
                <OttoIdle name="thinking" size={120} sway />
                <Text role="body">
                  Nothing to buy yet. Put a dish or two on Otto&apos;s week and build the list from
                  there.
                </Text>
              </View>
            ) : items.length === 0 && allItems.length > 0 ? (
              // The week HAS ingredients — the shopper has taken every one off.
              // Saying "nothing planned" here would be a lie sitting right under
              // the dish chips, so this state says what actually happened and
              // points at the restore line above.
              <View style={styles.empty}>
                <OttoIdle name="thinking" size={120} sway />
                <Text role="body">
                  You&apos;ve taken everything off this list. The dishes are still on the week —
                  tap &ldquo;Show them&rdquo; above to put the ingredients back.
                </Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.aisle} style={styles.section}>
                  <RNText style={styles.aisleHeader}>{group.aisle}</RNText>
                  <View style={styles.rule} />
                  {/* Tap = check off (unchanged). Hold ~300ms → the row lifts →
                      drag it away to take it off the list entirely. */}
                  {group.items.map((item) => (
                    <ShoppingItemRow
                      key={item.key}
                      item={item}
                      sourceLabel={item.sources
                        .map((id) => recipeTitles.get(id))
                        .filter(Boolean)
                        .join(' · ')}
                      checked={isChecked(item.key)}
                      onToggle={toggle}
                      onRemove={removeItem}
                    />
                  ))}
                </View>
              ))
            )}

            {customList.length > 0 && (
              <View style={styles.section}>
                <RNText style={styles.aisleHeader}>Everything else</RNText>
                <View style={styles.rule} />
                {/* Same gesture as the ingredient rows — hold, lift, swipe off,
                    undo toast. The old visible ✕ was the affordance INVERTED
                    against risk: a hard delete one accidental tap away, while
                    the recoverable removal hid behind a deliberate gesture. */}
                {customList.map((item) => (
                  <CustomItemRow
                    key={item.key}
                    itemKey={item.key}
                    name={item.name}
                    checked={isChecked(item.key)}
                    onToggle={toggle}
                    onRemove={removeCustom}
                  />
                ))}
              </View>
            )}

            {/* "Something else?" — add-your-own row, inside the pad like the
                printed sheet it belongs to. Its draft text is ITS OWN state
                (see AddItemRow): on the screen it re-rendered every ingredient
                row on every keystroke. */}
            <AddItemRow onAdd={addCustom} />
          </View>
        </View>

        {/* Offscreen share render (native only): the recipient-facing card the
            share sheet snapshots — bullets + open items, not this screen's
            checkboxes. Parked out of the viewport, never interactive. */}
        {Platform.OS !== 'web' && total > 0 && (
          <View
            style={styles.shareStage}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <ShareListCard
              ref={shareCardRef}
              list={{ items: shareItems, custom: customList, checked: checkedMap }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// One item line: quantity in terracotta, name in ink; both struck through and
// terracotta-tinted once checked (the "got it" read at a glance).
function itemLine(amount: string | null | undefined, name: string, on: boolean) {
  return (
    <RNText>
      {amount ? <RNText style={[styles.itemAmount, on && styles.struck]}>{amount} </RNText> : null}
      <RNText style={[styles.itemName, on && styles.struck]}>{name}</RNText>
    </RNText>
  );
}

// One ingredient row, memoized. `item` comes from a useMemo'd build and the two
// callbacks are stable, so a re-render of the screen (a check-off elsewhere, a
// refetch, a keystroke that escapes AddItemRow) re-renders only the rows that
// actually changed instead of rebuilding 40 rows' gesture handlers.
const ShoppingItemRow = React.memo(function ShoppingItemRow({
  item,
  sourceLabel,
  checked,
  onToggle,
  onRemove,
}: {
  item: ShoppingItem;
  /** Dish titles for the provenance line — looked up from the source ids by
   *  the screen (sources are recipe ids, never titles: shoppingList.ts). */
  sourceLabel: string;
  checked: boolean;
  onToggle: (key: string) => void;
  onRemove: (item: ShoppingItem) => void;
}) {
  return (
    <View>
      <HoldToRemoveRow
        style={styles.itemRow}
        checked={checked}
        accessibilityLabel={`${item.amount} ${item.name}`.trim()}
        onPress={() => onToggle(item.key)}
        onRemove={() => onRemove(item)}
      >
        <View style={[styles.check, checked && styles.checkOn]}>
          {checked && <Ionicons name="checkmark" size={17} color={colors.white} />}
        </View>
        <View style={{ flex: 1, opacity: checked ? 0.75 : 1 }}>
          {itemLine(item.amount, item.name, checked)}
          {sourceLabel.length > 0 && <Text role="caption">for {sourceLabel}</Text>}
        </View>
      </HoldToRemoveRow>
      <View style={styles.sep} />
    </View>
  );
});

// A custom extra behind the same hold-to-remove gesture as the ingredients.
const CustomItemRow = React.memo(function CustomItemRow({
  itemKey,
  name,
  checked,
  onToggle,
  onRemove,
}: {
  itemKey: string;
  name: string;
  checked: boolean;
  onToggle: (key: string) => void;
  onRemove: (key: string, name: string) => void;
}) {
  return (
    <View>
      <HoldToRemoveRow
        style={styles.itemRow}
        checked={checked}
        accessibilityLabel={name}
        onPress={() => onToggle(itemKey)}
        onRemove={() => onRemove(itemKey, name)}
      >
        <View style={[styles.check, checked && styles.checkOn]}>
          {checked && <Ionicons name="checkmark" size={17} color={colors.white} />}
        </View>
        <View style={{ flex: 1, opacity: checked ? 0.75 : 1 }}>
          {itemLine(null, name, checked)}
        </View>
      </HoldToRemoveRow>
      <View style={styles.sep} />
    </View>
  );
});

// The add-your-own row owns its draft text. Held on the screen, every keystroke
// re-rendered every ingredient row (and rebuilt every row's pan gesture); held
// here, typing "coffee" re-renders this row and nothing else.
const AddItemRow = React.memo(function AddItemRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [newItem, setNewItem] = useState('');
  const submit = () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem('');
    onAdd(name);
  };
  return (
    <View style={styles.addRow}>
      <TextInput
        style={styles.addInput}
        value={newItem}
        onChangeText={setNewItem}
        placeholder="Something else? Coffee…"
        placeholderTextColor={colors.inkSoft}
        onSubmitEditing={submit}
        returnKeyType="done"
        accessibilityLabel="Add your own item"
      />
      <Pressable
        onPress={submit}
        accessibilityRole="button"
        accessibilityLabel="Add item"
        style={styles.addBtn}
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </Pressable>
    </View>
  );
});

// Matches ToastHost's lifetime for a toast that carries an action — removals
// inside that window share one undo.
const UNDO_TOAST_MS = 5000;

// Pad frame insets (from the pad's outer edge). The double frame is two nested
// hairlines a step apart; content padding clears them so text never collides
// with the printed rules.
const FRAME = space[3];
const FRAME_GAP = space[1];

const styles: Record<string, ViewStyle & TextStyle> = {
  scroll: { padding: space[4], paddingBottom: space[7] },
  empty: { alignItems: 'center', gap: space[3], marginTop: space[5] },

  // The pad root stays opaque (white) under the sheet so nothing behind it can
  // ever bleed through the sheet's rounded corners.
  pad: {
    position: 'relative',
    marginTop: space[6],
    marginBottom: space[4],
    backgroundColor: colors.white,
    borderRadius: radii.card,
  },
  padSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  padFrameOuter: {
    position: 'absolute',
    top: FRAME,
    left: FRAME,
    right: FRAME,
    bottom: FRAME,
    borderRadius: radii.button - FRAME_GAP,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    opacity: 0.55,
  },
  padFrameInner: {
    position: 'absolute',
    top: FRAME + FRAME_GAP,
    left: FRAME + FRAME_GAP,
    right: FRAME + FRAME_GAP,
    bottom: FRAME + FRAME_GAP,
    borderRadius: radii.button - FRAME_GAP * 2,
    borderWidth: 1,
    borderColor: colors.terracotta,
    opacity: 0.35,
  },
  padContent: {
    paddingHorizontal: space[5],
    paddingTop: 0,
    paddingBottom: space[5],
  },
  // The ribbon hangs over the pad's top edge (half in, half out).
  bannerWrap: { marginTop: -space[5], marginBottom: space[4] },
  countHeader: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
    color: colors.inkSoft,
    marginBottom: space[4],
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    maxWidth: '100%',
    minHeight: 44,
    paddingLeft: space[4],
    paddingRight: space[3],
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
  },
  chipText: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: colors.ink },

  // Quiet by design: this is a way back, not a call to action — so it reads as
  // a note on the pad, at a full 44pt target.
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    minHeight: 44,
    marginBottom: space[3],
  },
  doneBeat: { alignItems: 'center', marginBottom: space[4] },
  restoreText: { fontSize: 13, color: colors.inkSoft },
  restoreAction: { fontWeight: '700', color: colors.terracotta, textDecorationLine: 'underline' },

  section: { marginBottom: space[5] },
  aisleHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  rule: {
    borderTopWidth: 1,
    borderTopColor: colors.terracotta,
    opacity: 0.5,
    marginTop: space[2],
  },
  sep: {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: colors.gray,
    opacity: 0.7,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    minHeight: 56,
  },
  itemAmount: { fontSize: 16, fontWeight: '700', color: colors.terracotta },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  // Crossed-off: strike the line and tint it terracotta so a ticked row reads
  // as "got it" at a glance (dimmed by the row container's opacity).
  struck: { textDecorationLine: 'line-through', color: colors.terracotta },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: space[3] },
  addInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: space[4],
    fontSize: 15,
    color: colors.ink,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareStage: { position: 'absolute', top: 0, left: -1000 },
};
