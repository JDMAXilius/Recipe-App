# Apple Pay
URL: https://developer.apple.com/design/human-interface-guidelines/apple-pay

## Summary
Apple Pay is a secure way to pay for physical goods, services, donations, and subscriptions in apps and browsers; virtual goods use In-App Purchase instead. An Apple Pay button brings up a payment sheet showing card, total (with tax and fees), shipping, and contact info, which people authorize with Face ID, Touch ID, Optic ID, or Apple Watch.

## Best practices
- Offer Apple Pay wherever supported; don't show it on unsupported devices.
- If you check for an active Wallet card, make Apple Pay the primary (not necessarily sole) option everywhere; don't push it into a separate step; consider pre-selecting it.
- Use Apple Pay buttons only to start payment or Apple Pay setup.
- A custom payment button must not say "Apple Pay" or show its logo; then show the Apple Pay mark or text on the same page.
- The Apple Pay mark only signals acceptance; never use it as a button.
- Never hide or disable the Apple Pay button; if something's missing (size/color), explain after the tap.
- Keep checkout cohesive and branded; avoid new pages/windows.
- Assume people want Apple Pay: show it first, larger, or separated by a line.
- Add Apple Pay buttons on product pages for single-item buys (exclude cart items; remove the item from the cart after purchase); offer express checkout for carts.
- Support coupons/promo codes on the payment sheet, and show active codes there.
- Collect required options (size, color) and optional info (gift message, instructions) before the sheet; highlight and auto-navigate to missing fields.
- Gather multiple shipping methods/destinations and pickup location before the sheet (sheet supports one method/destination).
- Prefer contact/shipping data from Apple Pay; don't require account creation before purchase; offer it on the confirmation page with prefilled fields.
- Report results in the sheet; then show an order confirmation/thank-you page (e.g., "1234 (Apple Pay)" or "Paid with Apple Pay").
- Show only essential sheet info (no shipping address for an e-gift card).
- Shipping options: description, cost, optional delivery/pickup date range; pickup windows allowed.
- Line items: explain extra charges, discounts, pending costs, donations, recurring/future payments; not an itemized product list; keep each to one line.
- Total line: "Pay [Business_Name]" matching the bank statement; intermediaries use "Pay [End_Merchant (via Your_Business)]".
- Disclose possible extra costs after authorization with an "Amount Pending" subtotal.
- Don't add your own spinners; the sheet shows progress.
- Validation: ignore irrelevant data and infer missing data (accept Zip+4, phone with/without dashes or country code); give specific, field-referencing messages ("Zip code doesn't match city") as noun phrases, sentence case, no ending period.
- On cancel or timeout, cancel the in-progress payment.
- Subscriptions: clarify terms before the sheet; line items for frequency, discounts, upfront fees; trials show trial amount ($0 if free), regular amount, and start date; total shows today's charge; show the sheet for changes only when cost rises.
- Donations: line item like "Donation $50.00"; offer preset amounts plus Other Amount.
- Always use API-generated buttons; never custom-design or replicate them.
- Styles: Black on light backgrounds; White with outline on white/light lacking contrast; White on dark; or Automatic.
- Button no smaller than other payment buttons and visible without scrolling; side-by-side: Apple Pay right of Add to Cart; stacked: Apple Pay above Add to Cart; corner radius may match your buttons.
- Mark: Apple artwork only, height-only changes, at least as tall as other brand marks; no effects, trademark symbol, rotation, or animation.
- Text: "Apple Pay" exactly (two words, capital A and P), never plural/possessive/translated; ® on first US body-text use, not in checkout options; text-only only when all options are text-only.

## iOS specifics
- None stated (no additional iOS/iPadOS considerations).
- Set Up Apple Pay button: for supported devices not yet set up; place in Settings, profile, or an interstitial.
- The system may show the default card image on payment buttons.

## Specs & numbers
| Button | Minimum width | Minimum height | Minimum margins |
|---|---|---|---|
| Apple Pay | 100pt (100px @1x, 200px @2x) | 30pt (30px @1x, 60px @2x) | 1/10 of button height |
| Book / Buy / Check Out / Donate / Set Up / Subscribe with Apple Pay | 140pt (140px @1x, 280px @2x) | 30pt (30px @1x, 60px @2x) | 1/10 of button height |

- Website icon: 60x60 pt (120x120 px @2x; 180x180 px @3x).
- Error messages: 128 characters or fewer.
- Mark clear space: at least 1/10 of its height.
- Example donation presets: $25, $50, $100. Example ZIP: five digits (ignore Zip+4 extras).
- Payment button types (by use): purchase, bill pay, Check Out, Continue, Book, Donate, Subscribe, Reload, Add Money, Top Up, Order, Rent, Support, Contribute, Tip, plain Apple Pay (fallback when size or OS doesn't fit the title; no fallback for Set Up). Button captions were images in source.
- Change log: June 8, 2026; December 16, 2025; June 10, 2024; September 12, 2023; May 2, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page (June 8, 2026 change log notes guidance refined for "the latest Apple Pay appearance").

## Do / Don't
- Do: Product page with a black Apple Pay button to the right of "Add to Cart", same size. / Don't: A small Apple Pay button below other options that requires scrolling.
- Do: Payment sheet total "Pay Otto Kitchen" with line items "Shipping $4.99", "Discount -$5.00". / Don't: Line items listing every product in the cart.
- Do: Tap Apple Pay without a size chosen, then highlight "Choose a size". / Don't: Gray out the Apple Pay button until options are selected.
- Do: Subscription sheet lines "Free trial $0.00", "Then $9.99/month starting Dec 10". / Don't: A sheet that hides the recurring amount.
- Do: Error "Shipping not available for this state". / Don't: Generic "Address is invalid".
- Do: Confirmation page "Paid with Apple Pay" plus "Create an account" with prefilled fields. / Don't: Force account sign-up before checkout.
- Do: Show the Apple Pay mark alongside other card marks at equal height. / Don't: Use the mark as a tappable button or add a glow.
