# 🎟️ Terminal Ticket — TestFlight Internal Testing (first iOS build)

> Goal: get Otto onto **TestFlight internal testing** so the founder (and up to 100 internal
> testers on the team) can install it on real iPhones. This ticket is executed on a **Mac with
> Xcode installed** — the cloud/Linux agent already did all the repo-side config it can (see
> "Already done" below); everything left needs an interactive Apple / Expo login, which only a
> human at a terminal can complete.
>
> All commands run from `mobile/` unless noted. Do the steps **in order** — later steps assume
> the credentials and project link created by earlier ones.

---

## Account facts (from the renewed membership — 2026-07-18)

| Field | Value |
|---|---|
| Apple Team ID | `A6J6HGNWZK` |
| Program | Apple Developer Program (Individual) |
| Bundle identifier (app) | `com.otto.recipes` |
| Bundle identifier (share extension) | `com.otto.recipes.share-extension` |
| Renewal | July 18, 2027 (active) |

> The share-extension bundle id exists because of the `expo-share-intent` plugin ("share a TikTok/IG
> link into Otto"). EAS provisions **both** ids automatically — you don't create them by hand.

---

## Already done (committed to the repo — do NOT redo)

- **`mobile/eas.json`** created with three build profiles (`development`, `preview`, `production`)
  and a `submit.production.ios.appleTeamId` = `A6J6HGNWZK`. Uses `appVersionSource: "remote"`, so
  **EAS tracks the build number for you** and auto-increments each production build.
- **`mobile/app.json`** hardened for the App Store:
  - `ios.bundleIdentifier` = `com.otto.recipes`
  - `ios.usesAppleSignIn: true` (EAS will add the "Sign in with Apple" capability)
  - `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` → **you will NOT be asked the
    export-compliance question on every TestFlight upload** (Otto only uses standard HTTPS).
- App icon verified **1024×1024, no alpha** — it will not be rejected at upload.

---

## Prerequisites (install once)

```bash
# Node 18+ and the EAS CLI
npm install -g eas-cli
eas --version            # expect >= 12

# Xcode + command line tools must be installed (App Store → Xcode, then:)
xcode-select --install    # no-op if already installed
```

You also need a free **Expo account** (expo.dev). Personal account is fine for internal testing.

---

## Step 1 — Log in to Expo and link the project

```bash
cd mobile
eas login                 # interactive — your expo.dev credentials
eas whoami                # confirm

# Creates the EAS project and writes extra.eas.projectId + owner into app.json.
# Commit that change afterward (see Step 6).
eas init
```

> If `eas init` asks to create a new project, say **yes**; slug can stay `mobile`. It will print a
> `projectId` (a UUID) and add it under `expo.extra.eas.projectId` in `app.json`.

---

## Step 2 — Provide the three build-time env vars (CRITICAL)

The app reads these `EXPO_PUBLIC_*` vars at **build time** and bakes them into the JS bundle. They
live in your local `mobile/.env` today, but **EAS Build does NOT read `.env` automatically** — you
must register them with EAS or the build will ship pointing at `localhost` and Supabase will be
undefined (white screen on launch).

They are all **client-public** values (the Supabase key is the publishable *anon* key, protected by
RLS; the API URL is your deployed backend), so plaintext EAS env vars are fine.

```bash
# Pull the exact values from your local mobile/.env, then:
eas env:create --name EXPO_PUBLIC_SUPABASE_URL       --value "<from .env>" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY  --value "<from .env>" --environment production --visibility sensitive
eas env:create --name EXPO_PUBLIC_API_URL            --value "<from .env>" --environment production --visibility plaintext

eas env:list --environment production   # verify all three are present
```

> `EXPO_PUBLIC_API_URL` must be your **deployed** backend (the Railway URL), NOT `http://localhost:5001`.
> A localhost value builds fine but the app can't reach the backend from a phone.

---

## Step 3 — Build the iOS app on EAS (cloud, no local Xcode signing needed)

```bash
eas build --platform ios --profile production
```

First run will prompt (interactive — this is why it needs a human):
- **"Generate a new Apple Distribution Certificate?"** → yes (EAS manages it).
- **"Log in to your Apple account"** → your Apple ID + app-specific password / 2FA.
- EAS registers the App ID, the share-extension App ID, the "Sign in with Apple" capability, and a
  provisioning profile automatically.

The build runs on EAS servers (~15–25 min). It ends with a `.ipa` URL. You don't download it — the
next step submits it straight from EAS.

---

## Step 4 — Submit the build to App Store Connect / TestFlight

```bash
eas submit --platform ios --profile production --latest
```

- If **no app record exists yet** in App Store Connect, `eas submit` offers to **create it** — accept
  (name "Otto", bundle `com.otto.recipes`, your primary language). This is the easiest path; you do
  NOT need to pre-create the app in the web UI.
- It needs an **App Store Connect API key** OR your Apple ID login. Easiest: let it log in with your
  Apple ID. (If you'd rather use an API key: App Store Connect → Users and Access → Integrations →
  App Store Connect API → generate a key with "App Manager" role, download the `.p8`, and pass
  `--asc-api-key-path`, `--asc-api-key-id`, `--asc-api-issuer-id`. Store the `.p8` OUTSIDE the repo.)

The uploaded build then goes through Apple "Processing" (~5–15 min).

---

## Step 5 — Turn on TestFlight internal testing (App Store Connect web)

1. Go to **appstoreconnect.apple.com → Apps → Otto → TestFlight**.
2. Wait for the build to move from **Processing** to ready.
3. Because we set `ITSAppUsesNonExemptEncryption: false`, there is **no export-compliance prompt**.
4. Under **Internal Testing**, create a group (e.g. "Otto Insiders") → add internal testers by their
   Apple ID email (they must be added under **Users and Access** first; as an Individual account
   that's mainly just you). Internal testers can install **immediately** — no Apple review needed.
5. Testers install the **TestFlight** app from the App Store, accept the invite (email or redeem
   code), and Otto appears there.

> Internal testing = up to 100 testers who are members of your team, **no App Review**. That's the
> right first step. (External testing — up to 10,000 public testers — needs a light Beta App Review
> and a filled-in "Test Information" tab; not needed yet.)

---

## Step 6 — Commit the project link

`eas init` edited `app.json` (added `extra.eas.projectId` and `owner`). Commit it so the next build
from any machine targets the same EAS project:

```bash
cd ..
git add mobile/app.json
git commit -m "Link EAS project for TestFlight builds"
git push origin main          # fast-forward only, per repo cadence
```

---

## Later builds (after this first setup)

Each new TestFlight build is just:

```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

The build number auto-increments (remote versioning). Bump `expo.version` in `app.json`
(e.g. `1.0.1`) when you want a new **user-facing** version string.

---

## Gotchas / troubleshooting

- **White screen or "Network request failed" on launch** → `EXPO_PUBLIC_API_URL` / Supabase env vars
  weren't set for the `production` environment (Step 2), or API URL points at localhost.
- **"No provisioning profile" / signing errors** → let EAS manage credentials (answer "yes" to the
  generate prompts); don't hand-manage certs in Xcode for EAS builds.
- **Sign in with Apple fails in the build** → confirm the capability shows on the App ID in the
  Developer portal (EAS adds it from `usesAppleSignIn: true`); the Supabase Apple provider must have
  the Services ID + key configured server-side (separate from the app build).
- **Build number conflict on submit** → with `appVersionSource: "remote"` this shouldn't happen; if it
  does, run `eas build:version:set` to align.
- **Backend must be reachable from the public internet** for a phone build — a laptop-only backend
  won't work. Confirm the Railway deployment is live before inviting testers.
```
