# Otto's magic moment

Written 2026-11-04. Status: **proposal, for Juan to decide.** Nothing here is approved or built.
Research: 30 apps (25 from our study + 6 direct competitors, minus Apple), from their live App Store pages
(subtitle, first 4 screenshots read one by one, most-helpful reviews), our flow-map study, Mobbin and a few
reports. Per-app write-ups with evidence labels: [`magic-moment/`](magic-moment/).

---

## 1. The short answer

**Today Otto has no magic moment a new person can reach.** The shipped path is
splash → sign up → 3 paintings → paywall (no close) → app (`src/features/onboarding/gate.ts`).
The first thing Otto *does* for anyone happens after they've made an account and paid. The things that
could be magic (import, plan → list) sit behind that wall, and the App Store subtitle
("A quieter kind of cookbook") sells a mood, not a result.

Every subscription-only app we studied that does well shows the moment **before** money. Otto has no
free tier to win people back later, so it must.

**Proposed magic moment:**

> **"The recipes I already saved just became this week's dinners for my household, with the shopping list done."**

In about a minute, before the account and before the paywall: the person shares one recipe they've already
saved (a TikTok, a reel, a blog link), answers 3 questions, and Otto hands back Mon–Fri with *their* dish on
Tuesday, the rest picked to fit, and an aisle-sorted list ready to share.

**The problem it solves:** "What's for dinner?" asked every night, and the pile of saved recipes nobody
ever cooks. Otto turns *saving* into *cooking*.

---

## 2. Why this one (what the research says)

| Finding | Evidence |
|---|---|
| **The moment transforms the user's own thing, or reflects their answers back as one concrete result.** Generic "your plan is ready" never appears in a strong app. | Cal AI (your plate → named dish + calories), Crouton/ReciMe (your link → clean recipe), Noom (your weight curve with "Wedding" on it), Ollie ("Memory updated: no broccoli for your son") |
| **Fast, inside onboarding.** Winners deliver within 1–2 minutes; long quizzes are tolerated only when every answer visibly comes back. | ReciMe runs a real import at screen 10 of 20; Mealime's plan + list in ~90 s; Waterllama's first sip at screen ~3 |
| **Paywall after the moment.** Free-first apps have the biggest, best-rated listings; the subscription-only apps that work (Amy, Cal AI) show the personal result first, then ask. | Finch ★4.95/771k, Waterllama ★4.87/164k, Duolingo; Amy 3-day no-card trial before the ask; Ollie asked for a card first and is now out of the US store |
| **Account after the moment, framed as "save this".** | Cherrypick "Your matches are ready → create account (Skip)", Cal AI and Lifesum sign-in at the end; Duolingo's delayed sign-up (+20% DAU, report only) |
| **The mascot talks over real output, never instead of it.** | YAZIO greets you by name, BitePal's raccoon reveal, CARROT's snark over your forecast, Amy's cat over "620 cal". PappAI's mascots are decoration only, and Otto's otter is closer to that today |
| **Screenshot 1 sells the result as real UI with personal-looking data**, captioned with the outcome. Mood/illustration leads are the smallest listings. | CARROT, Bevel, Oura, Cal AI, Flo ("Period in 2 days"); Ellie, Mogul lead with mood and are the smallest |
| **The moment comes back daily as one glanceable thing.** | Widgets / lock screen / Live Activities: Luna, Waterllama, Tiimo, Duolingo |

**The category gap.** Recipe apps split into two kinds and nobody joins them:
- *Capture* (ReciMe, Paprika, Crouton, Plan to Eat, Samsung Food): "my messy saves became a clean cookbook". Then the cookbook sits there.
- *Plan* (Mealime, Ollie): "a week was made for me", but from **their** catalogue, never your saves.

"Your saves → your week → your list" is unclaimed, and Otto already has every piece (import, plan, shared
aisle list, Ask Otto). **Timing:** Mealime shut down on Oct 21, 2026 (verified: mealime.com/closing, it moved
into Albertsons' grocery apps), and Ollie's meal app is gone from the US store. The "personal week in a minute"
slot has fewer apps in it than it has had in years.

**Why not the other candidates:**
- *Import alone* is ReciMe's moment (15M+ users, caption-less video) and Crouton's. Otto only reads captions today, so it would be the weaker copy.
- *A plan from questions alone* is Mealime's moment: proven, but generic ("their recipes"), and Samsung Food's reviews show ignored preferences turn into 1-star.
- *Talking to Otto* is the founder's favourite feature, but a chat is a blank box on day one. Otto belongs **inside** the moment ("swap the fish, Ana hates it" → Tuesday changes), not as the first screen.
- *Fridge photo → dinner* is done badly everywhere (opening), but it's a once-in-a-while use, not a weekly habit. Keep it as the second moment (§5).

---

## 3. The moment, beat by beat (first open, ~60–90 s)

1. **Welcome.** One line that names the job: "Turn the recipes you save into dinners you actually cook." [Get started]. No account.
2. **"Got a recipe you've been meaning to make?"** Paste a link / pick from Photos / **"Not now, Otto will pick"**. Must be optional: plenty of people won't have a link ready.
3. **The import, shown live.** The link turns into a recipe card in front of them (Amy's "Thinking…" → result). Otto says one line over it: "Got it, crispy gochujang salmon. 25 minutes."
4. **3 questions**, each visibly used later: who's eating (household size + names optional), anything off the table (diet / dislikes), weeknight time.
5. **The reveal: "Your week."** Mon–Fri, their dish on Tuesday tagged *"From your TikTok"*, every other card annotated with the reason ("under 30 min", "no pork", "uses the rest of the coriander"). A read-back line: *"5 dinners for 3. All under 35 minutes. No pork."*
6. **One live change.** "Want anything swapped?" One tap or one sentence to Otto, and the card changes in place. This is where Ask Otto first earns trust.
7. **The list.** "23 things, sorted by aisle." [Share with someone].
8. **Save your week** → Sign in with Apple (first, prominent). Framed as keeping what they just made.
9. **Otto Club** with their week still visible behind it: "Your week is saved. Start your free week to cook it." Billed amount biggest, trial terms, Restore, Terms, Privacy (3.1.2(c)).
10. **Day 1 onward:** Home opens on *Tonight* ("Tuesday · your salmon · 25 min"). A widget / Live Activity: "Tonight: salmon. Take it out of the freezer by 5."

The otter shows up at 3, 5 and 10 only, commenting on *their* food.

---

## 4. Selling it (App Store)

**Subtitle (≤30), pick one:**
- `Your saved recipes, planned` (27)
- `Dinner, decided for the week` (28)
- `Saves into dinners, list done` (29)

**Screenshot order** (real UI, personal-looking data, outcome captions):
1. The week with a TikTok-sourced dish on Tuesday: *"The recipes you save become this week's dinners."*
2. A reel turning into a recipe: *"Share any recipe. Otto reads it."*
3. The aisle list, shared: *"Your list, sorted and shared."*
4. Otto swapping a dish in chat: *"Ask Otto to change anything."*
5. Cook mode: *"Cook it a step at a time."*

**Promotional text** (no review needed): update once the flow ships; it must never claim more than the live build.

---

## 5. Second moments (keep the habit alive)

- **Sunday: "Next week's ready."** The week builds itself from what was saved since; one tap to keep it.
- **Tonight card + widget.** One glanceable thing a day (the pattern every daily-use app in the study has).
- **Fridge photo → tonight.** "What can I make with this?" Opportunity: nobody does it well. Later, not launch.
- **Share extension.** Save straight from TikTok/Instagram's share sheet into "next week". This is how capture apps keep feeding themselves.

---

## 6. What this needs in code (honest gaps)

| Need | Today | Gap |
|---|---|---|
| Import before account | `import-recipe` needs a signed-in Club member (`requireClub`, `getUserId`) | An anonymous/device-scoped allowance: 1–2 imports, rate-limited, AI consent asked *before* the call (named provider) |
| Caption-less videos | Import reads the post caption only (`transcribeCaption`) | Audio transcription for videos with no caption (ReciMe's edge). Until then, the onboarding copy must not promise "any video" |
| Week before account | Recipes readable by `anon`; plan engine is roadmap R0.6 / R1.4 | Build the week on the device, claim it into the account at sign-up (roadmap §2 already plans this) |
| Reasons on cards | Not built | Each pick carries the rule that chose it ("under 30 min", "no pork") |
| One live swap | Chat exists, not wired to plan cards | Swap one plan card from Ask Otto, in place |
| Share extension, widget | Neither exists (`app.json`) | Native targets: needs a native build |
| Paywall copy with the week behind it | `OttoClubScreen` is standalone | Paywall shown over the saved week |

---

## 7. Decisions for Juan

1. **Is "your saves → your week → your list" the magic moment?** (Alternatives: import-only, plan-only, talk-to-Otto-first.)
2. **Is the import step in onboarding optional** ("Otto will pick" path)? Recommended: yes.
3. **Free imports before the account:** how many (1? 2?) and accept the AI cost of anonymous use.
4. **Paywall stays hard (no close) but moves after the reveal?** Or add a no-card trial like Amy?
5. **Subtitle and screenshot 1:** pick from §4.
6. **Questionnaire:** 3 questions here vs the 7 in the v4 draft. This proposal needs 3; the rest can be asked later, in context.

If 1 is yes, the v4 onboarding screens, `REWORK_ROADMAP.md` R1.x and the draft `ROADMAP.md` all need to follow
this order. That rework waits for your call.
