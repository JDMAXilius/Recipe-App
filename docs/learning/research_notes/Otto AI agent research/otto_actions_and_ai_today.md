# What a user can do by hand in Otto today, and how the AI works today

Research notes, read from the repository at commit `d03c6fc1` (2026-11-04). Sources are repo paths with line numbers; no web sources were used. `docs/architecture/EDGE_FUNCTIONS.md` (Status: current, verified at `0cbfaa9f`) was read first and spot-checked against code.

## 1. Inventory of manual user actions (the future AI tool catalogue)

### Takeaway
Almost every durable user action is a small, typed function in a `*.queries.ts` file that writes one Supabase table under RLS with the user's own JWT. Plan, saved, my recipes, household and shares live on the server; the personal shopping list state, journal, preferences, reminders, ratings and chats live only on the device in `kv` (AsyncStorage `otto.v2.*`). Most actions are reversible; recipe delete, account delete, leaving a household and journal entries (no delete) are the exceptions.

### Cited Findings

**Storage layer**
- Device storage is one typed keyspace `kv` with keys `onboarded, unitSystem, prefs, notifPrefs, firstSaveCelebrated, soundsEnabled, shoppingState, household, householdRecent, journal, chats, cookRatings, reviewPrompt, aiConsentOpenAI, rcSynced`, namespace `otto.v2`; writes are best-effort and swallow failures — [src/shared/storage.ts:8-24, 27-59](src/shared/storage.ts)
- RLS is enabled on `plan_entries`, `favorites`, `recipes`, `recipe_shares`, `list_shares`, `households`, `household_members`, `household_list_state`, `memberships`, `otto_recipes`, `seed_nutrition`, `resolved_ingredients` with own-row select/insert/update/delete policies (e.g. `plan_entries_insert_own`, `favorites_delete_own`, `recipes_insert_own`) plus household read policies (`plan_entries_household_read`, `recipes_household_read`) — [supabase/migrations/*.sql](supabase/migrations) (grep of `enable row level security` / `create policy`); full model in [docs/architecture/ERD.md](docs/architecture/ERD.md) (12 public tables, 4 RPCs, 1 bucket, lines 5-13)

**Recipes / discovery (read-only)**
- Browse catalogue `otto_recipes`: `useCategories`, `useFeatured`, `useDiscover(category, areas)`, `useAreas`, `useSearch(query)`, `useRecipe(id)`, `useRelated(recipe)` — [src/features/recipes/recipe.queries.ts:55-323](src/features/recipes/recipe.queries.ts). Table is read-all under RLS (`otto_recipes_read_all`).
- Scale servings on the detail screen: local state `setServings`, `scaleIngredients(recipe.ingredients, factor, unitSystem)` — [src/features/recipes/RecipeDetailScreen.tsx:69, 100-109, 309-310](src/features/recipes/RecipeDetailScreen.tsx). Ephemeral, not persisted.
- Share a recipe: renders a card image and opens the native share sheet (`shareRecipeCard`); no link is minted on purpose — [RecipeDetailScreen.tsx:131-141](src/features/recipes/RecipeDetailScreen.tsx). `useCreateRecipeShare` (insert `recipe_shares`) exists but this screen does not use it — [src/features/share/share.queries.ts:64-71](src/features/share/share.queries.ts).

**Cookbook / saved**
- Save / unsave: `useSaved().toggle({recipe, wasSaved})`, optimistic with rollback and a toast Undo; writes `favorites` via `insertFavorite` (upsert on `user_id,recipe_id`) / `deleteFavorite` — [src/features/cookbook/useSaved.ts:21-83](src/features/cookbook/useSaved.ts), [src/features/cookbook/saved.queries.ts:22-53](src/features/cookbook/saved.queries.ts). Reversible.
- List my recipes: `useMyRecipes` / `fetchMyRecipes` from `recipes` — [src/features/cookbook/mine.queries.ts:48-50](src/features/cookbook/mine.queries.ts)
- Filter to cooked: local `cookedOnly` state — [src/features/cookbook/CookbookScreen.tsx:45, 136](src/features/cookbook/CookbookScreen.tsx); the cooked set comes from `plan_entries.cooked` for the rolling week only — [src/features/cook/useCookedState.ts:1-42](src/features/cook/useCookedState.ts)

**Import / create / edit (user recipes)**
- From a link: `importFromUrl(url)` → edge `import-recipe` — [src/features/import/import.queries.ts:73-75](src/features/import/import.queries.ts)
- From pasted text: `importFromText(text)` → `generate-recipe {text}` — [import.queries.ts:94](src/features/import/import.queries.ts)
- From a photo: `importFromPhoto(image, mimeType)` → `generate-recipe {image}` — [import.queries.ts:103-104](src/features/import/import.queries.ts)
- Write it myself: `openEditor(emptyDraft(null))` — [src/features/import/AddSheet.tsx:89](src/features/import/AddSheet.tsx)
- Every path lands in a review-first editor; Save is `useSaveRecipe()` → `createUserRecipe` / `updateUserRecipe` on `recipes`, computing per-line grams and per-serving nutrition before the write — [import.queries.ts:216-263, 335-347](src/features/import/import.queries.ts)
- Upload a recipe photo to Storage `recipe-photos/<uid>/<uuid>` — [import.queries.ts:140-168](src/features/import/import.queries.ts)
- Delete my recipe: `useDeleteRecipe()` → `deleteUserRecipe(id)` (hard delete on `recipes`) — [import.queries.ts:272-273, 354-360](src/features/import/import.queries.ts). Not reversible.

**Plan (rolling 7-day week)**
- `usePlan()` exposes `add(input)`, `remove(id)`, `swap(oldId, input)`, `setCooked(id, cooked)`; all optimistic with rollback; data `plan_entries (user_id, day, recipe_id, title, image, category, note, cooked)` — [src/features/planner/usePlan.ts:13-141](src/features/planner/usePlan.ts), [src/features/planner/plan.queries.ts:12-54](src/features/planner/plan.queries.ts)
- Swap is not atomic: `removePlanEntry` then `addPlanEntry` in two calls — [usePlan.ts:99-103](src/features/planner/usePlan.ts)
- Add to week from recipe detail: `addToWeek(dayKey,label)` → `add({day, recipeId, title, image, category})` — [RecipeDetailScreen.tsx:143-156](src/features/recipes/RecipeDetailScreen.tsx)
- Plan screen: pick (add or swap) `onPick`, `toggleCooked`, `removeEntry`, `carryLeftovers` (adds tomorrow's entry tagged leftovers) — [src/features/planner/PlanScreen.tsx:76-121](src/features/planner/PlanScreen.tsx)
- Week is computed per mount by `weekDays()`; only `days[0]..days[6]` are listed — [usePlan.ts:56-63](src/features/planner/usePlan.ts). All four actions reversible.

**Shopping list**
- Built on the device from the week's recipes: `buildShoppingList(recipes)` grouping by `aisleFor(name)` — [src/features/planner/shoppingList.ts:14, 91, 155](src/features/planner/shoppingList.ts); source rows via `getListRecipes` on `recipes` — [plan.queries.ts:102-116](src/features/planner/plan.queries.ts)
- Personal list actions are in-screen callbacks, not a hook: `toggle(key)`, `addCustom(name)`, `removeItem`, `restoreHidden`, `restoreCustom`, `removeCustom`, dish exclusion (`excluded`), `shareList` (plain text via native share) — [src/features/planner/ShoppingScreen.tsx:291-466, 539-566](src/features/planner/ShoppingScreen.tsx); persisted to kv `shoppingState {checked, custom, excluded, removed, removedV}` — [ShoppingScreen.tsx:216-238](src/features/planner/ShoppingScreen.tsx)
- Household list: `useSharedList(householdId)` → `toggle`, `addCustom`, `removeCustom`, `setRemoved(itemKey, removed, sources)` over table `household_list_state`, realtime channel — [src/features/household/useHousehold.ts:112-140](src/features/household/useHousehold.ts), [src/features/household/household.queries.ts:140-205](src/features/household/household.queries.ts)
- `useCreateListShare` (insert `list_shares`) exists — [share.queries.ts:79-86](src/features/share/share.queries.ts)

**Household**
- `useHousehold()` → `create(displayName)` (insert `households` + `household_members`), `join(code, displayName)` (RPC `join_household`), `leave()` (delete own member row) — [useHousehold.ts:38-109](src/features/household/useHousehold.ts), [household.queries.ts:74-107](src/features/household/household.queries.ts). Invite via native Share — [src/features/profile/HouseholdScreen.tsx:70](src/features/profile/HouseholdScreen.tsx). Leave is reversible only by re-joining with the code.
- Housemates' week dishes read via `getHouseholdWeekDishes` — [household.queries.ts:120-127](src/features/household/household.queries.ts)

**Cook mode** (all in-memory unless noted) — [src/features/cook/CookScreen.tsx](src/features/cook/CookScreen.tsx)
- Change servings (1..24) :429-430; start / extend (+1, +5 min) / dismiss timers :179-205, :520-526 (timers are React state with a 1 s interval, :147-177); step navigation `advance`, `goBackStep`, jump sheet :262-270, :501
- Finish: `finish()` plays success, records a review-prompt cook, and calls `usePlan().setCooked(e.id, true)` for every uncooked entry of that recipe :242-258
- Rate thumbs up/down → kv `cookRatings[recipeId]` :92-96
- Snap your plate → `choosePhoto()` then `useJournal().addEntry` :103-115
- Store review prompt after cooks — [src/features/cook/reviewPrompt.ts:16-24](src/features/cook/reviewPrompt.ts)

**Journal**
- `useJournal()` returns `{entries, loading, addEntry}` only; device-local kv `journal`, photo is a file uri on this device, no upload, no delete or edit API — [src/features/journal/useJournal.ts:7-57](src/features/journal/useJournal.ts)

**Nutrition** (read-only, computed) — see section 4.

**Preferences**
- `usePrefs()` → `setDiet`, `setCuisines`, `toggleCuisine`, `setUnitSystem`; kv `prefs` and `unitSystem` — [src/features/profile/usePrefs.ts:34-65](src/features/profile/usePrefs.ts). ADR-0010 (Status: Proposed) would move them to a `profiles` table — [docs/adr/0010-preferences-live-on-the-account-not-only-on-the-phone.md:3-14](docs/adr/0010-preferences-live-on-the-account-not-only-on-the-phone.md)
- Sounds on/off: kv `soundsEnabled` — [src/shared/sound.ts:37, 109](src/shared/sound.ts)
- AI consent toggle: `useAiConsent().set` — [src/shared/aiConsent.ts:62-74](src/shared/aiConsent.ts)

**Notifications / reminders**
- `useNotifPrefs()` → `setTonight(bool)`, `setHour(0..23)` (UI offers 16-19), `setSunday(bool)`; kv `notifPrefs`; defaults all off, hour 17 — [src/features/notifications/useNotifPrefs.ts:13-64](src/features/notifications/useNotifPrefs.ts), [notifications.logic.ts:10-17](src/features/notifications/notifications.logic.ts)

**Account**
- Sign in/up (password, Apple, Google), sign out, password reset/change, `saveUsername` — [src/features/auth/auth.queries.ts:19-115](src/features/auth/auth.queries.ts)
- Delete account → edge `delete-account` — [src/features/profile/profile.queries.ts:8-13](src/features/profile/profile.queries.ts). Irreversible.
- Otto Club: `useClub`, `useMembership`, `openManageSubscriptions` — [src/features/profile/club.purchases.ts:36-82](src/features/profile/club.purchases.ts)
- Chat threads: kv `chats`, ≤30 threads, ≤30 days — [src/features/chat/useChat.ts:47-64](src/features/chat/useChat.ts)

### Inferences
- Candidate AI tool catalogue (server-writable today with the user's JWT): `plan.add/remove/swap/setCooked/carryLeftovers`, `saved.toggle`, `recipe.create/update/delete`, `import.fromUrl/fromText/fromPhoto`, `household.list.toggle/addCustom/removeCustom/setRemoved`, `household.create/join/leave`, and the read tools `catalogue.search/discover/get`, `plan.list`, `saved.list`, `myRecipes.list`.
- Device-only actions (personal shopping list checks/custom/exclusions, journal, prefs, unit system, reminders, cook timers, ratings) cannot be executed by a server-side agent today; they need either client-executed tools or moving the data to tables.
- Undo exists in the UI for save (toast), plan (rollback/remove), list hide (restore). An agent should be given the same undo per action, and confirmation for the three irreversible ones (delete recipe, delete account, leave household).

### Gaps
- Whether the chats list screen lets a user delete a thread was not confirmed (`app/chats.tsx` showed no delete in a quick grep).
- `ShoppingScreen.tsx` (1110 lines) was read in parts; exact semantics of `excluded` vs `removed` beyond the comments at :49-74 were not traced fully.
- Onboarding answers, Club purchase/restore internals not traced in detail.

## 2. How the AI works today

### Takeaway
All AI is OpenAI Chat Completions with strict `json_schema` output, called only from Deno edge functions; there is **no function calling / tools** anywhere. Chat is a recipe-builder that answers with one of `clarify | recipe | decline`; it receives only the last 12 chat turns, and the app does not send prefs, plan, pantry or household context today.

### Cited Findings
- Shared OpenAI client posts to `https://api.openai.com/v1/chat/completions` with `response_format: {type:"json_schema", strict:true}` — [supabase/functions/_shared/openai.ts:3-5, 29](supabase/functions/_shared/openai.ts). A grep for `tools`, `tool_choice`, `function_call` across `supabase/functions` returned nothing.
- `generate-recipe` modes are chosen by body keys in order `messages → image → text (or prompt > 600 chars) → prompt`; model `gpt-5.1` for text and vision; 4000 max tokens, 120 s; `reasoning_effort` low for streaming chat, medium for JSON chat/paste/one-shot, omitted for vision — [docs/architecture/EDGE_FUNCTIONS.md:33-46](docs/architecture/EDGE_FUNCTIONS.md); confirmed [generate-recipe/index.ts:12-16](supabase/functions/generate-recipe/index.ts)
- Chat output schema `CHAT_SCHEMA {mode: clarify|recipe|decline, message, options, title, servings, category, area, ingredients[{measure,name}], steps}` and system prompt "build ONE recipe the person will save" — [generate-recipe/index.ts:79-123](supabase/functions/generate-recipe/index.ts)
- Server keeps the last 12 turns (`messages.slice(-12)`), max 20 in, each ≤600 chars, last must be user — [generate-recipe/index.ts:335](supabase/functions/generate-recipe/index.ts); [EDGE_FUNCTIONS.md:48-55](docs/architecture/EDGE_FUNCTIONS.md)
- Optional context lines the server can inject: `Servings`, `Dietary preference`, `Cuisines they enjoy (a lean, not a rule)` — [generate-recipe/index.ts:299-304](supabase/functions/generate-recipe/index.ts). But `ChatScreen` calls `useChat({ threadId: chatParam })` with no servings/diet/cuisines — [src/features/chat/ChatScreen.tsx:81](src/features/chat/ChatScreen.tsx), [useChat.ts:82-83](src/features/chat/useChat.ts). So today the chat gets no prefs, plan, pantry or household data.
- SSE: frames `data: {"type":"delta","text"}` then one `done` (payload) or `error`; client `sendChatStreaming` reads deltas and trusts only the zod-parsed `done` payload, with JSON fallback — [EDGE_FUNCTIONS.md:66-72](docs/architecture/EDGE_FUNCTIONS.md); [src/features/chat/chat.queries.ts:112-184](src/features/chat/chat.queries.ts)
- Chat recipe is "review-first": `stageOttoRecipe` then push `/recipe/edit`; the chat itself writes nothing — [ChatScreen.tsx:158-167](src/features/chat/ChatScreen.tsx)
- `import-recipe`: URL → schema.org JSON-LD with no model call; social posts fall back to caption → `generate-recipe {text}` server-to-server with the caller's Authorization; SSRF guard; 30 / 15 min — [EDGE_FUNCTIONS.md:113-160](docs/architecture/EDGE_FUNCTIONS.md)
- `resolve-nutrition`: USDA FDC search, `gpt-5-mini` picks an `fdcId`, a pick USDA did not return is discarded; cache `resolved_ingredients`; 20 / 15 min — [EDGE_FUNCTIONS.md:164-196](docs/architecture/EDGE_FUNCTIONS.md)
- `canonicalize`: one-time batch tool, `gpt-5.1`, no user auth, 1000/h per isolate — flagged as a risk — [EDGE_FUNCTIONS.md:290-330](docs/architecture/EDGE_FUNCTIONS.md)
- Rate limiter is an isolate-local sliding window `Map`, resets on cold start, not shared — [supabase/functions/_shared/http.ts:96-110](supabase/functions/_shared/http.ts). `generate-recipe` is `gen:<uid>` 20 / 15 min — [EDGE_FUNCTIONS.md:42](docs/architecture/EDGE_FUNCTIONS.md)
- `requireClub(uid)` is off unless `REQUIRE_CLUB=on`; on → `memberships` row or RevenueCat lookup, 402 if not a member, 503 if it cannot check — [EDGE_FUNCTIONS.md:16](docs/architecture/EDGE_FUNCTIONS.md); [_shared/http.ts:43-94](supabase/functions/_shared/http.ts). Whether production sets it is unknown from the repo — [EDGE_FUNCTIONS.md open question 2](docs/architecture/EDGE_FUNCTIONS.md)
- Order of checks in every user-facing function: preflight → method → JWT → rate limit → club gate → key → body — [EDGE_FUNCTIONS.md:27-28](docs/architecture/EDGE_FUNCTIONS.md)
- `getUserId` verifies the bearer token with the anon key; uid never from the body; `serviceClient()` bypasses RLS — [_shared/http.ts:21-41](supabase/functions/_shared/http.ts)
- AI consent: `ensureAiConsent()` (interactive, on a user's own action; fails closed with no sheet mounted) and `aiConsentGranted()` (silent, for background work); stored per provider in kv `aiConsentOpenAI` — [src/shared/aiConsent.ts:1-56](src/shared/aiConsent.ts). Called before Send and chips [ChatScreen.tsx:123, 147](src/features/chat/ChatScreen.tsx), before link/text/photo import [AddSheet.tsx:96, 117, 132](src/features/import/AddSheet.tsx), silently before nutrition resolve [nutrition.queries.ts:64](src/features/nutrition/nutrition.queries.ts). Consent is per device, not per account — [docs/adr/0006-ai-runs-on-openai-behind-supabase-edge-functions-with-per-pr.md:13-14](docs/adr/0006-ai-runs-on-openai-behind-supabase-edge-functions-with-per-pr.md)
- Chat storage: kv `chats`, threads pruned to ≤30 and ≤30 days, per-message prune, read-modify-write upsert per turn — [useChat.ts:47-64, 144-152](src/features/chat/useChat.ts)
- Stale comments still say Anthropic/Claude in several files although the code calls OpenAI only, e.g. [ChatScreen.tsx:121](src/features/chat/ChatScreen.tsx), [AddSheet.tsx:126](src/features/import/AddSheet.tsx), [nutrition.queries.ts:60](src/features/nutrition/nutrition.queries.ts) — listed in [EDGE_FUNCTIONS.md open question 10](docs/architecture/EDGE_FUNCTIONS.md)
- `sendChat` (non-streaming) and `useGenerateRecipe` (one-shot) have no caller — [EDGE_FUNCTIONS.md:87-90](docs/architecture/EDGE_FUNCTIONS.md)

### Inferences
- The chat is a single-purpose "recipe composer", not an assistant: to act on the app it needs a new mode/function with tool calls, plus context (prefs, this week, saved, household, list) the client currently never sends.
- Strict `json_schema` mode and SSE are already in place; OpenAI tool calling would be an additive change to `_shared/openai.ts` (which currently only builds `response_format`).
- An isolate-local rate limiter will not hold for multi-step agent loops (each tool round trip is another call); a Postgres counter is the upgrade the code itself names (`_shared/http.ts:97-98`).

### Gaps
- Production values of `REQUIRE_CLUB` and `verify_jwt` are not in source control (no `supabase/config.toml`) — [EDGE_FUNCTIONS.md:21-25](docs/architecture/EDGE_FUNCTIONS.md).
- AI cost per call is not recorded beyond token-count logging (`logUsage`) — [EDGE_FUNCTIONS.md:18](docs/architecture/EDGE_FUNCTIONS.md).

## 3. Voice today

### Takeaway
Voice is dictation only: `expo-speech-recognition` 3.1.3 fills the chat composer; recognition is **not on-device** (audio goes to Apple's speech service), there is no text-to-speech, and voice is not available outside the chat composer.

### Cited Findings
- Dependency `expo-speech-recognition` `3.1.3`; app.json plugin with mic text "Otto listens only while Speak is on, to write down what you say." and speech text "Otto turns what you say into text with Apple speech recognition." — [package.json](package.json), [app.json:108-114](app.json)
- Hook comment: `requiresOnDeviceRecognition` defaults false and is not set, so on iOS the audio is streamed to Apple and Otto receives only the transcript; Apple must be disclosed as a recipient; founder call pending to flip it — [src/features/chat/useSpeechInput.ts:5-15](src/features/chat/useSpeechInput.ts)
- Start: `requestPermissionsAsync()` then `speech.start({ lang: 'en-US', interimResults: true })`; stop/abort; toggle; module is required lazily so older builds/Expo Go without the native module degrade — [useSpeechInput.ts:19-26, 89-121](src/features/chat/useSpeechInput.ts)
- Error mapping: aborted/interrupted silent, `not-allowed` → denied, no-speech/speech-timeout → no-speech; dictation appends to the typed draft — [src/features/chat/speech.logic.ts:7-25](src/features/chat/speech.logic.ts)
- Used only in chat files (`Composer.tsx`, `ChatScreen.tsx`) — repo grep for `speech`. Denied mic toast — [ChatScreen.tsx:110-116](src/features/chat/ChatScreen.tsx)
- Language is hard-coded `en-US` — [useSpeechInput.ts:102](src/features/chat/useSpeechInput.ts)

### Inferences
- A voice agent (hands-free in cook mode, "Hey Otto add X to the list") would need: on-device or disclosed server recognition decision, TTS for replies (no `expo-speech` dependency today), and voice entry points beyond the composer.

### Gaps
- No ticket file `SPEAK_TO_OTTO.md` was located under `docs/` outside the comment reference (a `find` for it returned nothing; it may live in `docs/history/`, not searched).

## 4. Photo today

### Takeaway
A photo becomes a recipe by transcription only: `generate-recipe` vision mode reads a photographed recipe (text) into a draft; nutrition is then computed on save from the ingredient lines by the on-device USDA engine, with `resolve-nutrition` for misses. **Nothing estimates calories of a plated meal photo**; plate photos go to the device-only journal with no analysis.

### Cited Findings
- Snap a recipe: consent first, `choosePhoto({base64:true})`, then `importFromPhoto` → `generate-recipe {image, mimeType}` (≤10,000,000 base64 chars; jpeg/png/webp) → review-first editor — [AddSheet.tsx:126-140](src/features/import/AddSheet.tsx); [EDGE_FUNCTIONS.md:53-56](docs/architecture/EDGE_FUNCTIONS.md); vision instruction in [supabase/functions/generate-recipe/imageMode.ts](supabase/functions/generate-recipe/imageMode.ts)
- Vision output is the same recipe shape `{title, servings, ingredients, steps…}`, no nutrition — [EDGE_FUNCTIONS.md:60-64](docs/architecture/EDGE_FUNCTIONS.md)
- Nutrition at save: `resolveNutrition(...)` computes per-line grams and per-serving figure BEFORE the write to `recipes.nutrition` — [import.queries.ts:216-233](src/features/import/import.queries.ts)
- Engine: `computeNutrition(input)` locally, `unmatchedNames` → `resolveIngredients(missing)` only if `aiConsentGranted()`; keep local result if the resolved one trips a plausibility guard — [src/features/nutrition/nutrition.queries.ts:55-71](src/features/nutrition/nutrition.queries.ts); engine files `engine/parse.ts`, `engine/compute.ts`, `engine/guards.ts`, `engine/lookup.ts` in [src/features/nutrition/engine/](src/features/nutrition/engine)
- Plate photo: cook-mode "snap your plate" → `useJournal().addEntry({recipeId, title, image})`, stored as a device file uri, no upload, no model call — [CookScreen.tsx:103-115](src/features/cook/CookScreen.tsx); [useJournal.ts:7-9](src/features/journal/useJournal.ts)
- Photo permission text names recipe import and journal plates only — [app.json:100-104](app.json)
- Grep for `plate|calorie|kcal` in `supabase/functions` finds only canonicalize prompt wording and the USDA energy field in resolve-nutrition — no meal-photo estimator.

### Inferences
- A "log what I ate from a photo" feature would be new: a new vision prompt, a new honesty treatment (estimate with `~`, per otto-lead laws), and new App Privacy answers (photos of food sent to OpenAI).

### Gaps
- None material beyond the not-traced vision prompt text in `imageMode.ts` (contract taken from EDGE_FUNCTIONS.md).

## 5. Notifications, widgets, Live Activities, App Intents, calendar

### Takeaway
Only local scheduled notifications exist (`expo-notifications`): a per-day "Tonight" dinner nudge and a Sunday 9 am planning nudge, both off by default, rescheduled from the plan. There is no widget, Live Activity, App Intent/Siri Shortcut, Spotlight, HealthKit or calendar code, no `expo-apple-targets`, and no `ios/` folder (managed Expo).

### Cited Findings
- `computeNotifications(entries, prefs, now)`: one "Tonight in your kitchen" per future day with an uncooked dish at `prefs.hour`; "Plan your week" next Sunday 9 am; past times pruned — [src/features/notifications/notifications.logic.ts:56-97](src/features/notifications/notifications.logic.ts)
- `syncNotifications` cancels all then schedules DATE triggers; foreground banner+list, no sound/badge; `ensurePermission` respects `canAskAgain`; web no-ops — [src/features/notifications/notifications.queries.ts:13-61](src/features/notifications/notifications.queries.ts)
- Called from `NotifSync` on plan/prefs change — [src/features/notifications/NotifSync.tsx:4-18](src/features/notifications/NotifSync.tsx)
- Notifications carry no deep link or actions (content is only `{title, body}`) — [notifications.queries.ts:52-55](src/features/notifications/notifications.queries.ts)
- Cook timers are in-screen state with a 1 s interval; they are not scheduled as local notifications or Live Activities — [CookScreen.tsx:147-205](src/features/cook/CookScreen.tsx)
- app.json plugins: expo-router, expo-font, expo-web-browser, expo-apple-authentication, expo-image-picker, expo-notifications, expo-audio, expo-speech-recognition, google-signin — no widget/intents/calendar plugin — [app.json:94-121](app.json)
- Grep of `src`, `app`, `app.json`, `package.json` for `expo-calendar|EventKit|AppIntent|WidgetKit|ActivityKit|LiveActivit|apple-targets|widget|siri|shortcut|Spotlight|HealthKit` matched only a comment about Siri interrupting speech — [speech.logic.ts:5](src/features/chat/speech.logic.ts). `ls ios` returned nothing.
- Widgets/Live Activities appear only in design/research docs (e.g. `docs/flow-maps/research/01_APPLE_AND_INDUSTRY_RULES.md`, `docs/reference/otto-feature-definition.md`), not code.

### Inferences
- Widgets, Live Activities (cook timers) and App Intents (Siri/Shortcuts "What's for dinner?") all need native targets, i.e. a config plugin such as `expo-apple-targets` plus a dev build; none of that scaffolding exists.
- An App Intent would want the same typed action layer as the AI agent (section 6): one catalogue serving chat tools, Siri and widgets.

### Gaps
- Doc mentions of widgets/calendar were listed by filename only, not read.

## 6. What would need to change for an agent; cleanest seams

### Takeaway
The cleanest seam is the existing `*.queries.ts` files: each is a small typed function over the Supabase client with RLS doing authorization. Re-implemented server-side with a user-scoped client (anon key + the caller's JWT, never `serviceClient()`), they become agent tools that obey the same RLS. Device-only state and the optimistic TanStack caches are the main obstacles.

### Cited Findings
- Contract: "ALL Supabase calls for the planner domain… Screens never import supabase-js; they go through usePlan()/these functions" — [plan.queries.ts:1-2](src/features/planner/plan.queries.ts); same rule in chat — [chat.queries.ts:1-4](src/features/chat/chat.queries.ts)
- Write functions take ids and plain inputs: `addPlanEntry(userId, input)`, `removePlanEntry(id)`, `setPlanEntryCooked(id, cooked)` — [plan.queries.ts:28-54](src/features/planner/plan.queries.ts); `insertFavorite(userId, recipe)`, `deleteFavorite(userId, recipeId)` — [saved.queries.ts:32-53](src/features/cookbook/saved.queries.ts); `createUserRecipe`, `updateUserRecipe`, `deleteUserRecipe` — [import.queries.ts:236-273](src/features/import/import.queries.ts); household `setChecked`, `addCustomItem`, `setItemRemoved`, `removeCustomItem` — [household.queries.ts:149-205](src/features/household/household.queries.ts)
- Edge functions already forward the caller's Authorization header server-to-server (`import-recipe` → `generate-recipe`) — [EDGE_FUNCTIONS.md:153-155](docs/architecture/EDGE_FUNCTIONS.md)
- `serviceClient()` bypasses RLS — [_shared/http.ts:36-41](supabase/functions/_shared/http.ts); an agent must not use it for user writes.
- Optimistic caches keyed `['plan', userId]`, saved key `savedKey(userId)`, `['household-list', householdId]` — [usePlan.ts:57](src/features/planner/usePlan.ts), [useSaved.ts:17](src/features/cookbook/useSaved.ts), [useHousehold.ts:130](src/features/household/useHousehold.ts). Household list already has realtime; plan and saved do not.
- Offline: writes are never queued; offline writes fail — [docs/adr/0011-offline-persist-the-query-cache-never-sync-mutations.md:10-14](docs/adr/0011-offline-persist-the-query-cache-never-sync-mutations.md)
- Personal shopping state lives inside a 1110-line screen component, not a hook — [ShoppingScreen.tsx:190-238, 291-466](src/features/planner/ShoppingScreen.tsx)
- Reminder rescheduling depends on the client seeing plan changes (`NotifSync`) — [NotifSync.tsx:10-18](src/features/notifications/NotifSync.tsx)
- Shopping list has no server representation for solo users; only households have `household_list_state` — [household.queries.ts:140-205](src/features/household/household.queries.ts)

### Inferences
- Two viable architectures: (a) **server tools**: a new `otto-agent` edge function running OpenAI tool calls, each tool a Deno port of a queries.ts function on a user-JWT client; the client then invalidates the affected query keys from a returned "changes" list; (b) **client tools**: the model returns tool calls, the app executes them through the existing hooks (`usePlan().add`, `useSaved().toggle`), keeping optimistic UI and undo for free and reaching device-only state. A hybrid (server for reads/context, client for writes with undo) fits the current code best.
- Extraction steps implied by the code: lift the personal list actions out of `ShoppingScreen` into a `useShoppingList` hook; give journal a delete; make `swap` atomic (an RPC) so an agent cannot leave a half-swap; share zod schemas between client queries and the server tools; add realtime or invalidate-on-return for plan/saved.
- Context for the agent (prefs, week, saved, household) needs prefs on the server (ADR-0010) if tools run server-side.

### Gaps
- No existing ticket or ADR for an agent/tool layer was found (`find docs -iname '*agent*'` found only this research folder).

## 7. Constraints from docs

### Takeaway
Any agent must keep the honesty laws (no fabricated data, nutrition agrees everywhere, no dead UI, immutable attribution), ask OpenAI-named consent before the first AI call, sit behind the hard paywall, live in the Otto trailing-circle tab, and serve the "Tonight is answered" magic moment and the North Star of planned dinners cooked.

### Cited Findings
- Honesty laws: never fabricate data or precision the source lacks; nutrition card and detail agree, `~` marks estimates; no dead-end or unwired UI; never bury delete-account; attribution immutable — [.claude/skills/otto-lead/SKILL.md:29-40](.claude/skills/otto-lead/SKILL.md)
- ADR-0006 (Accepted): all model calls server-side via `_shared/openai.ts`; consent names OpenAI, stored per provider; consent is per device (scenario S11) — [docs/adr/0006-…md:10-14](docs/adr/0006-ai-runs-on-openai-behind-supabase-edge-functions-with-per-pr.md)
- ADR-0005 (Accepted): subscription-only; every route under `Stack.Protected`; paywall has no close — [docs/adr/0005-hard-paywall-an-account-and-an-active-otto-club-are-required.md:8-11](docs/adr/0005-hard-paywall-an-account-and-an-active-otto-club-are-required.md)
- ADR-0008 (Accepted 2026-11-04): four tabs + Otto in the trailing circle; chat is a tab root; Search moves to Discover; ＋ Add moves to Cookbook nav bar — [docs/adr/0008-…md:9-14](docs/adr/0008-tab-bar-home-plan-cookbook-account-with-otto-ai-in-the-trail.md)
- ADR-0010 (Proposed): prefs to a `profiles` row with household, diet, allergies, skips; changes App Privacy answers — [docs/adr/0010-…md:3-14](docs/adr/0010-preferences-live-on-the-account-not-only-on-the-phone.md)
- Magic moment "Tonight is answered": the first-week reveal opens on tonight's dinner sized for the household, any day swappable with one tap, aisle-grouped list — ["docs/learning/reports/Otto magic moment research.md":4](docs/learning/reports/Otto%20magic%20moment%20research.md)
- Tracking plan (Status: draft, nothing built, no analytics SDK): North Star = planned dinners cooked per active Club household per week; activation = ≥1 planned dinner cooked in the 7-day trial; events include `day_swapped` with `surface: otto`, `cooking_started` with `source: otto`, and `otto_changed_plan {day_offset}`; guardrail "AI cost per active household" — [docs/product/TRACKING_PLAN.md:1-36](docs/product/TRACKING_PLAN.md)
- Allergen coverage (current): of 510 dinner recipes in 795 `otto_recipes`, the strictest tested filter (vegetarian + dairy-free + gluten-free) leaves 52; flags come from keyword matches on canonical keys — [docs/product/ALLERGEN_COVERAGE.md:3-12](docs/product/ALLERGEN_COVERAGE.md)
- CLAUDE.md fixed decisions: light only, the tab bar of ADR-0008, AI consent names the provider and is asked before the first AI call — [CLAUDE.md](CLAUDE.md)
- Voice data goes to Apple and must appear in App Privacy — [useSpeechInput.ts:5-15](src/features/chat/useSpeechInput.ts); App Privacy truth table is the authority — [CLAUDE.md](CLAUDE.md) (`docs/legal/APP_PRIVACY_TRUTH_TABLE.md`, not read here)

### Inferences
- "Otto AI can do everything you can do" fits the North Star only if the agent's headline actions are plan actions (fill/swap tonight, mark cooked, build the list), which the tracking plan already anticipates with `surface: otto`.
- Honesty laws imply the agent must not invent nutrition or allergen safety: allergy answers should come from the canonical-key flags, and should say when a recipe is unchecked.
- Because consent is per device, an agent triggered from a widget, Siri or a notification must still check `aiConsentGranted()` and fail closed (as `ensureAiConsent` does with no sheet mounted, `aiConsent.ts:46-50`).

### Gaps
- `docs/legal/APP_PRIVACY_TRUTH_TABLE.md`, the magic-moment report body and the full tracking-plan event table beyond line 36 were not read in full.
