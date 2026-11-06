# Otto knows you: the agent's context, memory and retrieval (design)

Status: draft · Last verified against code at commit `6d6fd6f8` · 2026-11-06 · For Juan to decide the open questions (end of page), then an "ultra thinking" pass on the build order.

Juan, 2026-11-06: "The AI should be like an agent. It should have context based on the user: allergies, contracts, RAG for any information we have, what you are doing in the app and how you use it. So it knows you like this food and recommends based on your liking."

This page says what Otto should know, where each piece comes from, how it reaches the model, what the model may never do with it, and the order to build it in. It builds on `docs/learning/research_notes/Otto AI agent research/agent_architecture.md` §5 (structured memory, cacheable prefix) and the agent written today (`supabase/functions/otto-agent`).

## 1. What Otto can know, layer by layer

| Layer | What | Where it lives today | Gap |
|---|---|---|---|
| **1. Who you are** (you said it) | Household, diet, allergies, foods you skip, cuisines you like | `profiles` (account, RLS own row) | None. The agent already reads it; allergies and diet are hard filters in code |
| **2. What you do** (Otto saw it) | What you planned, cooked, swapped away, removed; what you saved; what you made yourself | `plan_entries`, `favorites`, `recipes`, `agent_actions` (all account, RLS) | No summary yet: raw rows only |
| **3. What you thought of it** | Thumbs up/down after cooking, plate photos, "cook again?" | `cookRatings`, `journal` in kv: **phone only** | Not on the account, so the agent can't use them and a new phone loses them |
| **4. What you told Otto** | "My son won't eat mushrooms", "we eat late on Tuesdays", "batch-cook on Sundays" | Nowhere (chats are phone-only and pruned after 30 days) | A memory table the person can see and delete |
| **5. Where you are right now** | Today, this week, the screen you're on and the recipe or day in front of you, the shopping list | The app knows; the agent gets `today` and reads the week | The app sends the surface and the item in view |
| **6. What Otto's kitchen holds** | 795 catalogue recipes, your own recipes, how the app works (FAQ) | `otto_recipes`, `recipes`, `FaqScreen` copy | Retrieval is keyword-only (title `ilike`); no meaning search; FAQ isn't reachable by the model |

"Contracts" in Juan's note is read as **rules the agent must keep** (section 4), the same idea as the action catalogue's specs: every tool has a schema, a risk level and a code-enforced boundary.

## 2. How it reaches the model

The prompt is built **server-side, per turn**, never by the app (the app can't forge another person's context, and nothing personal is cached on someone else's device).

Order (cache-friendly, from the research note): system rules → tool schemas → **profile block** → **taste summary** → **memories** → **situation** → the last turns.

- **Profile block** (layer 1): one short paragraph. Allergies and diet stated as "filtered for you", not as instructions the model must remember.
- **Taste summary** (layers 2 and 3), computed in code, not by the model, so it's testable and cheap:
  - top cuisines and categories by what you cooked in the last 8 weeks;
  - dishes cooked twice or more ("favourites in practice");
  - dishes or ingredients you swapped away or thumbs-downed more than once ("Otto avoids");
  - how you plan: dinners only or every meal, how many nights, weekday vs weekend.
  About 10 lines. Recomputed when the inputs change, stored in a `taste_profiles` row (own row, RLS), so a turn reads one row instead of scanning history.
- **Memories** (layer 4): at most 20 short facts, each with where it came from ("you told Otto on 3 Nov").
- **Situation** (layer 5): "on Plan, looking at Thursday", "on the recipe Thai green curry".
- **Retrieval** (layer 6) is a **tool**, not a prompt dump: the model asks for dinners ("something cosy with what I cooked last week", "like the ramen I loved"); the tool searches by meaning, applies the hard filters **in SQL**, and ranks with the taste summary **in code**. The model sees 8–12 candidates and explains its pick.

## 3. Recommendations ("you like this, so try that")

Ranking happens in code; the model only chooses among safe candidates and says why. Score = closeness in meaning to what you cook and rate well + your cuisines + variety (not the same category two nights running, not something you had this week) − things you avoid. The same ranking feeds:
- the agent's `find_dinners` (Plan with Otto, the Otto tab);
- "Otto, plan my week" (today's deterministic button gets smarter without becoming AI);
- a Home row "Picked for you" (no AI call at all).

Every suggestion can say *why* in plain words ("you cooked three Thai dishes this month"), from the same numbers — never an invented reason.

## 4. Rules the agent keeps (the contracts)

Enforced in the function, not in the prompt (the model can be talked out of a prompt):
1. **Only your data.** Every read uses your token (RLS). The model never sees another person's rows; a shared kitchen shows only what the kitchen already shares.
2. **Allergies and diet are filters, not suggestions.** Applied in SQL/code before the model sees a dish. The model can't turn them off; no such parameter exists. A dish you ask for by name that has your allergen comes back `blocked`, shown in system text the model can't reword.
3. **Never changes** allergies, diet, billing, the household, or deletes anything. Memories it suggests are shown and can be removed; it can't edit layer 1.
4. **Everything it changes is logged and undoable** (`agent_actions`).
5. **Data, not instructions.** Recipe titles, your notes and imported text are passed as quoted data; text that says "ignore your rules" is just a title.
6. **Small and honest context.** Summaries, not transcripts. No other app's data, no contacts, no location.

## 5. What the person sees and controls

- **Account → What Otto knows** (new): the profile (edit), the taste summary in plain words, the memories (delete any, or all), and a switch **"Use my cooking history for suggestions"**. Off → Otto uses only layer 1 and the situation.
- Download my data includes `taste_profiles` and memories; deleting the account removes them (cascade).
- The privacy answers gain **Product Personalization** (linked, not tracking) — T5 before the build ships.

## 6. Build order (proposal for the ultra-thinking pass)

| Step | What | New pieces | Size |
|---|---|---|---|
| A | **Situation + taste summary** in otto-agent from existing rows (plan, favorites, own recipes, agent_actions) | `taste.ts` (pure, tested); the app sends `surface` | S |
| B | **Ratings and journal on the account** | `cook_ratings` table (+ the journal's text, photos stay on the phone or move to Storage — decide), kv becomes cache | M |
| C | **Memories** | `agent_memories` table; `remember` / `forget` tools (risk: confirm-visible); "What Otto knows" screen | M |
| D | **Meaning search (RAG)** over the catalogue and your own recipes | `pgvector`; embeddings per recipe (title, ingredients, tags) built once (Terminal, like T13) and on save; `match_dinners` RPC applying the hard filters in SQL | M/L |
| E | **Ranking** shared by the agent, "plan my week" and Home "Picked for you" | `rank.ts` (pure, tested) | M |
| F | **How-to answers** (FAQ retrieval) so Otto can explain the app | FAQ as data; a `how_to` tool | S |

A and E give most of the "it knows what I like" feeling with no new data collected. B–D add memory and meaning search.

## 7. Open questions for Juan

1. **History on by default?** Recommendation: on, with the switch in Account and the privacy answer updated. Off by default would make most people never get it.
2. **Chats on the account?** Recommendation: not now. Otto remembers facts you confirm (layer 4), not whole conversations. (Scenario S9 asked the same.)
3. **Plate photos:** keep on the phone (recommended for now) or move to Storage so they follow you?
4. **Embeddings provider:** OpenAI again (already disclosed as the processor) — recommended.
5. **Kitchen members:** should Otto use the other members' tastes when planning for a shared kitchen? Recommendation: only their allergies and skips (safety), not their history, unless each member opts in.
