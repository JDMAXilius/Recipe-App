# Mobbin Gap Studies — Splash, Report/Block, Public Profile

**Date:** 2026-07-15 · **Source:** Mobbin iOS library (16 searches, screens + flows)
**Purpose:** Close three research gaps for Otto — (1) launch/brand moment, (2) App Store Guideline 1.2 moderation kit for future UGC, (3) Phase 2 public profile / shared cookbook layout.
**Otto context:** hand-painted otter mascot, terracotta palette, serif type, honesty-first voice. No follower counts at social launch.

---

## Study 1 — Splash / Launch: the brand moment

How top consumer apps handle the ~1–2 seconds between tap and content.

### Comparison

| App | What the launch moment is | Composition | Static or animated | Mobbin |
|---|---|---|---|---|
| Duolingo | Mascot-first welcome: Duo centered, lowercase wordmark + tagline below, CTAs at bottom | Character above wordmark, white bg | Static frame; Duo animates post-launch, not on splash | [Screen](https://mobbin.com/screens/fb4eda98-538d-4bc0-9ef6-bf06ed401c12) |
| Spotify | Logo + value prop ("Millions of songs. Free on Spotify.") on near-black | Small centered glyph, headline carries the weight | Static | [Screen](https://mobbin.com/screens/f4f60cac-2462-4fc9-a931-aa44e727d693) |
| Instacart | Full-bleed food photography (peas) with wordmark lockup overlaid mid-screen | Photography as brand surface | Static | [Screen](https://mobbin.com/screens/455fc90a-478b-4bc8-915c-97e88ab89cb7) |
| foodpanda | Mascot glyph + wordmark centered on flat brand pink | Single saturated brand color, white lockup | Static | [Screen](https://mobbin.com/screens/43192558-43ca-4b96-9ecb-4e8595a34727) |
| Zocdoc | Quiet horizontal lockup (mark + wordmark) on off-white | Centered, generous whitespace | Static | [Screen](https://mobbin.com/screens/362c8c2e-acc2-4d2d-ad37-a7f50994bcfb) |
| Moonly | Glowing crescent centered, wordmark + tagline pinned at bottom on near-black | Mark and wordmark split top/bottom | Static frame of a soft glow treatment | [Screen](https://mobbin.com/screens/8d3e6506-6d72-4609-bfa4-7da398ce8744) |
| Fabric | Mascot glyph alone on black — no wordmark at all | Pure mark, maximum confidence | Static | [Screen](https://mobbin.com/screens/ef8ddfe1-47fc-4551-894d-e08dc884ad52) |
| Headspace | Branded *loading interstitial*: "Thinking carefully about which course is right for you…" on brand blue | Copy replaces logo as the brand moment | Copy screen during real wait | [Screen](https://mobbin.com/screens/c33855ab-1009-4b68-9d9f-d94efa221d43) |
| Airbnb | Branded mode-switch transition ("Switching to hosting") with 3D house illustration | Illustration + one line of copy | Illustrated transition during real work | [Screen](https://mobbin.com/screens/7b540b04-1c64-4f54-8d1d-d31078b72fdc) |

### Three strongest patterns

1. **Flat brand-color splash, mark centered, wordmark secondary** (foodpanda, Zocdoc, Moonly, Fabric). iOS launch screens must effectively be static (LaunchScreen storyboard renders before code runs), so the winning move is one confident mark on one brand color, with any motion happening *after* the first app frame via a seamless cross-fade.
   **Trap:** faking a "loading animation" by delaying entry. Anything over ~1.5–2s of gate reads as slowness, and Apple flags launch screens that behave like ads or intros.
2. **Mascot as the logo** (Duolingo, foodpanda, Fabric). Character apps put the character — not the wordmark — at the center of the launch moment; Duolingo's splash is literally Duo above a lowercase wordmark.
   **Trap:** making the mascot perform on every cold start. Duolingo saves Duo's animation for onboarding and in-app moments; a mascot doing tricks at every launch goes stale in a week and adds perceived latency.
3. **Voice in the wait** (Headspace, Airbnb). When there is a *real* wait (personalization, mode switch, sync), replace the spinner with one line of brand-voice copy or illustration. The wait becomes a brand moment instead of dead air.
   **Trap:** inventing a wait to show the copy. Headspace's line appears only while work actually happens; inserting artificial delay for branding is exactly the dishonesty Otto is positioned against.

### Otto synthesis

Otto's launch should be a static hand-painted otter mark centered on terracotta (or the otter on warm cream with terracotta wordmark), serif wordmark below, matching the LaunchScreen storyboard pixel-for-pixel so the OS splash cross-fades invisibly into the first in-app frame — the foodpanda/Zocdoc formula wearing Otto's paint. No tagline, no CTAs: unlike Duolingo's splash-as-signup-gate, Otto launches signed-in users straight toward their recipes, and the brand moment should cost them nothing. Reserve motion for two honest cases only: a one-time animated hello in first-run onboarding, and a Headspace-style single line of Otto voice ("warming the pan…") *only* when a cold sync genuinely takes longer than ~1 second. Hard rules: total gate ≤1.5s, never an artificial delay, and the otter blinks or bobs once (≤600ms) at most — the honesty-first brand means the splash never pretends work is happening when it isn't.

---

## Study 2 — Report / Block flow (App Store 1.2 moderation kit)

Guideline 1.2 requires UGC apps to ship: a way to **report offensive content**, a way to **block abusive users**, and **published contact/terms**. This kit is a prerequisite for any Otto sharing feature.

### Comparison

| App | Entry point | Report reasons UI | Block UX | Confirmation state | Mobbin |
|---|---|---|---|---|---|
| Reddit | "…" on post → "More actions" sheet; Report + Block account in red, grouped at bottom | Full-screen "Submit a Report" stepper; per-reason follow-up questions (e.g. "Who is being impersonated?"); Submit disabled until a choice is made | Offered *inside* the report confirmation as an inline toggle ("Block Eddy_Key — you won't be able to send direct messages…") | "Thanks for your report" screen with checkmark, warm copy, Done | [Flow](https://mobbin.com/flows/c1aa9180-be5a-4dd1-8f36-265ddd718ff5) |
| Instagram | Profile "…" / chat options → Restrict · Block · Report menu | (separate flow) | Bottom sheet: avatar, "Block instagram?", note that future accounts are blocked too, 2 icon bullets ("They won't be able to message you or find your profile", "They won't be notified"), **Block** + **Block and report** | Toast "instagram is blocked"; button flips to Unblock in place | [Flow](https://mobbin.com/flows/4e3b4199-be15-45f2-a658-18aba79509b5) |
| Letterboxd | Profile menu → Report Member | Modal form: context paragraph (policy link, points to block as the tool for unwanted interactions), **Reason for report** picker + optional free-text message; Send disabled until reason chosen. Reason list is long and behavioral ("Account exhibits a pattern of…") | Separate profile-menu action (referenced in the report form copy) | Standard send | [Form](https://mobbin.com/screens/076b26b4-f2f7-4c2a-a4b3-07e47606f011) · [Reasons](https://mobbin.com/screens/98410c47-5ae6-4252-b54d-ca6d42a2aaf1) |
| Beli | Profile / settings | — | Settings → **Blocked accounts** list with per-row Unblock button (the reversal surface) | List updates in place | [Screen](https://mobbin.com/screens/fc230243-18b0-4b1a-94eb-b2ce1d874c06) |
| Plenty of Fish | Profile | — | Sheet: avatar with slash badge, plain-language consequences, "Blocked accounts are never notified", **Block Now** + **Block and report** | — | [Screen](https://mobbin.com/screens/c249bc62-90df-4ccc-97bf-7fc9a2093592) |
| Sora | Member row → Block/Report | — | Sheet with 2 icon bullets: can't message/find you; won't be notified | — | [Screen](https://mobbin.com/screens/95b7a087-1955-46fd-bac9-5454cd365f01) |
| Apple Music | Profile "…" | — | Alert with a dense 60-word paragraph of consequences (anti-pattern: technically honest, practically unread) | — | [Screen](https://mobbin.com/screens/7e640096-a0a1-4631-b95a-090487cf9c44) |

### Three strongest patterns

1. **Reason-first with disabled submit** (Reddit, Letterboxd). The report surface opens on a reason list, the primary button stays disabled until a reason is chosen, and free-text is optional — this yields triageable reports and satisfies 1.2 with minimal friction. Letterboxd's behavioral phrasing ("exhibits a pattern of…") also sets community tone.
   **Trap:** Reddit-depth nested steppers. Sub-questions per reason are right for a platform with millions of reports; for Otto v1 every extra step is abandonment. One reason + optional note is enough.
2. **Consequence-explainer block sheet** (Instagram, Plenty of Fish, Sora). The canonical block dialog: avatar of the person, question-form title, 2–3 icon bullets in plain language, the reassurance line **"they won't be notified,"** and paired actions **Block** / **Block and report**.
   **Trap:** Apple Music's paragraph wall — cramming every edge case into one unbroken alert paragraph. If a consequence matters, it gets a bullet; if it doesn't, it goes to a help page.
3. **Closure with escalation, and instant visible state** (Reddit, Instagram, Beli). Reddit thanks the reporter and offers block *inline* at the moment of highest intent; Instagram flips Follow→Unblock and toasts immediately; Beli provides a Blocked accounts list so reversal is always findable.
   **Trap:** over-promising outcomes ("we'll remove this within 24 hours"). Confirmation copy must describe what actually happens — for a small team, that's human review, not an SLA.

### Otto synthesis

Otto's 1.2 kit: every piece of future UGC (shared recipe, note, photo, profile) gets a "…" overflow whose sheet ends with red **Report recipe / Report user** and **Block user** — Reddit's grouped-destructive layout. Report opens a single terracotta-accented sheet: 5–7 plain-serif reasons (spam, stolen recipe, offensive content, impersonation, something else), submit disabled until one is picked, optional note field — Letterboxd's form without its novel-length reason list. Confirmation speaks Otto-honest: "Thanks — a human will look at this. We won't tell them it was you." with Reddit's inline block offer underneath. The block sheet follows the Instagram/POF canon — avatar, "Block this cook?", two icon bullets, "They won't be notified," Block + Block and report — and this is one surface where the otter stays out of frame: moderation moments need seriousness, not whimsy. Settings gets a Beli-style **Blocked accounts** list, and blocking takes effect instantly with the button flipping in place. Build the whole kit as a dormant component set now so sharing can ship the moment it's ready.

---

## Study 3 — Public profile / shared cookbook (Phase 2 social)

How curation-first apps lay out a public identity page — noting Otto will omit follower counts initially.

### Comparison

| App | Header | Counts treatment | Content layout | Follow affordance | Mobbin |
|---|---|---|---|---|---|
| Letterboxd (own profile) | Centered avatar, location, one-line bio | Stat rows as *navigation*: Films 8/5 this year · Diary · Reviews · Lists — each a tappable row with count | FAVORITES 4-poster row (pinned identity), then Recent Activity grid; Profile/Diary/Lists/Watchlist tabs | None on own profile; follower/following buried far down the stat list | [Screen](https://mobbin.com/screens/8fb27903-30a5-4aca-a647-e4845a2d5304) |
| Letterboxd (other member) | Name in nav bar, straight into Recent Activity | Same navigable stat rows (Films 1,325 · Reviews 1,222 · Following 28) + rating-distribution histogram | Poster grid with per-film star ratings | Quiet — page reads complete without prominent social counts | [Screen](https://mobbin.com/screens/9590f73e-39a4-4460-a19b-d2f81c66ffc2) |
| Beli | Avatar, @handle, member-since, quote-style bio | Vanity 3-up: Followers 814.3k / Following / Rank #837, plus streak + leaderboard cards | List rows: Been 1244 · Want to Try 983; activity tab gated "Followers only" | Prominent Follow pill + IG/TikTok links directly under bio | [Screen](https://mobbin.com/screens/fa5ae271-1fb8-4e3e-b3e7-929b58eb444b) |
| Recime (cookbook page) | Emoji cover + serif title "Dessert", "2 Recipes" count directly beneath | Single content count only — no social numbers anywhere | Filter chips (Ingredients, Total time) over a 2-col recipe-card grid | Add-collaborator person+ icon and "…" in header — sharing as *collaboration*, not following | [Screen](https://mobbin.com/screens/f9a07edd-7c7c-497b-b48b-88cf8ba9fdac) |
| CREME (creator profile) | Name in nav bar, share icon top-right, icon tabs | None visible | Content grids per tab; honest empty state: "Omer Alony's cookbooks are being cooked and will soon be available" | Share-first, follow secondary | [Screen](https://mobbin.com/screens/ff2ff970-41c8-463b-a8b4-079eac77f0a5) |
| NYT Cooking (recipe share) | — | — | Native share sheet from recipe page | Honest share toast: "Recipe shared! Your recipient will be able to read and save it, even without a subscription." | [Flow](https://mobbin.com/flows/3bf6d1b5-399d-4ea2-b540-b4c5bfb03054) |

### Three strongest patterns

1. **Identity through curation, not audience** (Letterboxd FAVORITES row). Four pinned posters above the fold say who this person is better than any follower count — and Letterboxd's other-member view proves a profile can feel complete with social counts demoted to list rows near the bottom. Direct precedent for Otto shipping profiles with zero follower numbers.
   **Trap:** the empty pinned row. New users have no favorites; without a designed empty state ("Pin your signature dishes") the hero of the page is a void.
2. **Counts as doors, not trophies** (Letterboxd stat rows vs Beli's 3-up). Letterboxd renders every number as a tappable row leading to content — the count is an index, not a scoreboard. Beli shows the opposite pole: follower vanity, rank, streaks, and a "Followers only" gate.
   **Trap:** importing Beli's competitive scaffolding (ranks, streak pressure, gated activity) — engagement-bait mechanics that directly contradict Otto's honesty-first positioning.
3. **Collection page = cover + title + count + filters + grid, with collaboration over broadcast** (Recime, NYT Cooking). Recime's cookbook is emoji cover, serif title, "N Recipes", filter chips, 2-col cards — and its social affordance is *invite a collaborator*, not gain followers. NYT's share toast tells the sender exactly what the recipient gets, even without an account.
   **Trap:** walling shared content behind signup. If a shared Otto cookbook link hits a login gate, the share loop dies at the first non-user.

### Otto synthesis

Otto's public profile should read like a Letterboxd page repainted in terracotta: hand-painted header band, serif display name and a one-line bio, a **Signature dishes** pinned row of 3–4 recipe cards as the identity statement, then cookbooks as a cover grid and stat *rows* that are doors — "34 recipes · 12 cooked this month" tapping through to the content itself — with no follower or following numbers anywhere in v1 (the Letterboxd other-member view is proof the layout holds without them; a single quiet "Follow" button slot in the header is reserved for later, added without reflow). The shared cookbook page borrows Recime wholesale: painted or emoji cover badge, serif title, honest recipe count, ingredient/time filter chips, two-column card grid — plus Recime's collaborator-invite as the *primary* social verb, since cooking together is more Otto than broadcasting. Every share terminates in a NYT-style honest toast ("They can read and save these recipes — no account needed"), shared links render view-only for non-users, and CREME's hand-written empty state ("This cookbook is still simmering") covers the cold-start. Ranks, streak pressure, and follower-gated content are explicitly out — Otto measures a profile in dishes cooked, not audience captured.

---

*Compiled from Mobbin iOS · 2026-07-15 · Ticket P10 guardrail research.*
