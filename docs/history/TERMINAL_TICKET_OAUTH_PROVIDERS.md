# 🎟️ Terminal Ticket — Supabase OAuth Providers (Apple / Google / Facebook)

> Goal: make the **Sign in with Apple / Google / Facebook** buttons actually work in the
> TestFlight build. The app-side is fully wired (`mobile/lib/socialAuth.js`) and **honestly
> gated**: the auth screens call `fetchEnabledProviders()` and render **only** the providers your
> Supabase project reports as enabled. So today the buttons are hidden; each one appears the
> moment you finish its section below. That means you can **ship internal testing with only Apple
> enabled** and add Google/Facebook later — nothing breaks, no dead buttons.
>
> This is all **dashboard/console work** (Supabase, Apple Developer, Google Cloud, Facebook) with
> interactive logins — it can't be scripted from the repo. Do the sections you want; each is
> independent. **Start with Apple** (App Store guideline 4.8 requires offering it once any other
> social login exists).

---

## Facts you'll reuse

| Field | Value |
|---|---|
| Apple Team ID | `A6J6HGNWZK` |
| App bundle id | `com.otto.recipes` |
| Supabase project ref | `mepzfdefanfpnrvydyty` *(confirm: Supabase → Project Settings → General → Reference ID)* |
| **Supabase OAuth callback** | `https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback` |
| **App deep-link redirect** (native) | `mobile://auth/callback` |
| Web redirect (if web is deployed) | your deployed web origin, e.g. `https://<your-web-host>` |

> **Why `mobile://`** — the app's URL scheme is `"mobile"` (`mobile/app.json`), and the code uses
> `Linking.createURL("auth/callback")` → `mobile://auth/callback` in a standalone/TestFlight build.
> *(Optional cleanup: `"mobile"` is a generic scheme; renaming it to `"otto"` is more collision-safe.
> If you ever do, it's a one-line `app.json` change + updating the redirect URLs below to
> `otto://auth/callback`. Not required for testing — noted so it's a conscious choice.)*

---

## Step 0 — Supabase URL allow-list (do this once, covers all three)

Supabase **Dashboard → Authentication → URL Configuration**:

- **Site URL:** your primary web origin if web is deployed, otherwise leave the default.
- **Redirect URLs** — add these (one per line; wildcards allowed):
  - `mobile://auth/callback`  ← the TestFlight/native build
  - `mobile://**`  ← optional catch-all for other native deep links
  - `exp://**`  ← lets sign-in work in **Expo Go / dev client** during development
  - `https://<your-web-host>/**`  ← only if the web app is deployed and you want web sign-in

> If a provider returns and the app says *"Sign-in was cancelled or didn't finish,"* the redirect
> URL almost always isn't in this list. This is the #1 cause of a silent OAuth failure.

---

## Section A — Apple  (do first)

Apple has two flows and Otto uses **both**: the **native sheet** (normal iOS sign-in) and the
**web OAuth** flow (only when an anonymous guest upgrades in place). So you configure both a
**bundle id** and a **Services ID**.

### A1. Apple Developer portal — enable the capability on the App ID
1. [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles → Identifiers**.
2. Open the App ID **`com.otto.recipes`** (EAS created it during the build). Confirm **Sign In with
   Apple** is checked. If not, check it and Save. *(EAS usually enables this from
   `usesAppleSignIn: true`, but verify.)*

### A2. Create a Services ID (for the web/link flow)
1. Identifiers → **＋** → **Services IDs** → Continue.
2. Description: `Otto Web Sign In`; Identifier: e.g. **`com.otto.recipes.signin`** (must differ from
   the bundle id). Register it.
3. Open it → enable **Sign In with Apple** → **Configure**:
   - **Primary App ID:** `com.otto.recipes`
   - **Domains:** `mepzfdefanfpnrvydyty.supabase.co`
   - **Return URLs:** `https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback`
   - Save.

### A3. Create a Sign in with Apple key (.p8)
1. **Keys → ＋** → name `Otto Apple Sign In` → check **Sign in with Apple** → Configure → Primary
   App ID `com.otto.recipes` → Save → **Register**.
2. **Download the `.p8`** (one-time download!) and note the **Key ID**. Store the `.p8` somewhere
   safe **outside the repo**.

### A4. Supabase — configure the Apple provider
**Dashboard → Authentication → Providers → Apple** → enable, then:
- **Client IDs** (comma-separated — this field takes BOTH):
  - `com.otto.recipes`  ← **required for the native sheet** (validates the identity-token audience — the most-missed step)
  - `com.otto.recipes.signin`  ← the Services ID, for the web/link flow
- **Secret Key (for OAuth):** generate the client-secret JWT from **Team ID `A6J6HGNWZK`** + your
  **Key ID** + the **`.p8`** + the **Services ID**. Follow Supabase's Apple guide
  (supabase.com/docs/guides/auth/social-login/auth-apple) — it documents the exact JWT, or use their
  generator. The secret expires (≤6 months) — set a calendar reminder to regenerate.
- **Save.**

### A5. Verify
`curl https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/settings -H "apikey: <ANON_KEY>"` → the JSON
should show `"external": { "apple": true, ... }`. In the next TestFlight build the Apple button
appears; tapping it opens the native sheet and lands you signed in.

---

## Section B — Google

Otto's Google flow is the **system browser via Supabase** (no native Google SDK), so you only need
a **Web** OAuth client — simpler than it looks.

### B1. Google Cloud Console — OAuth client
1. [console.cloud.google.com](https://console.cloud.google.com) → create/select a project (e.g. "Otto").
2. **APIs & Services → OAuth consent screen** → External → fill app name, support email, developer
   email → save. (While in "Testing" you can add test-user emails; that's fine for TestFlight.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Otto Supabase`
   - **Authorized redirect URIs:** `https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback`
   - Create → copy the **Client ID** and **Client secret**.

### B2. Supabase — configure Google
**Authentication → Providers → Google** → enable → paste **Client ID** + **Client secret** → Save.

### B3. Verify
`/auth/v1/settings` now shows `"google": true`; the Google button appears and completes in the
system browser, returning to `mobile://auth/callback`.

---

## Section C — Facebook

### C1. Meta for Developers — app + Facebook Login
1. [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App** → use case
   **Authenticate and request data with Facebook Login** → type **Consumer** → name "Otto".
2. Add the **Facebook Login** product.
3. **Facebook Login → Settings → Valid OAuth Redirect URIs:**
   `https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback` → Save.
4. **App settings → Basic:** copy **App ID** and **App Secret**.

### C2. Supabase — configure Facebook
**Authentication → Providers → Facebook** → enable → paste **App ID** (Client ID) + **App Secret**
(Client secret) → Save.

### C3. Take the Facebook app Live
A Facebook app in **Development** mode only lets listed test users log in. For real testers, toggle
the app to **Live** (top bar) — this may require a privacy-policy URL and completing basic app
details. *(If you're not ready, keep Facebook disabled in Supabase and ship Apple-only; the button
stays hidden. Honest > a button that fails for testers.)*

### C4. Verify
`/auth/v1/settings` shows `"facebook": true`; the button appears and completes.

---

## Final verification (all enabled providers)

1. Rebuild/redeploy is **not** needed for the buttons to appear — `fetchEnabledProviders()` reads
   the live `/auth/v1/settings` at runtime, so an already-installed TestFlight build shows a newly
   enabled provider on next app open. *(A rebuild is only needed for app-code changes, not provider
   toggles.)*
2. On a real device, tap each enabled button end-to-end:
   - **Apple** → native sheet → signed in.
   - **Google / Facebook** → system browser → returns to the app signed in.
3. Guest-upgrade path: use the app anonymously (import/save something), then **Sign up** with a
   provider → confirm your data survives (the code calls `linkIdentity` on sign-up for anonymous
   sessions, so imports/plans/saves keep their owner).

## Gotchas

- **Apple native button fails but web works** → `com.otto.recipes` is missing from the Apple
  provider's **Client IDs** in Supabase (A4). The native identity token's audience is the bundle id;
  without it Supabase rejects the token.
- **"cancelled or didn't finish" on Google/Facebook** → redirect URL missing from Supabase URL
  allow-list (Step 0), or the provider console's redirect URI isn't the Supabase callback exactly.
- **Apple sign-in stops working after a few months** → the client-secret JWT expired; regenerate it
  (A4). Set the reminder now.
- **Facebook works for you but not testers** → the Facebook app is still in **Development** mode (C3).
- **Web sign-in strands on the wrong origin** → add the deployed web origin to Redirect URLs; the
  code already pins `redirectTo: window.location.origin` on web so dev/preview hosts don't bounce.
```
