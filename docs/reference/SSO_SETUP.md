# Social sign-in — founder setup (P10 §3)

The app side is fully wired: sign-in and sign-up render a "Continue with …" row
for **every provider the Supabase project has enabled** (checked live against
`/auth/v1/settings`), Apple listed first (App Store 4.8). Today zero providers
are enabled, so zero rows render — nothing is dead, nothing is fake. Flip a
provider on in Supabase and its row appears in the app with no code change.

Supabase project: `mepzfdefanfpnrvydyty`
OAuth callback URL for every provider console:
`https://mepzfdefanfpnrvydyty.supabase.co/auth/v1/callback`

## 1. Apple (required first — App Store 4.8)
1. Apple Developer → Certificates, IDs & Profiles:
   - App ID `com.otto.recipes` → enable **Sign In with Apple** capability.
   - Create a **Services ID** (e.g. `com.otto.recipes.auth`), enable Sign In with
     Apple, set the callback URL above as a Return URL.
   - Create a **Sign In with Apple key** (.p8), note Key ID + Team ID.
2. Supabase → Authentication → Providers → Apple: enable; Services ID as
   Client ID; generate the client secret from the .p8/Key ID/Team ID.
3. Native: `app.json` already has `usesAppleSignIn` + the plugin. The iOS dev
   build must be rebuilt once (prebuild + pods) so the entitlement + native
   sheet exist — after that the row signs in natively via `signInWithIdToken`.

## 2. Google
1. Google Cloud Console → OAuth consent screen (External) → create a **Web
   application** OAuth client. Authorized redirect URI = the callback URL above.
2. Supabase → Providers → Google: enable, paste Client ID + Secret.
3. No native config needed — the app uses the system browser + deep link back.

## 3. Facebook (optional — first to cut, per P10-2)
1. Meta for Developers → create an app → Facebook Login → set the callback URL
   above as a Valid OAuth Redirect URI. App Review for public login.
2. Supabase → Providers → Facebook: enable, paste App ID + Secret.

## 4. Supabase redirect allow-list (both flows)
Authentication → URL Configuration → Redirect URLs, add:
- `mobile://auth/callback` (current dev-build scheme)
- `com.otto.recipes://auth/callback` (bundle-id scheme, future-proof)
- `http://localhost:8081` and the production web origin, when web ships

## Behavior already handled in code (`mobile/lib/socialAuth.js`)
- Anonymous guests who tap a social row are **linked in place**
  (`linkIdentity`) so their imports/plans/saves keep their owner — same rule
  as the email sign-up upgrade path.
- Apple's native sheet is iOS-only; the row hides on web/Android.
- User-cancelled sheets/browsers fail silent; real errors surface inline.
