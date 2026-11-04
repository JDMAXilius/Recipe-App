# Notifications
URL: https://developer.apple.com/design/human-interface-guidelines/notifications

## Summary
Notifications deliver timely, high-value information that people can grasp at a glance, and require consent before you send any. They can appear as banners on the Lock Screen or Home Screen, badges on the app icon, and items in Notification Center; communication notifications show contact avatars and group names instead of the app icon.

## Best practices
- Keep notifications concise and informative.
- Don't send repeat notifications about the same thing, even without a response.
- Don't tell people to go do a task in the app; offer notification actions for simple tasks instead.
- Use an alert, not a notification, for error messages.
- When the app is in the foreground, surface new info subtly (increment a badge, insert data into the view) rather than interrupting.
- Never include sensitive, personal, or confidential info.
- Titles: short, contextual (headline, event name, subject), title-style capitalization, no ending punctuation; if only a generic title is possible, let the system show the app name.
- Body: complete sentences, sentence case, proper punctuation; don't truncate yourself.
- Provide generic hidden-preview text (e.g., "Friend request", "New comment", "Shipment") in sentence case.
- Don't include your app name or icon; the system adds the icon.
- Optional custom sound: short, distinctive, professionally produced; never rely on sound alone. Vibration can't be set programmatically.
- Actions: up to four buttons in the detail view; short title-case labels describing the result; no app name; account for localization.
- Don't add an action that merely opens the app.
- Prefer nondestructive actions; give context for destructive ones (system styles them distinctly).
- Give each action a simple interface icon (SF Symbols), shown trailing the title.
- Badges: only for unread notification counts, never weather, dates, prices, or scores.
- Don't rely on badges alone for essential info; keep counts current; never fake a badge with a custom image.

## iOS specifics
- None stated (no additional iOS/iPadOS considerations).
- When previews are hidden, the system shows only the app icon and the default title "Notification".
- Communication notifications show the sender's contact image badged with a small app icon.
- Setting the badge to zero removes related notifications from Notification Center.

## Specs & numbers
- Notification actions: up to 4 buttons.
- (watchOS) Long look custom actions: up to 4, plus system Dismiss button at the bottom.
- (watchOS) Long-look background to match system: white at 18% opacity.
- (watchOS) Double tap runs the first nondestructive action; example options 5 minutes, 15 minutes, an hour.
- Change log: October 24, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: Banner titled "Order Shipped" with body "Your package arrives Thursday." / Don't: Banner titled "Recipe App" with body "Open the app to check your order".
- Do: Calendar notification expanded with a "Snooze" action button and icon. / Don't: An action button labeled "Open App".
- Do: Hidden-preview body "New comment". / Don't: Lock Screen preview revealing a private message or account balance.
- Do: Badge "3" for three unread messages. / Don't: Badge "72" showing today's temperature.
- Do: While viewing the inbox, insert the new item at the top of the list. / Don't: Fire a banner for content already on screen.
- Do: One notification for a reminder. / Don't: Three repeat notifications for the same reminder stacking in Notification Center.
- Do: Show a failed-save error as an in-app alert. / Don't: Send a push notification saying "Error saving".
