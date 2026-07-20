# Tiimo — deep-dive analysis

> A reference study of **Tiimo** (tiimoapp.com) — the visual daily planner for neurodivergent
> people that won **Apple's iPhone App of the Year 2025**. Studied as a design, brand, and product
> reference for **Otto** (our recipe + meal-plan app) and the upcoming **Auto** website/ecosystem.
>
> Compiled 2026-07-20 from Tiimo's own site (product, about, resource-hub, FAQ), the 2025 App Store
> Awards coverage, and third-party reviews. Tiimo's marketing pages block automated fetching, so
> direct quotes are drawn from search-indexed copy and reviews — treat exact wording as
> close-paraphrase unless in "quotes". Sources at the bottom.

---

## 1. One-paragraph snapshot

Tiimo turns a to-do list into a **calm, color-coded visual timeline** of your day. It was built
**by and for neurodivergent people** (ADHD, autism, executive-function differences) and is rooted in
executive-functioning research. Its whole design thesis is the opposite of hustle-culture
productivity: **gentle instead of punishing, visual instead of textual, supportive instead of
demanding.** Half a million+ people use it; Apple named it iPhone App of the Year 2025, explicitly
framing **accessible, inclusive design as a marker of excellence** rather than a niche. This is the
single most important thing to steal: Tiimo proves that a warm, humane, accessibility-first product
can win the most mainstream design award there is.

**Why it's the right reference for Otto:** both are "make daily life easier" tools for ordinary
people who feel overwhelmed by an everyday chore (planning your day / feeding yourself). Otto already
shares Tiimo's instincts — warm palette, no red/guilt states, gentle copy, a mascot. Tiimo is the
proof-of-ceiling for that instinct done at award-winning depth.

---

## 2. Company & mission

- **Founded** 2015 in Denmark (Copenhagen) by **Helene** and **Melissa**, out of a research project
  on how tech could support neurodivergent teens.
- **Mission framing:** "built by and for people who think differently" — not as a trend, "as a
  mission." Positioned as **"a rebellion against rigid systems"** and **"a movement for accessible,
  intuitive, and affirming tech."**
- **Co-creation is the method, not a slogan:** features are shaped with neurodivergent users,
  clinicians, educators, and researchers. "When they say co-created, they mean it."
- **Funding:** raised ~$4.8M to expand neurodivergent-friendly planning + learning tools — a real
  venture-backed company, not a hobby app.
- **Scale:** 500,000+ users; 6,600+ reviews; Apple iPhone App of the Year 2025 (previously nominated
  for an Apple Design Award for Inclusivity, 2024).

**Lesson for Auto/Otto:** the origin story *is* the marketing. Tiimo leads with "why we exist and who
we're for" before "what it does." A founder-led, lived-experience narrative ("we built this because we
needed it") is more durable than a feature list. Otto has an analogous story to tell (a warm cooking
companion for people who find meal-planning stressful).

---

## 3. Target audience & positioning

- **Primary:** neurodivergent adults — ADHD'ers, autistic people, anyone with executive-function
  challenges.
- **Secondary (deliberately inclusive):** "anyone distracted by the hum of modern life" / "anyone who
  thrives with visual organization." They widen the net without abandoning the core identity.
- **Positioning against the category:** explicitly **anti-"grind culture."** Competes with Structured,
  Todoist, Apple Reminders, Google Calendar — but reframes the whole category from *productivity/
  optimization* to *support/self-understanding.*

**Lesson:** pick a sharp primary audience and design uncompromisingly for them; let the mainstream
opt in ("this helps me too") rather than diluting for a generic user. Otto's sharp audience: people
who feel guilty/overwhelmed about cooking and planning meals, not "foodies."

---

## 4. Product & feature map

Core loop: **capture → visualize → focus → reflect.**

| Feature | What it does | The neurodivergent-aware twist |
|---|---|---|
| **Visual timeline** | The day as a vertical, color-coded, icon/emoji-tagged timeline across morning / day / night | You *see* time, not read a list. Reduces "time blindness." |
| **Routines / templates** | Reusable, repeatable routines you build once | Removes the daily re-planning tax |
| **Focus timer** | A visible countdown tied to a task; "makes time visible" | Manages transitions, the hardest ADHD moment |
| **Widgets & Live Activities** | Glanceable plan / to-do / focus timer on Home & Lock screen | Zero-friction re-entry; no need to open the app |
| **Checklists / subtasks** | Break tasks into small steps (self or AI) | "Not left doing the mental work on your own" |
| **Customization** | 3,000+ colors, custom icons, themes | "A visual system that works for *your* brain" |
| **Mood check-ins** | Log how you feel; reflect on the day | Builds self-knowledge, not just compliance |
| **Reflection** | See which tasks energize vs. drain; syncs with Apple Health (sleep/activity) | Plan *around your energy*, not against it |
| **Calendar import** | Apple, Google, Outlook, iCal → one timeline | Per-device import; then auto-syncs |
| **Body-doubling focus sessions** | On-demand videos: Pomodoro blocks + lo-fi music + a sense of company | Replicates "someone working alongside you" without live interaction |

**Design tell:** every feature is framed by the *emotional/cognitive job it does* ("manage
transitions," "not left doing the mental work"), never by the mechanism. Feature copy answers "what
does this do *for my brain*," not "what is this."

---

## 5. AI features (neuro-inclusive AI, done thoughtfully)

- **AI Co-Planner:** "when getting started feels impossible" — you **speak or type a brain-dump**, and
  it breaks tasks down, **estimates how long each step takes**, and assembles a realistic day.
  Explicitly aimed at **executive dysfunction / task initiation**, the specific hard moment.
- **Subtask generator:** turn a big task into small steps; subtasks show under the task on the Today
  tab.
- **Reflective AI:** after a mood check-in, the Co-Planner helps you reflect on what gave vs. drained
  energy.

**Lesson (directly relevant to Otto's honest-AI stance):** Tiimo aims AI at **one painful, specific
moment** (starting), not "AI everything." It's framed as a **co-**planner (assistive, alongside you),
never an authority. This mirrors Otto's "Did Otto get this right?" import-review posture — AI proposes,
the human stays in control. Keep that.

---

## 6. Design system & visual language

**Color**
- Brand palette (named on Mobbin): **Tundora `#4A4244`** (warm near-black ink — confirmed),
  **Wild Sand** (~`#F4F4F2`, warm off-white paper), **Silver Tree** (~`#67BE9B`, soft green accent).
  *(Wild Sand / Silver Tree hexes are the standard values for those color names; see Mobbin for
  Tiimo's exact tokens.)*
- In-app: **calming, low-saturation, pastel** color-coding; "a timeline of soothing colors."
- **3,000+ user-selectable colors** for personal coding — customization *is* an accessibility feature,
  not a vanity one.

**Appearance & type**
- Light / Dark / system-match, "whichever feels easiest on your eyes."
- **Dyslexia-friendly font option** for reading fatigue / visual stress.
- Theme = choose button/interface colors "to recognize things at a glance."

**Motion & sound**
- **Gentle transitions**, "small celebratory cues" on completion.
- **"Gentle nudges replace blaring alarms"** — notifications are soft, not jarring.

**Iconography**
- Emoji + custom icons on every block — fast visual recognition, low reading load, playful without
  being childish.

**Accessibility as the core, not a settings page**
- "Sensory-friendly design… reduces overwhelm, honors sensory needs, and makes planning tools feel
  usable and safe."
- **Flexibility principle:** "adjust the experience to meet your needs, not the other way around."

---

## 7. Design philosophy — the principles worth stealing

These are the crown jewels of the study:

1. **Never punish.** "Nothing turns red. Nothing gets marked as failed." Unfinished ≠ failure. The app
   refuses to induce guilt. *(Otto already does this — "no gray guilt," empty days as "painted
   invitations." Tiimo validates it at the highest level.)*
2. **Make time/▮the-hard-thing visible.** Externalize what the brain struggles to hold (time,
   sequence, size of a task) into calm visuals.
3. **Reduce friction at every entry point.** Widgets, glanceable views, reusable routines, "just type
   or speak." The cost of *using the tool* must be lower than the cost of the chore.
4. **Gentle over loud.** Soft nudges, soothing color, celebratory (not corrective) feedback.
5. **Flexible over prescriptive.** The user bends the tool to their brain; the tool never forces a
   single "right" system.
6. **Support over optimization.** The goal is follow-through and self-understanding, not maximum
   output. "Work *with* your brain."
7. **Co-created & evidence-based.** Grounded in executive-function research + real users. Credibility
   without clinical coldness.

---

## 8. Brand voice & messaging

**Tone:** warm, plain-spoken, affirming, quietly rebellious. Second person ("your brain," "your
day"). Validating, never condescending. Rejects productivity jargon.

**Signature moves & phrasings:**
- "Built by and for people who think differently."
- "Work *with* your brain, not against it."
- "Visual timelines replace overwhelming lists, gentle nudges replace blaring alarms, structure is
  built to support, not suffocate."
- "Nothing turns red. Nothing gets marked as failed."
- "Plan in a way that finally works."
- Names the *feeling*, not the feature: "when getting started feels impossible."

**Lesson for Otto's copy:** Otto's voice is already close (playful, warm, guilt-free — "even 'Tuesday
soup' works," "no gray guilt"). Tiimo's discipline to steal: **lead every feature line with the
emotional job.** Not "AI subtask generator" but "when you don't know where to start." Not "meal
planner" but "dinner sorted before the 6pm panic."

---

## 9. Onboarding & UX flow

- **Onboarding builds a real plan immediately:** pick from a list of everyday tasks + add this week's
  plans → the app generates a **custom visual schedule across morning/day/night** you can start
  checking off. First-run ends with a *populated, personal* timeline — not an empty canvas.
- **Time-to-value is near-instant:** you see your own day visualized in the first session.

**Lesson:** never open to a blank state. Otto's create-recipe/plan flows should end the first session
with something that already feels *theirs* (a first recipe on the shelf, a dinner on the week). The
onboarding output is the aha, not a tour.

---

## 10. Platforms & surfaces

- **iOS (flagship), Android, Web app, Apple Watch.**
- **Widgets + Live Activities** on Home & Lock screen (glanceable, no app-open).
- **Apple Watch:** check the plan or start the focus timer from the wrist.
- **Web app** is a premium surface (needs an active trial/subscription).
- **Calendar sync:** Apple, Google, Outlook, iCal; imported per-device, then automatic.
- **Apple Health** integration for the reflection/energy features.

**Lesson:** meet the user where the friction is — the wrist, the lock screen, the widget — not only
inside the app. For Otto, the analogous surfaces: a shopping-list widget, a "what's for dinner
tonight" glance, share-to-anywhere. (Otto already leans into share cards + widgets thinking.)

---

## 11. Business model & pricing

- **Freemium, forever ad-free.** Free tier is genuinely useful: visual planner, focus timer, to-dos,
  anytime activities, **limited AI** (subtask generator + Co-Planner).
- **Tiimo Pro** (paid) unlocks: calendar integration, **multi-device sync** (phone/desktop/tablet/
  watch), **web app**, **shared access for up to 5 profiles** (families/support teams), **unlimited
  AI**, full personalization.
- **Price:** ~**$79.99/yr** (~$6.67/mo) or ~**$7.99/mo**; roughly **$7–12/mo** by region. **7-day free
  trial**, offered on the yearly plan.
- **Stated reason for freemium:** "planning tools should be accessible to as many people as possible,
  especially those historically excluded from productivity systems" — and **ad-free because ads =
  distraction**, which would betray the core user. Values and monetization are aligned and *said out
  loud.*

**Lesson:** the paywall is drawn at **multi-device / sharing / unlimited-AI / power-use**, while the
**core daily value is free**. The monetization story is told as an ethic ("always ad-free"), which
builds trust with a community that's wary of being exploited. For Otto/Auto's future pricing: keep the
everyday loop free, charge for sync/household-sharing/AI depth, and *say why* in the brand's voice.

---

## 12. Content, community & credibility engine

- **Resource Hub:** a large library of neurodiversity-affirming articles (executive function, body
  doubling, "brain battery"/energy management, sensory design). This is **SEO + trust + mission** in
  one — it teaches, it ranks, it proves expertise.
- **Changemaker interviews** (e.g., Ellie Middleton, Sonny Jane Wise): community voices, not just
  product PR.
- **Free body-doubling sessions** as community programming — the brand shows up *for* the community
  beyond the app.
- **Evidence & partners:** clinicians, educators, researchers cited throughout.

**Lesson for the Auto website:** an "award-winning company" look is built as much by a **credible
content/resource layer** as by the product pages. A recipe/meal-plan ecosystem could run the same play
— genuinely useful cooking/nutrition/behavior content that teaches and ranks, plus real user voices —
so the site reads as an authority, not a landing page.

---

## 13. Why it won Apple iPhone App of the Year 2025

Apple's framing (and the press's): **accessible, inclusive design recognized as excellence and
innovation.** Specifics cited:
- Visual, color-coded, emoji-accented planning that makes hectic days feel manageable ("a calming
  activity").
- Built on **lived experience + inclusive design**; focus timers embedded in tasks, small celebratory
  cues, subtle continuous improvements.
- The award "shows that accessible design is being acknowledged as a marker of excellence."

**The takeaway that matters most:** you do not have to choose between "accessible/warm/gentle" and
"award-winning/mainstream/premium." Tiimo is the existence proof that the *humane* version of a
category can be the *best* version. That is the north star for Otto and for how Auto should present
itself.

---

## 14. Direct lessons — mapped to Otto & Auto

**Already aligned (keep / double down):**
- No-guilt states (no red, no "failed"), empty states as invitations — Otto has this; it's a strength,
  not a gap.
- Warm palette + serif/character + mascot (Otto) ↔ calm pastels + emoji + gentle motion (Tiimo).
- Honest, human copy; AI-as-assistant with a human check.

**Steal next:**
1. **Lead every feature with its emotional job**, in product copy and on the site. (Rewrite Otto/Auto
   feature lines from mechanism → feeling.)
2. **First-run ends with something that's already theirs** — a populated week / a saved recipe, never
   a blank canvas.
3. **Glanceable surfaces:** shopping-list & tonight's-dinner widgets, lock-screen presence.
4. **Say the values out loud** — an "always ad-free / your data is yours / no guilt" statement is
   brand equity, especially for a wellbeing-adjacent audience.
5. **A resource/content layer** on the Auto site (teach cooking/planning/behavior) for credibility +
   SEO + mission, plus real user voices.
6. **Draw the paywall at sync/sharing/AI-depth**, keep the daily loop free, and frame the freemium
   split as an ethic.
7. **Reflection/energy loop** — Tiimo's mood + energy reflection is a compelling retention mechanic; a
   food app's analog ("how did this week of cooking feel / what did you actually enjoy") could deepen
   the plan loop beyond logistics.

**Where Otto should *differ* (don't blind-copy):**
- Otto is food/joy-led, not clinical — lean into **appetite, warmth, and delight** (photography,
  texture, the mascot's personality) more than Tiimo's deliberately low-stimulation calm. Tiimo
  minimizes sensory input on purpose; Otto can be more *appetizing* and tactile.
- Tiimo's audience needs maximal restraint; Otto's needs *craving* + reassurance. Borrow the
  gentleness and the anti-guilt spine; keep Otto's richer, more sensory personality.

---

## 15. TL;DR for the team

Tiimo won the biggest design award in tech by being the **kind, visual, guilt-free, evidence-based,
built-by-and-for-us** version of a stressful everyday category — and by **saying so, out loud,
everywhere.** Otto already shares that DNA. The work is to (a) sharpen the copy to lead with feelings,
(b) never ship a blank first-run, (c) show up on glanceable surfaces, (d) build a credible content +
community layer for the Auto site, and (e) price along an ethical, sync/share/AI line. Keep Otto
warmer and more appetizing than Tiimo's calm — same humane spine, more flavor.

---

## Sources

- [Tiimo — Visual Planner for Every Neurotype (home)](https://www.tiimoapp.com/)
- [Tiimo — Product / Smart ADHD planner](https://www.tiimoapp.com/product)
- [Tiimo — About / Redesigning Productivity](https://www.tiimoapp.com/about)
- [Tiimo — Sensory-friendly design for ADHD and Autism](https://www.tiimoapp.com/resource-hub/sensory-design-neurodivergent-accessibility)
- [Tiimo — How Tiimo built an AI Co-Planner for executive dysfunction](https://www.tiimoapp.com/resource-hub/ai-co-planner-design)
- [Tiimo — Neuroinclusive AI Planning](https://www.tiimoapp.com/resource-hub/ai-planner)
- [Tiimo — Why Tiimo isn't fully free but will always be ad-free](https://www.tiimoapp.com/resource-hub/why-tiimo-went-freemium)
- [Tiimo — How body doubling helps neurodivergent brains focus](https://www.tiimoapp.com/resource-hub/body-doubling-focus-support)
- [Tiimo — Raises $4.8M](https://www.tiimoapp.com/resource-hub/tiimo-raises-4-8m-neurodivergent-planner)
- [Tiimo — Winner of iPhone App of the Year 2025](https://www.tiimoapp.com/resource-hub/tiimo-winner-2025-app-store-awards)
- [Tiimo — FAQ](https://www.tiimoapp.com/faq) · [Widgets](https://www.tiimoapp.com/faq/widgets) · [Calendar import](https://www.tiimoapp.com/faq/calendar-import) · [Customize & profiles](https://www.tiimoapp.com/faq/customize-and-add-profiles)
- [Apple — Announcing the 2025 App Store Awards](https://apps.apple.com/us/story/id1849728503)
- [Retail Insider — Apple names Tiimo, Detail, Essayist among 2025 winners (AI & accessibility)](https://retail-insider.com/retail-insider/2025/12/apple-names-tiimo-detail-and-essayist-among-winners-of-2025-app-store-awards-highlighting-ai-and-accessibility/)
- [AOL — "I tried Apple's app of the year"](https://www.aol.com/news/tried-apples-app-more-tool-101107150.html)
- [HowToGeek — Why I love this iPhone App of the Year](https://www.howtogeek.com/productivity-app-is-a-iphone-app-of-the-year-heres-why-i-love-it/)
- [Mobbin — Tiimo brand color palette](https://mobbin.com/colors/brand/tiimo-as)
- [Brandfetch — Tiimo brand assets](https://brandfetch.com/tiimoapp.com)
- [Selfpause — Tiimo Review 2026](https://www.selfpause.com/resources/tiimo)
- [Sifted — This Danish startup has a planning app for neurodivergent people](https://sifted.eu/articles/tiimo-planning-app-for-neurodivergent-people)
- [App Store — Tiimo: To Do List & AI Planner](https://apps.apple.com/us/app/tiimo-to-do-list-ai-planner/id1480220328)
