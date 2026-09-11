# Speak to Otto — voice input for the existing chat (2026-07-24)

**Founder directive:** talk to Otto instead of typing, as an option button right where the
composer is. The answer stays TEXT (the same chat bubbles + recipe cards as today). Do not
over-engineer. Token spend: the least possible without hurting answer quality.

**The one-line architecture:** speech-to-text happens ON DEVICE and simply fills the composer.
Everything after that is the pipeline we already have. No new server code, no new schema,
no audio ever leaves the phone, and voice input costs ZERO tokens.

## Decisions (locked by this plan)

- **On-device STT** via `expo-speech-recognition` (jamsch): wraps iOS `SFSpeechRecognizer`,
  Android `SpeechRecognizer`, and the Web Speech API behind one API, has an Expo config
  plugin, and ships an `@sdk-54` tag matching our Expo. Free, private, no per-minute bills.
- **No TTS** (Otto does not talk back — answer is text, per directive).
- **No cloud STT** (Whisper/Groq etc.): adds cost, latency, and a server path for zero
  quality win on short recipe asks.
- **Transcript is editable before send.** Speech lands in the TextInput as it's recognized;
  the user taps Send. Same trust pattern as the Ask-Otto hand-off (visible, editable).

## Phase 1 — the feature (one session + build 32)

1. `npx expo install expo-speech-recognition` (`@sdk-54` if needed) and add the config
   plugin to app.json with the two iOS strings (`NSMicrophoneUsageDescription`,
   `NSSpeechRecognitionUsageDescription`) in Otto's voice.
2. `useSpeechInput()` hook in `src/features/chat/` (~60 lines):
   - tap Speak → request permission (once) → start listening; interim results stream into
     the composer state; stop on tap or end-of-speech silence.
   - states: idle / listening (button pulses, live partial text visible) / error
     (toast: "Otto couldn't hear that. Try again.").
   - permission denied → plain toast pointing at Settings. Never blocks typing.
3. ChatScreen: replace the "coming soon" toast behind the existing Speak button with the
   hook. The button already exists; no layout work.
4. Web: the lib rides Chrome's Web Speech API, so localhost testing works; where the API is
   missing, keep the current "type it to him" toast.
5. **Native build 32 required** (new native module). Real test on the TestFlight device:
   mic permission flow, noisy-kitchen dictation, background/foreground.

Explicitly NOT in scope: wake word, auto-send on silence (maybe Phase 3), voice replies,
audio upload, transcription server.

## Phase 2 — token diet for the chat itself (~1 hour, server-side)

Ground truth from `generate-recipe/index.ts` today: model `claude-opus-4-8`, adaptive
thinking, `max_tokens` 4000, json_schema output, transcript capped server-side at 12 turns
and client-side at 20 turns × 600 chars, system prompt ~370 tokens. The discipline is
already good; the cost is the MODEL.

1. **Chat mode → `claude-sonnet-5`.** Recipe chat is schema-constrained structured work,
   the kind sonnet already handles for us (canonicalize ran 792 recipes on it). Opus is
   ~5× the price per token; a typical turn (~1.2k in / ~1k out) drops from roughly $0.09
   to under $0.02. Keep opus ONLY if the photo (vision) mode measurably degrades on
   sonnet — test that one before switching it.
2. **Prompt caching**: `cache_control` breakpoint on the static system prompt + schema.
   Cached reads are ~90% cheaper; pays off on every multi-turn conversation.
3. Keep as-is (already the floor): 12-turn cap, 600-char clamp, json_schema (no prose
   retries), 20-req/15-min rate limit, `max_tokens` 4000.
4. Verify (it already holds): recipe JSON never re-enters history — StoredMessage content
   is a 600-char string, so a full recipe can't balloon later turns.

Voice adds nothing to any of this: a spoken prompt becomes the same ≤600-char user turn a
typed one does.

## Phase 3 — polish (only if testers ask)

- Auto-send when speech ends (toggle, default off).
- Haptic tick on listen start/stop; locale from device settings.

## Acceptance

- Tap Speak, say "something cozy with chicken and rice", watch the words appear, tap Send,
  get the same clarify-or-recipe answer as typing. Works offline-ish (on-device model),
  works with the mic permission denied (typing untouched).
- Anthropic bill per chat turn drops ~80% with no visible quality change in the recipe
  cards (spot-check 10 chats sonnet vs opus before deleting the old model line).
