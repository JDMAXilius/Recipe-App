# Nutrition Framework Roadmap — USDA numbers, Claude matching

Status: adopted 2026-07-21 (founder + cloud session). What's SHIPPED, what remains, and who
can do each piece. **[Cloud]** = this remote session can build and verify it here.
**[Terminal]/[You]** = needs prod credentials, live keys, devices, or open network —
consolidated in `TERMINAL_TICKET_NUTRITION_FRAMEWORK.md`.

## Shipped (Phases 14–15g, all on main)

- Corrupt USDA rows fixed (chicken-skin, pork-backfat classes); qualifier/alias lookup
  ("white rice", "beef mince", "grated cheddar"); coverage guard (no confidently-understated
  totals); coverage-aware low floor (a black coffee computes its true ~5 kcal).
- **Claude-as-matcher** (Haiku): Stage 1 picks from the bundled 920-row table; Stage 2 picks
  by fdcId from live USDA FoodData Central search (~600k foods). USDA supplies every number;
  hallucination-proof guards both stages. Dormant without keys; byte-identical when off.
- Drink category estimates (research-grounded) + tolerant category lookup.
- Eager full-database recalculation script (`scripts/refresh-nutrition.mjs`), idempotent.
- 70+ backend tests incl. golden regressions for every fixed failure mode.

## Remaining work

### N1 · Raw-vs-cooked resolution via Claude — [Cloud] — **DONE 2026-07-21**
The blunt guards null any volume-measured grain ("3 cups rice" — raw and cooked differ ~3×)
and can only trust curated facts for seed recipes. The code has always named the real fix:
read the recipe's own steps ("add the cooked rice") and pick the raw vs cooked USDA record —
an LLM-shaped language task with USDA still supplying every number. Extends the existing
matcher; dormant-gated; unlocks recipes that today fall back to estimates. **Next cloud task.**

### N2 · Persist the resolver cache — **DONE 2026-07-21** (terminal runs `n2-resolved-cache.mjs`)
Resolutions currently cache in-process (reset on every deploy). A `resolved_ingredients`
table makes every Claude match durable, shared, and auditable (input → picked food → when),
so the same name is never paid for twice across deploys — and mismatches can be reviewed and
corrected as data. Cloud writes code + idempotent schema script; terminal runs it against prod.

### N3 · Full table audit — **DONE 2026-07-21** (119 flags reviewed, 9 corrupt rows fixed)
The protein sweep caught 5 corrupt rows because we looked at proteins. Sweep all 920 rows
with per-class plausibility bounds (dairy, oils, produce, grains, sauces) and fix what fails,
with regression tests. One-time, no keys needed.

### N4 · Expand the cooked-record table — **DONE 2026-07-21** (27 records added)
`usdaCookedTable.json` covers few foods; lines flagged "cooked" with no cooked record are
dropped (honest but lossy). Add cooked USDA rows for the common grains/legumes/pasta so N1
has records to land on.

### N5 · Golden nutrition corpus — **DONE 2026-07-21** (8 dishes, pinned ranges)
Like foodScale's golden test: a fixture set of real recipes with expected kcal RANGES pinned
in tests, so any future engine change that shifts totals fails loudly instead of silently.

### N6 · Confidence surfaced honestly in the card — **DONE 2026-07-21** (needs app rebuild, N9)
The data carries high/medium/low confidence; the card shows the number either way. Decide +
implement the honest presentation (e.g. low-confidence gets a softer caption). Founder taste
call on copy — will propose with screenshots.

### N7 · Execute the recalculation — [You/Terminal] — GATES EVERYTHING ABOVE REACHING USERS
Keys → deploy → sha check → `refresh-nutrition.mjs` → in-app spot-checks. Runbook:
`TERMINAL_TICKET_NUTRITION_REFRESH.md`. Until this runs, prod serves old-engine numbers.

### N8 · Live-fire matcher validation — [Terminal]
The matcher is unit-tested but has never run with real keys. Validate against ~30 tricky
names (regional, plurals, exotics) + 10 random seed and 5 user recipes; report resolutions
and cost from the logger's usage lines. Catches prompt-level misses no offline test can.

### N9 · App rebuild for client-side pieces — [You/Terminal]
Drink estimates + any card-copy changes ship inside the app bundle — they need a new
TestFlight build (backend deploys don't move them).

### N10 · Post-activation cost watch — [You]
First week after keys land: skim Railway logs for "ingredient resolution ran" usage lines.
Expected: cents (per-novel-ingredient, cached). If it ever isn't, N2's durable cache is the
first lever.

## Order

Cloud proceeds N1 → N2 → N3/N4 (pair) → N5 → N6 now; terminal runs N7 (+N8, N9) as soon as
the founder has the keys — the two tracks don't block each other. N7 can run before or after
N1–N6 land; re-running the idempotent refresh script re-trues the database either way.
