# Reference apps: real flows

Sources: Mobbin MCP (`search_flows` returns ~5 sampled screens per flow, so "~" positions are
estimates) and the PlanFuel Mobbin study file in Figma (`iEA3Aeu3ApmJdJabmAudXm`), where flows are
laid out screen by screen in order and were confirmed by screenshot. Delete-account flows and
returning-user landing were not researched. Interactive versions: `../maps/*.html`.

## Cross-app comparison
| | Duolingo | Cal AI | MyFitnessPal | Tiimo | Headspace | Cherrypick |
|---|---|---|---|---|---|---|
| Questions | 7 (language, source, level, why, goal) | ~20 screens | ~15 screens | 2 | ~6 | ~13 screens (household, diet, dislikes, taste swipe) |
| Result reveal | Placement "Start at Score 10" | Full plan (calories, macros) | — | — (social proof) | Recommended course, after paywall | Taste swipe → "matches are ready" |
| Account wall | After result, skippable "Later" | Late (screen 27/34), "Save your progress", Skip | Intent at screen 4, created at end | First (screen 2) | First (~5) | After taste swipe, framed as payoff, Skip |
| Paywall | None in onboarding; at friction (ads, hearts) | Hard, right after plan reveal; 3-day trial | Soft, 1-month trial (24-screen version) | Soft, after social proof; trial on annual only | Soft, trial timeline (today / day 12 / day 14) | None; Pro trial auto-starts, banner countdown |
| Second-chance offer | — | 80% off forever after dismiss | — | — | 50% off only when cancelling | — |
| Notifications | Primed by Duo, then iOS | Primed mock dialog, late | not seen | After paywall, Skip; newer: home checklist | not seen | — |
| Other permissions | Contacts after sign-up | Apple Health (Not now), camera at first scan | Data consents (legal) | Calendar import, Skip | — | — |
| Tabs | 6 icon-only | Home · Progress · Settings + ＋ | Today · Plan · ＋ · Progress · More | To-do · Today · Focus · Me | Today · Explore · Profile | Plan · Shop · Cook · You |
| Returning user | "I already have an account" on welcome | "Already have an account? Sign In" | "Log in" on carousel | "Have an account? Log in" | "Log in" on sign-up | "Log in" on welcome |

## Patterns
- Questions always come before any money ask.
- Every notification request is primed by a custom screen first.
- Every paywall has a trial; most close with ×.
- The paywall lands right after the moment of most value (Cal AI after the plan, Tiimo after social proof, Headspace before the result). Duolingo waits until free limits bite.
- The account wall is the big split: account-first when the product lives in the account (Tiimo, Headspace, MFP); after a result, framed as saving progress, with Skip (Duolingo, Cal AI, Cherrypick). Apple's guidance sides with later.
- Cherrypick is the closest analogue to Otto (recipes + meal plan + groceries).

## Per-app sequences (screen order)
**Cal AI (Figma 41:100, 34 screens):** splash → welcome ("Already have an account? Sign In") → gender ×2 → workouts → source → tried other apps → results chart → height/weight ×3 → DOB → goal → desired weight ×2 → "realistic" reassurance → speed slider → "2× vs on your own" → what's stopping you → transition chart → "Thank you for trusting us" → Apple Health (Not now) → burned calories → rollover → rate us → notifications (primed) → **Save your progress (Skip)** → referral → generating plan ×2 → **plan ready** → **hard paywall** → home. Mobbin variant adds "try for free / we'll remind you" pre-screens and an 80%-off one-time offer after dismiss. Core loop: ＋ → sheet → camera (first-use tip) → analyzing card on home → rings update.

**Duolingo (Figma 46:116, 24 screens + Mobbin 4511e153 profile):** splash → welcome (Get started / I already have an account) → "Hi I'm Duo, 7 quick questions" → language ×3 → course building ("3 million") → source ×2 → level ×2 → start fresh → why ×2 → routine → daily goal ×2 ("I'm committed") → "50 words in week 1" → notification primer + iOS alert → "what you can achieve in 3 months" → from scratch / find my level → placement result → **profile wall (Later)** → name + SSO → password → find friends → path. Super: interstitial "Skip ads, 7 days free" → choose plan → Apple sheet → 5-step welcome. Lesson: exercises → Good job/Incorrect → results (XP, accuracy, time) → chest → path.

**MyFitnessPal (Figma 37:221, 21 screens; Mobbin 6ec621e1, 24):** splash → value carousel (Sign up free / Log in) → **"Let's customize" Continue/Google/Apple** → name ×2 → goals (up to 3) ×2 → encouragement → habits ×2 → encouragement → meal planning → activity → sex/age/country ×2 → height/weight/goal ×3 → weekly goal → data consents → **create account** → (24-screen version) **Premium, 1-month trial, ×** → Today. Log: meal → search (All/My meals/Recipes/Foods) → detail → added.

**Tiimo (Figma 42:8, 16 screens):** splash (ADA badge) → **sign up (Apple / email)** → email form ×3 → marketing opt-in ×2 → biggest need ×2 → neurodivergent? ×2 → "500,000 happy users" → **paywall (annual 7-day trial, ×)** → notifications (Skip) → import calendar → select calendars → Today. Newer variant (Mobbin 16df946d): reminders move to a "Get started" checklist on home.

**Headspace (Mobbin 31b21791, 21 screens, sampled):** "Breathe in" splash → **create account** → what's on your mind → quiz intro ("we'll reveal your course") → style quiz ×5 → **paywall with trial timeline** → result "For Calm Explorers like you" → Today. Cancel flow: "Would 50% off help?".

**Cherrypick (Figma 28:1825, 22 screens):** splash → welcome ("Your weekly meals and groceries, sorted", Get started / Log in) → Plan / Cook / Shop value screens → what matters (testimonial) ×2 → video "26% less UPFs" → who you plan for ×2 → diet ×2 → "only show matching recipes?" sheet → dislikes ×4 (allergy warning) → taste swipe ×2 → **"Your meal matches are ready — create account" (Skip)** → "meal-plan and shop in under 2 min" → Plan tab with "Pro trial ends in 7 days" banner.

**Flo (Mobbin 3e01b864):** consents first → for yourself? → goals → reasons → … semi-hard "Choose your plan" (Go back, limited-access link) → second chance "46% off forever".

## Mobbin / Figma ids
Duolingo flows b0b4f93f, ac9d2f58, 4511e153, c71bfa5f, 706ba483 · Cal AI 05ca2ff4, 579da5dd, c35ddf72, 6b462ef7 · MFP 6ec621e1, 15130eda, d58bea22 · Tiimo 817f5bfd, 16df946d · Headspace 31b21791 · Flo 3e01b864. Links: `https://mobbin.com/flows/<id>`.
