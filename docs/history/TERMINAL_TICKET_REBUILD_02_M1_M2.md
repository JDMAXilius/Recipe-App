# TERMINAL TICKET — REBUILD 02 · M1 engine port + M2 platform

**Goal:** the two parallel tracks behind gate M3. M1 = port the nutrition
engine to `src/features/nutrition/engine/` behavior-identical. M2 = RLS
migrations, the 5 edge functions, and `shared/ui` + theme.

**Kick-off:** M0 signed off (founder, 2026-07-21) ✓ · contracts on
rebuild/v2 @ 81e5d6db ✓. Work branch: `rebuild/v2`.

## Packets

| Packet | Owner path | Definition | Acceptance |
|---|---|---|---|
| T2.1–2.5 engine | `src/features/nutrition/engine/` + `src/types/ids.ts` + root test glob | engine-porter | v1 suites (golden, macro, parse, resolveIngredient, resolveCooked, usdaProvider, carbCeiling) ported and green vs the TS port; 5 data JSONs single-copy, checksummed; zod schema parses cached seed_nutrition shape; tsc/lint clean |
| T3.1 RLS migrations | `supabase/migrations/` + `src/types/database.ts` | security-builder | schema+policies per database.md (SECURITY DEFINER share/collab fns, NO anon SELECT on shares); attack tests written; NOT applied to live project until terminal review |
| T3.2 edge functions | `supabase/functions/` | security-builder | 5 functions per FRAMEWORK §5, zod at boundaries, SSRF guard on import; deploy deferred to terminal |
| T3.3 shared/ui | `src/shared/` | ui-systems | 8 primitives + tokens per ui-components.md, a11y floor, renders on Expo web; tsc/lint clean |

Verification: verifier pass per packet (L1+L2), critic (REFUTER) over T3.1.
Gate M1 = engine suites green. Gate M2 = RLS survives refuters + ui renders.

## Report-back
```
engine:   suites __/__ vs port · data checksums Y/N
rls:      migrations written Y/N · attack tests __ · refuters survived __/3
functions: 5 written Y/N · deployed? (terminal)
ui:       primitives __/8 · web render Y/N
```
