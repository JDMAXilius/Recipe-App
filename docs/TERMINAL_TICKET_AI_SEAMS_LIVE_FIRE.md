# TERMINAL TICKET — AI seams live-fire + device QA of the new surfaces

The cloud session built and web-verified these features with STUBBED endpoints; none of the
Claude-calling seams has ever executed against the real API, and none of the new UI has had a
simulator/device pass (Linux box — no iOS toolchain, no live keys, Railway unreachable).
Prereq: `ANTHROPIC_API_KEY` on Railway + in `backend/.env`, current main deployed
(sha-check via `/api/health`).

## Task 1 — Live-fire the three user-facing AI seams

Run each against the deployed backend (or local backend with keyed .env), as a real user:

1. **Generation** ("Cook something up with Otto", `POST /api/generate`, Opus 4.8 structured
   outputs + adaptive thinking): ask for "a cozy 30-minute chicken dinner for 4, no dairy".
   Expect an editor-ready draft: weight-first measures ("500 g", "0.5 tsp" — decimals, no
   fractions), measure column holds ONLY amounts, unnumbered steps, sane servings. Also probe
   the decline gate: "a recipe for concrete" → 422 with a kind plain-language reason.
2. **Text import** (`POST /api/import/text`, Haiku): paste a real social-caption-style recipe;
   expect faithful extraction, nothing invented, is_recipe gate rejecting hashtag soup.
3. **Photo import** (`POST /api/import/photo`, Opus 4.8 VISION — never run live): photograph a
   real cookbook page AND a handwritten card AND a screenshot; expect faithful transcription,
   nulls where unreadable (never guessed), non-recipe photo (a dish photo) → 422. Watch one
   >2 MB photo go through (8 MB body path) and confirm the 401-before-buffer behavior is
   unchanged in prod.
4. For all three: pull the logger usage lines ("recipe generation ran", "caption extraction
   ran", "photo extraction ran") and note tokens/latency. Refusal/stop_reason handling paths
   can't be forced — just confirm no crashes on the declines above.

Wrong outputs (invented quantities, fraction glyphs, measure/name bleed) are PROMPT bugs —
paste examples in the thread; the cloud session owns the prompts.

## Task 2 — Simulator/device QA of this session's new UI (web-verified only so far)

On "iPhone 17 Pro Max" sim or device (dev build `com.otto.recipes`):

- Add sheet: Otto card collapsed by default → expands on tap (chevron + a11y expanded state);
  "Snap the recipe" card → real photo-library permission prompt → picker → "Otto's reading
  it…" → review editor; import-failed state shows BOTH "Write it myself instead" and "Have
  Otto cook one up instead" (the latter returns with Otto open).
- Editor: Otto button section on a blank New recipe only (not on edits/imports); generation
  fills the form in place, header flips to "Check Otto's work", sparkles banner, source note;
  unmeasured rows show the "amount" placeholder (never "500 g" ghost-values).
- Weight-first display spot-check stays intact everywhere (detail, cook mode, shopping kg
  roll-up) — screenshots to the thread.

## Task 3 — Standing note

When the cloud lands roadmap N2 (durable resolver cache), its idempotent schema script in
`backend/scripts/` must be RUN against prod like every schema change — watch for it in the
thread; nothing to do until then.

## Done when

- [ ] Three seams fired live; outputs + usage reported; any prompt bugs pasted back
- [ ] Sim/device pass done; screenshots in thread; any P1s fixed or reported
- [ ] (standing) N2 migration executed when it lands
