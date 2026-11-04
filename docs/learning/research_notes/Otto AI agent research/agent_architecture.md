# In-app AI agent for Otto: architecture, action layer, UX, voice, cost, safety, App Review

Research notes, 2026-11-04. Scope: an "Otto can do anything you can do by hand" assistant for an Expo/React Native app with Supabase (RLS, user JWT) and OpenAI called only from Edge Functions.

**Source-access caveat (read first):** this session could not reach `platform.openai.com`, `developers.openai.com` or `simonwillison.net` (blocked by the network allowlist). Everything about OpenAI below comes from search-result summaries of official pages, the openai.github.io Agents SDK docs (as indexed), or third-party trackers. All OpenAI prices and model names are therefore **unverified against OpenAI's own pricing page** and must be checked before they go into a budget. Apple's guidelines page and Anthropic's agents essay were read directly.

---

## 1. Tool calling as the action layer: which OpenAI API, and where tools execute

### Takeaway
Use the **Responses API** with **function tools in strict mode**, driven by a **server-side agent loop in a Supabase Edge Function** that runs each tool **with the user's forwarded JWT**, so RLS applies to every AI action exactly as it does to manual ones. Tools that only make sense on the device (timers, reminders, calendar export, navigation) come back to the client as **proposed client actions** that the app runs itself. The Assistants API is gone, so don't build on it. The Agents SDK is optional. A hand-rolled loop of about 100 lines is easier to debug in Deno.

### Cited Findings
- OpenAI keeps supporting Chat Completions but recommends Responses for new projects. The Assistants API (`/v1/assistants`) shut down on 2026-08-26, and its replacement is Responses plus the Conversations API — [OpenAI Developer Community: Assistants API deprecation](https://community.openai.com/t/assistants-api-beta-deprecation-august-26-2026-sunset/1354666); [syntackle migration write-up](https://syntackle.com/blog/openai-assistants-to-responses-api/)
- Responses has built-in tools that Chat Completions lacks, and it drops some parameters (`n`, `seed`, `logprobs`, per a third-party source). A blog cites OpenAI internal tests showing 40–80% better cache utilization on Responses than on Chat Completions. This is second-hand and unverified — [restfulapi.net](https://restfulapi.net/responses-api-vs-chat-completions/); [ml4devs](https://www.ml4devs.com/articles/openai-responses-api-vs-chat-completions/)
- A single blog claims that from GPT-5.4 onward, Chat Completions only allows tool calling when `reasoning_effort` is `none`. This is unverified, but if it's true it is another reason to choose Responses — [aifreeapi](https://www.aifreeapi.com/en/posts/chat-completions-vs-responses-api)
- In Responses, a function tool's `name`, `description`, `parameters` and `strict` sit at the top level of the tool object, not nested under `function`. Calls come back as output items of `type: "function_call"`, and results go back as outputs matched by call ID. Parallel calling is on by default — [apiyi docs mirror (third-party)](https://docs.apiyi.com/en/api-capabilities/openai/function-calling)
- A third-party guide says strict mode is incompatible with parallel function calls and recommends `parallel_tool_calls: false` when you need strict guarantees. This is not verified against OpenAI's current docs — [apiyi docs mirror](https://docs.apiyi.com/en/api-capabilities/openai/function-calling)
- A community report says `parallel_tool_calls: true` on Responses produced only one call per response, while the same setup on Chat Completions produced parallel calls. The thread has no resolution — [OpenAI community](https://community.openai.com/t/responses-api-parallel-tool-calls-not-happening/1226942)
- Agents SDK (TypeScript): a tool's `needsApproval` takes `true` or an async predicate. It is evaluated after the arguments parse, and malformed JSON or a non-object "fails closed". The run pauses with `interruptions`, and you resume after `state.approve()` / `state.reject()`. The guide says the server should own this state: "Do not accept replacement tool calls, arguments, approval records, or serialized state from the client." — [Agents SDK JS: Human-in-the-loop](https://openai.github.io/openai-agents-js/guides/human-in-the-loop/)
- For Responses chaining, pass `lastResponseId` as `previousResponseId` (the lightest server-managed continuation). `conversationId` (Conversations API) shares one named conversation across services — [Agents SDK JS: Running agents](https://openai.github.io/openai-agents-js/guides/running-agents/)
- Tool guardrails run on every guarded function-tool call. Input guardrails run only for the first agent and output guardrails only for the final agent — [developersdigest 2026 overview (secondary)](https://www.developersdigest.tech/blog/openai-agents-sdk-whats-new-2026)
- Supabase: forward the request's `Authorization` header into `createClient(..., { global: { headers } })`, built per request inside `Deno.serve`, so queries run under the caller's RLS. The client uses the anon/publishable key, and the service-role key would bypass RLS. With `verify_jwt = true` (the default), the platform checks the JWT before your code runs — [Supabase: Securing Edge Functions](https://supabase.com/docs/guides/functions/auth.md); [Supabase: auth-legacy-jwt](https://supabase.com/docs/guides/functions/auth-legacy-jwt)
- OWASP LLM06 Excessive Agency mitigations: run extensions under the user's security context, not a broad high-privilege identity. Keep authorization in external systems, not in the model — [Aembit summary of OWASP 2025](https://aembit.io/blog/owasp-top-10-llm-risks-explained/)
- Anthropic: start with the simplest solution and add complexity only when needed. Frameworks "can hide prompts and responses", so start with LLM APIs directly. Workflows (predefined code paths) suit well-defined tasks, and agents suit open-ended ones — [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

### Inferences
- **Recommended execution split for Otto:**
  1. **Server-executed tools (most of them).** These are data mutations on Supabase tables: plan, recipes, list, prefs. The Edge Function `otto-agent` builds a per-request Supabase client with the user's JWT, so the AI physically cannot touch rows the user couldn't. This satisfies OWASP LLM06 ("user's security context") with no extra auth code. Never use the service-role key inside the agent loop.
  2. **Client-executed tools.** These are things that live on the device: `set_timer`, `set_reminder` (local notifications), `export_to_calendar` (EventKit via expo-calendar), `navigate_to`, `start_cook` (cook-mode screen), haptics. The server returns them as `client_actions[]` in its response, the app runs them through the same action layer as the UI, and the result (ok/denied) goes back on the next turn.
  3. **"Server proposes, client executes" for everything** is the alternative. It is simpler on auth, but it puts the tool loop's round trips over the mobile network and lets a modified client fabricate tool results. The SDK guidance against accepting client-supplied tool calls or approval state points the same way. Use it only for device-native actions.
- **Loop shape:** `while (response has function_call && steps < 6)`: validate the args again in code (Zod) even with `strict`, run the tool, append `function_call_output`, call again. Cap the step count and wall time, since Edge Function limits apply. Stream text and card events to the client over SSE.
- **Strict vs parallel:** because of the reported incompatibility, default to `strict: true` with `parallel_tool_calls: false`. Allow batching through **coarse "batch" tools** (e.g. `plan_week` returns seven days in one call, `add_to_list` takes `items[]`) instead of relying on parallel calls. Verify this against OpenAI's docs once the host is reachable.
- **Agents SDK vs hand-rolled:** the SDK's `needsApproval` plus serializable `RunState` maps neatly onto "pause for the confirm card, then resume". It runs in Deno only if the npm package is compatible, which is untested here. A hand-rolled loop with a `pending_actions` table gives the same thing and stays transparent, in line with Anthropic's advice.

### Gaps
- I could not read OpenAI's function-calling guide directly, so these remain unconfirmed: the exact strict-mode schema rules (all fields `required`, `additionalProperties: false`, nullable optionals), the `allowed_tools` / `tool_choice` options, whether strict and parallel are still incompatible in 2026, and the current maximum tool count.
- I did not confirm that the Agents SDK JS package runs on Supabase's Deno Edge Runtime.
- I did not verify whether `getClaims()` (vs `getUser()`) is the current recommended supabase-js call.

---

## 2. Designing the action catalogue (one typed layer for UI, AI and Siri)

### Takeaway
Define each user capability once, as a typed **Action** (name, Zod schema, risk level, `execute`, `inverse`/undo). Generate from it the OpenAI tool JSON schema, the UI handlers and, later, native App Intents. Keep the AI-visible set **well under 20–50 tools**: use verb_noun names, coarse batch-capable actions, IDs over free text, and an idempotency key per call.

### Cited Findings
- Shopify Sidekick: at roughly **20–50 tools**, tool boundaries blur and combinations of tools produce unexpected results. The system prompt suffered "Death by a Thousand Instructions". Their fix was **JIT instructions** returned alongside tool results when relevant, which also avoids breaking prompt caches. They advise against multi-agent setups early ("simple single-agent systems can handle more complexity than you might expect") and favor tool quality over quantity — [Shopify Engineering: Building production-ready agentic systems](https://shopify.engineering/building-production-ready-agentic-systems)
- One critique of JIT: the model only sees a tool's instructions after it calls that tool, so they can't help it choose the tool in the first place — [secondary summary in search of Shopify coverage](https://theaiengineer.substack.com/p/how-shopify-built-sidekick)
- Anthropic on the agent-computer interface (ACI): give tool definitions "just as much prompt engineering attention" as prompts, write tool docs as you would for a junior developer (with examples and edge cases), test with many inputs, and **poka-yoke** the arguments ("Change the arguments so that it is harder to make mistakes"). In their SWE-bench work, requiring absolute paths removed a whole class of errors, and they spent more time optimizing tools than prompts — [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- OWASP LLM06: every tool given to an agent should have a specific justification. Excessive functionality, excessive permissions and excessive autonomy are the three root causes — [ByteHide LLM06](https://docs.bytehide.com/products/radar/sast/owasp/llm06-2025); [Aembit](https://aembit.io/blog/owasp-top-10-llm-risks-explained/)
- Apple (WWDC26): **App Intents** are the base layer for Siri. **Intent schemas** let people act on app content "naturally, with no specific phrases to define", and **entity schemas** feed the Spotlight semantic index. On-screen awareness uses `NSUserActivity` (one main item) or **View Annotations** (complex layouts) — [WWDC26 "Build intelligent Siri experiences with App Schemas"](https://developer.apple.com/videos/play/wwdc2026/240/); [WWDC26 "Explore advanced App Intents features"](https://developer.apple.com/videos/play/wwdc2026/343/); [Apple Intelligence for developers](https://developer.apple.com/apple-intelligence/)
- Apple's newsroom (Sept 2026) announces the shipped "Siri AI" with on-screen awareness and "even more systemwide app actions". A third-party report lists a developer preview on 27.3 betas. Version details conflict across sources — [Apple Newsroom](https://www.apple.com/newsroom/2026/09/siri-ai-a-profoundly-more-capable-and-personal-assistant-is-here/); [basic-tutorials (unverified)](https://basic-tutorials.com/news/siri-ai-opens-up-to-all-apps-developer-preview-with-app-intents-and-skills/)

### Inferences
- **Proposed catalogue (about 16 AI-visible tools, grouped):**
  - *Read* (risk 0, no confirm): `get_plan(week)`, `search_recipes(query, filters)`, `get_recipe(id)`, `get_list()`, `get_prefs()`.
  - *Plan* (risk 1, act-then-undo): `add_to_plan(recipe_id, date, servings?)`, `move_plan_item(item_id, to_date)` (this covers swap), `remove_from_plan(item_id)`, `plan_week(week, constraints)`. The last one returns a *draft*, and committing it is a separate `apply_plan_draft(draft_id)`.
  - *Recipes* (risk 1): `save_recipe(recipe_id)`, `create_recipe(draft)`. Imports go through a sanitizing pipeline (section 6) and are never written raw.
  - *List* (risk 1): `add_to_list(items[])`, `check_items(item_ids[], checked)`, `add_plan_to_list(week)`.
  - *Device* (client-executed): `start_cook(recipe_id)`, `set_timer(seconds, label)`, `set_reminder(at, text)`, `export_to_calendar(week)`.
  - *Prefs* (risk 2, always confirm): `update_prefs(patch)`. Allergies are **not** writable by the model at all (section 6).
  - *Never AI-visible*: delete account, subscription and billing, household membership changes, clearing a whole cookbook.
- **Naming:** `verb_object` snake_case, one verb per intent. "Swap" is a UI word and should map to `move_plan_item`/`replace_plan_item` so the model doesn't need two near-duplicate tools (the Shopify blurring problem).
- **Poka-yoke for Otto:** take IDs (`recipe_id`, `item_id`) returned by read tools, never recipe titles. Dates are ISO `YYYY-MM-DD`, with the server resolving "Thursday" relative to the user's timezone *before* the call, or the tool accepting an enum `mon..sun` plus a `week_start` ISO date. Servings is an integer 1–12.
- **Idempotency:** each mutating call carries `idempotency_key = hash(response_id, call_id)`. The Edge Function stores it in an `agent_actions` table with a unique constraint, so retries (network, model re-emits) can't double-add.
- **Undo:** each action's `execute` returns an `inverse` payload, e.g. `move_plan_item(item, from_date)`, which is written to `agent_actions`. "Undo" in the UI replays the inverse through the same action layer. This also gives you the activity log (section 3) for free.
- **One source of truth:** a `src/shared/actions/` module (TS) exports `{ name, description, schema (zod), risk, runsOn: 'server'|'client', execute, inverse }`. `zod-to-json-schema` produces the OpenAI tool definitions, and the Edge Function imports the same schemas (a shared package or a copied file with a test that checks they match). The UI calls the same `execute`. This is what makes "everything manual is also available to AI" true, and testable: a test fails if a UI mutation has no Action.
- **Siri/App Intents later:** Expo doesn't expose App Intents natively. It needs a Swift module (Expo Modules API) that declares `AppIntent`s mirroring the risk-0/1 actions and calls into the JS layer or straight into Supabase. Apple's intent and entity schemas are a reason to model `Recipe` and `PlanDay` as clean entities now.

### Gaps
- I found no source on Expo/React Native bridges for App Intents or intent schemas as of iOS 26/27. This needs a targeted check.
- I did not verify the exact App Schema domains Apple offers. It is unknown whether a "recipes/meal planning" domain exists.

---

## 3. UX patterns for an agent acting on the user's behalf

### Takeaway
Use **act-then-undo** for cheap, reversible, in-app changes, and **preview-then-confirm** only for irreversible, bulk or outward-facing ones. Show results as **cards** (generative UI), not prose. Keep a visible **activity log** with per-action undo, and ask clarifying questions only when a wrong guess would be costly.

### Cited Findings
- Microsoft HAX Guideline 9, "Support efficient correction": "Make it easy to edit, refine, or recover when the AI system is wrong." Pattern 9C, "Undo automated actions", lets users revert to an earlier state and says the system should first show what it changed. HAX also warns that repeated correction can cost users more than doing the task themselves — [Microsoft HAX Toolkit Pattern 9C](https://www.microsoft.com/en-us/haxtoolkit/pattern/g9-c-undo-automated-actions/)
- Google's agent guidance (web.dev): "Before executing sensitive actions, such as returns, refunds, address changes, the agent should summarize the action and request user confirmation." — [web.dev: Design AI user experiences](https://web.dev/learn/ai/ux-patterns)
- Practitioner guidance: approving every step trains reflexive approval, so interrupt only for irreversible, costly or outward-facing actions. Offer undo per action, not only a global restore, and say upfront when something can't be undone — [setproduct: 16 AI agent UI patterns](https://www.setproduct.com/blog/ai-agent-ui-design-patterns); [tremoloo: Agentic UX patterns](https://www.tremoloo.com/blog/agentic-ux-design-patterns)
- A coding-agent paper describes an operation log with single-command undo, backed by a shadow repository. This is an analogue for an activity log with undo — [arXiv 2603.05344](https://arxiv.org/pdf/2603.05344)
- Anthropic's core principle 2: "Prioritize transparency by explicitly showing the agent's planning steps." — [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- Klarna's assistant (Feb 2024) handled 2.3M conversations in its first month (two-thirds of service chats), with satisfaction it reported as on par with humans and 25% fewer repeat inquiries. Humans stayed available for complex cases. Critics found it reciting docs and handing off quickly — [HubSpot on Klarna](https://blog.hubspot.com/ai/klarna-ai-assistant); [Fast Company](https://www.fastcompany.com/91039401/klarna-ai-employees-layoffs)

### Inferences
- **Risk tiers mapped to UX for Otto:**
  - Risk 0 (read): just answer, with cards.
  - Risk 1 (single reversible change: move a dinner, add to list, check items): **act, then show a toast or snackbar with Undo** ("Moved salmon to Friday · Undo"), and write the change to the log.
  - Risk 1-bulk (`plan_week`, `add_plan_to_list` with more than ~5 items, replacing an existing week): **preview card with "Use this plan" / "Tweak"**. The draft lives server-side, and `apply_plan_draft` commits it in one transaction with a single undo.
  - Risk 2 (prefs, anything touching allergies or diet, calendar export, deleting user recipes): **always confirm**, using the native-feeling sheet or alert pattern.
- **Generative UI:** the agent response is `{ text?, cards: [{type:'plan_week'|'recipe'|'list_diff'|'action_receipt', data}] , client_actions[] }`. The app renders cards with existing design-system components (RecipeCard, PlanDayRow), so AI output looks like the app, not like chat. Cards carry their own action buttons, which call the shared action layer directly with no model round trip.
- **Activity log:** an "Otto did" list (in the Otto AI tab, or in Account) that reads `agent_actions`, with per-row undo for 24h or until conflicting manual edits. This satisfies HAX 9C and makes trust auditable.
- **Interruption:** a Stop button cancels the SSE stream and aborts the loop server-side (AbortController). Already-applied steps stay in the log, so they can be undone.
- **Clarifying questions:** ask only when (a) the action is risk 2, or (b) the ambiguity changes the outcome a lot ("which Thursday?" when two weeks are visible). Otherwise pick the sensible default and offer undo. HAX's correction-cost warning argues against over-asking.
- **Proactive suggestions:** surface at most one, as a card on Home or Tonight ("Thursday is empty; want a 20-min dinner?"). Never as push notifications by default. Dismissing it means don't repeat it this week.

### Gaps
- No NN/g material on agent confirmation or undo was retrieved, and the PAIR guidebook wasn't read directly.
- I didn't research these case studies in depth: Instacart (Ask Instacart), Duolingo Max, Notion AI agents, Perplexity, Gemini in Google apps, ChatGPT apps/Operator, Apple Intelligence UX. There are no cited findings here for those products.
- Klarna's later re-hiring of human agents (reported in 2025) wasn't confirmed in this pass.

---

## 4. Realtime voice agents

### Takeaway
OpenAI Realtime (speech-to-speech over WebRTC, with function calling) is viable for a hands-free cook mode. The app gets a **short-lived client secret** minted by an Edge Function and connects directly to OpenAI. Tool calls arrive on the client data channel and should be **relayed to the server action layer**. Expect roughly **$0.02–0.05/min on the mini model and $0.05–0.15/min on the full model** (third-party estimates). Model names are in flux: gpt-realtime and gpt-realtime-mini are reportedly being replaced by the 2.1 versions.

### Cited Findings
- Ephemeral flow: the backend creates a short-lived key via the `client_secrets` endpoint (lifetime 10–7,200 s, default 600 per one guide), and the client exchanges SDP with the calls endpoint using that key, so the real API key stays on the server — [forasoft Realtime WebRTC guide](https://www.forasoft.com/blog/article/openai-realtime-api-webrtc-sip-websockets-integration); [Agents SDK JS Voice quickstart](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/)
- Pricing (third-party, unverified). gpt-realtime text tokens: $4 in / $0.40 cached / $16 out per 1M. gpt-realtime-mini text: $0.60 / $0.06 / $2.40. gpt-realtime-2.1 audio: $32 in / $0.40 cached / $64 out per 1M, and the 2.1-mini audio: $10 / $0.30 / $20 — [morphllm](https://www.morphllm.com/openai-api-pricing); [mer.vin on gpt-realtime-2.1](https://mer.vin/2026/07/gpt-realtime-2-1-api-reasoning-voice-agents-and-mini-pricing/)
- Per-minute estimates: about $0.05–0.15/min for a two-way conversation on gpt-realtime-2.1 and $0.02–0.05/min on 2.1-mini. Another estimate puts the base model at about $0.019/min listening and $0.077/min speaking — [forasoft pricing](https://www.forasoft.com/blog/article/openai-realtime-api-pricing); [cekura](https://www.cekura.ai/blogs/openai-realtime-api-pricing); [layer3labs](https://www.layer3labs.io/guides/openai-realtime-api-pricing)
- Several sources report that gpt-realtime and gpt-realtime-mini shut down on 2027-01-20, replaced by gpt-realtime-2.1 and 2.1-mini. This is unverified — [maxim](https://www.getmaxim.ai/articles/gpt-realtime-api-production/); [forasoft](https://www.forasoft.com/blog/article/openai-realtime-api-pricing)
- The Agents SDK has a `RealtimeAgent` for voice agents, with tracing for Realtime — [OpenAI community announcement](https://community.openai.com/t/updates-to-building-agents-typescript-agents-sdk-a-new-realtimeagent-feature-for-voice-agents-traces-for-realtime-and-speech-to-speech-improvements/1277152)

### Inferences
- **Security wrinkle:** with WebRTC the model talks to the *client*, so function calls surface on the device. Don't execute data mutations from the device's own say-so. Instead, relay each `function_call` to the `otto-agent` Edge Function, which runs it with the user's JWT and the same validation and undo, then send the result back into the session. Device actions (timer, next step) run locally.
- **Mint secrets server-side** in an Edge Function that checks the `club` entitlement and the AI-consent flag first (ADR-0005, ADR-0006). Use short TTLs (e.g. 60–120 s to start; the session itself continues) and per-user minute quotas.
- **Text pipeline alternative** (on-device STT via iOS Speech, then the text agent, then iOS `AVSpeechSynthesizer` or OpenAI TTS): this is far cheaper (it uses the text-model cost from section 5) and keeps one agent path, at the cost of higher latency and less natural turn-taking. **Recommendation: v1 voice = push-to-talk using the text pipeline. Realtime is a later premium "hands-free cook mode" once usage justifies it.**
- Cook mode is the natural voice use case: hands dirty, short commands ("next step", "set a timer for 8 minutes"). These are mostly client-executed actions, which suits Realtime's client-side tool events.

### Gaps
- No verified OpenAI-published latency numbers were gathered, and I couldn't verify `react-native-webrtc` compatibility with the Realtime calls endpoint in Expo SDK 54 (it needs a dev client or config plugin).
- Official transcription (`gpt-4o-mini-transcribe`) and TTS prices weren't retrieved.

---

## 5. Memory, context and cost per active user

### Takeaway
Keep a **stable, cacheable prefix** (system prompt plus tool schemas) and a **small per-turn context block** built server-side from Supabase: household size, diet, allergies (as hard constraints, read-only), this week's plan summary and the last N messages. On a small model this comes to **cents per active user per month** for text (estimates below). Voice is the only cost line that matters.

### Cited Findings
- GPT-5 mini: $0.25 input / $0.025 cached input / $2.00 output per 1M tokens. GPT-5 nano: $0.05 / $0.005 / $0.40. These are consistent across trackers — [silicondata](https://www.silicondata.com/use-cases/openai-api-pricing-per-1m-tokens); [morphllm](https://www.morphllm.com/openai-api-pricing); [benchlm](https://benchlm.ai/openai/api-pricing)
- GPT-5.4 mini is listed at $0.75 / $0.075 / $4.50, and GPT-5.4 nano at $0.20 / $0.02 / $1.25 (reportedly deprecated, callable until 2027-04-01). Newer names (a GPT-6 family) appear only in one or two trackers, so they're unconfirmed — [morphllm](https://www.morphllm.com/openai-api-pricing); [modelpricing.ai](https://modelpricing.ai/models/openai)
- Shopify: JIT instructions in tool results keep the core prompt small and avoid breaking prompt caches — [Shopify Engineering](https://shopify.engineering/building-production-ready-agentic-systems)
- `previousResponseId` gives server-managed continuation on Responses, so you don't resend history — [Agents SDK JS: Running agents](https://openai.github.io/openai-agents-js/guides/running-agents/)

### Inferences (all costs are ESTIMATES from unverified third-party prices)
- **Assumptions per agent turn:** 2 model calls (tool, then answer). Each call has ~6,000 input tokens (system ~1.5k, 16 tool schemas ~3k, context ~1k, history ~0.5k), 80% of them cached, and ~400 output tokens.
  - GPT-5 mini: per call 1.2k×$0.25/M + 4.8k×$0.025/M + 0.4k×$2/M ≈ $0.0003 + $0.00012 + $0.0008 ≈ **$0.0012**, so ≈ **$0.0024 per turn**.
  - GPT-5.4 mini: ≈ $0.0009 + $0.00036 + $0.0018 ≈ **$0.0031/call**, so ≈ **$0.006 per turn**.
  - `plan_week` (10k input, 2k output): ≈ $0.006 (5 mini) / $0.012 (5.4 mini).
- **Per active user per month (text):**
  - Typical (30 turns + 4 plan_week): ≈ **$0.10** on GPT-5 mini, ≈ **$0.23** on GPT-5.4 mini.
  - Heavy (150 turns + 8 plan_week): ≈ **$0.41** / **$1.00**.
- **Voice:** 10 min/month on realtime-mini at $0.02–0.05/min ≈ **$0.20–0.50**. Heavy cook-mode use (60 min) ≈ **$1.20–3.00** on mini, or $3–9 on the full model. This is why Realtime should sit behind quotas.
- **Caching discipline:** order the prompt so that system prompt, then tool definitions (sorted and stable), then household profile come first, and the volatile parts come last. Don't put timestamps in the prefix. Return per-tool guidance JIT in tool outputs, Shopify-style.
- **Memory model:** structured, not free-text "memories". Prefs, household and allergies live in existing tables (user-edited). Inferred likes or dislikes go into an `agent_memory` table the user can see and delete in Account. Never let the model write allergies or diet.
- **Context budget:** send a *plan summary* (day, title, recipe_id) rather than full recipes, and let the model call `get_recipe` when it needs detail.

### Gaps
- I couldn't read OpenAI's official pricing page (blocked host), so every number above needs re-checking. I also didn't verify OpenAI's cache discount rules (minimum prefix length, TTL).
- No public data was found on realistic AI-turn frequency for meal-planning apps. The 30/150 turns-per-month figures are assumptions.

---

## 6. Safety: prompt injection, destructive actions, allergies, limits, evals, logging

### Takeaway
Treat imported recipes, web pages and photo OCR as **untrusted data that can never trigger actions**. Parse them in a **quarantined, tool-less extraction call** that returns strict JSON. Keep **allergy and diet filtering in code and SQL**, outside the model. Confirm risk-2 actions, rate-limit per user, and run an eval set on tool-call accuracy before each prompt or model change.

### Cited Findings
- Willison's **lethal trifecta**: private data + untrusted content + external communication. The way to stay safe is to avoid having all three together — [Simon Willison: The lethal trifecta](https://simonw.substack.com/p/the-lethal-trifecta-for-ai-agents)
- "Design Patterns for Securing LLM Agents against Prompt Injections" (June 2025; 11 authors from IBM, Invariant Labs, ETH Zurich, Google, Microsoft and others) proposes six patterns: Action-Selector, Plan-Then-Execute, LLM Map-Reduce, Dual LLM, Code-Then-Execute and Context-Minimization. The principle: "once an LLM agent has ingested untrusted input, it must be constrained so that it is impossible for that input to trigger any consequential actions." Willison: "These design patterns constrain the actions of agents to explicitly prevent them from solving arbitrary tasks." — [Simon Willison weblog (indexed)](https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/); [conffab summary](https://conffab.com/elsewhere/design-patterns-for-securing-llm-agents-against-prompt-injections/)
- The Dual LLM pattern: a privileged LLM coordinates a quarantined LLM that handles untrusted content, with no exposure of that content to the privileged model — [same](https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/)
- The trifecta covers exfiltration, but injection can also *change state* (delete, overwrite, order). Meta's Oct 2025 "rule of two" addresses this (secondary source) — [HackerNoon](https://hackernoon.com/you-cannot-filter-your-way-out-of-prompt-injection)
- OWASP 2025: LLM01 Prompt Injection is the top risk, and LLM06 Excessive Agency covers excessive functionality, permissions and autonomy. OWASP published a 2026 edition on 2026-08-04 in which Excessive Agency moves to LLM03:2026 (per one source) — [Invicti](https://www.invicti.com/blog/web-security/owasp-top-10-risks-llm-security-2025); [Modulos](https://docs.modulos.ai/frameworks/owasp-top-10-llm)
- Anthropic: agents mean "higher costs and the potential for compounding errors", so they need extensive testing in sandboxes plus guardrails — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)
- Agents SDK: `needsApproval` fails closed on malformed arguments, and tool input/output guardrails run on every guarded call — [Agents SDK JS HITL](https://openai.github.io/openai-agents-js/guides/human-in-the-loop/)
- Shopify evaluates Sidekick with LLM evaluations and RL work. A dedicated talk covers their evaluation approach — [rubyevents talk](https://www.rubyevents.org/talks/llm-evaluations-reinforcement-learning-for-shopify-sidekick-on-rails); [ZenML LLMOps DB](https://www.zenml.io/llmops-database/building-and-evaluating-sidekick-a-production-agent-for-e-commerce-merchants)

### Inferences
- **Otto's trifecta check:** private data (household, allergies) and untrusted content (imports) are both present, but external communication is nearly absent: there's no email, share or web-fetch tool for the agent. **Keep it that way.** Don't give the agent a `fetch_url` or `share` tool. URL import runs a fixed pipeline, not a model-chosen fetch.
- **Import pipeline (Dual LLM / Context-Minimization):** 1) Code fetches the URL, or the app sends the photo. 2) A **tool-less** extraction call with a strict JSON schema (`title, ingredients[{name, qty, unit}], steps[]`) runs on it. 3) Code validates and canonicalizes, mapping ingredients to known keys. 4) The result returns to the user as a *draft card*. 5) Only the user's tap, or a later agent turn that sees the **structured fields only** and never the raw page, can call `create_recipe`. Any "ignore previous instructions" text in the page ends up as just an ingredient string at worst.
- **Allergy safety (hard rule):** `search_recipes`, `plan_week` and `add_to_plan` enforce the user's allergen exclusions in SQL or code (via the existing allergen coverage data) **regardless of model arguments**. The model can't pass `ignore_allergies`, and no such parameter exists. If a user asks to add a recipe containing their allergen, the tool returns `blocked: allergen <x>` and the UI shows a system-styled warning that the model can't alter. Allergies are editable only in Settings by the user, never by the agent (OWASP: authorization outside the model).
- **Destructive actions:** there's no AI-visible hard delete. Removals are soft or reversible with logged inverses, and bulk replace needs a preview. Deleting a user's own recipe is risk 2 with confirm.
- **Rate limits and quotas:** per user, e.g. N agent turns/day and M voice minutes/month, enforced in the Edge Function via a Postgres counter. Add a per-turn step cap (≤6 tool calls) and a token cap. Return a friendly "Otto needs a breather" card when a limit is hit.
- **Logging:** the `agent_actions` table (user_id, response_id, call_id, tool, args_redacted, result_status, inverse, created_at) is under RLS so users see only their own rows. Log tokens and cost per turn for unit economics. Never log raw imported page text or auth headers (CLAUDE.md: no secrets in logs).
- **Evals:** a golden set of ~100 scripted requests ("move Thursday's salmon to Friday", "plan a vegetarian week for 4 under 30 min", injection-laden import pages, allergen-conflict requests). Metrics: task success (DB end state matches the expected state), tool-selection accuracy, argument accuracy, unnecessary-confirmation rate, injection resistance (zero unintended mutations) and allergen violations (must be 0). Run it in CI against a Supabase branch or local DB on every prompt, tool-schema or model change.

### Gaps
- I couldn't fetch the full paper text, so pattern details come from summaries. Meta's "rule of two" wasn't verified against Meta's own post.
- I found no published evals specific to consumer-app agents (meal or grocery).

---

## 7. Apple App Review implications

### Takeaway
Guideline **5.1.2(i)** now names **third-party AI**: Otto must clearly disclose that data goes to OpenAI and get **explicit permission before** the first AI call. ADR-0006 already covers this, and it must also cover voice and photo. AI-generated content falls under **1.2** ("AI content creation apps"), which requires filtering and reporting. The age-rating questionnaire requires considering AI assistant features.

### Cited Findings
- 5.1.2(i), verbatim: "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- The third-party-AI wording was added in the 2025-11-13 guidelines update — [TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai)
- Rejections under 5.1.1(i)/5.1.2(i) are happening in practice. In one forum thread, reviewers reportedly didn't see the consent screen even though it was the first screen at launch — [Apple Developer Forums 820209](https://developer.apple.com/forums/thread/820209); [forums 815715](https://developer.apple.com/forums/thread/815715)
- 1.2 now explicitly includes "AI content creation apps" and requires filtering of objectionable material, a report mechanism with timely responses, blocking abusive users, and published contact info — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 4.7 covers "chatbots" not embedded in the binary. 4.7.1 requires filtering, reporting and blocking, and 4.7.5 requires age-gating for software that exceeds the app's rating — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 2.3.6: answer age-rating questions honestly. There is no standalone generative-AI guideline — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- In its age-rating update, Apple says: "You must consider how all app features, including AI assistants and chatbot functionality, impact the frequency of sensitive content appearing within your app". New questions cover capabilities and medical/wellness topics, with a deadline of 2026-01-31 — [Apple Developer News: Updated age ratings](https://developer.apple.com/news/?id=ks775ehf); [9to5Mac](https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/)
- A WSJ-relayed report says Apple required 17+ for a generative-AI email update (BlueMail). This isn't confirmed as general policy — [AppleScoop](https://applescoop.org/story/apple-looking-to-restrict-generative-ai-apps-to-17-plus-audiences)

### Inferences
- **Consent scope:** the ADR-0006 consent sheet should name OpenAI and list what is sent: messages, voice audio, photos, household and diet profile, plan and recipes. It should appear before the first AI call on *every* entry point (chat, voice, photo import, URL import if it uses AI). Store the consent server-side and have the Edge Function refuse calls without it. Make it re-viewable in Account. In review notes, point reviewers to exactly where the consent appears, because forum reports show reviewers miss it.
- **1.2 / 4.7 compliance for the AI tab:** run moderation on user input and model output (OpenAI's moderation endpoint is the obvious choice; its price wasn't verified). Add a "Report this response" action on AI cards that writes to a `ai_reports` table, and keep the support contact visible. A recipe domain plus a system prompt scoped to cooking lowers the risk, but the mechanisms still need to exist.
- **Age rating:** answer the capabilities question honestly (AI assistant: yes). Scope the assistant to food, which keeps sensitive-content frequency low. Medical/wellness: allergy features may touch this question, so frame them as preferences, not medical advice.
- **Privacy labels:** update `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` for audio (if voice ships), photos and user content sent to OpenAI.

### Gaps
- I didn't read the final ~14k characters of the guidelines page (sections after 5.2.5), and I didn't read the exact new age-rating questionnaire items.
- I found no Apple statement on whether a scoped, food-only assistant counts as a "chatbot" under 4.7.
