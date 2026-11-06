# Terminal ticket: risks found while drawing the architecture from code

> **Budget:** A1 needs Juan's OK and one command; A2–A5 are one small PR; B items ride with the next build. Written 2026-11-04.
> Source: `docs/architecture/EDGE_FUNCTIONS.md` (open questions, with `path:line` evidence), `docs/architecture/ERD.md`, `docs/architecture/C4.md`. Each item below was re-checked against the code before it was written here.

## A — fix soon
- [x] **A1. Retire `canonicalize`** *(done 2026-11-06: replaced in production by a 410 stub; delete it from the dashboard when convenient)* (money + abuse). It is **ACTIVE in production** (version 14, read from the Supabase project on 2026-11-04). It has no user check: `verify_jwt` passes with the anon key, which ships in the app, and the code relies on that (`supabase/functions/canonicalize/index.ts:5-13, 213-216`). Anyone can spend OpenAI tokens through it, up to 1000 calls an hour per isolate. Its own header says it is deleted after the one-time 792-recipe batch, which has shipped (`OWN_RECIPE_DB.md` is in `docs/history/`). **Ask Juan**, then `supabase functions delete canonicalize` and remove the folder (keep `tools/canonicalize-recipes.mjs` working offline or note that it needs the function redeployed).
- [x] **A2. Household invite codes** *(done 2026-11-06: CSPRNG codes; 10 join tries per 15 min in `join_household`)*: 6 characters from `Math.random` (`src/features/household/household.queries.ts:37`) and `join_household` has no attempt limit. Use `crypto.getRandomValues` (already polyfilled for share tokens) and rate-limit joins in the RPC or an edge function.
- [ ] **A3. Deleting a kitchen's creator deletes the kitchen for every member** *(written: `20261106060000_household_owner_handover.sql`; waits for Juan to run it in the SQL editor)*: `households.created_by … on delete cascade` (`supabase/migrations/20260722120000_households_shared_shopping_list.sql:7`). Hand ownership to the next member (or set null) before the auth user goes, in `admin_delete_user_data`.
- [x] **A4. `revenuecat-webhook`** *(done 2026-11-06: 6 s timeout, missing key → 503 with a clear log; deployed v11)*: the RevenueCat fetch has no timeout, unlike every other upstream call; a missing `REVENUECAT_SECRET_KEY` makes every event 502 and RevenueCat retries forever. Add the shared timeout and fail with a clear log line.
- [x] **A5. Run the RLS attack suite** *(done 2026-11-06: `npm run test:rls` against a throwaway local stack, by hand before a migration is pushed (no GitHub CI); 78 checks incl. events and the join limit)*: `supabase/migrations/tests/rls-attacks.test.mjs` is not part of `npm test` or CI. Wire it into CI against a local Supabase, or document the manual run in `TESTING.md`.

## B — correctness and drift
- [ ] **B1. Regenerate `src/types/database.ts`**: last generated 2026-07-23, before the `memberships` migration; `memberships` is missing.
- [x] **B2.*(done 2026-11-06: 402/429/503 from generate-recipe pass through; import-recipe v16)*  `import-recipe` hides 402 / 429 / 503 from `generate-recipe` behind a 422**, so a lapsed member or a rate limit reads as "couldn't read that recipe". Pass the status through.
- [x] **B3.*(done 2026-11-06; the frozen nutrition engine's history comments and aiConsent's provider note are left as true history)*  Code comments that still name Anthropic / Claude / Sonnet**: `ChatScreen.tsx:121`, `chat.queries.ts:29`, `import.queries.ts:99`, `AddSheet.tsx:126`, `nutrition.queries.ts:60`, `nutrition/engine/lookup.ts:4`, `ProfileScreen.tsx:274`, `resolve-nutrition/index.ts:12`. `_shared/http.ts:1` says 5 functions (there are 7).
- [ ] **B4. Privacy**: `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` still names Anthropic as the AI vendor (rows 7, 12, 13, 17, vendor table); the live privacy policy too (ROADMAP Phase 0). Juan re-audits before the next submission; answers are an attestation.
- [x] **B5.*(done 2026-11-06: supabase/config.toml)*  `supabase/config.toml`**: per-function `verify_jwt` is only in the dashboard (all on except `revenuecat-webhook`). Commit a config so a redeploy can't flip it.
- [ ] **B6. Ask Otto never sends diet or cuisines** (`ChatScreen.tsx:81`), so allergies and diet are ignored in chat. Ties to ADR-0010 (prefs on the account).

## Rules
Code changes in small PRs; `npm run typecheck`, `npm run lint`, `npm test` once per PR. Production changes (A1 delete, A2/A3 migrations) only after Juan says yes. Update `docs/architecture/` and its Status line in the same commit.

## Log
<!-- append: date, item, result, commit -->
