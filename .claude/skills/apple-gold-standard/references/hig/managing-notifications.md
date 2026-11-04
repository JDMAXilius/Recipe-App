# Managing notifications
URL: https://developer.apple.com/design/human-interface-guidelines/managing-notifications

## Summary
Apps need permission before sending any notification, and people can change that or silence everything in Settings. Notifications should integrate with Focus and scheduled delivery by using honest interruption levels, and marketing notifications require explicit opt-in plus in-app controls.

## Best practices
- Get permission before sending any notification.
- Classify notifications as communication (calls, messages; adopt SiriKit intents) or noncommunication.
- Assign a system interruption level to every noncommunication notification.
- Represent urgency honestly; overstating it erodes trust and leads people to turn notifications off.
- Use Time Sensitive only for events happening now or within an hour.
- Expect the system to explain Time Sensitive on first arrival and periodically let people turn it off.
- Reserve Critical for rare health/safety alerts; it requires an entitlement.
- Never send marketing/promotional notifications without explicit opt-in.
- Never mark a marketing notification Time Sensitive.
- Ask for marketing permission with an alert or modal that describes the content and offers a clear opt-in/opt-out.
- Provide an in-app settings screen where people can change notification choices.
- Remember that even when Focus delays an alert, the notification itself is available immediately.

## iOS specifics
None stated beyond the general guidance (Critical can override the Ring/Silent switch on iPhone and iPad).

## Specs & numbers
Four interruption levels for noncommunication notifications:

| Interruption level | Overrides scheduled delivery | Breaks through Focus | Overrides Ring/Silent switch (iPhone/iPad) |
|---|---|---|---|
| Passive | No | No | No |
| Active (default) | No | No | No |
| Time Sensitive | Yes | Yes | No |
| Critical | Yes | Yes | Yes |

- Time Sensitive: event happening now or "within an hour".
- watchOS per-notification options include "Mute 1 Hour".

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: "Your timer is done" sent as Time Sensitive. / Don't: "New recipes this week!" sent as Time Sensitive.
- Do: A weekly recipe digest sent as Passive. / Don't: Every low-priority update sent at Active or higher by default.
- Do: An in-app sheet "Get deals and new features?" with clear Allow / No Thanks buttons. / Don't: Send promo pushes just because general notification permission was granted.
- Do: A Settings > Notifications screen in the app with per-type toggles (Reminders, Tips, Offers). / Don't: Only point people to iOS Settings to opt out.
- Do: Keep Critical for health/safety with an entitlement. / Don't: Use Critical to bypass the silent switch for reminders.
