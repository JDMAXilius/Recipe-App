# Add / Create redesign — Mobbin research + direction (2026-07-21)

The ＋ sheet grew from 2 modes to 5 (Cook-with-Otto, link, paste-text, snap-photo, write-it-
myself) + editor. Five equal full-width cards is a list, not a hierarchy. And the hero feature —
AI creation — is now good enough to deserve its own conversational surface, not a text box in a
card. Founder vision: Otto should ASK clarifying questions ("low-cal coffee with milk, or black
with creamer + one stevia?"), you answer (tap or type), he confirms, then formulates the recipe
and hands it to you to accept.

## The reference set (what each app solves for us)

| App | Flow | The one pattern it contributes |
|---|---|---|
| **Wabi** — [Creating an app](https://mobbin.com/flows/e5b10451-ea48-4784-9ac0-998e58e57e09) | chat → builds → inline result card | **The gold standard for our vision.** Conversation IS the create surface; the finished thing appears INLINE as a card ("App created · View app"), copy says *"Tap Create when you're happy, or tell me what to tweak"*, quick-reply chips + persistent "Ask for any changes". |
| **Agoda** — [Chatting with an AI assistant](https://mobbin.com/flows/d5a8a0ca-ca21-4d6b-a861-d6a8d5deed08) | property Q&A | **Clarifying-question CHIPS.** Otto greets, offers 2–3 tappable suggested questions as pills + a free-text box. Exactly the founder's "he asks, you pick or type back." |
| **Google Food Mood** — [Food mood](https://mobbin.com/flows/1261ed46-d3e3-4eb5-acc1-e21a0364a1e8) | build a recipe | **Structured mad-libs prompt.** "I want a `dessert` for `1 person` mixing `Monaco` + `Sweden`" with tappable tokens, diet chips, add-ingredient → recipe card. A guided, low-typing FIRST prompt. Also: honest AI disclaimer. |
| **ChatGPT** — [Asking ChatGPT](https://mobbin.com/flows/73965d45-3e1d-4418-a2fb-128375360490) | café mocha recipe | The baseline to BEAT: a plain chat just dumps a recipe + variations. It never asks "how do you want it?" — the clarifying step is our differentiator. Starter-suggestion cards on the empty state. |
| **Grok / Gemini / Perplexity / DeepSeek** | ask → answer | Empty-state starter prompts above the input; a compact "thinking…/steps" affordance while generating; result actions (copy, regenerate, share). |
| **Instacart** — [Generate a recipe](https://mobbin.com/flows/5407616a-a1d0-41d1-a0d1-b7a509d4c0be) | photo → shoppable recipe | **Multi-path entry as a labeled TILE GRID** (Drinks/Dinner/Lunch/Dessert), a distinct "Share a written recipe" tile, and a graceful "Sorry, we can't read this" failure card. |

## Principles (from the set)

1. **One hero, the rest secondary.** Every strong app leads with its primary create path and
   demotes the alternates — nobody shows five equal options. AI creation is Otto's hero now.
2. **The conversation is the surface, the result is a card in it.** Wabi never leaves the chat to
   show the built thing — it drops a result card inline with a clear primary action. No modal, no
   context switch.
3. **Ask, don't assume — with chips.** The clarifying question is what separates a chef from a
   vending machine (ChatGPT vs the founder's vision). Render Otto's options as tappable pills so
   answering is one tap, with free-text always available.
4. **Seed the blank.** An empty chat is intimidating; every leader shows 1–2 starter prompts.
5. **Honesty travels with AI.** Disclaimer + graceful failure card + the review gate before save
   (Otto already does this — keep it, it's on-brand and ahead of most).

## Proposed direction — two layers

### Layer 1 — "Add to your cookbook" entry (cleaner hierarchy)
- **Hero:** one prominent **"Create with Otto"** action (opens the conversation, Layer 2).
- **Import row:** the four import paths (Paste a link · Paste text · Snap a photo · Write it
  myself) as a compact 2×2 labeled tile grid (Instacart model), not five stacked cards. Each tile
  = icon + short label; tap opens that path's focused input (sheet or inline), not five open
  forms competing for the eye.
- Keeps the TikTok/IG coach row and the honest failure recovery.

### Layer 2 — "Chat with Otto" (the new screen — the founder's core ask)
A real conversation screen:
1. **Empty state:** Otto greets + 2–3 starter chips ("A cozy chicken dinner for 4", "A low-cal
   coffee", "Use up what's in my fridge") + free-text/voice input. (Optionally a "quick build"
   structured mad-libs entry for the low-typing path — Food Mood.)
2. **You describe** ("a coffee").
3. **Otto clarifies with chips:** *"Happy to! Two easy ways —"* → `Low-cal: black coffee, splash
   of milk` · `Creamer + 1 tsp stevia` · or type your own. (Chips carry Otto's real proposals.)
4. **You pick/answer** → Otto confirms: *"Got it — a black coffee with almond creamer and one
   stevia. Let me write it up."* (brief thinking state).
5. **Otto drops the finished recipe INLINE as a card** — title, servings, the weight-first
   ingredients, computed nutrition — with a primary **"Save to cookbook"** and a secondary **"Ask
   for a change"** (keeps iterating in the same thread).
6. **Save →** the EXISTING review editor ("Check Otto's work"), source "otto". Every honesty law
   intact: review gate, USDA nutrition on save, immutable label.

### Why this is the right shape for Otto
- It makes the hero feature feel like talking to a chef, not filling a form — the founder's exact
  intent, and Wabi-proven.
- It reuses everything already built (generate endpoint, review editor, nutrition) — the chat is a
  new front-end surface, not new backend. The clarifying turn is one added prompt mode.
- It fits the design system (light, Lora display, terracotta accent, Otto at emotional beats) and
  the honesty laws unchanged.

## Open decisions for the founder (before building)
- **D1 — First prompt:** free chat with starter chips (ChatGPT/Wabi), OR a structured mad-libs
  quick-build first (Food Mood), OR offer both?
- **D2 — Where the conversation lives:** a full pushed screen "Chat with Otto", or an expanding
  panel inside the Add sheet? (Full screen recommended — it's a real surface now.)
- **D3 — Clarifying depth:** always ask ≥1 clarifying question, or let Otto skip straight to the
  recipe when the request is already specific ("gluten-free banana bread for 6")? (Skip-when-clear
  recommended — asking when unnecessary annoys.)
