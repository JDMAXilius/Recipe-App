# Otto final screens (build spec)

Written 2026-11-04. Figma: **Otto — App Redesign** (`r9QxxN5qDQXjW473H7LKgM`), pages **"Final · 00 Index — build spec"** to **"Final · 10 System states"**.
These are the screens to build during the UI/UX roadmap. Older pages (Review · 00–15, v4 · First draft, v3, Concepts) were not changed and stay as history.

**128 screens: 49 NEW · 77 CHANGED · 2 SAME** (+ 5 shipped screens kept as is, no new design).

## Decisions these screens follow (Juan, 2026-11-04)

1. **Magic moment** ([MAGIC_MOMENT.md](MAGIC_MOMENT.md)): the recipes you already saved become this week's dinners for your household, with the list done, before the account and the paywall.
2. **Onboarding order:** Welcome → share a recipe you saved (optional: "Not now, Otto will pick") → Otto reads it → 3 questions → your first week → one swap → your list → Save your week (account, Sign in with Apple first) → Otto Club → Welcome to the Club → reminders → Today.
3. **3 questions:** who's eating · anything off the table (diet + allergies + dislikes, allergies kept separate with the safety note) · weeknight time. Taste and "what matters most" live in Account › Food preferences.
4. **Paywall hard** (no close), **7-day trial on Yearly and Monthly**, billed amount biggest, dated trial terms, Restore, Terms, Privacy, Sign out · Delete account. Shows "Your week is saved · 5 dinners · 23 items".
5. **Tabs:** Today · Plan · Recipes · Shopping + the round Ask Otto button. Account from the avatar on Today. No ＋ tab; ＋ "Bring in a recipe" sits in the Recipes nav bar.
6. One search across Discover + Cookbook · AI consent at first send (names OpenAI) · "Add to this week" = next open dinner + Undo · the building screen only while the real plan call runs · sign-out says chats and journal leave this phone (S9).

## Legend

- **NEW**: not in today's app. **CHANGED**: the app has it, build this design. **SAME**: keep the shipped screen (system sheets/alerts, or restyle only).
- Status was checked against the shipped code (`src/features/*`): chat, inline search, import states, plan swap/leftovers/add already exist, so they are CHANGED.
- Fictional data everywhere: household Juan, Ana, Leo (2 adults + 1 kid); first week Wed 4 – Sun 8 Nov 2026: honey teriyaki salmon (From your TikTok), shakshuka with spinach, beef tacos, teriyaki chicken casserole, sesame spinach noodles; 23 list items; $39.99/year, $4.99/month.

## Screens

### Final · 01 Getting in

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F01.01 | Launch screen | CHANGED | app.json splash → app/welcome.tsx | 139:1473 (v4) |
| F01.02 | Welcome | CHANGED | app/welcome.tsx (replaces app/onboarding) | 174:889 |
| F01.03 | Share a recipe you saved | NEW | app/about/recipe.tsx | 162:889 (+ nav 172:894) |
| F01.04 | Link pasted | NEW | app/about/recipe.tsx (AI consent at first send) | 162:947 |
| F01.05 | Otto reads it | NEW | app/about/recipe.tsx (reading) | 162:1005 |
| F01.06 | Got your recipe | NEW | app/about/recipe.tsx (result) | 162:1005 (+ art 174:913) |
| F01.07 | Couldn't read it | NEW | app/about/recipe.tsx (error, keeps going) | 162:1266 |
| F01.08 | Who's eating | NEW | app/about/[step].tsx 1/3 | 172:889 |
| F01.09 | Anything off the table | NEW | app/about/[step].tsx 2/3 | 172:1005 + 172:1035/1095/1096 |
| F01.10 | Weeknight time | NEW | app/about/[step].tsx 3/3 | 172:1126 |
| F01.11 | Building your week | NEW | app/first-week.tsx (building) | 174:906 |
| F01.12 | Your first week | NEW | app/first-week.tsx (reveal) | 174:948 |
| F01.13 | Swap a dish | NEW | sheet on app/first-week.tsx | 174:948 + sheet 169:1250 |
| F01.14 | Swapped | NEW | app/first-week.tsx (Undo toast) | 174:948 |
| F01.15 | Your list | NEW | app/first-week.tsx (list step) | 170:1249 (+ 174:953, 174:1016) |
| F01.16 | Couldn't build | NEW | app/first-week.tsx (error) | 174:1023 |
| F01.17 | Save your week | CHANGED | app/(auth)/sign-up.tsx | 176:1053 |
| F01.18 | Save with email | CHANGED | app/(auth)/sign-up.tsx (email) | 176:889 |
| F01.19 | Save your week, offline | NEW | app/(auth)/sign-up.tsx (offline) | 176:1053 |
| F01.20 | Sign in | CHANGED | app/(auth)/sign-in.tsx | 176:926 |
| F01.21 | Wrong password | CHANGED | app/(auth)/sign-in.tsx (inline error) | 176:964 |
| F01.22 | Reset password | CHANGED | app/(auth)/forgot-password.tsx | 176:1021 |
| F01.23 | Check your inbox | CHANGED | app/(auth)/forgot-password.tsx (sent) | 176:1037 |
| F01.24 | Otto Club · Yearly | CHANGED | app/otto-club.tsx | 178:889 |
| F01.25 | Otto Club · Monthly | CHANGED | app/otto-club.tsx (Monthly) | 178:973 |
| F01.26 | Apple purchase sheet | SAME | system sheet over app/otto-club.tsx | 141:3917 (v4) |
| F01.27 | Welcome to the Club | NEW | app/club/welcome.tsx | 178:1057 |
| F01.28 | Purchase cancelled | CHANGED | app/otto-club.tsx (silent) | 178:1075 |
| F01.29 | Purchase failed | CHANGED | alert on app/otto-club.tsx | 178:1159 |
| F01.30 | Waiting for approval | NEW | app/club/pending.tsx | 178:1255 |
| F01.31 | Purchases restored | CHANGED | app/otto-club.tsx (restored) | 178:1283 |
| F01.32 | Nothing to restore | CHANGED | app/otto-club.tsx (nothing found) | 178:1300 |
| F01.33 | Reminders primer | NEW | app/about/reminders.tsx | 141:4271 (v4) |
| F01.34 | Notification permission | SAME | system alert | 141:4296 (v4) |
| F01.35 | Reminders, off | CHANGED | app/notifications.tsx (denied) | 141:4333 (v4) |
| F01.36 | Today, first evening | NEW | app/(tabs)/index.tsx (Today; spec on Final 02) | 151:207 |

### Final · 02 Today

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F02.01 | Today, first evening | NEW | app/(tabs)/index.tsx | 151:207 |
| F02.02 | Chat, from Today's idea | CHANGED | app/(tabs)/otto.tsx (question pre-asked) | 139:466 |
| F02.03 | Lock screen dinner reminder | NEW | system notification, otto://recipe/<id>?from=reminder | 141:2951 |
| F02.04 | Recipe, opened from the reminder | CHANGED | app/recipe/[id].tsx on Today stack | 141:2978 |
| F02.05 | Lock screen reminder actions | NEW | notification category actions | 141:3047 |
| F02.06 | Today, after dinner | NEW | app/(tabs)/index.tsx | 151:421 |
| F02.07 | Today, nothing planned | NEW | app/(tabs)/index.tsx | 151:325 |
| F02.08 | Otto's pick for tonight | NEW | sheet on app/(tabs)/index.tsx | 139:576 |

### Final · 03 Plan

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F03.01 | Your first week | CHANGED | app/(tabs)/plan.tsx | 169:1697 |
| F03.02 | Week with open nights | CHANGED | app/(tabs)/plan.tsx | 169:889 |
| F03.03 | Add to an open day | CHANGED | sheet on app/(tabs)/plan.tsx | 169:1013 |
| F03.04 | Otto plans the open nights | NEW | app/plan/review.tsx (modal) | 169:1630 |
| F03.05 | Week filled, with Undo | CHANGED | app/(tabs)/plan.tsx | 169:1697 |
| F03.06 | Swap a dish | CHANGED | sheet on app/(tabs)/plan.tsx | 169:1182 |
| F03.07 | Dish actions | CHANGED | sheet on app/(tabs)/plan.tsx | 169:1342 |
| F03.08 | Leftovers tomorrow | CHANGED | app/(tabs)/plan.tsx | 169:1503 |

### Final · 04 Shopping

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F04.01 | Share with household | CHANGED | sheet on app/(tabs)/shopping.tsx | 170:1086 |
| F04.02 | The list, live while Ana shops | CHANGED | app/(tabs)/shopping.tsx | 170:1249 |
| F04.03 | Offline list | NEW | app/(tabs)/shopping.tsx | 170:1495 |
| F04.04 | Always have | NEW | app/shopping/staples.tsx | 170:1387 |
| F04.05 | Empty list | CHANGED | app/(tabs)/shopping.tsx | 170:889 |
| F04.06 | Add the week to your list | NEW | sheet on app/(tabs)/shopping.tsx | 170:975 |

### Final · 05 Recipes & Search

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F05.01 | Recipes, Discover | CHANGED | app/(tabs)/recipes.tsx (Discover segment) | 155:207 |
| F05.02 | Recipes, Cookbook | CHANGED | app/(tabs)/recipes.tsx (Cookbook segment) | 155:326 |
| F05.03 | Cookbook empty | CHANGED | app/(tabs)/recipes.tsx | 155:452 |
| F05.04 | Filter recipes | NEW | sheet on app/(tabs)/recipes.tsx | 170:2491 |
| F05.05 | Search | CHANGED | app/search.tsx | 170:2213 |
| F05.06 | Recent searches cleared | NEW | app/search.tsx | 170:2310 |
| F05.07 | Search results | CHANGED | app/search.tsx | 170:2406 |
| F05.08 | No matching recipes | CHANGED | app/search.tsx | 170:2645 |
| F05.09 | Search by voice | NEW | app/search.tsx | 170:2704 |

### Final · 06 Create a recipe

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F06.01 | Bring in a recipe | CHANGED | app/add.tsx (sheet from ＋ on Recipes) | 162:889 |
| F06.02 | Link pasted | CHANGED | app/add.tsx | 162:947 |
| F06.03 | Otto's reading | CHANGED | app/add.tsx | 162:1005 |
| F06.04 | Check it, then save | CHANGED | app/add/review.tsx | 162:1035 |
| F06.05 | Saved to Cookbook | CHANGED | app/add.tsx | 162:1153 |
| F06.06 | Write it yourself | CHANGED | app/recipe/edit.tsx | 162:1106 |
| F06.07 | Ask Otto to create one | CHANGED | app/add/otto.tsx | 143:1545 (v4) |
| F06.08 | Snap a cookbook page | CHANGED | app/add/photo.tsx | 162:1190 |
| F06.09 | Camera permission | NEW | system alert on app/add/photo.tsx | 142:972 (v4) |
| F06.10 | Camera is off | CHANGED | app/add/photo.tsx | 162:1224 |
| F06.11 | Couldn't read this photo | CHANGED | app/add/photo.tsx | 162:1266 |
| F06.12 | No recipe in the caption | NEW | app/add.tsx | 145:983 (v4, re-written) |
| F06.13 | Import limit reached | NEW | app/add.tsx | 145:983 (v4) |

### Final · 07 Recipe & Cook

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F07.01 | Recipe | CHANGED | app/recipe/[id].tsx | 167:889 |
| F07.02 | Added to this week | NEW | app/recipe/[id].tsx (toast + Undo) | 167:889 + toast |
| F07.03 | Change the day | NEW | sheet on app/recipe/[id].tsx | 167:1281 |
| F07.04 | Scale to your table | CHANGED | app/recipe/[id].tsx | 167:999 |
| F07.05 | Shopping updated | CHANGED | app/recipe/[id].tsx | 167:1428 |
| F07.06 | Method & nutrition | CHANGED | app/recipe/[id].tsx | 167:1122 |
| F07.07 | Recipe unavailable | CHANGED | app/recipe/[id].tsx | 167:1551 |
| F07.08 | Get ready | CHANGED | app/recipe/cook/[id].tsx | 172:1941 |
| F07.09 | Bake timer running | CHANGED | app/recipe/cook/[id].tsx | 172:2015 |
| F07.10 | Lock Screen timer | NEW | Live Activity (ActivityKit) | 141:4419 (v4) |
| F07.11 | Next step, timer stays | CHANGED | app/recipe/cook/[id].tsx | 172:2101 |
| F07.12 | Timer paused | CHANGED | app/recipe/cook/[id].tsx | 172:2179 |
| F07.13 | Leave cooking? | CHANGED | alert on app/recipe/cook/[id].tsx | 172:2267 |
| F07.14 | Dinner, done | CHANGED | app/recipe/cook/[id].tsx | 172:2361 |

### Final · 08 Ask Otto

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F08.01 | Ask Otto, starting point | CHANGED | app/(tabs)/otto.tsx | 172:2578 |
| F08.02 | AI consent, first send | CHANGED | sheet on app/(tabs)/otto.tsx | 172:2679 |
| F08.03 | AI declined, still useful | CHANGED | app/(tabs)/otto.tsx | 172:2810 |
| F08.04 | Otto is thinking | CHANGED | app/(tabs)/otto.tsx | 172:2923 |
| F08.05 | A recipe you can act on | CHANGED | app/(tabs)/otto.tsx | 172:3007 (button → "Add to this week") |
| F08.06 | Added to this week | NEW | app/(tabs)/otto.tsx | 172:3236 (v4 139:1226 copy) |
| F08.07 | Couldn't answer, retry | CHANGED | app/(tabs)/otto.tsx | 172:3345 |
| F08.08 | Microphone off | CHANGED | app/(tabs)/otto.tsx | 172:3436 |

### Final · 09 Account & Household

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F09.01 | Today, tap the avatar | CHANGED | app/(tabs)/index.tsx | 172:1328 (offline strip hidden) |
| F09.02 | Account | CHANGED | app/account.tsx (sheet; replaces app/(tabs)/profile) | 171:1461 |
| F09.03 | Food preferences | CHANGED | app/preferences.tsx | 171:1563 (+ Allergies group, + Taste & what matters most) |
| F09.04 | Notifications | CHANGED | app/notifications.tsx | 171:1636 |
| F09.05 | Otto Club membership | CHANGED | app/otto-club.tsx (member view) | 171:1745 |
| F09.06 | Privacy & AI, AI off | CHANGED | app/privacy.tsx | 171:1689 (OpenAI named, v4 140:1356 copy) |
| F09.07 | Household members | CHANGED | app/household.tsx | 171:1796 |
| F09.08 | Join a kitchen, wrong code | CHANGED | app/household.tsx (join; also app/l/[token].tsx) | 171:1848 |
| F09.09 | Leave the kitchen | CHANGED | action sheet on app/household.tsx | 171:1878 |
| F09.10 | Sign out | CHANGED | system alert on app/account.tsx | 171:1938 |
| F09.11 | Welcome, signed out | NEW | app/welcome.tsx | v4 141:1009 |
| F09.12 | Delete account | CHANGED | app/account/delete.tsx | 171:2051 |
| F09.13 | Delete, confirm | CHANGED | system alert on app/account/delete.tsx | 171:2105 |
| F09.14 | Account deleted | NEW | app/account/deleted.tsx | v4 141:1147 |

### Final · 10 System states

| ID | Screen | Status | Build target | Figma source |
|---|---|---|---|---|
| F10.01 | Today, offline | NEW | state on app/(tabs)/index.tsx | 172:1328 |
| F10.02 | Changes waiting to sync | NEW | state on app/(tabs)/index.tsx | 172:1429 |
| F10.03 | Can't connect | NEW | full state, any tab | 172:1530 |
| F10.04 | Today, billing problem | NEW | banner on app/(tabs)/index.tsx | 172:1573 |
| F10.05 | Billing update pending | NEW | banner on app/(tabs)/index.tsx | 172:1871 |
| F10.06 | Club ended | NEW | app/club/ended.tsx | 172:1635 (v4 141:3275 copy) |
| F10.07 | Paywall, returning member | CHANGED | app/otto-club.tsx (returning variant) | v4 141:3300 |
| F10.08 | Launch, returning member | CHANGED | LaunchScreen | v4 141:3341 |
| F10.09 | Shopping, where you left off | CHANGED | app/shopping.tsx (Shopping tab) | v4 141:3349 |
| F10.10 | What's new | NEW | sheet on app/(tabs)/index.tsx | 172:1660 |
| F10.11 | Camera off | NEW | state on app/add.tsx | 172:1787 |
| F10.12 | Cookbook, nothing saved | CHANGED | empty state on Recipes › Cookbook | 172:1829 |

### Shipped screens with no new design (SAME)

- Change password | SAME | app/change-password | Account › Juan (profile) row, email/password accounts only (hidden for Sign in with Apple)
- Reset password | SAME | app/reset-password | deep link from the reset email; started at app/(auth)/forgot-password (Welcome › I have an account › Forgot password)
- FAQ | SAME | app/faq | Account › Help & feedback
- Journal | SAME | app/journal | Recipes › Cookbook › Cooked (journal), plus "Add a note" after finishing Cook mode; leaves the phone on sign out (S9)
- Chats list | SAME | app/chats | Ask Otto › clock icon (top left); leaves the phone on sign out (S9)

## Duplicates (same screen drawn twice; build once)

- F10.11 Camera off = F06.10 Camera is off.
- F10.12 Cookbook, nothing saved = F05.03 Cookbook empty.
- F01.36 Today, first evening is a light copy; F02.01 is the spec.

## Where this disagrees with the roadmaps (they follow these screens once approved)

- `REWORK_ROADMAP.md` R4.5 puts Shopping inside Plan; the decision is **its own tab**.
- `REWORK_ROADMAP.md` R1.3 lists diet + allergies and "anything to skip" as separate questions; the final merges them into "Anything off the table" and adds weeknight time.
- `REWORK_ROADMAP.md` calls the first tab "Home"; the screens say **Today**.
- `REWORK_ROADMAP.md` R1.4 says "no building screen"; the final keeps one, only while the real plan call runs, with honest steps.
- The magic moment adds steps no roadmap has yet: share a recipe before the account (F01.03–F01.07), one swap (F01.13–F01.14), the list step (F01.15).

## Needs work outside the front end

- **Import before the account**: `import-recipe` requires a signed-in Club member (`requireClub`). F01.03–F01.07 need an anonymous allowance (1–2 imports, rate-limited, consent first).
- **Caption-less videos**: import reads the post caption only; F06.12 covers the failure honestly. Audio transcription is a later backend task.
- **Week before the account**: roadmap R0.3/R0.6 (draft on the phone, claimed at sign-up).
- **Live Activity, lock-screen reminder actions, widget**: native targets, need a native build.
- **Trial on Monthly**: App Store Connect must offer the 7-day introductory offer on the Monthly product too.
- **Proposed route names** (not in any roadmap yet): `app/about/recipe.tsx`, `app/about/reminders.tsx`, `app/add/review.tsx`, `app/add/photo.tsx`, `app/add/otto.tsx`, `app/plan/review.tsx`, `app/shopping/staples.tsx`, `app/account.tsx`, `app/account/delete.tsx`, `app/account/deleted.tsx`, `app/privacy.tsx`, `app/(tabs)/recipes.tsx`, `app/(tabs)/shopping.tsx`.

## Known design leftovers

- F01.26 Apple purchase sheet, F01.33–F01.34 reminder primer and system alert are v4 clones (system styling); restyle the primer to match the Review look when building.
- Three food photos are the closest available stand-ins (salmon hero upscaled from a thumbnail; tacos and noodles approximate). Replace with real photography before App Store screenshots.
