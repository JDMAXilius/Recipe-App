# Siri
URL: https://developer.apple.com/design/human-interface-guidelines/siri

## Summary
Siri helps people find information and take quick actions across the system, via voice, swiping down from the Dynamic Island, or the Siri app; on supported devices Siri AI (powered by Apple Intelligence) adds natural language and on-screen context awareness. Apps join in by exposing actions (intents) and content (entities) with the App Intents framework, ideally mapped to App schema domains, and by sharing contextual info.

## Best practices
- Expose features through App Intents; associate them with App schema domains (email, music, photos, etc.) when they fit, else use App Shortcuts.
- Annotate onscreen views with app entities so Siri understands references to on-screen content.
- Donate entities to the Spotlight index and donate actions as intents so Siri can anticipate needs.
- Identify your most popular actions and when/where they happen (e.g., hands-free, specific devices) to prioritize.
- Use familiar terms for content and actions (track vs. song vs. podcast).
- Offer relevant content (recent searches, favorites, bookmarks, wishlist) rather than everything, except where whole catalogs matter (email, messaging).
- Never include ads, marketing, or in-app purchase pitches in Siri content.
- Only add custom responses when built-in ones don't suffice; optional properties may not always appear.
- Write clear, descriptive dialogue; customize follow-ups ("Which soup?" not "Which one?").
- Keep responses succinct; no filler or jokes.
- Make responses work both audibly and visually; voice must stand alone.
- Be inclusive; avoid unnecessary gendered pronouns ("Who should I send it to?").
- For long option lists, ask an open-ended question.
- Keep responses device-independent; reference a device only if accurate.
- Omit your app name; the system attributes it.
- Use appropriate language, respect parental controls; responses may be heard aloud.
- Make errors specific ("Sorry, we're out of chicken noodle soup").
- Call Siri "Siri", never she/him/her; never impersonate Siri or Apple; don't use reserved phrases like "Call 911" or "Hey Siri".
- When localizing "Hey Siri", translate only "Hey"; never translate "Siri".

## iOS specifics
- None stated as a separate section.
- People can invoke Siri by swiping down from the Dynamic Island or in the Siri app.
- Snippets (e.g., a playback control) can display custom static or interactive UI in Siri responses.

## Specs & numbers
- No numeric UI specs.
- "Hey Siri" translations (selected): da_DK Hej Siri; de_* Hey Siri; en_* Hey Siri; es_CL/ES/MX/US Oye Siri; fi_FI Hei Siri; fr_BE/CA/CH/FR Dis Siri; it_CH/IT Ehi Siri; ja_JP Hey Siri; ko_KR Siri야; ms_MY Hai Siri; nb_NO/no_NO Hei Siri; nl_BE Hé, Siri; nl_NL Hé Siri; pt_BR E aí Siri; ru_RU привет Siri; sv_SE Hej Siri; th_TH หวัดดี Siri; tr_TR Hey Siri; zh_CN 嘿Siri; zh_HK 喂 Siri; zh_TW 嘿 Siri; ar_AE/ar_SA يا Siri.
- Change log: June 8, 2026 (revised for Siri AI); June 5, 2023; May 2, 2023.

## New in iOS 26 / Liquid Glass
Not mentioned on this page. (Page does describe Siri AI, powered by Apple Intelligence, revised June 8, 2026: on-screen awareness and follow-up requests like "Add this photo to my Landscapes album" then "And email it to Josh".)

## Do / Don't
- Do: Siri snippet "Added Tomato Soup to your list" showing the item. / Don't: Response "Recipe App says: Done! Also try Premium for $4.99!".
- Do: Follow-up "Which soup?" with a short list. / Don't: Follow-up "Which one?" or reading 40 options aloud.
- Do: Error "Sorry, we're out of chicken noodle soup". / Don't: "Sorry, we can't complete your order."
- Do: "Who should I send it to?" / Don't: "What's his or her name?"
- Do: In-app copy "Ask Siri to start a timer". / Don't: Copy referring to Siri as "she" or a custom voice imitating Siri.
- Do: Voice response that conveys the full result without the screen. / Don't: "Here's what I found" with essentials only visible onscreen.
