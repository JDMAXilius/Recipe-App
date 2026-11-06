# Tracking plan, North Star and activation

Status: current · Last verified against code 2026-11-06 · source: `docs/learning/reports/Otto magic moment research.md`. Built (R0.8): `app_events` table (applied), `src/shared/events.ts` (names + props, the code twin of the table below), `src/shared/track.ts` (phone queue, batch write). No analytics SDK.

## The three numbers

| Number | Definition | Why |
|---|---|---|
| **Magic moment 1** | `recipe_from_photo_saved` (after `dish_snapped`) | Snap any dish becomes a saved recipe (ADR-0013) |
| **Magic moment 2** | `week_planned_by_otto` committed, then a `item_cooked` from it | Otto plans your week and you cook from it |
| **Activation** | At least **one planned item cooked** within the 7-day trial (`item_cooked` with `source=plan`) | Cooking something you planned is the promise kept. The threshold of 1 is a starting guess; test 2 and 3 once data exists |
| **North Star** | **Planned items cooked per active Otto Club household per week** | Grows only when Otto keeps answering dinner and people act on it; can't be gamed by opens or chats |

Guardrails: trial → paid (RevenueCat), refund rate, uninstall within 24 h, AI cost per active household.

## Where the data comes from (no SDK)
- **Money:** RevenueCat cohorts (install → trial → paid, renewals, refunds). Already live.
- **Behaviour:** a first-party Supabase table `app_events(id, user_id null, device_id, name, props jsonb, app_version, created_at)` with RLS insert-own, no select for clients. Onboarding events happen before the account: buffer them on the phone and write them, tagged with the new `user_id`, right after Save your plan; drop the buffer if the person never signs up.
- **Privacy:** adding this changes the App Privacy answers ("Product interaction", linked to the user, not used for tracking). Update `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` before the build ships (it is already marked *needs re-audit*).

## Events (object_action, snake_case props)

| Event | When | Props |
|---|---|---|
| `onboarding_started` | Welcome shown on a fresh install | `variant` |
| `question_answered` | Each of the 3 questions, answered or skipped | `step` (1–3), `skipped` |
| `dish_snapped` | A photo is analysed | `ok`, `matched_catalogue`, `questions_asked`, `before_account` |
| `recipe_from_photo_saved` | The recipe from a photo is saved | `edited` |
| `week_planned_by_otto` | An Otto week preview is committed | `items`, `new_recipes`, `constraints` |
| `first_week_revealed` | The reveal renders with a Tonight card | `ms_since_launch`, `household_size`, `filters_count`, `dinners` |
| `day_swapped` | A day is swapped, on the reveal or in Plan | `day_offset`, `surface` (`reveal` \| `plan` \| `otto`) |
| `shopping_list_opened` | List opened | `surface`, `items` |
| `plan_saved` | An account is created (Save your plan, or today's sign-up door) | `method` (`apple` \| `google` \| `facebook` \| `email`) |
| `paywall_viewed` | Paywall shown | `variant` (`generic` \| `your_week`): what was SHOWN; `assigned` (same values, rework build): the account's arm, 50/50 by `paywallVariant`. **Analyse by `assigned`** (intent to treat): an assigned `your_week` with an empty week is shown `generic` |
| `purchase_result` | Every purchase attempt, from `BuyResult` (one event; `result=ok` is the trial start) | `product`, `result` (`ok` \| `pending` \| `cancelled` \| `error` \| `unconfirmed`) |
| `reminders_answered` | Primer answered | `allowed` |
| `tonight_card_viewed` | Home opens with a Tonight card | `has_plan` |
| `cooking_started` | Cook mode opened | `source` (`plan` \| `recipe` \| `otto`) |
| `item_cooked` | "Cooked it" tapped or cook mode finished | `source`, `via` (`button` \| `cook_mode`) |
| `otto_changed_plan` | Ask Otto put a recipe into a plan day | `day_offset` |

**Not wired yet** (their screens don't exist): `week_planned_by_otto`, `reminders_answered`, `otto_changed_plan`. `shopping_list_opened` uses `surface=list` until the Plan segment lands.

Keep it under 20 events. Every event name and prop lives in this file before it lives in code.

## First questions to answer
1. Median `ms_since_launch` at `first_week_revealed` (target under 90 s) and drop-off per question.
2. Reveal → `plan_saved` → `trial_started` conversion, against a two-week baseline on today's flow.
3. Share of trials that reach activation, and whether activated trials convert to paid more often (correlation first; prove with the experiments in the report).
