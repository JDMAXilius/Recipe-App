# Apple In-App Purchase
URL: https://developer.apple.com/design/human-interface-guidelines/apple-in-app-purchase

## Summary
Apple In-App Purchase (rebranded September 17, 2026) lets people securely buy digital goods and services, such as premium content and subscriptions, inside an app; items can also be promoted on the App Store. It supports consumables, non-consumables, auto-renewable subscriptions, and non-renewing subscriptions; physical goods, services, and donations use Apple Pay instead.

## Best practices
- Let people experience the app before asking them to buy; consider limited free access for subscriptions.
- Make the store feel integrated with your app's style, not like a different app.
- Use short, plain product names and descriptions that don't truncate or wrap.
- Show the total billing price for every purchase, whatever the type.
- Show the store only when people can pay (e.g., hide or explain when parental restrictions apply).
- Use the system confirmation sheet; never modify or replicate it.
- Highlight Family Sharing ("Family", "Shareable" in names; mention on sign-up); write messaging that works for purchasers and family members ("Your family subscription includes...").
- Offer an in-app purchase-help screen: troubleshooting, FAQs, contact options, and a link into the system refund flow.
- Title the refund action simply: "Refund" or "Request a Refund".
- List recent purchases with image, name, description, and purchase date to identify the right one.
- Offer alternatives (immediate fulfillment, conciliatory item) but make clear refunds remain available; don't hide the refund button behind scrolling or another screen.
- Don't characterize or predict Apple's refund decisions.
- Subscriptions: show value during onboarding with a strong call to action and clear terms; offer a range of levels and durations.
- Offer free sampling (freemium, metered paywall, free trial); prompt at relevant moments (e.g., nearing a free limit).
- Don't pitch subscriptions to existing subscribers; offer sign-in if subscriptions are shared across apps/web.
- Sign-up: distinct short option names with price and duration; for intro offers list intro price, offer duration, and standard price after.
- Ask only for necessary info at sign-up; defer the rest.
- Sign-up screen must include: subscription name, duration, and what's provided each period; localized billing amount; a sign-in/restore option; plus Terms of Service and Privacy Policy links.
- Explain free trials clearly, including that payment starts automatically when the trial ends, with trial length and billed amount.
- Include a subscribe option in settings.
- Offer codes: explain offer details; custom codes only alphanumeric ASCII; tell people to redeem custom codes via URL or in-app; add a "Redeem Code" button (paywall, onboarding, settings) that launches the system flow; supply a promotional image (defaults to app icon); welcome people right after redemption.
- Management: show subscription summary and upcoming renewal date near the manage option; consider the system manage-subscriptions UI; on cancel attempts remind of losses, suggest other plans or discounts; always make cancellation easy to find.

## iOS specifics
- None stated as a separate section (no additional iOS/iPadOS considerations).
- Subscription offer codes are an iOS/iPadOS feature: one-time use codes (generated in App Store Connect; redeem via URL, in app, or App Store) and custom codes (e.g., NEWYEAR, SPRINGSALE; redeem via URL or in app only, not App Store account settings).

## Specs & numbers
- 4 content types: consumable, non-consumable, auto-renewable subscription, non-renewing subscription.
- Family Sharing: up to 5 additional family members.
- 2 offer code types: one-time use and custom.
- Custom codes: alphanumeric ASCII only; no special characters (including Chinese and Arabic characters).
- Example sign-up options: monthly, biannual, annual.
- Change log: September 17, 2026 (rebranded); September 12, 2023; November 3, 2022.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Paywall listing "Monthly $4.99/month", "Annual $39.99/year ($3.33/mo)" with the total billing price most prominent and a "Restore Purchases" link. / Don't: Show only "$3.33/mo" without the annual total charged.
- Do: Free trial card stating "7 days free, then $39.99/year, auto-renews". / Don't: "Start Free Trial" with no mention of the price after the trial.
- Do: Let people cook a few recipes, then prompt when they hit the free limit. / Don't: Open the app straight to a hard paywall.
- Do: Settings "Subscription" row showing "Renews Dec 3" and a clear "Manage" / cancel option. / Don't: Bury cancellation several screens deep with a vague label.
- Do: Purchase-help screen with recent purchases (image, name, date) and a visible "Request a Refund" button. / Don't: Hide the refund option below FAQs requiring scrolling.
- Do: Use the system purchase confirmation sheet. / Don't: Draw a custom lookalike confirmation sheet.
- Do: Show a subscriber "You're subscribed" status. / Don't: Show the "Subscribe now" banner to someone already paying.
