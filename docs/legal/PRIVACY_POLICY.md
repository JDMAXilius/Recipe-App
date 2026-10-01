> Mirror of the ottosapp.com website repo's legal/PRIVACY_POLICY.md, synced 2026-09-30. Edit there, not here.

# Otto — Privacy Policy

> **⚠️ DRAFT — starting point, not legal advice.** This is written to be accurate to what the Otto
> app actually does today (verified against the codebase), so it's a strong first draft. But privacy
> law is jurisdiction-specific — **have a lawyer or a privacy-policy service review it before you
> publish**, especially the rights sections (GDPR/CCPA) and the legal-entity details. Update it
> whenever the app's data behavior changes.

---

**Effective date:** September 30, 2026
**App:** Otto (the "App")
**Website:** https://ottosapp.com (the "Site")
**Provider:** Juan Diego Lugo ("we", "us", "our")

Otto is a recipe app — a quiet cookbook that lets you save, import, cook, plan, and share recipes.
This policy covers both the **App** and our **Site**. It explains what information we handle, why,
and the choices you have. We've tried to write it plainly.

---

## The short version

- We collect the **minimum** needed to run the App: your **account** (email, and a name if your
  sign-in provider gives one) and the **content you create** (recipes you save or import, meal plans,
  and shopping lists).
- Your **cooking-journal plate photos, food preferences, and reminder settings stay on your device** —
  they are not uploaded to us.
- We **do not sell your data**, we **do not show ads**, and we **do not track you across other apps
  or websites**. There is no advertising or cross-app tracking in Otto.
- You can **delete your account** from inside the App at any time.

---

## 1. Information we collect

### a) Information you give us
- **Account information.** When you create an account, we receive your **email address**. If you sign
  in with Apple, Google, or Facebook, we receive your email and, if the provider supplies it, your
  **name** and a provider account identifier; signing in with Google also gives us a **profile photo
  URL** the provider hosts (we don't otherwise use or display it). We use a third-party authentication
  provider (see §4) to manage sign-in and passwords; we do not store your password ourselves.
- **Your content.** Recipes you save or import, meal plans, and shopping list items — including items
  on lists you choose to **share with people you invite**. If you add a photo to a recipe, that photo
  is uploaded and stored so it can display in the App; see "Recipe photos" below.
- **Recipe photos you upload.** A photo you attach to a recipe (as opposed to a cooking-journal photo,
  which stays on your device — see §1(c)) is uploaded to our storage provider and served by a direct
  link. Choose photos you're comfortable being reachable by anyone who has that link.
- **Membership and purchases.** If you join Otto Club, our payment processor (see §4) manages the
  purchase and tells us your membership status and its expiration date, so the App can unlock what
  you paid for. We never see or store your card details — Apple's App Store handles payment directly.
- **Messages you send us.** If you email support or send feedback or a bug report from the App, we
  receive what you write and basic context you include (such as the App version and your device's
  operating system).

### b) Information collected automatically
- **Limited technical/diagnostic data.** To keep the service reliable, our servers process routine
  request information (such as a request's time, the operating system type, IP address, and
  approximate location derived from it) and **error/diagnostic logs** when something goes wrong. This
  includes what you search for in Otto's recipe catalogue: our infrastructure provider's request logs
  record the search term alongside your account and the request's IP address and approximate location,
  for a limited retention window, to keep the service reliable and secure. We use this to fix bugs,
  protect the service, and understand load — not to build an advertising profile, and not shared with
  advertisers. The App does **not** include third-party advertising or analytics SDKs.
- **Voice input.** If you use the microphone to talk to Otto instead of typing, your speech is
  processed by Apple's on-device or server-side speech recognition (depending on your settings and
  connectivity) to produce a text transcript. Otto receives only that transcript, never the audio
  itself.

### c) Information that stays on your device (we do **not** collect it)
- **Cooking-journal photos** of your finished plates, your **food preferences** (diet and cuisines),
  your **reminder settings**, and **onboarding state** are stored **only on your device**. They are
  not uploaded to our servers. If you delete the App, this on-device information is removed with it.

### d) Our website
Our Site is a **static marketing and legal site**. It has no accounts, no sign-in, and no shopping.
It sets **no cookies** and embeds **no advertising or cross-site tracking scripts** — so there is
nothing to consent to and no cookie banner.

We do measure **aggregate page views** on the Site using **Vercel Web Analytics**, a cookieless
analytics tool. It records which page was viewed, the referring site, and coarse details such as
country, browser, and device type, and uses a **daily-rotating hash** to estimate visitor counts. It
does **not** set cookies, does **not** keep a persistent identifier for you, does **not** build a
profile, and does **not** follow you to other websites. We use it only to see which pages people find
useful. There are still **no analytics of any kind inside the App itself**.

Our hosting provider also processes standard server request data (such as IP address and browser
type) to serve pages and protect against abuse.

### e) Information from third parties
- When you use a social sign-in, the provider (Apple, Google, or Facebook) sends us the limited
  profile information described in §1(a). We do not receive your social media posts, contacts, or
  friend lists.

### f) The contact form on our Site
The one exception to (d): our Site has a **contact form**. If you use it, we receive what you enter —
your **email address**, your **message**, and, if you provide them, your **name** and a **subject**.
We use this information for one purpose: **to read and reply to your message**. Sending the message
uses **Resend** (an email delivery provider), which processes it to deliver it to our inbox. Our
server also briefly processes your **IP address** to limit abuse of the form (rate limiting); it is
not stored with your message. We keep contact messages like ordinary email correspondence — as long
as needed to handle your request and a reasonable period after — and you can ask us to delete them at
**juandiego@ottosapp.com**. The form sets no cookies and uses no CAPTCHA or tracking.

### g) How Otto uses AI
Several App features are powered by a third-party AI provider (**Anthropic**). We send it only what a
feature needs to do its job:
- what you type when you **chat with Otto** or **paste recipe text** to import it;
- **the photo itself**, if you import a recipe by taking or choosing a picture of it;
- the **public caption of a post** (for example on TikTok or Instagram), when you import it by link
  and the page doesn't publish the recipe in a standard format, so Otto can read the recipe from it;
- an **ingredient name**, when our own nutrition data doesn't already have it, so Otto can estimate
  its nutrition.

Ingredient names that reach this step are also checked against **USDA FoodData Central**, a public
U.S. government nutrition database, and the matched result is kept in a shared lookup table so the
next person who cooks with the same ingredient doesn't need a fresh lookup — see §7 for how that
table relates to your account.

Anthropic processes this content to generate the response Otto shows you (a recipe, a chat reply, a
nutrition estimate); we don't use it to train models, and it is not sold or used for advertising.

## 2. How we use information

We use the information above to:
- create and secure your account and sign you in;
- store and sync the recipes, plans, and lists you create;
- power features you ask for (importing a recipe from a link, sharing a recipe or list, planning your
  week);
- respond to your support messages and fix problems;
- keep the service safe and working (debugging, preventing abuse, rate-limiting).

We rely on these information practices to provide the App you asked for. We do **not** use your
information for advertising or to track you across other services.

---

## 3. Recipe browsing

Some recipes you browse come from a third-party recipe database (TheMealDB). Requests to browse or
search those recipes are handled to return results; we don't use that browsing to build an
advertising profile.

## 4. How we share information

We do **not sell** your personal information. We share it only with service providers that help us
run the App, and only as needed:

- **Authentication & database provider (Supabase).** Manages sign-in, runs the servers the App talks
  to, and stores your account and content.
- **Sign-in providers you choose (Apple / Google / Facebook).** Only when you use social sign-in, and
  only to authenticate you.
- **AI provider (Anthropic).** Powers chat, recipe import, and nutrition-matching — see §1(g) for
  exactly what we send it.
- **Payment processor (RevenueCat).** Manages Otto Club subscriptions and tells us your membership
  status; Apple's App Store handles the actual payment.
- **Recipe data provider (TheMealDB).** For browsing built-in recipes.
- **Nutrition data provider (USDA FoodData Central).** For ingredient nutrition lookups — see §1(g).
- **Video provider (YouTube).** Some recipes include a cooking video. It plays in YouTube's embedded
  player only when you open it, and YouTube (Google) receives that request, including your IP address
  and device information, under Google's privacy policy. We don't send YouTube your account details.

We may also disclose information if required by law, to protect our rights or users' safety, or in
connection with a business transfer (e.g., a merger or acquisition), in which case we'll honor the
commitments in this policy.

## 5. Sign in with Apple and "Hide My Email"

If you use Sign in with Apple and choose to hide your email, Apple gives us a private relay address
instead of your real one. We use that relay address the same way we'd use a normal email — to run
your account. You can manage or stop the relay in your Apple ID settings at any time.

## 6. Sharing you initiate

- **Public share links.** If you create a share link for a recipe, anyone with that link can view the
  shared recipe — the link is designed to be hard to guess, but it is **public to whoever holds it**.
  You can revoke a share link in the App.
- **Collaborative shopping lists.** If you invite others to a shared list, the items on that list, and
  the first names/labels associated with who added or checked items, are visible to the people you
  invite.

Please share only what you're comfortable making visible to the people who receive the link or
invitation.

## 7. Data retention and deletion

- We keep your account and content for as long as your account is active.
- **You can delete your account** at any time from the App (Profile → delete account). Deleting your
  account removes your account and the **recipes, meal plans, and favorites** associated with it from
  our systems, along with your **membership record** at our payment processor (RevenueCat).
- **Please note:** content you chose to share may persist after deletion — for example, a **public
  share link** you created or an item on a **shared list** may remain visible to others until it is
  separately revoked or removed. Revoke share links and leave/clear shared lists before deleting if
  you want that content gone. *(We're working to make account deletion sweep this content
  automatically; until then, this is the honest state.)*
- On-device information (journal photos, preferences) is removed when you delete the App from your
  device.
- **One thing survives deletion, and it isn't yours:** when Otto works out nutrition for an
  ingredient, it keeps the *ingredient name* and what it matched to in a shared lookup table — so
  the next person who cooks with "smoked paprika" doesn't cost anyone another lookup. Those rows
  carry no account, no user ID and nothing linking them to you, and they are not deleted with your
  account because after deletion there is nothing to connect them to. Your recipes, plans and
  favorites are deleted as described above.
- We may retain limited records where we're required to for legal, security, or fraud-prevention
  reasons.

## 8. Your rights and choices

Depending on where you live, you may have the right to **access, correct, delete, or export** your
personal information, and to object to or restrict certain processing. You can exercise the core of
these directly — view and edit your content in the App, and delete your account — or contact us at
**juandiego@ottosapp.com** and we'll help.

- **California (CCPA/CPRA):** We do not sell or "share" personal information for cross-context
  behavioral advertising, and we don't use it for targeted advertising.
- **EEA/UK (GDPR):** Our legal bases are performing our contract with you (running the App),
  legitimate interests (keeping the service secure and reliable), and your consent where required.
  You may lodge a complaint with your local data protection authority.

We will not discriminate against you for exercising these rights.

## 9. Where your information is processed

We and our service providers process and store information in the **United States**. If you use Otto
from outside the U.S., you understand your information will be transferred to and processed in the
U.S., where privacy laws may differ from those in your country.

## 10. Security

We use reasonable technical and organizational measures to protect your information (such as
encrypted connections and access controls). No method of transmission or storage is 100% secure, so
we can't guarantee absolute security, but we work to protect your data and to address issues
promptly.

## 11. Children's privacy

Otto is not directed to children under 13 (or the minimum age required in your country), and we do
not knowingly collect personal information from them. If you believe a child has provided us personal
information, contact us at **juandiego@ottosapp.com** and we'll delete it.

## 12. Changes to this policy

We may update this policy as the App evolves. When we make material changes, we'll update the
effective date above and, where appropriate, notify you in the App. Your continued use of Otto after
an update means you accept the revised policy.

## 13. Contact us

Questions or requests about your privacy? Reach us at:

**Juan Diego Lugo**
Email: **juandiego@ottosapp.com**
https://ottosapp.com

Governed by the laws of **the State of Florida, United States**, without regard to conflict-of-laws principles.
