# Architecture

Status: current · Last verified at commit 0cbfaa9f · 2026-11-04

This folder describes how Otto is actually built, as read from the code: every
fact cites a `path:line`, and where code and comments disagree the code wins.
[C4.md](C4.md) is the C4 model: system context (the cook, household members,
and the outside services Otto depends on, such as the App Store, RevenueCat,
Supabase, OpenAI, the sign-in providers, TheMealDB, USDA and ottosapp.com),
containers (the Expo iOS app and web build, Postgres with RLS, Auth, Storage,
Realtime, the seven Edge Functions and the RevenueCat webhook path), the app's
feature modules, and two sequence diagrams (buying Otto Club, and an Ask Otto
chat turn streamed over SSE). [ERD.md](ERD.md) is the data model rebuilt from
`supabase/migrations/` in order: an entity-relationship diagram, a data
dictionary with PII and RLS per table, the RPCs and SECURITY DEFINER helpers,
and a cross-check against `src/types/database.ts`.
[EDGE_FUNCTIONS.md](EDGE_FUNCTIONS.md) is one contract per Edge Function
(route, auth, request and response shapes including streaming, status codes,
rate limits, external calls, env var names, callers and tests), ending with
the open questions and risks found while writing all three. Diagrams are
Mermaid (flowchart, sequenceDiagram, erDiagram), so GitHub renders them.
