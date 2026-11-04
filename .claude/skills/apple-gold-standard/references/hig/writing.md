# Writing
URL: https://developer.apple.com/design/human-interface-guidelines/writing

## Summary
The words in your app are part of its UX. Define a consistent voice, adapt tone to the situation, and write clear, action-oriented, inclusive copy for buttons, errors, empty states, settings, and fields.

## Best practices
- Define your app's voice from your audience and values; keep a list of standard terms.
- Match tone to context (serious for errors/payments, celebratory for achievements).
- Be clear: cut unneeded words; read it aloud.
- Write for everyone: plain language, no jargon or gendered terms, localization-ready.
- Put the most important information first; split multiple ideas across screens.
- Label buttons and links with verbs; "Send" beats "Let's do it!"; avoid "Click here", use descriptive link text.
- Build and reuse language patterns.
- Pick a capitalization style per element type (title case = formal, sentence case = casual) and apply it consistently.
- Multi-step flows: start with "Get Started", advance with consistent "Continue" or "Next", end with "Done".
- Use possessives sparingly ("Favorites" not "Your Favorites"); avoid "we" ("Unable to load content" not "We're having trouble...").
- Use device-correct verbs ("tap" on iPhone/iPad, not "click"); be brief on small screens.
- Empty states: welcoming, useful, with a clear next action button; don't put crucial info there.
- Errors: near the problem, no blame, say how to fix ("Choose a password with at least 8 characters"); skip "oops".
- Choose the right delivery (notification, alert, action sheet) for urgency.
- Settings labels: practical; describe what "on" does; link directly to a setting instead of describing its path.
- Text fields: clear labels plus hints ("name@example.com", "Your name"); instructive inline errors ("Use only letters for your name"), not "Invalid name".

## iOS specifics
- "No additional considerations" for any platform.
- On iPhone, say "tap", and keep copy brief for the small screen.

## Specs & numbers
- Example password rule: at least 8 characters.
- No other numeric specs on this page.

## New in iOS 26 / Liquid Glass
Not mentioned on this page.

## Do / Don't
- Do: button "Save Recipe". / Don't: button "Let's do it!"
- Do: error under the field "Choose a password with at least 8 characters." / Don't: banner at top "Oops! Invalid password."
- Do: "Unable to load recipes. Try again." / Don't: "We're having trouble loading this content."
- Do: empty list "No saved recipes yet" + "Browse Recipes" button. / Don't: a blank white screen.
- Do: tab label "Favorites". / Don't: "My Favorites" in one place and "Your Favorites" in another.
- Do: "Get Started" > "Continue" > "Done" through onboarding. / Don't: mix "Next", "Proceed", and "OK" for the same step.
- Do: placeholder "name@example.com". / Don't: unlabeled field with no hint.
