# AI cost diet, round 2 (2026-07-24)

**Founder directive:** ~1 cent per recipe turn is good; make it less. No user quotas
(locked call); the savings come from engineering the calls.

**Where we are (after today's round 1):** chat/one-shot on sonnet-5 at effort medium
with thinking steered off for everyday turns; photo vision on opus-4-8; nutrition on
haiku with permanent caching. Approx per action: recipe turn ~1c (0.7c on intro
pricing), clarify ~0.3c, photo ~3c. Round 1 cut per-ask cost roughly 3-4x.

## Do in this order

1. **Measure before cutting.** One line in generate-recipe logging
   `usage.input_tokens / output_tokens / cache_read_input_tokens` per call (no user
   content, no key material). Every lever below gets judged by this number, not napkin
   math. Also answers whether the cache_control breakpoint ever activates.

2. **Try haiku-4-5 for chat.** $1/$15 vs sonnet's $3/$15... input is 3x cheaper and
   output 3x cheaper ($5 vs $15/M out). Recipes are schema-constrained, templated
   cooking knowledge; haiku may be entirely adequate. Spot-check 10 recipes
   (quantities, technique, weight-first format) haiku vs sonnet before switching.
   If quality dips only on complex asks, keep sonnet and stop; a router model is
   over-engineering.

3. **Vision on sonnet (measured swap).** Photo import is the priciest action (~3c on
   opus). Sonnet-5 has the same high-res vision tier. Transcribe the same 5 photos on
   both; if faithful, swap MODEL_VISION and photo drops to ~1.8c.

4. **Trim the fat in prompts and output.**
   - CHAT_SYSTEM + SCHEMA carry a few hundred shaveable tokens (examples, repeated
     rules). Output costs 3-5x input per token, so the bigger lever is output:
     steps are already "one action per step"; consider capping typical recipes at
     the natural 8-12 steps via prompt wording, not truncation.
   - Never pad prompts to reach the prompt-cache floor; caching saves 90% of a cost
     you'd be adding.

5. **Batch API for catalog jobs (50% off).** Non-interactive only: otto-new-recipes
   canonicalization batches, nutrition recomputes. Wire into tools/ when the next
   catalog batch runs.

6. **Calendar note: intro pricing ends 2026-08-31** — sonnet costs rise ~50% back to
   sticker that day. The measured baseline from item 1 makes the jump visible instead
   of mysterious.

## Not doing

- User quotas or credit systems (founder call 2026-07-24).
- A classifier/router model in front of chat (adds a call to save a call).
- Trimming the 12-turn transcript further; context quality pays for itself.
