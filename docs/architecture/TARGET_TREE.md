# Otto — target file tree

Status: draft · Last verified against code at commit ecf2d46b · 2026-11-06

Every file and folder the reworked app will have, marked against today.
Planning only: the tickets (`docs/tickets/REWORK_ROADMAP.md`) decide the order.

## How the rework treats files

Rework in place, not a parallel rewrite:

1. **Same job → keep the file, rewrite what it holds.** Routes are file paths
   (expo-router), other code imports them, and the tests pin their behaviour.
   Keeping the path keeps all three.
2. **New idea → new file.** For example: actions, the yield model, the
   free-list plan, scan-meal.
3. **Idea replaced → new file, and the old one deleted in the same change.**
   No `*V2` copies left alive. For example: Welcome replaces the onboarding
   carousel, Home replaces Discover, the Otto tab replaces the ＋ tab.
4. **Old and new side by side only behind `flags.flowV2`**, and only until the
   flag is turned on (R10.1). The change that turns it on deletes the old path.

Legend: ✅ have, keep · ✏️ have, changing · 🆕 new · 🗑️ removing.
`done` = already built on `claude/new-session-izhr2i`; everything else is planned.

```
Recipe-App/
├── app/                                   routes (one screen per file, ~10 lines each)
│   ├── _layout.tsx                        ✏️ launch state machine, new route groups (R0.1, R1.7)
│   ├── index.tsx                          ✏️ reads resolveLaunch (R0.1)
│   ├── onboarding.tsx                     🗑️ the 3-painting carousel (R1.2, R9.4)
│   ├── welcome.tsx                        🆕 one screen: Get started · I have an account (R1.2)
│   ├── about/[step].tsx                   🆕 the three questions (R1.3)
│   ├── first-week.tsx                     🆕 week preview, tonight first (R1.4)
│   ├── search.tsx                         🆕 search pushed from Home (R3.3)
│   ├── add.tsx                            ✏️ ways in: Snap a meal · Write or paste · Say it · editor (R6.2) · done (first pass)
│   ├── (auth)/
│   │   ├── _layout.tsx                    ✅
│   │   ├── sign-in.tsx                    ✅
│   │   ├── sign-up.tsx                    ✏️ becomes "Save your plan" (R1.5)
│   │   └── forgot-password.tsx            ✅
│   ├── (tabs)/
│   │   ├── _layout.tsx                    ✏️ Home · Plan · Cookbook · Account + Otto circle (R3.1)
│   │   ├── index.tsx                      ✏️ Home: Tonight · This week · Discover (R3.2)
│   │   ├── plan.tsx                       ✏️ week + free day lists + Shopping segment (R4.1, R4.5)
│   │   ├── cookbook.tsx                   ✅
│   │   ├── profile.tsx                    🗑️ renamed ↓
│   │   ├── account.tsx                    🆕 Account tab (was profile.tsx) (ADR-0008)
│   │   ├── create.tsx                     🗑️ the ＋ tab (R3.4)
│   │   └── otto.tsx                       🆕 Otto AI as a tab root (R3.4)
│   ├── club/
│   │   ├── pending.tsx                    🆕 Ask to Buy / waiting (R2.2)
│   │   ├── welcome.tsx                    🆕 "You're all set" (R2.4)
│   │   └── ended.tsx                      🆕 Club ended, everything still here (R2.6)
│   ├── r/[slug].tsx                       🆕 shared recipe link (R8.1)
│   ├── l/[token].tsx                      🆕 shared list link (R8.1)
│   ├── privacy.tsx                        🆕 Privacy & data (R7.4)
│   ├── delete-account.tsx                 🆕 delete flow (R7.5)
│   ├── otto-club.tsx                      ✏️ Membership: renewal, manage, refund (R7.1)
│   ├── preferences.tsx                    ✏️ the 3 questions, editable (R7.2)
│   ├── recipe/
│   │   ├── [id].tsx                       ✏️ add to plan with a date, not-found state (R5.1, R5.5)
│   │   ├── cook/[id].tsx                  ✏️ mise en place, Dinner done (R5.2, R5.4)
│   │   └── edit.tsx                       ✏️ dynamic editor (R6.7) · done: Makes / Served as
│   ├── auth/callback.tsx                  ✅
│   ├── change-password.tsx                ✅
│   ├── reset-password.tsx                 ✅
│   ├── chats.tsx                          ✅ Otto history
│   ├── faq.tsx                            ✅
│   ├── household.tsx                      ✅
│   ├── journal.tsx                        ✅
│   ├── notifications.tsx                  ✅
│   └── shopping.tsx                       ✅ stays as a deep link target
│
├── src/
│   ├── catalogue/                         🆕 done — every action, bound to its runner (R0.9)
│   │   ├── specs.ts                       🆕 done
│   │   ├── index.ts                       🆕 done
│   │   ├── claimDraft.ts · DraftClaim.tsx 🆕 done — the pre-account week onto the account (R0.3)
│   │   └── catalogue.test.mjs             🆕 done
│   │
│   ├── shared/
│   │   ├── actions/action.ts (+test)      🆕 done — spec, runner, dispatch, undo, tool manifest
│   │   ├── supabase/
│   │   │   ├── client.ts                  ✅
│   │   │   └── rows.ts (+test)            🆕 done — a write that matched no row is an error
│   │   ├── speech/                        🆕 done — moved from chat; used by chat and Add
│   │   ├── flags.ts                       🆕 done — flowV2
│   │   ├── yield.ts (+test)               🆕 done — yield · servings · portion
│   │   ├── allergens.ts (+test via firstWeek) 🆕 done — keyword allergens + diet fit
│   │   ├── intent.ts                      🆕 pending link after sign-in / purchase (R0.2)
│   │   ├── events.ts                      🆕 tracking plan events (R0.8)
│   │   ├── storage.ts                     ✏️ new kv keys (draft, intent, last tab)
│   │   ├── assets.ts                      ✏️ asset batch 1 (D1.9)
│   │   ├── imagePicker.ts                 ✏️ camera primer first (R6.3)
│   │   ├── theme/tokens.ts (+test)        ✏️ token sync with Figma, body 17 (D0.3, G19)
│   │   ├── ui/
│   │   │   ├── Bounceable · Button · ErrorBoundary · Input · OttoArt · OttoIdle
│   │   │   │   OttoStates · PawMark · Ring · Screen · SegmentBar · Sheet · Text
│   │   │   │   TextLink · Toast · AiConsentHost · index.ts           ✅
│   │   │   ├── OfflineBanner.tsx          ✏️ becomes Banner (offline, payment problem) (D1.7)
│   │   │   ├── TabBarCreateButton.tsx     🗑️ the ＋ tab (R3.4)
│   │   │   ├── TabBarOttoButton.tsx       🆕 the Otto circle (D1.1)
│   │   │   ├── Chip.tsx                   🆕 labels, "Otto sees", filters (D1.11, D1.12)
│   │   │   ├── WeekStrip.tsx              🆕 real dates, tonight first (D1.4)
│   │   │   └── AiImageTag.tsx             🆕 "AI image" tag (D1.13)
│   │   ├── lib/ (fdaCalories, format)     ✅
│   │   └── actionSheet · aiConsent* · bus · haptics · motion · online
│   │       recentSearches · sound · vocabulary.guard.test             ✅
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx           ✏️ claims the onboarding draft after sign-up (R0.3)
│   │   │   ├── SignUpScreen.tsx           ✏️ Save your plan (R1.5)
│   │   │   └── everything else            ✅
│   │   ├── onboarding/
│   │   │   ├── OnboardingScreen.tsx       🗑️ carousel (R1.2)
│   │   │   ├── Splash.tsx                 🗑️ logo splash (R1.1)
│   │   │   ├── WelcomeScreen.tsx          🆕 (R1.2)
│   │   │   ├── QuestionScreen.tsx         🆕 (R1.3)
│   │   │   ├── FirstWeekScreen.tsx        🆕 (R1.4)
│   │   │   ├── launch.ts (+test)          🆕 done — resolveLaunch, replaces gate.ts (R0.1)
│   │   │   ├── gate.ts (+test)            🗑️ done — replaced by launch.ts
│   │   │   ├── onboarding.draft.ts (+test)🆕 done — answers + week before the account (R0.3)
│   │   │   ├── useDraft.ts                🆕 done
│   │   │   ├── firstWeek.ts (+test)       🆕 done — buildFirstWeek (R0.6)
│   │   │   └── useOnboarded.ts, index.ts  ✅
│   │   ├── home/                          🆕 the Home tab (R3.2)
│   │   │   ├── HomeScreen.tsx             🆕 Tonight · This week · Discover
│   │   │   ├── components/TonightCard.tsx 🆕 Start cooking · Cooked it · Swap (D1.2, R5.6)
│   │   │   └── index.ts                   🆕
│   │   ├── recipes/
│   │   │   ├── DiscoverScreen.tsx         🗑️ its sections move to Home (R3.2)
│   │   │   ├── SearchScreen.tsx           🆕 (R3.3)
│   │   │   ├── RecipeDetailScreen.tsx     ✏️ (R5.1, R5.5)
│   │   │   └── everything else            ✅
│   │   ├── planner/
│   │   │   ├── PlanScreen.tsx             ✏️ week view, free lists, dish actions (R4.1–R4.4) · done: labels
│   │   │   ├── ShoppingScreen.tsx         ✏️ becomes a Plan segment (R4.5) · done: store
│   │   │   ├── components/
│   │   │   │   ├── DishActionsSheet.tsx   🆕 cooked · swap · move · leftovers · remove (R4.2)
│   │   │   │   ├── RecipePickerSheet.tsx  ✏️ Pick a meal: Saved · Discover · Ask Otto (R4.3)
│   │   │   │   └── HoldToRemoveRow.tsx    ✅
│   │   │   ├── plan.actions.ts            🆕 done
│   │   │   ├── plan.list.ts (+test)       🆕 done — free list order, labels, leftovers
│   │   │   ├── shopping.actions.ts        🆕 done
│   │   │   ├── shopping.local.ts (+test)  🆕 done
│   │   │   ├── shopping.store.ts          🆕 done (moves to server state in R0.11)
│   │   │   ├── plan.queries.ts            ✏️ done — runners, one-write swap, move, label
│   │   │   ├── usePlan.ts                 ✏️ done
│   │   │   ├── plan.types.ts              ✏️ done
│   │   │   ├── plan.pick.ts (+test)       ✏️ done — leftovers kind, dinner label
│   │   │   └── shoppingList.ts · week.ts (+tests) · index.ts             ✅
│   │   ├── cook/
│   │   │   ├── CookScreen.tsx             ✏️ mise en place, Dinner done (R5.2, R5.4)
│   │   │   ├── components/MiseEnPlace.tsx 🆕 (R5.2)
│   │   │   └── everything else            ✅
│   │   ├── cookbook/
│   │   │   ├── CookbookScreen.tsx         ✏️ Saved · Mine · Cooked (R6.1)
│   │   │   ├── saved.actions.ts           🆕 done
│   │   │   ├── saved.queries.ts           ✏️ done
│   │   │   ├── useSaved.ts                ✏️ done
│   │   │   └── everything else            ✅
│   │   ├── import/
│   │   │   ├── AddSheet.tsx               ✏️ done (first pass) — Snap a meal, Say it
│   │   │   ├── EditRecipeScreen.tsx       ✏️ done (first pass) — dynamic editor next (R6.7)
│   │   │   ├── components/
│   │   │   │   ├── SnapSummary.tsx        🆕 done — what Otto saw, questions, checks
│   │   │   │   ├── CameraPrimer.tsx       🆕 (R6.3)
│   │   │   │   └── RecipeInput.tsx        ✅
│   │   │   ├── recipe.actions.ts          🆕 done
│   │   │   ├── draft.ts (+test)           ✏️ done — recipe size, snap info
│   │   │   ├── import.queries.ts          ✏️ done — scanMeal; legacy photo path deleted at R10.1
│   │   │   └── save.compute.ts (+tests), index.ts                        ✅
│   │   ├── chat/                          the Otto AI tab
│   │   │   ├── ChatScreen.tsx             ✏️ tab root, answer cards (R3.4, D3.1)
│   │   │   ├── useChat.ts                 ✏️ runs tool calls through the catalogue
│   │   │   ├── agent.ts (+test)           🆕 tool call → dispatch → receipt + Undo (1.3)
│   │   │   ├── components/AnswerCard.tsx  🆕 week, recipe, list change, "Otto did · Undo" (D3.1)
│   │   │   └── everything else            ✅
│   │   ├── household/
│   │   │   ├── household.actions.ts       🆕 done
│   │   │   ├── household.queries.ts       ✏️ done
│   │   │   ├── useHousehold.ts            ✏️ done
│   │   │   └── index.ts                   ✅
│   │   ├── profile/                       the Account tab
│   │   │   ├── ProfileScreen.tsx          ✏️ renamed AccountScreen.tsx
│   │   │   ├── OttoClubScreen.tsx         ✏️ Membership (R7.1)
│   │   │   ├── PreferencesScreen.tsx      ✏️ the 3 questions (R7.2)
│   │   │   ├── PrivacyScreen.tsx          🆕 (R7.4)
│   │   │   ├── DeleteAccountScreen.tsx    🆕 (R7.5)
│   │   │   ├── ClubPendingScreen.tsx      🆕 (R2.2)
│   │   │   ├── ClubWelcomeScreen.tsx      🆕 (R2.4)
│   │   │   ├── ClubEndedScreen.tsx        🆕 (R2.6)
│   │   │   ├── profile.prefs.ts (+test)   ✏️ done — household, diet, allergies, skips (R0.5)
│   │   │   ├── profile.queries.ts, usePrefs.ts  ✏️ prefs on the account (R0.4)
│   │   │   ├── club.purchases.ts          ✏️ refund request (R7.1)
│   │   │   └── everything else            ✅
│   │   ├── share/
│   │   │   ├── SharedRecipeScreen.tsx     🆕 (R8.1)
│   │   │   ├── SharedListScreen.tsx       🆕 (R8.1)
│   │   │   └── everything else            ✅
│   │   ├── notifications/
│   │   │   ├── NotifSync.tsx              ✏️ trial reminder, taps open the right screen (R2.8, R8.2)
│   │   │   └── everything else            ✅
│   │   ├── journal/                       ✅
│   │   └── nutrition/ (engine frozen)     ✅
│   │
│   └── types/
│       ├── database.ts                    ✏️ done — regenerated after each migration
│       └── ids.ts                         ✅
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── http.ts                    ✏️ durable rate limiter (R0.12)
│   │   │   ├── image.ts                   🆕 done
│   │   │   ├── actions.json               🆕 done — generated tool list
│   │   │   ├── device.ts                  🆕 App Attest / DeviceCheck (R0.16)
│   │   │   └── membership.ts, openai.ts   ✅
│   │   ├── scan-meal/                     🆕 done — index, scan.ts, tests, fixtures (not deployed)
│   │   ├── generate-recipe/
│   │   │   ├── imageMode.ts (+test)       🗑️ recipe-page transcription (R6.6)
│   │   │   ├── index.ts                   ✏️ drops the page-photo mode (R6.6)
│   │   │   └── streamParse.ts (+test)     ✅
│   │   ├── otto-agent/                    🆕 Otto AI with tools from actions.json (1.3)
│   │   ├── recipe-image/                  🆕 photoreal image, generated once (R0.15)
│   │   ├── export-data/                   🆕 Download my data (R7.4)
│   │   ├── calendar-feed/                 🆕 ICS feed of the plan (R7.7)
│   │   ├── import-recipe/                 ✅ Paste a link (Juan to decide)
│   │   ├── canonicalize/                  🗑️ retire (A1, needs Juan)
│   │   ├── revenuecat-webhook/            ✏️ timeout (A4)
│   │   └── content/ · delete-account/ · resolve-nutrition/   ✅
│   └── migrations/
│       ├── 26 applied migrations          ✅
│       ├── …120000_recipe_size.sql        🆕 done — not applied
│       ├── …130000_plan_list.sql          🆕 done — not applied
│       └── planned                        🆕 profiles (R0.4) · app_events (R0.8) · solo shopping list (R0.11)
│                                             rate_limits (R0.12) · agent_actions + AI consent (R0.13)
│                                             cook times (R0.14) · recipe images (R0.15) · scan quota (R0.16)
│
├── tools/
│   ├── actions-manifest.mjs               🆕 done
│   └── nutrition-breakdown.mjs            ✅
├── assets/                                ✏️ asset batch 1, launch shell without art (D1.9, R1.1)
├── e2e/ · test/                           ✏️ a journey per new screen
└── docs/                                  ✏️ each change updates the doc that describes it
```
