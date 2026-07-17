# Otto — Product Requirements Document (PRD)

> Written plain and simple, the way you'd explain it to a friend. Otto is a
> recipe app. This paper says what it is, what it does, and how we grow it —
> like opening a restaurant, one step at a time.
>
> **App:** Otto — the quieter kind of cookbook · **Owner:** JDMAXilius ·
> **Updated:** 2026-07-17

---

## The idea in one sentence

Otto is a cozy home for the recipes you actually cook. You save them, plan
your week, make one shopping list, and cook without stress. No noisy feed. No
ads. Just an otter named Otto keeping the stove warm.

---

## Who it's for

- **The tired weeknight cook.** They cook a few nights a week and dread the
  question "what's for dinner?"
- **The family organizer.** They want one shopping list the whole house can
  add to.
- **The recipe hoarder.** They screenshot recipes from TikTok and Instagram
  and never find them again.

---

## How we grow Otto (the restaurant story)

We don't build the whole restaurant on day one. We start tiny and grow. Each
step works on its own and makes money's worth of sense before we add the next.

- **🍳 The food stand** — the smallest thing that helps. One window, one good
  dish. *For Otto: see recipes and save the ones you like.*
- **🏠 The small restaurant** — a few tables, a real menu. *For Otto: write
  your own recipes, plan your week, make a shopping list, and cook step by
  step.*
- **🏛️ The full restaurant** — front of house (what guests see and touch)
  and back of house (the kitchen, the staff, the locks on the doors). *For
  Otto: sharing, family lists, imports, accounts, and everything kept safe.*

Otto is already a **full restaurant that's open for business** — most of this
is built. The roadmap below shows how we got here and what we cook next.

---

## The menu (core features)

Plain list of everything Otto does:

1. **Discover** — browse a big free recipe book and get an idea for tonight.
2. **Cookbook** — your own shelf: recipes you saved, wrote, or imported.
3. **Import** — grab a recipe from a website, a TikTok/Instagram post, or
   pasted text. Otto reads it and you check its work.
4. **Plan** — a loose week. Drop dinners on days. No guilt for empty days.
5. **Shopping list** — turns your week into one tidy list, sorted by aisle.
6. **Shared list** — one list your whole house adds to and checks off, live.
7. **Cook mode** — big, hands-free steps with timers you can tap.
8. **Food preferences** — tell Otto your diet and favorite cuisines.
9. **Sharing** — send a recipe or list as a nice link, not a screenshot.
10. **Reminders** — a gentle nudge about tonight's dinner (all on your phone).
11. **Profile & account** — sign in, your stats, help, and Otto Club (soon).

---

## The phased roadmap

Each phase is a step up the restaurant ladder. Every phase gives a **quick
win** you can see and use before we move on.

### Phase 1 — 🍳 The food stand *(the quick win)*
**Build:** Browse recipes. Tap one to read it. Save the ones you like.
**Quick win:** In one afternoon, you can look at real recipes and keep your
favorites. That's already useful.

### Phase 2 — 🏠 The small restaurant
**Build:** Write your own recipes. Import from a link. Plan a week. Build a
shopping list from that week. Cook step by step.
**Quick win:** Now Otto runs your real dinners, start to finish — pick,
plan, shop, cook.

### Phase 3 — 🏛️ Full restaurant, front of house *(what guests see)*
**Build:** Share recipes and lists as links. One shared list for the whole
house. Food preferences. Reminders. The "save from TikTok" helper. Lots of
warm polish (the paper shopping pad, Otto's little faces, smooth gestures).
**Quick win:** Otto stops being just yours — you can cook *with* people.

### Phase 4 — 🏛️ Full restaurant, back of house *(the kitchen & the locks)*
**Build:** Accounts (sign in safely). A real server and database that
remember your stuff. Rate limits so nobody can spam it. Secret share links
nobody can guess. Honest "coming soon" gates so no button ever lies.
**Quick win:** Everything is safe, private, and yours — and it keeps working
as more people use it.

### Phase 5 — 🌟 New dishes we add next
**Build:** Turn on the last gated features, then:
- Otto Club membership.
- Import a recipe from a **photo** of a cookbook page.
- A prettier recipe page (Kitchen-Stories style).
**Quick win:** Otto keeps getting better without ever breaking what works.

---

## How we test as we go (the taste test)

Before any dish leaves the kitchen, we taste it. Same four checks, every time,
in this order:

1. **The lights turn on.** The page opens with no errors.
2. **The doors open and the register rings.** Buttons and forms actually do
   their job.
3. **The kitchen cooks real food.** Real data flows — the recipe truly
   imports, the list truly saves, not a fake demo.
4. **The locks work.** We check security — nobody sees another person's stuff,
   nothing private leaks, no button opens a door it shouldn't.

If any check fails, the dish goes back to the kitchen. We don't serve it.

---

## How we work together

- **Explain it simply.** No jargon. If a word needs a dictionary, use a
  different word.
- **Say what you're doing and why.** And when something is needed, say exactly
  what to click or run.
- **Grow like a restaurant.** Food stand first, then small restaurant, then
  the full place. A quick win today, more tomorrow.

---

## Where Otto stands today (honest status)

**Already cooked and served:** Discover, Cookbook, manual + website import,
Plan (with leftovers and swap), Shopping list on the paper pad, sharing,
food preferences, reminders, hands-free cook mode, profile, the share-to-Otto
helper. Phases 1–4 are essentially open for business.

**Cooked, waiting on the owner to flip the sign to "open":**
- **Share links + family shared list** → needs one database setup command
  (`drizzle-kit push`).
- **Import from TikTok/Instagram/pasted text** → needs one secret key
  (`ANTHROPIC_API_KEY`) added to the server.
- **Sign in with Apple, save-from-other-apps, reminders on your phone** →
  needs one fresh iPhone build.

**On the menu next (Phase 5):** Otto Club, photo import, the prettier recipe
page.

---

## What Otto needs from you (the owner)

Three small owner jobs turn on everything already built:

1. Run the database setup command (`npx drizzle-kit push --force` from the
   `backend` folder).
2. Add the `ANTHROPIC_API_KEY` to the server settings.
3. Do one new iPhone build (`expo prebuild -p ios --clean`, then build).

Do those three and Otto goes from "mostly open" to "fully open," no new code
needed.

---

*Keep this paper short and honest. Otto grows one dish at a time, and every
dish gets the taste test before it reaches a guest.*
