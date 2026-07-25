# Otto — App Privacy truth table (ticket A2)

**Audit date:** 2026-07-25 · **App version audited:** `app.json` 1.0.17, iOS build 35
**Method:** code walk only. No app code and no policy text was changed in this pass.
**Rule used:** every row cites `file:line`. Where the code cannot settle a question (what a
vendor does on its own servers), the row says **UNKNOWN** and names the test that would settle it.

Apple's definition used throughout:
- **Collected** = transmitted off the device and retained beyond the immediate request, in a form
  accessible to us or to a partner acting for us.
- **Linked to identity** = tied to an account/user id we hold.
- **Tracking** = linked with third-party data for ads/measurement, or shared with a data broker.
  **Otto does none of this** — there is no ad SDK, no IDFA read, no `AppTrackingTransparency`
  import anywhere in `src/` or `app/` (grep: zero hits). Every row below is **Tracking: NO**.

---

## 1. The table

| # | Data type | Apple App Privacy category | Collected? | Linked to identity? | Tracking? | Where in code (`file:line`) | Third party that receives it |
|---|---|---|---|---|---|---|---|
| 1 | Email address | Contact Info → **Email Address** | **YES** | YES | No | `src/features/auth/auth.queries.ts:19-27` (password sign-in/up); `src/features/auth/oauth.native.ts:27-37` (Apple scope `EMAIL`); `:56-60` (Google/Facebook) | **Supabase** (auth + DB, US). Apple/Google/Facebook are the *source*, not recipients. Apple Hide-My-Email relay handled at `src/features/auth/username.ts:31-32` |
| 2 | Name / display name | Contact Info → **Name** | **YES** | YES | No | User-chosen name → `auth.queries.ts:73-77` (`user_metadata.username`); Apple full name scope → `oauth.native.ts:28`; household display name → `src/features/household/household.queries.ts:83, 97` (`household_members.display_name`, migration `20260722120000_…:14`); collaborator label on shared lists → migration `20260721090009_share_functions.sql:110-112` (`collab_items.added_by_name`, `checked_by_name`) | **Supabase**. `added_by_name`/`checked_by_name` are additionally visible to **every other holder of that share token** (`…090009:69-81`) |
| 3 | Account user id (UUID) | Identifiers → **User ID** | **YES** | YES (it *is* the identity) | No | Every table keys on it: `favorites.user_id` (`…090001_favorites.sql:8`), `recipes` (`…090002:7`), `plan_entries` (`…090003:5`), `recipe_shares` (`…090005:12`), `list_shares` (`…090006:8`), `collab_lists.owner_user_id` (`…090007:14`), `households.created_by` (`20260722120000:7`), `household_members.user_id` (`:13`), `household_list_state.updated_by` (`:24`), `memberships.user_id` (`20260723150000:8`). Storage path prefix = uid (`src/features/import/import.queries.ts:148`) | **Supabase**; and **RevenueCat**, which is handed the Supabase UUID verbatim as its App User ID (`app/_layout.tsx:29` configure → `src/features/auth/AuthProvider.tsx:63` `Purchases.logIn(uid)`) |
| 4 | Device identifier (IDFV) | Identifiers → **Device ID** | **YES (assume yes)** | YES (RevenueCat joins it to the uid in row 3) | No | `app/_layout.tsx:4, 29` — `react-native-purchases` is configured at module scope on every launch, before any purchase | **RevenueCat**. **UNKNOWN from our code**: the SDK collects IDFV/device metadata internally; nothing in this repo reads or sends it. *Settles it:* RevenueCat's own published "data collected" disclosure for the SDK version in `package.json`, or a proxy capture of the SDK's `/v1/subscribers` POST body |
| 5 | Purchase / subscription history | Purchases → **Purchase History** | **YES** | YES | No | `src/features/profile/club.purchases.ts:27-34` (offerings + customer info on every paywall mount), `:46` (`purchasePackage`), `:58` (`restorePurchases`); server mirror `supabase/functions/revenuecat-webhook/index.ts:43-46, 73-80` → `public.memberships` (`20260723150000_memberships.sql:7-13`: `product_id`, `store`, `environment`, `expires_at`) | **RevenueCat** (and Apple, as the store). Mirrored back into **Supabase** |
| 6 | Photos — recipe/dish photos uploaded | User Content → **Photos or Videos** | **YES** | YES (path is `<uid>/<epoch_ms>.<ext>`) | No | Pick: `src/shared/imagePicker.ts:20-38`; upload: `src/features/import/import.queries.ts:131-157`; called from `src/features/import/EditRecipeScreen.tsx:169-176`; bucket declared **public** in `supabase/migrations/20260721090010_storage_policies.sql:19-21` | **Supabase Storage**. Bucket is public-read: the object URL is fetchable by anyone who has or guesses it (`…090010:4-7`) |
| 7 | Photos — recipe photos sent to AI for transcription | User Content → **Photos or Videos** | **YES** (transmitted; retention is the vendor's) | YES (request carries the user's JWT; per-user rate-limit key `gen:${userId}`) | No | `src/features/import/AddSheet.tsx:105-118` (camera or library, `base64:true`) → `src/features/import/import.queries.ts:94-97` → `supabase/functions/generate-recipe/index.ts:378-392` (image block posted to `https://api.anthropic.com/v1/messages`, `:14, :176-192`); size/type gate `supabase/functions/generate-recipe/imageMode.ts:16-23` | **Anthropic** (`api.anthropic.com`), model `claude-opus-4-8` (`generate-recipe/index.ts:12`) |
| 8 | Photos — cooking-journal plate photos | User Content → **Photos or Videos** | **NO** | n/a | No | `src/features/journal/useJournal.ts:42-55` stores only a device file `uri` into AsyncStorage key `otto.v2.journal` (`src/shared/storage.ts:18, 23`); `src/features/journal/journal.logic.ts:10` "the image bytes stay on-device". Journal picks omit `base64` (`imagePicker.ts:26`), so no bytes are ever produced for upload | none |
| 9 | **Location (EXIF/GPS inside an uploaded photo)** | Location → **Precise Location** | **UNKNOWN — treat as YES until tested** | YES (uploaded under the uid path) | No | Otto never strips metadata: `import.queries.ts:110-125` decodes the base64 verbatim and `:150-152` uploads those exact bytes. With `quality: 0.7` (`imagePicker.ts:25`), the library path takes expo-image-picker's slow path and, **for HEIC/TIFF/AVIF/WebP/BMP originals, returns the untouched original file** — `node_modules/expo-image-picker/ios/ImageUtils.swift:145-150`, `MediaHandler.swift:177-198` — and iPhone camera-roll photos are HEIC. `uploadRecipePhoto` explicitly expects HEIC (`import.queries.ts:144-147`). JPEG/PNG originals and **camera** captures *are* re-encoded through `UIImage` and lose EXIF (`ImageUtils.swift:107, 129`; the library's own comment at `MediaHandler.swift:196` — "EXIF … is being lost in UIImage") | **Supabase Storage — in a public bucket** | 
| 10 | Recipes, meal plans, shopping lists, notes (user-authored text) | User Content → **Other User Content** | **YES** | YES | No | `recipes` (`…090002_recipes.sql:5-22` — title, ingredients, steps, source URL, image); `plan_entries` incl. free-text `note` (`…090003:3-13`); `favorites` (`…090001:6-15`); `household_list_state.custom_name` (`20260722120000:19-26`); `collab_items` (`…090007:19-27`) | **Supabase** |
| 11 | Shared-link snapshots (recipe / shopping list) | User Content → **Other User Content** | **YES** | YES to us; **capability-public to link holders** | No | `src/features/share/share.queries.ts:64-90` mints a CSPRNG token (`src/features/share/token.ts:3`) and writes `recipe_shares` / `list_shares.payload`; read back by `SECURITY DEFINER` functions keyed on the exact slug/token, never anon `SELECT` (`…090009_share_functions.sql:22-34, 49-52, 69-81`). Owner `user_id` is stripped from the share view (`:29-30`) | **Supabase**; content is readable by **anyone holding the link** |
| 12 | Chat / prompt text typed to Otto | User Content → **Other User Content** | **YES** | YES (JWT-authenticated, rate-limited per user) | No | `src/features/chat/chat.queries.ts:81-97` and `:117-130` → `supabase/functions/generate-recipe/index.ts:340-375` → Anthropic `:176-192` / `:242-259`. Paste-a-recipe import uses the same one-shot path (`src/features/import/AddSheet.tsx:87-100` → `index.ts:404-413`). Cap 600 chars/turn, ≤20 turns (`:22, :29-32`) | **Anthropic**, model `claude-sonnet-5` (`generate-recipe/index.ts:11`) |
| 13 | Ingredient names from your recipes (nutrition resolution) | User Content → **Other User Content** | **YES** | Request is authenticated; **the stored row is not** | No | `src/features/nutrition/resolve.queries.ts:31-49` → `supabase/functions/resolve-nutrition/index.ts:189-248`. Names go to **USDA** search (`:129-141`, `https://api.nal.usda.gov/fdc/v1/foods/search`) and to **Anthropic** (`:62-79`, `claude-haiku-4-5` `:20`), then are **persisted forever** into `public.resolved_ingredients` (`:238-243`), a table with `select to anon, authenticated using (true)` (`…090008_resolved_ingredients.sql:17-19`) | **Anthropic**, **USDA FoodData Central** (US Government), **Supabase**. Note: the free-text name a user typed becomes a globally readable row, un-deleted by account deletion (`…090009:182-203` does not touch it) |
| 14 | Voice / audio (mic dictation) | User Content → **Audio Data** | **NO by Otto — but the audio DOES leave the device to Apple** | No | No | `src/features/chat/useSpeechInput.ts:90` calls `speech.start({ lang:'en-US', interimResults:true })` and **does not set `requiresOnDeviceRecognition`**, which defaults to `false` (`node_modules/expo-speech-recognition/ios/SpeechRecognitionOptions.swift:21`) and is passed straight to `SFSpeechAudioBufferRecognitionRequest` (`ios/ExpoSpeechRecognizer.swift:580`); `app.json:46-52` sets no on-device flag either. Only the resulting **text** reaches Otto (`useSpeechInput.ts:53-57`) | **Apple** (server-side speech recognition). Otto's servers never receive audio |
| 15 | Recipe search terms / browsing of the built-in catalogue | **Search History** / **Browsing History** | **UNKNOWN — likely YES in logs** | Probably (the call carries the session JWT) | No | `src/features/recipes/recipe.queries.ts:32-38` — the search term is in the **URL query string** of a `supabase.functions.invoke('content/search.php?s=…')`; forwarded verbatim by `supabase/functions/content/index.ts:47-71` to TheMealDB. Our code stores nothing, but Supabase's edge-function request log records path+query. *Settles it:* read Supabase Edge Function logs for a `search.php?s=` request and check whether query string and caller identity are retained, and for how long | **TheMealDB** (receives the term); **Supabase** (platform request logs) |
| 16 | Pasted import URL | **Browsing History** (arguable) / Other Data | **YES, transiently** | Request authenticated | No | `src/features/import/import.queries.ts:72-75` → `supabase/functions/import-recipe/index.ts:10` (zod-validated), fetched with a resolve-then-connect SSRF guard (`:16-82`). No DB write of the URL by the function; the URL is persisted only if the user saves the draft (`recipes.source_url`, `…090002:9`) | The **website the user pasted** (it sees our server's request), **Supabase** logs |
| 17 | Dietary preference + favourite cuisines | **Sensitive Info** (diet can imply religion/health) | **NO today** | n/a | No | Stored device-only: `src/features/profile/usePrefs.ts:41` → `kv 'prefs'` (`src/shared/storage.ts:11`). **Fragile:** the wire and the server already forward them to Anthropic (`chat.queries.ts:64-67, 86`; `import.queries.ts:80-81`; `generate-recipe/index.ts:328-338` builds `Dietary preference: …` into the prompt) — **no caller passes them today** (`ChatScreen.tsx:70` passes only `threadId`; `AddSheet.tsx:95` passes only `prompt`). The day one does, this row flips to YES/Anthropic | none today |
| 18 | Reminder settings, onboarding state, cook ratings, chat transcripts, shopping check-state, unit system, sounds | Other Data | **NO** | n/a | No | All device-local AsyncStorage keys: `src/shared/storage.ts:8-20`; reminders `src/features/notifications/useNotifPrefs.ts:27, 34`; notifications are **scheduled locally**, never pushed (`src/features/notifications/notifications.queries.ts:43-57`) | none |
| 19 | Device push token | Identifiers → **Device ID** | **NO** | n/a | No | grep for `getExpoPushTokenAsync` / `getDevicePushTokenAsync` across `src/`, `app/`, `supabase/`: **zero hits**. `expo-notifications` is used only for local scheduling (`notifications.queries.ts:1-4, 52-56`). The plugin is declared in `app.json:44` but no remote-push path exists | none |
| 20 | Crash data, performance data, analytics, product interaction | Diagnostics, Usage Data | **NO** | n/a | No | grep `Sentry|posthog|amplitude|analytics|firebase` across `src/`, `app/`, `supabase/`, `package.json`: **zero hits**. Confirms ticket §B "no crash reporting and no analytics". Server-side, Supabase keeps platform request/error logs; edge functions log only messages, never bodies or keys (`generate-recipe/index.ts:309`, `_shared/http.ts:2`) | **Supabase** (platform logs only) |
| 21 | Support / bug-report messages | User Content → **Customer Support** | **NO by the app** | — | No | `src/features/profile/ProfileScreen.tsx:113-118` opens a `mailto:` with a prefilled body containing only app version + `Platform.OS`; the user's own mail client sends it. Nothing is transmitted by Otto | the mail path the user chooses; the message lands in our inbox |
| 22 | Payment card / financial info | Financial Info | **NO** | n/a | No | Purchases run through StoreKit/RevenueCat; no card data ever touches Otto (`club.purchases.ts:43-54`) | Apple |
| 23 | Contacts, health/fitness records, physical address, phone number | — | **NO** | n/a | No | No `expo-contacts`, no HealthKit, no address/phone field anywhere in `src/` | none |

### Third parties, consolidated (what the label's "data recipients" must cover)

| Vendor | What reaches it | Evidence |
|---|---|---|
| **Supabase** (auth, Postgres, Storage, Edge Functions) | Everything in rows 1-3, 5-7, 10-13, 15-16 | `src/shared/supabase/client.ts:28-39`; all migrations |
| **Anthropic** | Chat text, pasted recipe text, recipe photos, ingredient names | `generate-recipe/index.ts:14, 176, 242`; `resolve-nutrition/index.ts:21, 63`; `canonicalize/index.ts:26, 150` (dev-time batch tool, no user data) |
| **RevenueCat** | Supabase user UUID, purchase/entitlement state, SDK device metadata | `app/_layout.tsx:29`; `AuthProvider.tsx:63`; `revenuecat-webhook/index.ts:43-46` |
| **Apple** | Sign-in identity; **dictated audio** (server-side speech recognition); StoreKit purchases | `oauth.native.ts:25-40`; `useSpeechInput.ts:90` + `SpeechRecognitionOptions.swift:21` |
| **Google / Facebook** | Sign-in identity, only if that button is used | `oauth.native.ts:54-60` |
| **TheMealDB** | Recipe search/browse terms | `content/index.ts:14-15, 67` |
| **USDA FoodData Central** | Ingredient names the local table missed | `resolve-nutrition/index.ts:90, 129-141` |

---

## 2. Disagreements with `PRIVACY_POLICY.md`

Ordered worst-first. **"Under-disclosure"** = the code collects or sends more than the policy admits;
that is the direction that gets an app rejected and a policy called untrue.

### D1 — UNDER-DISCLOSURE (serious). Anthropic is not in the policy at all.
Policy §4 lists exactly four recipients: Supabase, Railway, the sign-in providers, TheMealDB. It
never names an AI vendor, and §1 never says user text or photos are sent to one.

The code sends to `https://api.anthropic.com/v1/messages`:
- every chat turn the user types — `generate-recipe/index.ts:340-375` → `:176-192`;
- any block of text pasted into "paste a recipe" — `AddSheet.tsx:87-100` → `index.ts:404-413`;
- **the raw bytes of any photo** used for recipe import — `AddSheet.tsx:105-118` → `index.ts:386-392`;
- every ingredient name the local nutrition table misses — `resolve-nutrition/index.ts:172-176`.

Policy §2's "we do not use your information for advertising" is true and irrelevant here; the missing
sentence is "we send what you type and the photos you import to Anthropic to generate results". This
must be fixed in the policy **and** declared as a third-party recipient in App Privacy.

### D2 — UNDER-DISCLOSURE (serious). RevenueCat is not in the policy at all.
Policy §1(b): "The App does **not** include third-party advertising or analytics SDKs." Literally
true (RevenueCat is neither), but §4's list of service providers omits RevenueCat while the app
configures the SDK on every launch (`app/_layout.tsx:29`) and hands it the Supabase user UUID
(`AuthProvider.tsx:63`). Purchase history is stored server-side in `public.memberships`
(`20260723150000_memberships.sql:7-13`), which no section of the policy mentions.
Also: §7's deletion promise says account deletion removes "recipes, meal plans, and favorites" — the
RevenueCat-side subscriber record is not addressed at all.

### D3 — UNDER-DISCLOSURE (serious). "Recipe photos" are omitted, and they live in a **public** bucket.
Policy §1(a) enumerates content as "Recipes you save or import, meal plans, and shopping list items".
Photos are named only in §1(c), and only to say journal photos stay on-device — which is true
(`useJournal.ts:42-55`). But there is a **second, uploaded** photo path the policy never mentions:
`EditRecipeScreen.tsx:169-176` → `import.queries.ts:131-157` → the `recipe-photos` bucket, created
`public` at `20260721090010_storage_policies.sql:19-21`. A reader of §1(c) would reasonably conclude
Otto does not upload photos. It does, and they are served by unauthenticated URL.
The path is `<uid>/<epoch_ms>.<ext>` (`import.queries.ts:148`) — not a CSPRNG token like share links
(`src/features/share/token.ts:3`), so it is guessable-by-brute-force to anyone who knows a uid, and
§6's "designed to be hard to guess" reasoning does not apply to it.

### D4 — UNDER-DISCLOSURE (serious, and this is the classic App Privacy label mistake).
Speech recognition is **server-side, not on-device**, and the policy is silent on voice entirely.
`useSpeechInput.ts:1-2` claims "On-device STT via expo-speech-recognition" — **the code comment is
wrong**. `:90` starts recognition without `requiresOnDeviceRecognition`, which defaults to `false`
(`expo-speech-recognition/ios/SpeechRecognitionOptions.swift:21`) and is assigned verbatim to the
`SFSpeechRecognitionRequest` (`ios/ExpoSpeechRecognizer.swift:580`). `app.json:46-52` sets nothing
either. Result: **the user's audio is streamed to Apple's speech servers.** Otto never receives the
audio, only the transcript, so this is arguably not "collected by the developer" — but it is a
disclosure the policy owes the user, and the code comment must stop asserting the opposite.
Cheapest real fix (out of scope for this audit pass): pass `requiresOnDeviceRecognition: true` on
iOS and make the comment true.

### D5 — UNDER-DISCLOSURE (potentially serious; needs one test to settle). Photo location metadata.
Policy has no Location section at all — correct in the sense that Otto never asks for location
permission and imports no geolocation API. But Otto strips nothing from uploaded photos
(`import.queries.ts:110-125, 150-152`), and expo-image-picker returns **the original file bytes
untouched** for HEIC/TIFF/AVIF/WebP/BMP library picks even at `quality: 0.7`
(`node_modules/expo-image-picker/ios/ImageUtils.swift:145-150`; slow path `MediaHandler.swift:177-198`).
iPhone camera-roll photos are HEIC, and `uploadRecipePhoto` explicitly handles a `heic` extension
(`import.queries.ts:144-147`). Camera captures and JPEG/PNG picks *are* re-encoded and lose EXIF
(`ImageUtils.swift:107, 129`).
**UNKNOWN:** whether iOS's PHPicker hands the app GPS tags at all under
`preferredAssetRepresentationMode = .current` (`ios/ImagePickerOptions.swift:44`).
**What settles it:** take a geotagged HEIC, add it as a recipe photo, `curl` the resulting public
URL and run `exiftool -gps:all -a` on it. If GPS survives, Otto is publishing **Precise Location**
from a public bucket and both the label and the policy are wrong; the fix is a strip-on-upload.

### D6 — UNDER-DISCLOSURE (moderate). USDA is not in the policy, and the ingredient cache is global and permanent.
Policy §4 does not list USDA FoodData Central, which receives user-typed ingredient names
(`resolve-nutrition/index.ts:129-141`). Worse for §7: those names are upserted into
`public.resolved_ingredients` (`:238-243`), a table readable by **anon** (`…090008:17-19`), and
`admin_delete_user_data` does not delete from it (`…090009:182-203`). A user who typed a personal or
identifying ingredient name has created a permanent, world-readable, undeletable row. Low volume and
low sensitivity in practice, but §7's deletion promise does not cover it and §4 does not name the
vendor.

### D7 — THE POLICY IS WRONG. Railway is not a service provider.
Policy §4: "**Hosting/backend provider (Railway).** Runs our server that the App talks to." There is
no Railway anywhere in the codebase — the app talks only to Supabase (`src/shared/supabase/client.ts:28-39`)
and its edge functions. `docs/reference/FRAMEWORK.md:158` records the v2 rewrite as "drizzle/railway
gone". Naming a processor that does not process anything is a straightforward factual error; delete it.

### D8 — THE POLICY IS WRONG (contact address). `hello@ottosapp.com` is not one of the real mailboxes.
The policy directs users to `hello@ottosapp.com` in §1(f), §7, §8, §11 and §13. The confirmed
addresses are `juandiego@`, `info@`, `noreply@`, `support@` at ottosapp.com. The app itself uses
`juandiego@ottosapp.com` (`src/features/profile/ProfileScreen.tsx:38, 116, 334`). A GDPR/CCPA rights
address that bounces is a live compliance defect and it is also the address a reviewer may test.
Either create `hello@` or change the policy to `support@ottosapp.com`. The URLs in §*"App/Website"*
(`https://ottosapp.com`, `/privacy`, `/terms`) do match what the app links to
(`ProfileScreen.tsx:39-40`, `OttoClubScreen.tsx:30-31`) — that part is consistent.

### D9 — THE POLICY IS OPTIMISTIC (moderate). "Limited technical/diagnostic data" undersells search terms.
Policy §1(b) describes automatic collection as "a request's time and the operating system type" plus
error logs. Recipe searches are carried **in the URL query string** of an authenticated edge-function
call (`recipe.queries.ts:32-38`), so the platform request log plausibly holds `?s=<what the user
searched>` alongside the caller's token. Policy §3 promises only that browsing isn't used for ad
profiling — it does not admit the term is logged at all.
**What settles it:** inspect Supabase Edge Function logs for a `content/search.php?s=` request and
confirm whether the query string and caller identity are retained, and the retention window.

### D10 — Small factual gaps (over-disclosure or harmless, listed for completeness)
- §1(c)'s on-device list ("journal photos, food preferences, reminder settings, onboarding state") is
  **incomplete but in the safe direction**: chat transcripts, cook ratings, shopping check-state,
  unit system, sound setting and the household cache are also device-only
  (`src/shared/storage.ts:8-20`). Nothing is wrongly claimed as collected.
- §1(a) says a provider identifier is received. True, and Supabase also stores whatever profile
  metadata the provider returns (name, avatar URL) in `auth.users`. Otto's code never reads an
  avatar (grep: no `avatar_url` usage), but it is stored. **UNKNOWN which fields land per provider;**
  settles by reading one real `auth.users.raw_user_meta_data` row per provider.
- §6 "Collaborative shopping lists … the first names/labels" is accurate — `collab_items.added_by_name`
  / `checked_by_name` (`…090009:110-112, 140-141`), capped at 40 chars (`:99, :129`).
- §7 "content you chose to share may persist" is accurate and honest: `admin_delete_user_data` deletes
  the user's own shares and owned collab lists (`…090009:194-201`) but not items they added to
  someone else's list. Households and memberships are covered by `ON DELETE CASCADE` on `auth.users`
  (`20260722120000:7, 13`; `20260723150000:8`) plus the auth-user delete at
  `delete-account/index.ts:68` — the policy's silence on households is a gap, not an error.
- §1(d) describes Vercel Web Analytics on the marketing site. Out of scope for this audit — nothing
  in this repo serves the site — but note the app-side claim "no analytics of any kind inside the App
  itself" is **verified true** (row 20).

---

## 3. What A2 still needs before the label can be called finished

1. Run the EXIF test in **D5**. It is the only row that can change from "no location" to "precise
   location", and it takes five minutes.
2. Read the Supabase edge-function logs once for **D9** (search terms) and once for **row 20**
   (what platform logs retain).
3. Get RevenueCat's SDK data-collection disclosure for the pinned version — **row 4** is the one row
   where our code genuinely cannot answer.
4. Confirm one `auth.users.raw_user_meta_data` row per provider — **D10**, to know whether "Name"
   and an avatar URL are stored for Google/Facebook sign-ins.
5. Then, in a *separate* pass (not this one): fix the policy for D1-D4 and D6-D8, and fix the
   `useSpeechInput.ts:1-2` comment, which currently states the opposite of what the code does.

**Note for B1/B3 of the ticket:** adding Sentry or any analytics SDK invalidates rows 20 and the
"no third-party analytics" claim in policy §1(b) and §2 in the same commit.
