# Voice input, Siri / App Intents and Apple on-device AI for Otto

Status: draft · research notes, gathered 2026-11-04 · repo facts checked against working tree (no commit pinned)

Method note: research used web search plus one GitHub fetch. WebFetch could not reach developers.openai.com, docs.expo.dev, callstack.com or developer-mdn.apple.com from this cloud session (DNS blocked by the session network policy), so many facts below come from search-result summaries of those pages rather than full reads. Price figures in particular should be rechecked on OpenAI's pricing page before they go into a cost model.

Repo baseline (checked in code, not web):
- Otto already ships voice dictation into the chat composer: `src/features/chat/useSpeechInput.ts` uses `expo-speech-recognition` 3.1.3 (`package.json:42`), configured in `app.json:109-112` with the permission string "Otto turns what you say into text with Apple speech recognition."
- The hook does NOT set `requiresOnDeviceRecognition`, so audio is streamed to Apple's speech servers; `docs/legal/APP_PRIVACY_TRUTH_TABLE.md` row 14 records Apple as a recipient of dictated audio. A "founder call" (flip to on-device vs disclose server recognition) is open in the hook's header comment.
- The hook lazy-requires the native module so builds without it degrade to a "coming soon" toast.

## Speech-to-text options and what works in Expo / React Native today

### Takeaway
For short commands ("swap Thursday", "add eggs"), Apple's own recognizer is free, low-latency and already wired into Otto via `expo-speech-recognition`; the cheapest privacy upgrade is setting `requiresOnDeviceRecognition: true` where `supportsOnDeviceRecognition()` is true. The iOS 26 SpeechAnalyzer/SpeechTranscriber is more accurate and fully on-device but is iOS 26+ only and reaches RN today mainly through Callstack's `@react-native-ai/apple`; OpenAI `gpt-4o-mini-transcribe` (~$0.003/min) is a cloud fallback that adds a third-party-AI disclosure and network latency.

### Cited Findings
**Apple Speech (SFSpeechRecognizer, iOS 10+) via expo-speech-recognition (jamsch)**
- The library wraps iOS `SFSpeechRecognizer`; it does not mention SpeechAnalyzer/SpeechTranscriber. — [expo-speech-recognition README](https://github.com/jamsch/expo-speech-recognition)
- Options: `requiresOnDeviceRecognition` (keeps audio off the network where the device supports it), `supportsOnDeviceRecognition()` check, `contextualStrings` for custom vocabulary ("seems to work better on iOS"), `iosTaskHint` (`unspecified | dictation | search | confirmation`), `continuous` mode (without it iOS 17 and earlier stop after ~3 s of silence; iOS 18+ runs until a final result), volume metering events (-2..10, 100 ms default), and audio-file transcription via `audioSource.uri` (16 kHz mono WAV/MP3 verified). — [expo-speech-recognition README](https://github.com/jamsch/expo-speech-recognition)
- The README's install table pairs library versions with Expo SDKs (it lists a 57.x line for SDK 57); Otto pins 3.1.3 on SDK 54. New-architecture support is not stated explicitly on the README page. — [expo-speech-recognition README](https://github.com/jamsch/expo-speech-recognition)

**Apple SpeechAnalyzer / SpeechTranscriber (iOS 26, shipped)**
- Introduced at WWDC25 (session 277, "Bring advanced speech-to-text to your app with SpeechAnalyzer"); three core types: `SpeechAnalyzer` (session), `SpeechTranscriber` (audio to text module), `AssetInventory` (downloads the system-managed on-device model). Successor to SFSpeechRecognizer. Available on iOS, iPadOS, macOS, tvOS, visionOS 26 (not watchOS). — [WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/); [Addpipe overview](https://blog.addpipe.com/apple-speechanalyzer-api/); [DEV write-up](https://dev.to/arshtechpro/wwdc-2025-the-next-evolution-of-speech-to-text-using-speechanalyzer-6lo)
- Runs entirely on device; there is also a `SpeechDetector` (voice activity) module. — [WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/); [AI SDK React Native Apple provider docs](https://ai-sdk.dev/v5/providers/community-providers/react-native-apple)
- Gap reported by a developer: as of iOS 26.0 SpeechAnalyzer had no equivalent of SFSpeechRecognizer's `contextualStrings` vocabulary biasing (relevant for ingredient names). — [DEV: SpeechAnalyzer on a live mic](https://dev.to/simple_memo/ios-26s-speechanalyzer-on-a-live-mic-the-5-things-the-docs-dont-tell-you-2ng5)
- Speed: MacStories reported a 34-minute video transcribed in ~45 s on macOS (beta-era test). — [Gigazine](https://www.gigazine.net/gsc_news/en/20250619-apple-speech-analyzer)
- Accuracy (independent, July 2026, M2 Pro, LibriSpeech): SpeechAnalyzer 2.12% WER test-clean / 4.56% test-other vs WhisperKit Whisper Small 3.74% / 7.95% and Whisper Base 5.42%. — [Gigazine benchmark summary](https://www.gigazine.net/gsc_news/en/20260714-apple-speech-analyzer-benchmark/)
- Contradicting vendor benchmark (June 2025, earnings-call audio): WhisperKit whisper-small.en 12.8 WER at 35x speed vs SpeechTranscriber 14.0 WER at 70x speed — Whisper more accurate, Apple 2x faster. Argmax makes WhisperKit. — [Argmax: Apple and Argmax](https://www.argmaxinc.com/blog/apple-and-argmax)
- Multi-language test (13k samples): SpeechAnalyzer won German/Italian; WhisperKit won English/Spanish. — [rohitraj.tech notes](https://rohitraj.tech/en/notes/apple-speechanalyzer-vs-whisper-on-device-stt-2026)

**RN bridges for SpeechAnalyzer**
- Callstack's `@react-native-ai/apple` exposes SpeechAnalyzer transcription through the Vercel AI SDK: `experimental_transcribe({ model: apple.transcriptionModel(), audio })` returns text, segments, duration; `NativeAppleSpeech.prepare('en')` pre-downloads language assets; autolinked. Transcription: iOS 26+, no Apple Intelligence requirement. Text generation (Foundation Models) in the same package needs an Apple Intelligence device. — [AI SDK RN Apple provider](https://ai-sdk.dev/v5/providers/community-providers/react-native-apple); [Callstack blog](https://www.callstack.com/blog/on-device-speech-transcription-with-apple-speechanalyzer); [callstackincubator/ai](https://github.com/callstackincubator/ai)

**OpenAI cloud STT**
- `gpt-4o-mini-transcribe`: $3 / 1M audio input tokens, $1.25 / 1M text input, $5 / 1M text output ≈ $0.003/min ($0.18/hour). — [Neowin launch coverage](https://www.neowin.net/news/openai-announces-next-generation-audio-models-to-power-voice-agents/); [CostGoat](https://costgoat.com/pricing/openai-transcription)
- `gpt-4o-transcribe` and `whisper-1` are commonly cited at ≈ $0.006/min; I could not load OpenAI's pricing page to confirm (host blocked). — [CostGoat](https://costgoat.com/pricing/openai-transcription)
- OpenAI positions the gpt-4o transcribe models as lower-WER than Whisper (March 2025 launch). — [Neowin](https://www.neowin.net/news/openai-announces-next-generation-audio-models-to-power-voice-agents/)

**On-device Whisper**
- WhisperKit (Argmax) runs Whisper via CoreML on Apple silicon; competitive with SpeechAnalyzer per the benchmarks above. — [Argmax](https://www.argmaxinc.com/blog/apple-and-argmax)
- whisper.cpp vs SpeechAnalyzer (Aug 2026, Mac): Apple more accurate; whisper.cpp slightly lower post-speech latency. — [developersdigest](https://www.developersdigest.tech/blog/apple-speechanalyzer-vs-whisper-benchmark)

### Inferences
- Ranking for Otto's short-command use case: (1) keep `expo-speech-recognition`, add `requiresOnDeviceRecognition` when supported plus `contextualStrings` seeded with this week's plan recipe names, day names and the user's pantry/list items; (2) iOS 26+ upgrade path to SpeechTranscriber via `@react-native-ai/apple` or a small custom Expo module; (3) OpenAI transcribe only if accuracy on food words proves poor. Bundling WhisperKit adds hundreds of MB of model and buys little over SpeechAnalyzer.
- Cost check: at $0.003/min, 10 voice commands of ~5 s per user per day ≈ 0.83 min/day ≈ $0.075/user/month on gpt-4o-mini-transcribe — small, but not zero, and it routes raw audio to OpenAI (new 5.1.2(i) disclosure; Otto today never sends audio to OpenAI).
- Turning on on-device recognition would let the privacy truth table drop Apple as an audio recipient on supported devices, but only if the code also refuses or discloses the server fallback.
- The iOS dictation keyboard needs no code at all and remains a valid zero-effort path inside any TextInput.

### Gaps
- Exact current OpenAI per-minute prices for `whisper-1`, `gpt-4o-transcribe`, and any newer transcribe snapshot (pricing page blocked here).
- Whether `expo-speech-recognition` plans a SpeechAnalyzer backend, and its new-architecture status for the 3.x line Otto uses.
- SFSpeechRecognizer server-mode per-request duration and daily request limits (not found in sources reached).
- SpeechTranscriber language list and whether `contextualStrings`-like biasing was added after iOS 26.0.
- No food/kitchen-vocabulary benchmark for any engine.

## Siri, App Intents, App Shortcuts and system surfaces

### Takeaway
App Intents is the one API that reaches Siri, Shortcuts, Spotlight, the Action button and widgets, and Expo now has an official (alpha) `expo-app-intents` package that declares intents in Swift via inline modules; iOS 26 added interactive `SnippetIntent` views. The "new Siri" with personal context and on-screen awareness slipped out of iOS 26.4 and was re-announced at WWDC26 for iOS 27, labelled a beta; Otto should build App Intents/App Entities now and treat LLM-Siri as upside, not a dependency.

### Cited Findings
**Exposing App Intents from Expo**
- `expo-app-intents` is an official Expo package, documented as alpha with frequent breaking changes. Intents are written in Swift and compiled into the app target so Xcode's App Intents metadata processor can extract them; it uses Expo inline modules over an `app-intents` directory; `npx expo-app-intents init` adds the config plugin and starter Swift files. — [Expo docs: AppIntents](https://docs.expo.dev/versions/latest/sdk/app-intents/)
- If Siri/Shortcuts fires while the app is not running, invocations queue; `useAppIntents()` delivers pending invocations to a JS handler when the app starts. Intent types cannot be created dynamically from JS. Schema intents can work without shortcut phrases. — [Expo docs: AppIntents](https://docs.expo.dev/versions/latest/sdk/app-intents/)
- Docs conflict on on-screen intelligence: older unversioned page says unsupported, latest says supported; `appEntityIdentifier()` / `AppEntityView` require Xcode 27. — [Expo docs (unversioned)](https://docs.expo.dev/versions/unversioned/sdk/app-intents/); [Expo docs (latest)](https://docs.expo.dev/versions/latest/sdk/app-intents/)
- The docs have a v58 page, i.e. the package targets recent SDKs; I could not confirm which SDK it first shipped in. Expo SDK 55 dropped the legacy architecture; SDK 56 (React Native 0.85, May 2026) made inline Expo modules a feature. — [Expo docs v58](https://docs.expo.dev/versions/v58.0.0/sdk/app-intents/); [SDK 55 changelog](https://expo.dev/changelog/sdk-55); [SDK 56 changelog](https://expo.dev/changelog/sdk-56)
- `expo-apple-targets` (Evan Bacon) is a config plugin for native Apple targets (widgets, App Clips, share extensions, Siri/Intents categories) outside `/ios`; sources do not position it as the App Intents path. — [expo-apple-targets docs index](https://docsearch.algolia.com/mcp/docs/repo/evanbacon/expo-apple-targets)

**What intents can return / run without opening the app**
- `SnippetIntent` (iOS 26.0+) is the protocol for intents that show interactive snippets; only these can present working buttons/toggles; the system may call it repeatedly and the app can request a reload; intents can chain by returning further snippet intents. — [Apple: SnippetIntent](https://developer.apple.com/documentation/appintents/snippetintent); [Superwall: Interactive snippets in iOS 26](https://superwall.com/blog/app-intents-interactive-snippets-in-ios-26); [Blake Crosley: App Intents 2.0](https://blakecrosley.com/blog/app-intents-2-ios-26-additions)
- Snippets surface in Siri, Spotlight and Visual Intelligence. — [Blake Crosley](https://blakecrosley.com/blog/app-intents-2-ios-26-additions)

**Siri status**
- Personalized Siri, first promised March 2025, missed iOS 26.4 (Bloomberg, Feb 11 2026); Apple said it was still planned for 2026. — [MacTech](https://www.mactech.com/2026/02/11/the-more-personalized-version-of-apples-siri-is-delayed-yet-again); [9to5Mac](https://9to5mac.com/2026/02/11/apple-reportedly-pushing-back-gemini-powered-siri-features-beyond-ios-26-4/); [T3](https://www.t3.com/tech/ai/gemini-powered-siri-still-on-track-for-2026-release-apple-tells-major-outlet)
- At WWDC26 (June 8 2026) Apple announced "Siri AI" with personal context and on-screen awareness, with public availability as a beta later in the year; a Siri app and cross-app actions were reported. — [iClarified](https://www.iclarified.com/101113/apple-introduces-siri-ai-with-personal-context-and-onscreen-awareness); [MacRumors release timing](https://www.macrumors.com/2026/06/08/ios-27-and-siri-ai-release-date/)
- Siri reaches apps through App Intents (Apple's iOS 27 guide); third-party commentary says SiriKit is on a deprecation clock (unconfirmed). — [Apple WWDC26 iOS guide](https://developer.apple.com/wwdc26/guides/ios/); [DEV: WWDC 2026 for RN devs](https://dev.to/malik_chohra/wwdc-2026-app-intents-foundation-models-and-what-rn-devs-should-ship-3o8a)
- Reported limits: Siri AI English-first; not in the EU on iPhone/iPad or mainland China at launch (secondary). — [mer.vin](https://mer.vin/2026/06/apple-wwdc26-siri-ai-and-gemini-backed-foundation-models-on-device-and-private-cloud-compute/); [Pasquale Pillitteri](https://pasqualepillitteri.it/en/news/15275/apple-siri-ai-screen-camera-in-app-actions)
- iOS 27 public beta opened ~August 2026. — [TechEconomy](https://techeconomy.ng/apple-releases-ios-27-public-beta-biggest-siri-upgrade)

### Inferences
- First intents worth shipping: `WhatsForDinnerIntent` (returns dialog + snippet of tonight's meal with "Start cooking" / "Swap"), `AddToShoppingListIntent(item)`, `SwapMealIntent(day)`, `NextStepIntent` for cook mode. With an `AppShortcutsProvider` these work as "Hey Siri, what's for dinner in Otto" on iOS 16+, independent of the LLM Siri.
- Answering without opening the app requires the Swift intent to read data itself (e.g. an App Group cache the RN app writes, or a Supabase call in Swift). The JS `useAppIntents()` queue implies JS handling happens when the app is foregrounded, so "no-open" intents must be pure Swift.
- Because `expo-app-intents` is alpha and docs reference v58 while Otto is on SDK 54, adopting it likely means an SDK upgrade; on SDK 54 a hand-written local Expo module + config plugin is the fallback.
- App Entities (recipes, plan days) are the hook for iOS 27 on-screen awareness and Spotlight; they also need Xcode 27 for some APIs.

### Gaps
- Which Expo SDK introduced `expo-app-intents` and whether it runs on SDK 54 (docs host blocked).
- Whether iOS 27 / Siri AI has reached general release as of Nov 2026, and in which regions — sources found are June–August 2026.
- Exact `openAppWhenRun` / background execution rules for SnippetIntent (Apple's "Displaying static and interactive snippets" guide not retrieved).
- Action button and Control Center controls details were not researched in depth beyond "App Intents powers them".

## Apple Foundation Models framework (on-device and, from iOS 27, cloud)

### Takeaway
On iOS 26, Foundation Models gives free, private access to a ~3B on-device model with guided generation (`@Generable`) and tool calling — well suited to turning "swap Thursday" into a typed action, poorly suited to recipe knowledge or long reasoning, and absent on non-Apple-Intelligence devices. iOS 27 (beta) adds Private Cloud Compute models, free for Small Business Program apps under 2M downloads, plus pluggable third-party providers — potentially a cost lever versus OpenAI, but beta and region-limited.

### Cited Findings
- iOS 26 framework gives direct access to Apple's ~3B on-device LLM; requires iOS 26 and an Apple Intelligence-capable device; model unavailable when Apple Intelligence is off or still downloading. — [DEV: Foundation Models framework](https://dev.to/arshtechpro/apples-foundation-models-framework-run-ai-on-device-with-just-a-few-lines-of-swift-lbp); [createwithswift](https://createwithswift.com/exploring-the-foundation-models-framework/)
- Context window cited as 4,096 tokens (single source); `tokenCount(for:)` from iOS 26.4; apps should catch context-overflow errors. — [Blake Crosley](https://blakecrosley.com/es/blog/apple-foundation-models-framework); [DEV 2026 guide](https://dev.to/jovan_chan_9500711396d4e6/apple-foundation-models-for-developers-in-2026-on-device-swift-ai-xcode-263-agentic-coding-and-1gpa)
- `@Generable`/`@Guide` macros with constrained decoding guarantee schema-conforming output; streaming fills fields progressively. Tools conform to `Tool` (name, description, `@Generable` Arguments, `call(arguments:)`). Not intended for world knowledge, code, math or factual Q&A. — [Blake Crosley](https://blakecrosley.com/pl/blog/apple-foundation-models-framework); [DEV](https://dev.to/arshtechpro/apples-foundation-models-framework-run-ai-on-device-with-just-a-few-lines-of-swift-lbp)
- iOS 27 (beta): more powerful on-device models with image input, server models on Private Cloud Compute, custom skills; developers can plug in other providers (Claude, Gemini, or anyone implementing Apple's language-model protocol). Small Business Program developers under 2M first-time downloads get PCC models at no cloud API cost; Heise ties the threshold to the largest "AFM 3 Cloud Pro" (complex reasoning, agentic tool use). — [Apple via BusinessWire](https://www.businesswire.com/news/home/20260608093428/en/); [heise](https://heise.de/-11329079)
- Usage-limit risk of the free PCC tier flagged in commentary. — [mjtsai](https://mjtsai.com/blog/?p=52277)
- RN bridge: `@react-native-ai/apple` exposes the on-device model as a Vercel AI SDK provider (Apple Intelligence devices only). — [AI SDK RN Apple provider](https://ai-sdk.dev/v5/providers/community-providers/react-native-apple)

### Inferences
- Good fit: intent parsing of short utterances into a `@Generable enum OttoAction { swapMeal(day), addItem(name, qty), showTonight, nextStep }`, with tools that read the local plan. Zero cost and no third-party AI disclosure for that step. Heavier work (generate a week, substitutions with allergen reasoning) stays on OpenAI via Edge Functions.
- Must ship a fallback: Otto requires an account and Club, but not an iPhone 15 Pro or newer; any device without Apple Intelligence needs the same parse done by a cheap OpenAI call or a deterministic grammar ("add X to list", "swap <day>").
- Free PCC (iOS 27) could replace some OpenAI spend later, but it is beta, Apple-only, and the eligibility threshold can change; do not plan the business on it yet. ADR-0006 consent naming "the provider" would need an Apple variant.

### Gaps
- Apple's official device list for Apple Intelligence (iPhone 15 Pro and later is the widely known rule; not re-verified here) and share of Otto's users on such devices.
- Measured on-device latency for a short structured parse (no benchmark found).
- Whether the iOS 27 language-model protocol lets an app call OpenAI through Foundation Models.

## Text-to-speech for spoken answers

### Takeaway
For read-aloud replies and cooking steps, on-device `AVSpeechSynthesizer` via `expo-speech` is free, instant and private; OpenAI `gpt-4o-mini-tts` (~$0.015/min, 13 voices, steerable tone) sounds better but adds latency, cost and another 5.1.2(i) flow. Speak only when the user started by voice or is in cook mode.

### Cited Findings
- `gpt-4o-mini-tts`: $0.60 / 1M text input tokens, $12 / 1M audio output tokens ≈ $0.015/min (some aggregators list $10/M output). — [Neowin](https://www.neowin.net/news/openai-announces-next-generation-audio-models-to-power-voice-agents/); [OpenAI community](https://community.openai.com/t/understanding-gpt-4o-mini-tts-pricing-input-characters-cost/1151816); [CostGoat](https://costgoat.com/pricing/openai-tts)
- Voices: tts-1/tts-1-hd have 9 (Alloy, Ash, Coral, Echo, Fable, Nova, Onyx, Sage, Shimmer); gpt-4o-mini-tts adds Ballad, Verse, Marin, Cedar (13). — [techsy.io](https://techsy.io/en/blog/best-tts-apis-developers)
- `@react-native-ai/apple` routes speech synthesis through AVSpeechSynthesizer. — [AI SDK RN Apple provider](https://ai-sdk.dev/v5/providers/community-providers/react-native-apple)

### Inferences
- `expo-speech` (AVSpeechSynthesizer) is the default; it needs no permission and no disclosure. Use OpenAI TTS only if a brand "Otto voice" is a product goal.
- Spoken replies help in cook mode (hands wet, eyes on the pan) and after a voice question; they annoy in a quiet room, on public transit, or when the answer is a list better seen than heard. Rule: reply in the modality the user asked in, with a mute toggle, and never speak during the meal plan or shopping list screens unless asked.

### Gaps
- No user research found on spoken-reply preference in cooking apps; no measured latency for OpenAI TTS first audio byte.

## Hands-free cooking

### Takeaway
iOS gives third-party apps no custom wake word; the realistic hands-free loop is "Hey Siri, next step in Otto" via an App Intent plus a Live Activity showing the current step, or an in-app listening mode while cook mode is foregrounded.

### Cited Findings
- App Intents run from Siri/Shortcuts even when the app is not running, queuing to JS on next launch in the Expo implementation. — [Expo docs: AppIntents](https://docs.expo.dev/versions/latest/sdk/app-intents/)
- `expo-speech-recognition` continuous mode can run until stopped (iOS 18+ behaviour), enabling an in-app "listening while cooking" mode. — [expo-speech-recognition README](https://github.com/jamsch/expo-speech-recognition)

### Inferences
- A custom "Hey Otto" wake word would need always-on mic in the background, which iOS does not allow for this use; keep the mic open only in foreground cook mode, with a visible indicator and auto-timeout.
- `NextStepIntent`/`PreviousStepIntent`/`StartTimerIntent` should be pure Swift reading the active step from an App Group, and update a Live Activity (Lock Screen / Dynamic Island) so the answer is visible too.

### Gaps
- Live Activity + App Intent button interaction specifics and Expo widget-target tooling (`expo-apple-targets` vs `expo-widgets`) were not researched here.
- No source found on battery/thermal cost of long continuous recognition sessions.

## Apple review and privacy

### Takeaway
Voice needs `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription` strings that name who processes audio; since November 2025, guideline 5.1.2(i) also requires clear disclosure and explicit consent before personal data (which includes voice transcripts) goes to a third-party AI such as OpenAI. On-device Apple paths avoid the third-party-AI consent; OpenAI audio would need ADR-0006's consent to name audio explicitly.

### Cited Findings
- On Nov 13 2025 Apple revised 5.1.2(i) to require disclosure of where personal data is shared, including with third-party AI, and explicit permission before sharing. — [TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai)
- "Third-party AI" is not precisely defined; a privacy-policy line alone is not considered sufficient by developer guides. — [DEV: 5.1.2(i)](https://dev.to/arshtechpro/apples-guideline-512i-the-ai-data-sharing-rule-that-will-impact-every-ios-developer-1b0p); [qawerk](https://qawerk.com/blog/apple-app-store-ai-data-sharing-guidelines/)
- Claim that on-device inference is exempt is unverified. — [stora.sh guide](https://stora.sh/blog/2026-05-06-apple-ai-consent-rule-5-1-2-i-implementation-guide)
- Otto's current speech permission string names "Apple speech recognition" (`app.json:112`) and the privacy truth table lists Apple as an audio recipient (repo, row 14).

### Inferences
- If Otto moves to on-device recognition, the speech string can say "on your iPhone"; if it ever sends audio to OpenAI, the mic string, the ADR-0006 consent sheet, the App Privacy label (Audio Data) and the policy must all name OpenAI.
- Voice transcripts sent to the AI chat are already user content covered by the existing OpenAI consent; confirm that consent copy mentions spoken requests.

### Gaps
- Exact current text of 5.1.2(i) (Apple's guidelines page not fetched).
- Whether App Review treats Apple's server-side speech recognition as "third-party AI" (no source found; likely not, since Apple is the platform).
