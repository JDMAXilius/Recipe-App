# 📥📤 Import & Share Research — every channel, grounded

> **Purpose.** Research pass for (A) **recipe import** from URL / Instagram / TikTok / photo /
> video and (B) **sharing** recipes and shopping lists to Instagram / WhatsApp / Messages.
> Extends `BACKEND_ROADMAP.md §C` (import channels) and `§G` (sharing) with design evidence
> (Mobbin), technical mechanics, costs, and legal posture. **Research only — nothing here ships
> without a ticket.**
>
> **Sources:** Mobbin pass (15 searches: Crouton, ReciMe, CREME, Kitchen Stories, NYT Cooking,
> Instacart, Cherrypick, Julienne, Alma, Yazio, Hypelist…), primary API docs (Meta, TikTok,
> Apple, Expo), vendor pricing pages, case law summaries. **Date:** 2026-07-17 · **Run:** cloud
> session, three parallel research agents. Key URLs inline.

---

## 0. Executive summary

- **Import:** every serious competitor is **share-extension-first, caption-first, review-screen-always**.
  Otto's deterministic URL importer is already the quality bar; the new channels (IG, TikTok,
  photo, video) are one shared LLM-extraction endpoint behind the same review screen.
  Cost is a non-issue (~**$0.003–0.01 per import** on Haiku-class models; transcripts add
  <$0.01). The gating dependency is unchanged: the **iOS share extension** (needs a dev-build
  rebuild, package: `expo-share-intent`).
- **Legal line (import):** user-initiated, logged-out, single-post, text-only derivation with
  source attribution and no media storage = defensible (hiQ v. LinkedIn; Meta v. Bright Data;
  recipes-as-facts aren't copyrightable). Bulk crawling, logged-in scraping, storing creators'
  media = never. This maps 1:1 onto the roadmap's "never scrape arbitrary accounts" rule.
- **Sharing:** two payloads, one button. **Text** (share sheet → WhatsApp/iMessage/anything)
  ships **now** with zero backend; **links with rich previews** need the public share pages
  (roadmap B4/G1 — SSR + OG tags + unguessable slugs); **Instagram accepts only pixels**, so
  the IG answer is a generated painted card image (Stories share is alive and doesn't need App
  Review — just a free Meta App ID).
- **Shopping list:** ship **plain-text share** (aisle-grouped, WhatsApp-bold headers) now;
  snapshot link `/l/:token` with B4; collaborative lists later via Supabase Realtime — exactly
  the G2 phasing, now validated against AnyList/Bring!/Paprika.

---

## 1. What the market does (Mobbin evidence)

| App | Import channels | Share targets | The lesson |
|---|---|---|---|
| **Crouton** | Link, QR, Camera, Image, Text, PDF, Manual — one "+" menu; AI channels grouped under a **"Smart Import"** label | Link / File / **PDF / Plain Text / Markdown**; "Household" sync | Deterministic vs AI import labeled differently; clipboard-detect pill ("Website Available — On your clipboard [Import]"); progress copy admits fallibility ("AI is used… check the results") |
| **ReciMe** | In-app browser w/ "Import to ReciMe" bar, Camera, Paste text; **per-platform tutorials** that deep-link into IG/TikTok | Grocery list share | The reference review sheet: parsed recipe + Edit + **"Calculate nutrition" as explicit button** + Select cookbook + **"Report import mistake"**; imports metered 5/week free |
| **CREME** | Video-native recipes | Message, Copy link, More | **Credits section** (chef + photographer profiles) — attribution as anatomy |
| **NYT Cooking** | Own catalog + browser tools | System share sheet + "Give" | Post-share toast states the recipient's entitlement: *"Your recipient will be able to read and save it, even without a subscription."* |
| **Instacart** | **Photo → shoppable recipe** | Basket handoff | Error names cause + recovery: "We couldn't read this recipe. Please take another picture and try again." |
| **Cherrypick** | Text / Photo / Link tabs | — | Confirmation as CTA: button reads **"This looks correct"** |
| **Julienne** | **Text / Image / Video / Link** 4-tile sheet | — | Cleanest taxonomy: by *media type*, not source app |
| **Alma** | — | Image-card composer | User controls the card: "Your Photo" vs stylized toggle, **logo overlay opt-in** |
| **Yazio / Hypelist / Keeta** | — | List share toolbar; pre-rendered IG Stories card + channel row (Copy/WhatsApp/Messenger/iMessage); permissions in plain words ("People you invite can add or edit items") | Shopping-list share is a first-class toolbar action; direct channel rows appear where a per-channel image is generated |

Flow/screen URLs: mobbin.com/flows/24463139 (Crouton link), 19d68d56 (ReciMe browser),
aee91ad6 (ReciMe platform tutorials), 66b4096a (ReciMe paste), 5407616a + da9cf0ac (Instacart
photo→recipe), a1f7d1c0 (CREME share), 3bf6d1b5 (NYT share), 23eab2ee (Crouton PDF export),
cfff69e1 (Crouton household), 0ddb8164 (ReciMe groceries), 69f4ca7b (Hypelist invite).
*(Not on Mobbin: Paprika, Pestle, Mela, Samsung Food, AnyList, Yummly, Flavorish, Umami —
covered via web research below.)*

**Anti-patterns observed (all violate an Otto law already):**
- In-app import browser leaking CAPTCHAs/ads mid-flow (Kitchen Stories) — a dead end inside the app.
- Import quota shown as an anxiety chip at the moment of intent (ReciMe "5/5" lightning).
- Generic "Oops…" errors with no cause or retry (Yuka).
- Silent auto-nutrition presented as fact (several) — ReciMe's explicit button is the honest form.
  *(Otto note: our async USDA compute is deterministic + estimate-framed, which satisfies the
  spirit; keep the confidence footnote forever.)*
- Tutorial-dependent share-extension import (ReciMe needed a 3-screen rehearsal per platform, and
  their own rebrand broke icon recognition) — minimize memorized steps.
- Unconditional watermarks on shared assets; marketing hashtags injected into a personal moment.

---

## 2. Import — per-channel technical findings

### 2.1 URL (shipped) — stays the gold path
Deterministic schema.org JSON-LD, review screen, honest null. Every other channel should
**funnel into this when possible**: IG/TikTok captions very often contain a blog link — chase it
and import the *structured* recipe instead of parsing prose. New channels reuse the same review
screen and attribution columns (`sourceUrl`, `sourceName`).

### 2.2 Instagram
- **Big recent change:** Meta dropped the oEmbed token requirement (June 15, 2026) — IG/FB oEmbed
  is callable with **no app, no review**; public posts/reels only (not stories/private). Tokenless
  rate limits are unpublished; registering a free Meta app + app token raises them. Basic Display
  API is dead (fully off ~Sept 2025) — design nothing on it.
- **Caption reality:** oEmbed `title`/`html` often carries the caption but is **not guaranteed** —
  treat oEmbed as first attempt; fallback = server-side logged-out fetch of the public
  `/p/{shortcode}/embed/captioned` page (SSRF-guarded, cached by shortcode, normal UA). Never use
  logged-in sessions server-side (that's the line Meta v. Bright Data draws).
- **Pipeline (confidence M-H):** share-intent/paste → resolve link → tokenless oEmbed → caption
  missing? fetch embed page → caption contains blog URL? **chase into existing importer** → else
  LLM-extract caption → review screen. Video/transcript fallback only when captions fail.

### 2.3 TikTok
- **oEmbed is public, no auth:** `https://www.tiktok.com/oembed?url=…` returns `title` (**the
  caption**), `author_name/url`, `thumbnail_url`. Handles vm.tiktok.com after redirect resolution.
  Rate limits undocumented → cache + back off on 429. Display API only returns *your own* videos —
  useless here; Research API is academia-only.
- **Reality check:** TikTok captions are recipe-bearing less often than IG (hashtag soup) —
  expect a **higher transcript-fallback rate**.
- **Pipeline (confidence H):** share-intent → resolve → oEmbed caption → recipe-like? LLM extract
  → review. Else transcript path (2.5). Keep author handle + URL as attribution.

### 2.4 Photo (cookbook page / handwritten card / screenshot)
- **The 2026 shortcut: skip dedicated OCR** — send the photo straight to a multimodal LLM; it
  reads print *and* handwriting and does structured extraction in one call (~1–1.6K image tokens
  → **~$0.005–0.015/import on Haiku**). This is effectively what Crouton's "scan" does.
- On-device options if a free/offline pre-pass is ever wanted (all need prebuild, none work in
  Expo Go): `expo-mlkit-ocr`, `@react-native-ml-kit/text-recognition`, Infinite Red's
  `react-native-mlkit`; live-camera OCR via `react-native-vision-camera` + ocr-plus plugin
  (Apple Vision under the hood on iOS). Server OCR (Google Vision / Textract, ~$1.50/1k) only
  matters at scale. Tesseract fails handwriting — skip.
- **Pipeline (confidence H):** picker/camera → client crop/rotate → multimodal extract → review.
  UX mirrors document scanners: capture → Retake/Continue (Instacart pattern).

### 2.5 Video (file or link)
- **User-uploaded files:** zero ToS issues — transcode → speech-to-text → extract.
- **Links:** metadata/caption first; only then media. STT is cheap: Whisper-class ~$0.006/min
  (Groq-hosted large-v3-turbo ~$0.0006/min; gpt-4o-mini-transcribe $0.003/min) — a 90s TikTok
  transcribes for **well under a cent**. Optionally sample 3–5 keyframes for on-screen ingredient
  text (common in recipe videos). `yt-dlp` (audio-only `-x`) is the standard fetcher but churns —
  run it in an isolated worker behind the SSRF guard, design graceful degradation to caption-only,
  and know that downloading media technically breaches platform ToS even when legal exposure is
  low (contract risk to our access, not user tort). Delete media after derivation; store only
  text + attribution.
- Open-source reference pipelines: github.com/pickeld/social_recipes, github.com/sleeper/recipe-extractor.

### 2.6 The shared LLM extraction endpoint (new backend seam)
One endpoint: `extract(text|image, sourceMeta) → {title, servings, ingredients[{qty,unit,item,note}],
steps[], times?, source{url,author,platform}, is_recipe, confidence}`.
- **Anthropic structured outputs:** `output_config: {format: {type:"json_schema", schema}}`
  (old top-level `output_format` is deprecated); keep **one stable schema** (compiled + cached 24h);
  `additionalProperties: false`. Cache the system prompt with `cache_control: ephemeral`.
- **Model:** `claude-haiku-4-5` ($1/M in, $5/M out) default; Sonnet-class escalation for messy
  transcripts. **~$0.003–0.01/import** typical; ~$0.01–0.04 on Sonnet.
- **Honesty rules in the prompt:** missing fields → `null`, never invented; keep creator's wording
  for steps; `is_recipe` gate rejects non-recipe posts *before* the review screen.
- **Guardrails:** per-user import meter in Postgres (market norm: ReciMe 5/week free — ties into
  roadmap §J Otto Club gating), per-IP+user rate limits (costlyLimiter exists), transcript
  truncation ~4K tokens, token-usage logging per import.

### 2.7 Entry point: the share extension
- **Recommended: `expo-share-intent` (achorein)** — one package covers the iOS share extension
  *and* Android intent filters; payload arrives in the main app via `useShareIntent()` +
  expo-router (auth stays simple because import runs in the app, not the extension). Needs
  prebuild + a **new dev build** — the same rebuild that's already pending for Apple Sign-In.
- Alternative for "save without leaving TikTok" (Pinterest-style in-sheet UI):
  `expo-share-extension` (MaxAst) — more polish, much more complexity (separate bundle, memory
  limits, App Groups auth). Not v1.
- Always keep **in-app paste + clipboard-detection pill** (Crouton pattern) as the universal
  fallback and the iPad/desktop path.

---

## 3. Sharing — technical findings

### 3.1 The one constraint that shapes everything
**Only text channels accept a prefilled link** (share sheet, `wa.me`, `sms:`). **Instagram accepts
only pixels** (image/video). So the share button carries **two payloads**: a text/URL pipeline and
an image-card pipeline.

### 3.2 Mechanics (what to use where)
- **Text:** RN built-in `Share.share({message, url})` — zero install. iOS-only `url` field; on
  Android concatenate the URL into `message`.
- **Image files:** `expo-sharing.shareAsync(fileUri)` (local files only, generic sheet).
- **Direct channel buttons** (optional polish): `react-native-share` with its config plugin
  (`shareSingle` → `Social.Whatsapp`, `Social.InstagramStories`); works on SDK 53 dev builds;
  treat as progressive enhancement — known flaky per-target issues; generic sheet is the fallback.
- **WhatsApp:** `wa.me/?text=<urlencoded>` opens WhatsApp's own contact picker with prefilled
  text. No media, no recipient prefill via URL — that's universal, not an Otto limitation.
- **iMessage/SMS:** `sms:&body=` (iOS) vs `sms:?body=` (Android) — but the share sheet → Messages
  is more robust than a dedicated sms: button. Rich bubble appears when the message is *just* the
  URL.
- **Instagram Stories:** alive + officially documented; **needs only a free Meta App ID** (no App
  Review — mandatory since Jan 2023). iOS: pasteboard keys + `instagram-stories://share?source_application={APP_ID}`;
  Android: `com.instagram.share.ADD_TO_STORY` intent. You control background (1080×1920) + sticker
  + gradient; **no caption, no link** — branding/attribution must live in the pixels. Feed: no
  programmatic prefill exists; fallback = share sheet (users pick IG Feed/DMs) or save-to-camera-roll.
- **Image card generation:** `react-native-view-shot` (`captureRef`) on a hidden mounted card view
  (gotchas: `collapsable={false}`, position off-viewport not unmounted, wait for image/font load,
  explicit background color) + `expo-image-manipulator` for story/square/OG variants. A painted
  Otto card frame is the differentiator — **mascot/branding opt-out, attribution non-removable**
  (Alma pattern + honesty law).

### 3.3 Public share pages (the B4 destination — prerequisite for rich previews)
- Express SSR `GET /r/:slug`: OG meta (`og:title`, `og:description` "12 ingredients · 35 min",
  `og:image` **1200×630 JPEG ≤300KB** — satisfies WhatsApp's strictest limit and iMessage),
  `apple-touch-icon`, human-readable recipe, "Open in Otto" CTA. **Crawlers run no JS — SSR is
  mandatory** (Apple TN3156; WhatsApp/Meta preview docs).
- **Capability URLs:** mint unguessable slugs on first share (`nanoid(10–12)`, ~60–70 bits) in a
  `recipe_shares (slug PK, recipe_id, created_by, created_at, revoked_at)` table; never expose row
  IDs; revocation = `revoked_at` → 410; per-recipe share toggle honors `visibility`. Attribution
  travels on the page (imported source stays credited — immutable law).
- **Universal links:** AASA + assetlinks.json on the same domain, `ios.associatedDomains` +
  Android `intentFilters(autoVerify)` in app.json, expo-router route `/r/[slug]` (another
  dev-build item). **Firebase Dynamic Links is dead (Aug 2025)** — plain universal links + the SSR
  page as not-installed fallback is the modern default; Branch/OneLink only if deferred deep
  linking ever matters.

### 3.4 Shopping list sharing
- **Market pattern:** live collaboration is invite/account-based (AnyList email invites + realtime;
  Bring! invites + shopped notifications; Crouton "Household"); one-shot sharing is **plain text**
  (Paprika email/print; Yazio "Share List" toolbar action).
- **Plain-text spec (works everywhere):** title line → blank line → aisle sections as `*Produce*`
  (WhatsApp renders real bold + `- ` bullets since 2024) → `- 2 lb chicken thighs` (qty+unit
  first) → omit checked items → footer "Shared from Otto". **No Unicode checkbox glyphs** (render
  inconsistently); dumb hyphens paste cleanly into Reminders/Notes. Keep source-recipe provenance
  lines ("for World's Best Lasagna") — ReciMe keeps recipe chips on lists; it's also Otto's
  existing pattern.
- **Snapshot link** `/l/:token` (B4 machinery reused; read-only; "copy to my Otto") — matches the
  G2 recommendation. **Collaborative lists** later: `list_members` + invite-token links + Supabase
  Realtime `postgres_changes` + RLS scoped to members; invite-by-link beats invite-by-email (no
  email infra, works over any messenger); state permissions in plain words (Hypelist).

---

## 4. Otto phasing proposal (for founder + ticket)

**Phase S0 — text shares, zero backend (ships this week if wanted)**
Share button on detail + shopping list → `Share.share({message})` with honest plain-text formats.
Covers WhatsApp/iMessage/email/Notes today. No dead ends: works for every recipe (seed recipes
share their source link inline).

**Phase S1 — painted card image (needs nothing but code)**
Hidden ViewShot card → expo-sharing + save-to-camera-roll. The IG answer pre-URLs. Card = photo,
title, meta, attribution line (locked), Otto paw (removable).

**Phase I1 — social/photo/video import (the big one; one ticket)**
`expo-share-intent` + dev-build rebuild (bundle with the pending Apple Sign-In rebuild) → new
`/api/extract` LLM endpoint (Haiku, structured outputs, is_recipe gate, import meter) → oEmbed
caption fetchers (TikTok free; IG tokenless) → blog-URL chase into existing importer → same
review screen with "Otto read it — check his work" framing + "Report import mistake". Photo via
multimodal direct. Video transcript fallback behind a flag (yt-dlp worker) — decide the ToS
posture explicitly at ticket time.

**Phase S2 — public share pages + universal links (B4, coordinated change)**
`/r/:slug` + `/l/:token` SSR pages, OG images, nanoid slugs + revocation, AASA/assetlinks,
`/api/v1` prefix lands here per the existing deferral. Text shares upgrade to link shares
automatically. Optional: Meta App ID + `react-native-share` for a first-class IG Stories button.

**Phase S3 — collaborative lists (household)** — Supabase Realtime; additive schema per G2.

**Founder inputs this unlocks against:** Anthropic API key + monthly import budget cap;
a domain for share pages (determines universal links); free Meta App ID (Stories button, higher
IG oEmbed limits); the dev-build rebuild slot; decision on the video-transcript ToS posture;
import-meter numbers (free vs Otto Club — §J).

**Honesty-law checkpoints baked in:** review-before-save on every channel; extraction returns
null over guesses; attribution immutable on cards/pages/text; no dead share buttons (text share
needs no infrastructure, so the button never lies); quota shown honestly *before* intent, not as
a countdown chip; recipient entitlement stated at share time (NYT pattern).
