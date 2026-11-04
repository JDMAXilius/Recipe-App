# Apple HIG digest — index (iOS/iPadOS, Liquid Glass era)

Fetched 2026-11-03 from `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json`. The live HIG is now on the **iOS/iPadOS 27** cycle (What's new, Sept 2026: iOS 27 UI Kit, iPhone Duo, "Apple In-App Purchase" rebrand), so Liquid Glass (introduced with iOS 26, WWDC25) is the current baseline. Raw JSON: `../raw/`, extracted text: `../text/`. All digests are paraphrased. Some run over 600 words because of spec tables (widgets, apple-pay, live-activities, color).

**Fetch result:** 53 of 55 requested slugs OK. `navigation-bars` 404 (merged into Toolbars, stub written). `in-app-purchase` 404, fetched as `apple-in-app-purchase`. Also fetched: `scroll-views` (scroll edge effects), `designing-for-ios`, `designing-for-iphone-duo` (text only, no digest), the What's new page, and transcripts of WWDC25 sessions 219 and 356.

## Pages
| Group | Slug | Title | One-line summary | Fetch |
|---|---|---|---|---|
| Foundations | [accessibility](accessibility.md) | Accessibility | An accessible interface is intuitive, perceivable through more than one sense, and adapts to how each person uses their device. | OK |
| Foundations | [app-icons](app-icons.md) | App icons | Your app icon is a core brand asset that appears on the Home Screen, in Search, notifications, Settings, and share sheets. | OK |
| Foundations | [color](color.md) | Color | Color communicates status, hierarchy, brand, and interactivity, but must stay consistent and never be the only signal. | OK |
| Foundations | [dark-mode](dark-mode.md) | Dark Mode | Dark Mode is a systemwide setting people expect every app to respect, using dimmer backgrounds and brighter foregrounds rather than a simple inversion. | OK |
| Foundations | [layout](layout.md) | Layout | A good layout orders content by importance, groups and aligns related items, and adapts gracefully across screen sizes, orientations, windows, and text sizes. | OK |
| Foundations | [materials](materials.md) | Materials | Materials create depth and hierarchy by letting background color pass through foreground layers. | OK |
| Foundations | [motion](motion.md) | Motion | Motion conveys status, feedback, and instruction, and system components already include it, adjusting for accessibility settings and input method. | OK |
| Foundations | [privacy](privacy.md) | Privacy | Be transparent about the data and resources you need, ask only when needed, and protect what people share. | OK |
| Foundations | [sf-symbols](sf-symbols.md) | SF Symbols | SF Symbols is Apple's library of thousands of configurable symbols that align with the San Francisco font in every weight and size. | OK |
| Foundations | [typography](typography.md) | Typography | Typography should be legible, express hierarchy, and scale with Dynamic Type. | OK |
| Foundations | [writing](writing.md) | Writing | The words in your app are part of its UX. | OK |
| Foundations | [branding](branding.md) | Branding | Express brand identity in ways that are recognizable yet feel native to the platform. | OK |
| Foundations | [images](images.md) | Images | Deliver artwork at the right scale factors and formats so it stays sharp on every display. | OK |
| Patterns | [launching](launching.md) | Launching | Launching covers the span from opening the app (including the first download) until the first screen is ready. | OK |
| Patterns | [onboarding](onboarding.md) | Onboarding | Onboarding helps people get started, but ideally the app is understandable just by using it. | OK |
| Patterns | [loading](loading.md) | Loading | The best loading experience finishes before people notice it. | OK |
| Patterns | [managing-accounts](managing-accounts.md) | Managing accounts | Require an account only when core functionality needs it, and delay sign-in as long as possible. | OK |
| Patterns | [managing-notifications](managing-notifications.md) | Managing notifications | Apps need permission before sending any notification, and people can change that or silence everything in Settings. | OK |
| Patterns | [modality](modality.md) | Modality | Modality presents content in a dedicated mode that blocks the parent view and requires an explicit action to dismiss. | OK |
| Patterns | [searching](searching.md) | Searching | People search across the system, within apps, and inside documents. | OK |
| Patterns | [settings](settings.md) | Settings | Apps should just work with great defaults, offering only a minimal set of customizations. | OK |
| Patterns | [feedback](feedback.md) | Feedback | Feedback tells people what's happening, what they can do next, the result of their actions, and how to avoid mistakes. | OK |
| Patterns | [entering-data](entering-data.md) | Entering data | Make it easy and error-free for people to give you information. | OK |
| Patterns | [offering-help](offering-help.md) | Offering help | The best experiences are intuitive, but contextual help fills the gaps. | OK |
| Patterns | [ratings-and-reviews](ratings-and-reviews.md) | Ratings and reviews | People check ratings before downloading, so a great experience and good timing matter. | OK |
| Patterns | [going-full-screen](going-full-screen.md) | Going full screen | iPhone, iPad, and Mac offer full-screen modes that hide system controls for distraction-free focus on games, media, or deep tasks. | OK |
| Patterns | [undo-and-redo](undo-and-redo.md) | Undo and redo | Undo and redo let people reverse actions and experiment safely. | OK |
| Patterns | [scroll-views](scroll-views.md) | Scroll views | A scroll view lets people move through content larger than its bounds. | OK (added: scroll edge effects) |
| Components | [tab-bars](tab-bars.md) | Tab bars | A tab bar switches between an app's top-level sections while keeping each section's navigation state intact. | OK |
| Components | [toolbars](toolbars.md) | Toolbars | A toolbar is a horizontal set of controls along the top or bottom edge that holds the view title, navigation (back, search) and actions. | OK |
| Components | [navigation-bars](navigation-bars.md) | Navigation bars | In iOS, the navigation bar is the top toolbar: it shows the current view's title, a Back button to retrace the hierarchy, optional search, and a few actions. | 404, merged into Toolbars (stub built from toolbars) |
| Components | [sidebars](sidebars.md) | Sidebars | A sidebar sits on the leading side and navigates between app areas or top-level collections like folders. | OK |
| Components | [buttons](buttons.md) | Buttons | A button triggers an immediate action and is defined by style, content (symbol and/or text) and role. | OK |
| Components | [menus](menus.md) | Menus | A menu reveals a list of commands, options or states on demand, saving space. | OK |
| Components | [lists-and-tables](lists-and-tables.md) | Lists and tables | Lists and tables present rows of mostly textual data, optionally grouped or hierarchical, with selection, adding, deleting and reordering. | OK |
| Components | [collections](collections.md) | Collections | A collection shows an ordered set of content in a visual layout, ideal for images. | OK |
| Components | [sheets](sheets.md) | Sheets | A sheet handles a scoped task tied to the current context, then returns people to the parent view. | OK |
| Components | [alerts](alerts.md) | Alerts | An alert interrupts with critical information that needs action now, such as a problem or an irreversible destructive step. | OK |
| Components | [action-sheets](action-sheets.md) | Action sheets | An action sheet is a modal set of choices related to an action the person just started, like discarding or saving a draft. | OK |
| Components | [popovers](popovers.md) | Popovers | A popover is a transient view that appears above content from a control, showing a small amount of info or functionality. | OK |
| Components | [search-fields](search-fields.md) | Search fields | A search field is a text field with a search icon, clear button and placeholder for finding content. | OK |
| Components | [segmented-controls](segmented-controls.md) | Segmented controls | A segmented control is a row of two or more equal-width segments acting as buttons, usually for a single choice among closely related options. | OK |
| Components | [toggles](toggles.md) | Toggles | A toggle switches between two opposing states (such as on/off) and looks visibly different in each. | OK |
| Components | [pickers](pickers.md) | Pickers | A picker shows one or more scrollable lists of distinct values to choose from, with styles that vary in values and appearance. | OK |
| Components | [text-fields](text-fields.md) | Text fields | A text field is a rectangular area for entering or editing small, specific pieces of text such as a name or email. | OK |
| Components | [progress-indicators](progress-indicators.md) | Progress indicators | Progress indicators show that an app isn't stalled while it loads content or runs a long operation; they are transient and disappear when the task finishes. | OK |
| Components | [widgets](widgets.md) | Widgets | Widgets surface timely, glanceable content and focused actions from an app in places like the iPhone Home Screen, Lock Screen, StandBy, and CarPlay. | OK |
| Components | [live-activities](live-activities.md) | Live Activities | A Live Activity lets people follow an ongoing task or event (delivery, match, workout, ride) at a glance, with frequent updates over a few hours and optional light interaction. | OK |
| Components | [notifications](notifications.md) | Notifications | Notifications deliver timely, high-value information that people can grasp at a glance, and require consent before you send any. | OK |
| Components | [sign-in-with-apple](sign-in-with-apple.md) | Sign in with Apple | Sign in with Apple lets people sign in or sign up with their existing Apple Account, skipping forms, email verification, and passwords, with Face ID/Touch ID and built-in two-factor authentication. | OK |
| Components | [in-app-purchase](in-app-purchase.md) | Apple In-App Purchase | Apple In-App Purchase (rebranded September 17, 2026) lets people securely buy digital goods and services, such as premium content and subscriptions, inside an app; items can also be promoted on the App Store. | OK via slug `apple-in-app-purchase` (`in-app-purchase` 404s) |
| Components | [apple-pay](apple-pay.md) | Apple Pay | Apple Pay is a secure way to pay for physical goods, services, donations, and subscriptions in apps and browsers; virtual goods use In-App Purchase instead. | OK |
| Components | [healthkit](healthkit.md) | HealthKit | HealthKit is the central store for health and fitness data on iPhone, iPad, and Apple Watch; apps can ask permission to read and write it (e.g., a nutrition app reading weight/activity and writing logged calories). | OK |
| Components | [siri](siri.md) | Siri | Siri helps people find information and take quick actions across the system, via voice, swiping down from the Dynamic Island, or the Siri app; on supported devices Siri AI (powered by Apple Intelligence) adds natural language and on-screen context awareness. | OK |

## Liquid Glass overview

**What it is.** Liquid Glass is a dynamic "digital meta-material" that bends, shapes and concentrates light (*lensing*) instead of scattering it like the old blurs. It flexes and lights up on touch, morphs between controls as context changes, and materializes rather than fading. [219] It forms a **distinct functional layer for controls and navigation that floats above the content layer**. [materials]

**Where it applies.** Tab bars, toolbars and navigation bars, sidebars (inset, floating on iPad), sheets, popovers, alerts, menus, and prominent buttons. Sliders and toggles take on glass only while being dragged. System components adopt it automatically. [materials, 219, 356]

**Rules**
- **Content first.** Use glass only for the navigation/control layer, never in the content layer (lists, cards, backgrounds). Use standard materials there instead. [materials, 219]
- **Use sparingly on custom controls.** Apply it to the most important functional elements only, and put the material on the control itself, not on its inner views. [materials, 356]
- **No glass on glass.** Don't stack glass elements. Things placed on top of glass use fills, transparency and vibrancy instead. [219]
- **Variants.** *Regular* is adaptive and used almost everywhere, including anything text-heavy (alerts, sidebars, popovers). *Clear* is highly translucent and only for controls over media-rich content with bold, bright foregrounds. Behind clear glass over bright content, add a **35% dark dimming layer**. Never mix the two variants. [materials, 219]
- **Adaptivity.** Small elements (nav, tab and toolbars) flip between light and dark with the content behind them, and their symbols and text flip to stay monochrome-legible. Large elements (menus, sidebars) adapt but don't flip, and appear more opaque. [color, 219]
- **Tinting.** Glass has no color of its own. Tint sparingly, only for primary actions or status, and tint the **background** of a prominent button (for example the blue Done checkmark), not its glyph. Never tint everything. Put brand color in the content layer. Solid opaque fills break the material. [color, 219, 356]
- **Floating and concentric shapes.** There are three shape types. *Fixed* has a constant radius. A *capsule* has a radius of half its height. A *concentric* shape's radius is the parent radius minus the padding. Nested shapes share a center so corners never look pinched or flared. Near the iPhone screen edge, use a capsule with extra margin. Bar components have concentric radii by default. [356, toolbars]
- **Scroll edge effects** replace hard dividers. Use them only where floating UI overlaps scrolling content, and only one per view. *Soft* is the default on iOS. *Hard* is for pinned headers and is mostly a macOS style. Don't mix or stack the two. [356, scroll-views, 219]
- **Bars.** Remove custom bar backgrounds and borders. Group items by function. Don't put symbols and text in one group. Move overflow into a More menu. Keep the primary action separate and tinted. Search is a dedicated trailing tab on iOS. A tab bar accessory is for persistent features such as a mini player, never screen-specific actions. Tab bars can minimize on scroll. [356, tab-bars, toolbars]
- **Modality.** Pair a sheet that interrupts the flow with a dimming layer. A sheet for a parallel task relies on glass separation instead. Action sheets now spring from their source element. [356]
- **Steady state.** At rest (for example at launch), avoid content intersecting glass. [219]
- **Accessibility is automatic.** Reduce Transparency makes glass frostier. Increase Contrast makes it mostly black or white with a border. Reduce Motion removes elastic effects. [219]
- Supporting changes: system colors were retuned, and typography is bolder and left-aligned in alerts and onboarding. [356]

Sources: [219] WWDC25 "Meet Liquid Glass" https://developer.apple.com/videos/play/wwdc2025/219/ · [356] WWDC25 "Get to know the new design system" https://developer.apple.com/videos/play/wwdc2025/356/ · HIG Materials, Color, Toolbars, Tab bars, Scroll views · What's new https://developer.apple.com/design/whats-new/

## Key numbers

| Spec | Value | Source |
|---|---|---|
| Minimum hit target (button) | 44×44 pt (visionOS 60×60) | buttons |
| Control size, iOS/iPadOS | default 44×44 pt, minimum 28×28 pt | accessibility |
| Text size, iOS/iPadOS | default 17 pt, minimum 11 pt | accessibility |
| Contrast (WCAG AA) | up to 17 pt: 4.5:1 · 18 pt and up: 3:1 · bold text: 3:1 | accessibility |
| App icon canvas | 1024×1024 px, layered, square (system masks the corners). Appearances: default, dark, clear light/dark, tinted light/dark | app-icons |
| Clear-glass dimming layer | 35% dark, over bright content | materials |
| Sheet detents | large (full height) and medium (about half). Custom detents allowed | sheets |
| Capsule radius | half the height · concentric radius = parent radius minus padding | WWDC 356 |
| iOS tab bar / nav bar / toolbar height | **not stated** in current HIG (only the tvOS tab bar: 68 pt, 46 pt from the top) | tab-bars |
| iPhone screen sizes and safe-area insets | **unverified.** The 2026 Layout page no longer lists device dimensions. From prior knowledge only: iPhone 17 Pro 402×874 pt, 17 Pro Max 440×956 pt, iPhone Air 420×912 pt, iPhone 16e 390×844 pt. Status bar and home indicator insets are also unverified (roughly 62/34 pt on Dynamic Island devices) | unverified |

**iOS Dynamic Type, Large (default) size**, verified against typography (emphasized weight added Dec 2025):

| Style | Weight | Size pt | Leading pt | Emphasized |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

Note: Large Title is **Regular** weight in Apple's table (Bold is its emphasized variant). Fonts: SF Pro (system) and New York. The other sizes (xSmall to AX5) are in the typography digest. For system color RGB values see the color digest (taken from swatch labels).
