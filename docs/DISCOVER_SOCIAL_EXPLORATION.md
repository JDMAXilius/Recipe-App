# 👥 Discover as a Social Surface — deep-think + recommendation

> The founder's idea: make Discover feel more like social media — **showcase users and their
> cookbooks**, let Otto **re-feature the best** community recipes, and maybe add **ratings and
> comments**. This doc thinks it through against the design system's honesty rules and the real
> cost, and lands a **phased recommendation**. Nothing here ships without a go.

**Status:** exploration (cloud co-pilot). Decision flagged at the end.
**Big finding:** the old "no ratings, no social" rule was scoped to the *read-only* app. **v2 UGC
unlocks it** — but a full social feed is the single biggest scope multiplier in the roadmap, so we
phase it.

---

## 1. The honesty reconciliation (why this is now allowed)
`MOBBIN_COMPARISON.md §2.9.1` bans ratings/social proof: *"TheMealDB has no rating data and fake
counts poison trust."* That ban was **correct for a read-only catalog** — any number would be
fabricated. **v2 changes the premise:** users now create, import, and (optionally) share real
recipes. Real people cooking real user recipes can leave **real** ratings and comments. The
honesty clause doesn't forbid social — it forbids *fake* social. So:

- ✅ **Allowed now:** ratings/comments **on user-created/shared recipes**, from real users.
- ❌ **Still banned:** ratings on **TheMealDB seed recipes** (no source data → don't invent stars).
- ✅ **Author attribution** ("By Juan") on user recipes — honest identity, cheap, shippable in v1.

This is a genuine reversal of a prior rule, logged here and to be mirrored in `REDESIGN_NOTES.md`.

## 2. The honesty gate that makes our ratings *better* than everyone's
Every big recipe app lets you rate a recipe you never cooked (drive-by stars, easy to game).
Our differentiator: **cook-then-rate.** You can only rate/review a recipe **after** you've opened
**Cook Mode** (or tapped "I cooked this"). Display it as **"★ 4.6 from 12 cooks"** — not "from 12
users." That single constraint:
- makes every rating meaningful (the person actually made it),
- is much harder to spam,
- ties directly to a feature we already ship (Cook Mode, `SCREEN_MAP D2`),
- and is a real, ownable trust story ("Otto ratings come from people who *cooked* it").

## 3. The honest cost — what "social" actually drags in
A community feed is not one feature; it's a subsystem. Before the founder greenlights, this is the true bill:
- **Public profiles** — a user identity others can see (name, avatar, their public cookbook).
- **A "share to community" toggle** — per recipe: private (default) vs public. Private stays the norm.
- **A feed + ranking** — "best / trending / Otto's picks"; needs seed volume or it looks dead.
- **Comments + ratings storage** (Supabase tables, RLS).
- **Moderation — non-optional.** **App Store Guideline 1.2** requires any app with user-generated
  content to provide: a content filter, a **report** mechanism, the ability to **block** abusive
  users, and a way to contact/act on reports. Shipping UGC *without* this risks rejection **and**
  real-world harm. This is the part solo founders underestimate.
- **Cold-start risk** — a "community" tab with 4 recipes and 0 comments reads as abandoned. Social
  only works past a critical mass; at launch you have TheMealDB seed + your own recipes, not a crowd.

**Verdict on cost:** worth doing, but it's a **Phase-2 product**, not a launch add-on. Forcing it
into v1 risks a dead-feeling feed, a moderation gap, and slipping the launch.

## 4. Recommendation — phase it (3 steps)

### Phase 1 (v1, launch) — *seed the identity, skip the feed*
- Discover stays the **4 lean modules** (`SCREEN_DECISION_PROMPT.md` worked example): greeting/search
  → Otto's pick → category tiles → grid. **No public feed, no ratings, no comments yet.**
- BUT build the data + card so **user recipes carry author attribution** ("By you" / later "By Juan")
  and recipes have a **`visibility` field** (private default) from day one — so Phase 2 is a
  switch-on, not a migration.
- This gives the *social seed* (identity, ownership) with **zero** moderation/feed cost.

### Phase 2 (community) — *the social layer, membership-adjacent*
- **"Share to the Otto kitchen"** toggle on your own recipes → they can appear publicly.
- A **"From the Otto kitchen" rail on Discover** (one module, curated first): standout community
  recipes Otto **editorially re-features** — the founder's "refeature the best." Curated/editorial
  before algorithmic keeps quality high while volume is low (and dodges cold-start deadness).
- **Ratings** (cook-then-rate, §2) + **comments** on public recipes, with the **full moderation
  kit** (report / block / filter) — non-negotiable, ships *with* this phase or not at all.
- **Public profiles** = a user's shared cookbook. This is the step that turns Otto into a social
  app — take it deliberately.

### Phase 3 (network, optional/later) — *follows, notifications, Instagram pull-in*
- Following creators, activity notifications, and the Instagram pull-in (`SCREEN_MAP H3`) all belong
  here. Only if Phase 2 shows real engagement. Don't pre-build.

## 5. "Is it too much?" — the straight answer
**For v1: yes, the full ratings+comments+feed is too much** — it's a subsystem with a legal
(moderation) floor and a cold-start failure mode. **For the roadmap: no, it's the right Phase-2
bet** — it's what makes UGC compound, and our cook-then-rate gate makes it more trustworthy than
the incumbents. So: **not next iteration's *build*, but next iteration's *plan* — and we seed it in
v1 for free** (attribution + a visibility flag).

## 6. References (to confirm when Mobbin is re-authed)
Mobbin needs re-auth this session (OAuth, non-interactive). From prior sweeps + general knowledge,
the patterns to study for Phase 2 (pull these fresh before building):
- **NYT Cooking** — ratings + private "Cooking Notes" (a comments pattern that stays useful, not toxic).
- **Kitchen Stories** — "Most loved" heart counts + comments on community recipes; the editorial "Today" re-feature.
- **Tasty / Pinterest** — saving + creator attribution; how public collections read.
- **Any UGC app's report/block flow** — for the moderation kit (Instagram, Reddit patterns).
> Fresh Mobbin pulls needed specifically for: **community recipe cards, a report/block flow, and a
> public profile/cookbook layout** — we have no prior references for these three.

## 7. Decisions to confirm (founder)
1. **Green-light the phased plan?** (v1 seeds attribution + visibility flag; social feed is Phase 2.)
2. **Cook-then-rate gate** for ratings — adopt as the rule? (Recommend yes — it's our trust differentiator.)
3. **Curated-first re-feature** ("From the Otto kitchen" chosen by Otto/you) before any algorithm? (Recommend yes.)
4. Is **community/social a membership driver** (Otto Club) or free-and-open? (Leaning: sharing free, but "Otto featured me" + creator tools could be a Club perk.)

*End — Discover social exploration. Pairs with `SCREEN_MAP.md §C` (Discover v1) and the Otto v2 direction doc.*
