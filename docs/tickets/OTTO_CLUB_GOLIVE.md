# Otto Club go-live — real subscriptions replacing the Test Store (2026-07-24)

**Goal:** a tester on TestFlight (and later the App Store) pays real money through Apple and the
`club` entitlement unlocks — no Test Store sheet, no placeholder prices anywhere.

**Pricing (founder call 2026-07-24): $34.99/year · $4.99/month · 5-day free trial · one tier.**

## Where we are (shipped in v1.0.15 / build 31)

- Paywall (`app/otto-club.tsx` → `OttoClubScreen`) has 3 runtime states: member / live store /
  honest "opens soon" fallback. Plan cards redesigned; launch prices shown.
- `useClub()` (`src/features/profile/club.purchases.ts`) wraps RevenueCat: offerings, buy,
  restore, entitlement listener. Entitlement id = **`club`** (must match the RC dashboard).
- The RC key lives in `club.purchases.ts` (`RC_API_KEY`, currently the Test Store `test_…` key,
  configured at module scope in `app/_layout.tsx`). While `RC_TEST_STORE` is true the paywall
  displays the launch prices above and ignores the Test Store's canned $79.99/$9.99 demo
  products; swapping in the real `appl_` key flips display back to store-authoritative —
  no other code change needed.
- Backend done: `public.memberships` (read-own-row RLS, service-role writes) fed by the
  `revenuecat-webhook` Edge Function (shared-secret header auth, re-fetches entitlement from the
  RC API per event — idempotent). RC webhook points at the function; `RC_WEBHOOK_SECRET` +
  `REVENUECAT_SECRET_KEY` set in Supabase function secrets.
- `Purchases.logIn(<supabase user id>)` synced in AuthProvider.
- Paywall carries the App-Review-required Terms/Privacy links (ottosapp.com/terms + /privacy).

## To go live (in order)

1. **Paid Applications Agreement + banking + tax in App Store Connect** — THE hard gate.
   Only the Account Holder (jdmaxinius@gmail.com) can sign. Nothing charges until active.
2. **Create the ASC subscription group + products** — yearly **$34.99** + monthly **$4.99**,
   both with the **5-day free intro offer**. The intro offer is what makes the in-app trial
   timeline honest: the paywall only advertises a trial the store actually grants.
3. **Connect ASC to RevenueCat** — use the In-App Purchase key `SubscriptionKey_HTA6549CWG.p8`
   (Key ID HTA6549CWG); import the two products; attach them to the `club` entitlement's
   offering (annual + monthly packages).
4. **Swap the SDK key**: replace `RC_API_KEY` in `club.purchases.ts` with the real `appl_…`
   key. That single change retires every Test Store behavior (fake sheet, price override).
5. **Gate Club features on `useClub().member`** — unlimited imports, unlimited saves/collections,
   meal plan + smart shopping list, unlimited Ask Otto + mid-cook help, offline cookbook.
   Always free: browse/search, cook any recipe, manual entry, Otto's personality.
   (Freemium, not hard gate — locked decision.)
6. **New native build** → TestFlight → sandbox-test a real purchase + restore + webhook row in
   `memberships`; verify the timeline copy reads "You'll be charged" (it keys off live mode).

## AI cost controls (founder call 2026-07-24: per-call engineering, NO user quota)

The contract lives on the AI calls themselves, not on a monthly user allowance:
- max_tokens 4000 output ceiling; stop_reason max_tokens/refusal returns the friendly
  502, never a half recipe (the tokens-exceeded clause).
- Input capped: 12-turn / 600-char transcript, ~500-token system prompts, json_schema
  output (no prose waste, no retry loops).
- Cheapest adequate model per job: sonnet chat/one-shot at effort medium with thinking
  steered off for everyday turns; haiku nutrition matching; opus only for photo vision.
- 20 calls per 15 min per user as the abuse guard; auth before any token is spent.
- TODO: log usage.input_tokens/output_tokens per call (no content) so cost per ask is
  measured, not guessed; use the Batch API (50% off) for non-interactive catalog jobs
  in the otto-new-recipes pipeline.

## Open loose ends

- `hello@ottosapp.com` (contact email in legal docs/support page) doesn't exist — add as alias.
- Test Store dashboard products still say $79.99/$9.99; harmless (app overrides), but aligning
  them in the RC dashboard avoids confusion during demos.

## Honesty rails (keep)

- Never advertise a trial the store's intro offer doesn't grant.
- Savings % computed only against our own real monthly price — no fake anchors.
- Store unavailable → "opens soon" fallback, never a dead buy button.
