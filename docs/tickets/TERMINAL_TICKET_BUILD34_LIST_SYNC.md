# TERMINAL TICKET — build 34, shared-list removal sync, one remove affordance

> STATUS: open — cut from cloud 2026-07-25. Items 1–3 are the founder's open list; item 4 is
> the confirmed fallout from the adversarial review of `9fbd4dc` + `5f9fdcd` (hold-to-remove),
> which lives in the same code and should be fixed in the same pass.

**Ordering law: 4a gates 2.** The shared-list migration must not be written until the removal
entry's *source identity* is fixed (4a). Storing today's title-keyed sources in Postgres
enshrines the bug in a schema that then needs a second migration to undo.

---

## 1 — Build 34 `[~40 min, mostly waiting]`

Everything on `main` after `e01443f` ("release: build 33") is on the founder's phone only
through a new build. Eleven commits, of which these are user-visible:

| commit | what the founder should see on device |
| --- | --- |
| `f1217b5`…`28d5738` | filter chips: selected reads as a soft terracotta fill + ring + check, **label stays legible**; multi-select cuisine; Selected·N summary; Clear all; cuisine-only browsing works |
| `d407228` | YouTube: a "Watch on YouTube →" line is always visible under the inline player, and a failure card replaces a dead webview |
| `9fbd4dc` + `5f9fdcd` | shopping list: hold a row → it lifts → swipe it off; undo toast; "N hidden · Show them" |
| `e557e2b` | recipe tiles are white cards, CAL pill top-right, paw straddling the photo edge |
| `1d47292` | Ask Otto: 220pt hero, display headline, composer card (Speak pill left, Send circle right) |
| `ce39e2a` | recipe detail: "More from the pantry" is a 2×2 grid; **back is the left-edge swipe only** (a mid-screen drag no longer steals a downward scroll) |

**The app icon is NOT in this list.** `3699bcc` ("wire the Otto app icon") is an ancestor of
`e01443f`, so build 33 already carries it — verified with `git merge-base --is-ancestor`.
(The cloud session said otherwise in chat; this ticket is the correct version.)

1. Decide the number before building: `eas build:list --platform ios --limit 5`. If a build
   numbered **33 was already uploaded**, bump `app.json` `expo.ios.buildNumber` to `"34"` —
   App Store Connect rejects a reused number. If 33 was never actually produced, building
   HEAD as 33 is legal and ships the icon plus all eleven commits. Either way `expo.version`
   stays `1.0.16` — no user-facing feature warrants a version bump.
2. Android has **no `versionCode`** in `app.json` (`expo.android` carries only `package` and
   `adaptiveIcon`). Not a blocker for a TestFlight-only cut; needed before any Play upload.
3. `eas build --platform ios --profile production`. Note `eas.json` sets
   `"credentialsSource": "local"` on the production profile — the machine needs the local
   credentials, which is exactly why the cloud session cannot cut this build.
4. `eas submit --platform ios --profile production` (`appleTeamId A6J6HGNWZK`,
   `ascAppId 6792195637`).
5. On-device pass, in this order — each one is a thing a review already flagged as
   unobservable from CI:
   - [ ] Home screen icon is the Otto mark on terracotta (not the white Expo default)
   - [ ] Recipe detail: **scroll to the bottom without going back** — this is the gesture fix
   - [ ] Recipe detail: "More from the pantry" is 2 rows × 2 cards, not 4 slivers
   - [ ] A recipe with a video: inline player works, *or* the fallback line opens YouTube
   - [ ] Filters: a selected chip's label is readable; pick a cuisine with no category and
         the grid actually fills
   - [ ] Shopping list: hold a row → visible lift → swipe → gone → Undo works
   - [ ] Ask Otto on the **smallest device you have** (SE / mini) — see finding 4h; the empty
         state may auto-scroll Otto's head off the top

---

## 2 — Shared-household removal doesn't sync `[one session, gated on 4a]`

`household_list_state` (`supabase/migrations/20260722120000_households_shared_shopping_list.sql:19-27`)
is `(household_id, item_key, checked, custom_name, updated_by, updated_at)` — **no removal
column**. `ShoppingScreen.tsx:249-273` `removeItem` therefore only ever calls the local
`setRemoved`, unlike `toggle` (:221), `addCustom` (:230) and `removeCustom` (:288), which all
branch on `liveRef.current.isShared`.

Founder-visible failure: Juan removes 12 items and says "list's cleaned up". His partner's
phone still shows all 12. The share-sheet text (`ShoppingScreen.tsx:311`) reads the filtered
list, so it shows none of them. Two people, two lists, no signal that they diverged — and the
toast says "Off the list." identically in both modes.

6. **Do 4a first.** Then add the column carrying the *same* identity the client uses:
   ```sql
   alter table public.household_list_state
     add column if not exists removed boolean not null default false,
     add column if not exists removed_sources text[];
   ```
   A removal is then a row like a check-off is. `hls_all` is a `for all` policy on the table,
   so the new columns inherit RLS with no policy change; the table is already in the
   `supabase_realtime` publication (`…shared_shopping_list.sql:70`), so a partner's phone
   updates live with no extra wiring.
7. Regenerate `src/types/database.ts` (database.md contract) — do not hand-edit it.
8. Wire `removeItem` / the "Show them" restore through `household.queries.ts` the way `toggle`
   already is, and make the *undo* path shared-aware too.
9. Verify with two accounts: A removes → B's row disappears within a second; B restores →
   A's row returns. Confirm a non-member cannot write (RLS check, per security doctrine).

---

## 3 — One remove affordance `[small, but see 4k]`

Custom extras still carry a visible ✕ (`ShoppingScreen.tsx:519-526`) while ingredients are
behind hold-and-swipe. The review found the affordance is **inverted relative to risk**:
`removeCustom` (:288-291) fires a real DB `delete` (`household.queries.ts:157-162`) with no
toast, no undo and no "N hidden" line, while the fully-recoverable ingredient removal is the
one hidden behind a 300 ms gesture. A thumb brushing the ✕ next to a just-typed "Coffee"
destroys it irreversibly.

10. Move custom extras onto `HoldToRemoveRow` (same gesture, same toast, same undo) and drop
    the ✕ — matching the founder's spec ("swipe to remove but no button"). If a custom item's
    removal must stay a hard delete, it needs the undo toast at minimum before the ✕ goes.
11. The dish chips (`ShoppingScreen.tsx:415-427`) keep their ✕ deliberately — a chip is a
    filter control, not a list row. Leave them; note the reasoning in the Log.

---

## 4 — Removal defects the adversarial review CONFIRMED `[same code, same session]`

All traced to file:line by the REFUTER pass on `9fbd4dc`+`5f9fdcd`; `npm test` is 297/297 and
`tsc` clean, so **none of these is visible to CI** — there is no test that mounts
`ShoppingScreen` or `HoldToRemoveRow` anywhere in the repo.

- [ ] **4a. Sources are title strings, not recipe ids** (`shoppingList.ts:172`). Two dishes
      that share a title collapse to one source, so the global-suppression bug the fix exists
      to kill still fires: remove 100 g of onion from one "Pasta Night", and a *different*
      recipe with the same title silently loses its 2 kg. Renaming a dish (4g) is the same
      bug from the other side — every removal made against it reappears unexplained. Fix the
      identity to recipe ids and render titles by lookup. **This is the gate for item 2.**
- [ ] **4b. Removals never expire and aren't week-scoped** (`shoppingList.ts:224-227, 268-273`;
      `ShoppingScreen.tsx:185` is one un-scoped blob). Skip the olive oil on 1 March because
      the bottle is full → it is still missing on 22 March, silently. Decide the rule
      (per-week? N days? until the dish leaves the plan?) — this is a founder call, not a
      code call, so bring the options rather than picking one.
- [ ] **4c. Undo is dead once the shopper navigates away** (`ShoppingScreen.tsx:260-270`,
      `ToastHost` is app-root at `app/_layout.tsx:51`). The toast rides along; tapping Undo
      calls `setRemoved` on an unmounted screen, React drops it silently, the toast dismisses
      as if it worked, and `kv` already persisted the removal.
- [ ] **4d. `listComplete` can be permanently false** (`ShoppingScreen.tsx:204-212` vs
      `plan.queries.ts:131-133`). One plan entry pointing at a seed id the app no longer
      ships — or a co-member's recipe RLS won't return — makes the length check fail forever,
      so `pruneRemoved` never runs again for that user and every removal becomes immortal.
      The fix for the flaky wipe traded it for a permanent freeze.
- [ ] **4e. The exclusion prune kept the weak guard** (`ShoppingScreen.tsx:189-195` still uses
      only `recipeIds.length === 0`, while the removal prune at :204 got `listSettled` /
      `listComplete`). A momentary short member list resurrects a dish the shopper dropped.
- [ ] **4f. A failed `plan_entries` select renders "Nothing to buy yet"**
      (`household.queries.ts:114` discards `error`, returns `data ?? []`). Empty dishes →
      `listQuery` disabled → `isError` false → the confident empty state lies to a shopper
      whose week is full. Straight honesty-law violation.
- [ ] **4g. Hydration is unguarded** (`ShoppingScreen.tsx:163-182`). `kv.get('shoppingState')`
      is read with **no zod schema**, against `storage.ts:24-26`'s validate-before-trust rule;
      a stored `null` throws at `saved.checked` before `normalizeRemoved` runs, the async IIFE
      rejects unhandled, `hydrated.current` stays false and **nothing persists that session**.
      Also: rows render before `kv.get` resolves, so a removal in that window is overwritten.
- [ ] **4h. Ask Otto auto-scrolls its own hero off the top** (`ChatScreen.tsx:180`
      `onContentSizeChange={toBottom}`, unchanged while `ChatEmptyState` grew to ~396–474pt).
      On a 667pt window the chat viewport is ~392pt, so the screen animates to the bottom on
      open and Otto's head sits under the header. `OttoClubScreen.tsx:137` renders the same
      220 hero with no autoscroll — gate `toBottom` on a non-empty transcript.
- [ ] **4i. `ChatEmptyState.tsx:28-32` hand-mixes `type.body` with `colors.inkSoft`** and its
      comment claims the roles are unchanged. There is no "body inkSoft" role
      (`Text.tsx:22-24`: "Role IS the color decision. No color/style escape hatch."). Either
      use `role="caption"` or state the deviation honestly.
- [ ] **4j. The error row is now unreachable from the empty state** (`Transcript.tsx:155-159`
      renders it, but `ChatScreen.tsx:182-194` only renders `Transcript` when non-empty, and
      `useChat.ts:100-113` never clears `error` on thread switch). Narrow path, real drift.
- [ ] **4k. The hold arms with no movement filter** (`HoldToRemoveRow.tsx:97-102` —
      `activateAfterLongPress(300)` with no `activeOffsetX` / `failOffsetY`). Rest a thumb on
      a row for 300 ms while reading, then flick to scroll: **the list won't scroll**, because
      the pan already owns the touch. Add axis constraints. Related: `COMMIT_FALLBACK = 120`
      is documented as a "threshold" but used as a *width* (`:115`), so a pre-layout release
      commits at 42pt, not the intended ~109pt. And a swipe *without* a hold fails the gesture
      and falls through to `Pressable.onPress`, i.e. it **ticks the item off** (`:190-196`).
- [ ] **4l. The held state is scale + shadow only** and the removal is unannounced on iOS
      (`HoldToRemoveRow.tsx:165-172`; `Toast.tsx:64` uses `accessibilityLiveRegion`, which RN
      documents as Android-only). WCAG 1.4.1 / 1.3.1. A VoiceOver user firing the "Remove from
      list" action hears nothing and is never told Undo exists.
- [ ] **4m. Restore returns a row still ticked** (`ShoppingScreen.tsx:146, 252`) and "Show
      them" (:278-286) is all-or-nothing with no undo — 8 removed, want 1 back, get all 8.
- [ ] **4n. `sameSources` is asymmetric under duplicates and `normalizeRemoved` doesn't dedupe**
      (`shoppingList.ts:231-236, 248-259`): `sameSources(["A","A"],["A","B"]) === true` one way
      and `false` the other. Only reachable via a hand-edited or future-written blob, but the
      doc comment claims a true set comparison. Dedupe on normalize.

**What the review could NOT break** (do not re-litigate): the cancelled-gesture fix, the
commit-on-release fix, `pruneRemoved`'s identity return, the legacy `string[]` migration path,
undo double-restore, the toast batch window, the "3 of 2" counter, and PlanScreen's
"Build my shopping list" CTA (`PlanScreen.tsx:109`) — all verified correct.

---

## Done when

- [ ] Build number decided against `eas build:list`, built, submitted, and the on-device
      checklist in item 1 is fully ticked (or the failures written to the Log)
- [ ] 4a landed: removal sources are recipe ids, with a test that two same-titled dishes keep
      independent removals
- [ ] `household_list_state` carries removal state, types regenerated, two-account sync
      verified, non-member write refused
- [ ] Custom extras and ingredients share one remove affordance
- [ ] Every 4x box above ticked or explicitly deferred with a reason in the Log
- [ ] At least one test that would have caught 4a (the suite is pure-function only today —
      a `buildShoppingList` + `isRemoved` regression test is enough; no component harness
      exists and adding one is out of scope for this ticket)

## Log

<!-- append dated findings here; this is the shared thread between terminal and cloud -->
