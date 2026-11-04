# Managing accounts
URL: https://developer.apple.com/design/human-interface-guidelines/managing-accounts

## Summary
Require an account only when core functionality needs it, and delay sign-in as long as possible. Prefer Sign in with Apple or passkeys, name the authentication method clearly, and if people can create an account in the app, they must be able to delete it there too.

## Best practices
- Let people use the app without an account unless the core function requires one.
- If required, explain the reasons and benefits briefly and warmly in the sign-in view.
- Delay sign-in; e.g., let people browse a shopping app and ask only at purchase.
- Consider Sign in with Apple; otherwise prefer passkeys (username only, no password).
- If passwords remain, add two-factor authentication.
- Label the method explicitly ("Sign In with Face ID", not just "Sign In").
- Only mention methods the device actually supports (no Face ID text on a non-Face ID device).
- Avoid an in-app toggle for biometrics; people enable it system-wide.
- Don't call account credentials a "passcode"; that term means the device passcode.
- Provide real deletion (not just deactivation) for accounts created in-app; comply with local laws.
- If law requires retaining some data, explain what's kept and why.
- Make deletion easy to start in the app; if it must happen on the web, link directly and don't bury it in policy pages.
- Keep in-app and web deletion flows equally simple.
- Consider scheduled future deletion, but always offer immediate deletion too.
- Tell people when deletion will finish and notify them when done.
- With in-app purchases, explain that Apple billing continues until the subscription is canceled, and how to cancel or request a refund.
- Support account deletion even if the subscription wasn't bought in your app.
- Revoke Sign in with Apple tokens on deletion.

## iOS specifics
None stated (no additional considerations for iOS/iPadOS).

## Specs & numbers
- tvOS 16 and later: apps can share credentials across users while keeping profiles separate.
- Settings paths referenced: Settings > TV Provider; Settings > Privacy.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Let people browse recipes freely; show sign-in when they tap "Save". / Don't: A sign-in wall as the very first screen.
- Do: Sign-in sheet with a one-line benefit ("Sync your recipes across devices") above Sign in with Apple. / Don't: A bare email/password form with no explanation.
- Do: Button labeled "Sign In with Face ID". / Don't: Generic "Sign In" button that silently triggers Face ID.
- Do: "Delete Account" row in Account settings leading to a clear confirm flow. / Don't: Deletion only via a link buried in the Terms of Service.
- Do: Deletion confirmation explaining the Apple subscription still bills until canceled, with a "Manage Subscription" link. / Don't: Delete the account silently while the subscription keeps billing.
- Do: Offer "Delete now" alongside "Delete at end of billing period". / Don't: Only offer a 30-day scheduled deletion with no immediate option.
- Do: Rely on system Face ID settings. / Don't: An in-app "Enable Face ID" toggle or text asking for a "passcode".
