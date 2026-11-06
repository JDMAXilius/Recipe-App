# ADR-0006: AI runs on OpenAI behind Supabase Edge Functions, with per-provider consent

- **Status:** Accepted
- **Date:** 2026-11-02 (backfilled)
- **Deciders:** Founder · release 1.0.22

## Context
Otto's AI features (Ask Otto chat, recipe generation, import from photo/text, nutrition matching) first ran on Anthropic's Claude. In 1.0.22 (build 51) the AI functions switched to OpenAI. Apple guideline 5.1.2(i) requires telling people before their data goes to a third-party AI.

## Decision
All model calls happen server-side in Edge Functions through `supabase/functions/_shared/openai.ts`; the app never holds a model key. Before the first AI call the app asks for consent that names OpenAI, stored per provider (`aiConsentOpenAI`), so a yes given for one provider never covers another.

## Consequences
Good: keys stay server-side; switching provider is one shared module plus a new consent key. Bad: docs written before 1.0.22 still say Claude (fixed 2026-11-04); consent is per device, not per account (scenario ticket S11).

## Amendment (2026-11-06, R0.13)
Consent also lives on the account: `profiles.ai_consent` (granted · declined), `ai_consent_provider`, `ai_consent_at`. Under flowV2 the app writes it with every answer and, on a phone with no answer, reads it from the account. An answer for another provider reads as unasked. Sign-out still clears the phone's copy. The server does not enforce it yet: builds before the rework don't write it, so a server check would cut off their AI. That check comes with the agent (1.2), for Siri and widgets that have no sheet to ask.

## Options considered
- Call the model from the app (rejected: exposes keys)
- Keep Anthropic (changed in 1.0.22; rationale not recorded in the commit)

## Evidence
- commit `fd5e3d5e` (2026-11-02)
- `src/shared/aiConsent.ts`
- `supabase/functions/_shared/openai.ts`
