# Design system documentation for a production mobile app (React Native / Expo + Figma)

> Research notes, compiled 2026-11-04. **Source reliability:** this session's network blocked direct fetches of designtokens.org, w3.org, medium.com, figma.com and help.zeroheight.com. Only web-search snippets and github.com were reachable. Findings marked **[S]** come from this session's search results, which summarise the linked pages. Findings marked **[K]** come from the researcher's prior knowledge of a stable primary source. Those URLs are real canonical pages, but they were *not re-fetched this session*, so check exact wording and numbers before quoting them.

---

## 1. What does a "golden standard" design system doc set look like, and which sections recur?

### Takeaway
Apple HIG, Material 3, Polaris, Carbon, Atlassian and GOV.UK all converge on roughly the same top level:
- Get started / principles
- Foundations: colour, type, spacing/layout, iconography, motion, accessibility, content/voice
- Components
- Patterns
- Tokens / resources
- Community / contribution, with a changelog

They differ in emphasis. Apple and Material are platform guidelines. Polaris, Carbon and Atlassian are product systems that ship code. GOV.UK is research-evidence-led and adds a public contribution backlog.

### Cited findings
- **Atlassian** puts content guidance under Foundations: `atlassian.design/foundations/content/voice-tone`. Voice is the brand's personality and tone is how that personality flexes by situation, for example an error versus a completed project. Voice traits: "bold, optimistic, and practical with a wink". Six principles: inform, empower, encourage, motivate, satisfy, delight. **[S]** — [Atlassian Voice and tone](https://atlassian.design/foundations/content/voice-tone); [Atlassian voice & tone principles](https://Atlassian.design/content/voice-and-tone-principles)
- Atlassian says its voice applies across all properties and to anyone writing customer-facing copy. **[S]** — [Atlassian content](https://atlassian.design/content)
- **Polaris** (Shopify) has a content / voice-and-tone section with four voice guidelines and do/don't screenshots. This comes from a secondary comparison; the primary page was not retrieved. **[S]** — secondary report surfaced in search; verify at [polaris.shopify.com](https://polaris.shopify.com)
- **GOV.UK Design System** has a "Community" area with contribution criteria and a public backlog on GitHub. **[S]** — [GOV.UK contribution criteria](https://design-system.service.gov.uk/community/contribution-criteria); [govuk-design-system-backlog](https://uithub.com/alphagov/govuk-design-system-backlog)
- The GOV.UK model has been cloned by other UK departments (MoJ, DfE, ONS, DWP, Defra, SIS), each with near-identical "contribution criteria" pages. That makes it a de facto template for public-sector systems. **[S]** — [MoJ criteria](https://design-patterns.service.justice.gov.uk/community/criteria); [ONS criteria](https://service-manual.ons.gov.uk/community/how-to-contribute/contribution-criteria); [DfE propose](https://design.education.gov.uk/design-system/contribute/)
- **Apple HIG** top-level structure: Getting started, Foundations (accessibility, app icons, branding, colour, dark mode, icons, images, inclusion, layout, materials, motion, playing haptics, privacy, right-to-left, SF Symbols, typography, writing), Patterns, Components, Inputs, Technologies. **[K]** — [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- **Material 3** top-level structure: Get started, Foundations (accessibility, adaptive design, content design, interaction states, layout, tokens), Styles (colour, elevation, icons, motion, shape, typography), Components, plus Develop per platform. Each component page has Overview / Specs / Guidelines / Accessibility tabs. **[K]** — [m3.material.io](https://m3.material.io)
- **IBM Carbon** component pages use Usage / Style / Code / Accessibility tabs. Carbon also documents its contribution and governance process. A secondary source cites it, with Salesforce Lightning, as a "hybrid" model: the core team owns foundations and primitives, and product teams contribute patterns. **[K]** for the tabs ([carbondesignsystem.com](https://carbondesignsystem.com)); **[S]** for the hybrid claim ([designer-skills governance summary](https://supercode.sh/en/skills/owl-listener/designer-skills/design-system-governance)), which is a weak secondary source.
- **Brad Frost, *Atomic Design*:** atoms → molecules → organisms → templates → pages. This is the canonical mental model for layering a component library and its docs, and the book is free online. **[K]** — [atomicdesign.bradfrost.com](https://atomicdesign.bradfrost.com/)

### Recurring section checklist, synthesised from the systems above
| Layer | Artifact | Seen in |
|---|---|---|
| Principles | 3–6 opinionated principles, each with a "this means… / this doesn't mean…" | Apple, Material, Polaris, Carbon, GOV.UK |
| Brand & voice | Voice traits, tone-by-situation matrix, vocabulary/word list | Atlassian, Polaris, Material "content design", Apple "Writing" |
| Foundations | Colour, typography, spacing/layout grid, elevation/materials, shape/radius, iconography, motion, haptics, accessibility | all |
| Tokens | Token reference tables plus downloadable JSON | Material, Carbon, Polaris, Atlassian |
| Components | One page per component (see section 2) | all |
| Patterns | Multi-component flows: forms, empty states, onboarding, errors, search | GOV.UK (very strong), Apple, Material, Polaris |
| Content | Microcopy rules, capitalisation, error message formula, inclusive language | Atlassian, Polaris, GOV.UK, Apple |
| Resources | Figma library link, code package, changelog, roadmap, versioning policy | all product systems |
| Community | Contribution model, office hours, request/backlog | GOV.UK, Carbon, Atlassian |

### Inferences
- For a recipe app with a mascot, the reasonable minimum is: Principles → Voice → Foundations (incl. motion + haptics + sound + mascot/illustration) → Tokens → Components → Patterns → Changelog. Community/contribution can be a single page for a 1–3 person team.
- Apple HIG is the right *behavioural* reference for an iOS-first Expo app. Material 3 is the best-documented *token/motion system* to borrow structure from, even if visuals are not Material.

### Gaps
- Primary pages for Polaris, Carbon and Material were not fetched this session, so current tab names may have drifted.

---

## 2. What is the anatomy of a good component spec page?

### Takeaway
A strong component page is both a **design spec** and a **code contract**. It has:
- Overview / when to use
- Anatomy (numbered parts)
- Variants
- States
- Sizes / layout / spacing (tokens, not px)
- Props API that mirrors the Figma component properties
- Behaviour / interaction (incl. motion + haptic)
- Content guidelines
- Accessibility (roles, labels, focus, target size, contrast, reduced motion)
- Do/Don't pairs
- Related components
- Status / version / changelog

### Cited findings
- **EightShapes Specs Figma plugin** (Nathan Curtis, Feb 2023) generates a spec to the right of a component with frames for **Title, Anatomy, Props (if an instance), Layout and spacing (if Auto Layout is used)**. Anatomy is produced by traversing layers and marking text, instances and shapes as numbered elements. **[S]** — [The EightShapes Specs Figma plugin](https://medium.com/eightshapes-llc/the-eightshapes-specs-figma-plugin-2892f21adc96)
- Curtis's "Component Specifications" (Feb 20, 2023) covers "what to include, where it goes, and why it matters more now". The full text was not retrieved. **[S]** — [EightShapes on Medium](https://medium.com/eightshapes-llc)
- Curtis's "Crafting Component API, Together" argues for **unifying anatomy and props across code and design tools**: the Figma component property names should equal the code prop names. **[S]** — [EightShapes UI components list](https://medium.com/@nathanacurtis/list/ui-components-90c74982dd7e)
- The Porsche Design System (Storybook-based) documents **edge-case stories as standard: long text, empty, loading, error**. It also uses a shared preset with a theme toggle / dark mode and rendered token docs. **[S]** — [Porsche Digital Tech Radar: Storybook](https://opensource.porsche.com/porschedigital-technology-radar/tools/storybook/)
- Material 3 component pages split into Overview / Specs (anatomy, measurements, colour roles, states) / Guidelines (usage, do/don't) / Accessibility. **[K]** — [m3.material.io/components](https://m3.material.io/components)

### Template, synthesised: one page per component
1. **Header:** name, one-line purpose, status badge (draft / beta / stable / deprecated), version introduced, Figma link, code import path, Storybook link.
2. **When to use / when not to use**, linking to alternatives.
3. **Anatomy:** numbered diagram with a legend (1 Container, 2 Icon, 3 Label …), marking required vs optional.
4. **Variants:** e.g. `variant: primary | secondary | ghost | destructive`, `size: sm | md | lg`.
5. **States:** default, pressed, focused, disabled, loading, selected, error. Show a matrix of variant × state.
6. **Layout & spacing:** padding, gap, min height, radius, all as token names.
7. **Tokens used:** a table of component-tier tokens → semantic aliases.
8. **Props API:** a TS interface table (name, type, default, description), auto-generated from code via Storybook ArgTypes / react-docgen where possible.
9. **Behaviour:** press feedback, motion token (`motion.duration.short` + `easing.standard`, or spring token), haptic (`impactLight`), sound, and reduced-motion fallback.
10. **Content:** label length, casing, truncation rules, and an example strings table.
11. **Accessibility:** `accessibilityRole`, `accessibilityLabel`/`Hint`, state announcements, minimum target 44×44 pt (Apple), Dynamic Type behaviour, contrast pairs, focus order.
12. **Do / Don't:** paired images, ideally 3–6 pairs.
13. **Related:** components and patterns.
14. **Changelog** for this component.

### Inferences
- For a 1–3 person team, steps 1–5, 8, 11 and 12 are the non-negotiables. The rest can grow.
- Keeping Figma property names identical to TS prop names is the single highest-leverage practice: it makes Code Connect mappings trivial and keeps docs in sync.

### Gaps
- Could not retrieve the full Curtis "Component Specifications" article to quote his exact section list.

---

## 3. How are tokens named and structured, synced Figma → code, and tested?

### Takeaway
- **Format:** the industry standard is the **W3C DTCG format, stable v2025.10 (released 28 Oct 2025)**: `.tokens.json` files with `$value`/`$type`/`$description`, and aliases written as `{group.token}`.
- **Tiers:** primitive (`color.tomato.500`) → semantic (`color.text.danger`, `color.surface.raised`) → component (`button.primary.background`).
- **Pipeline:** Figma variables (with modes for light/dark/brand) → export (native DTCG export, Tokens Studio, or a plugin) → git → **Style Dictionary v5** (DTCG-native) or **Terrazzo** → platform outputs (a TS theme object for React Native).
- **Tests:** CI checks contrast on the computed values, plus visual regression on Storybook stories.

### Cited findings — spec
- The DTCG spec reached its **first stable version (v2025.10)**, announced **October 28, 2025**. More than 20 editors/authors worked on it. Reference implementations: **Style Dictionary, Tokens Studio, Terrazzo**. Published at designtokens.org/tr/2025.10. **[S]** — [W3C DTCG blog: first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/); [DTCG FAQ](https://www.designtokens.org/faq/); [public-design-tokens mailing list](https://lists.w3.org/Archives/Public/public-design-tokens/2025Oct/0003.html)
- The licensing allows free implementation by tools and design systems. **[S]** — [DTCG FAQ](https://www.designtokens.org/faq/)
- The DTCG format covers:
  - **Token properties:** `$value`, `$type`, `$description`, `$extensions`, `$deprecated`
  - **Primitive types:** `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`
  - **Composite types:** `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`
  - **Aliases** in curly-brace form `{color.brand.primary}`, and **groups** as nested objects
  - Separate **Color** and **Resolver** (theming/modes/sets) modules

  **[K]**, not re-fetched; the type list should be verified against [designtokens.org/tr/2025.10](https://www.designtokens.org/tr/2025.10/).
- A Figma-community note says **boolean and string variables have no DTCG type**, so they need handling outside the standard. Terrazzo's importer notes string types need workarounds. **[S]** — [atomize.tools guide](https://atomize.tools/blog/figma-variables-export-json/); [Terrazzo: Import from Figma](https://terrazzo.app/docs/guides/import-from-figma)

### Cited findings — tooling
- **Style Dictionary v5 adopted DTCG 2025.10 as its base format.** Figma, Tokens Studio and the SD CLI now read 2025.10. DTCG files use the **`.tokens.json`** extension. Migration may shift some variable names and generated structure. **[S]**, via a zeroheight help article that was not fetched directly — [zeroheight help: SD v5 / DTCG migration](https://help.zeroheight.com/hc/en-us/articles/48049028236187)
- **Tokens Studio:**
  - 2.0 made DTCG format opt-in, and it later became the default.
  - The `sd-transforms` preprocessor converts Tokens Studio-specific types, e.g. `borderWidth` → DTCG `dimension`.
  - Nov 2025 changelog: theme changes auto-switch Figma variable modes, and scoping/syntax settings sync to Figma variables and back.
  - Supports a GitHub sync provider.

  **[S]** — [Tokens Studio docs: border width](https://docs.tokens.studio/manage-tokens/token-types/dimension/border-width); [Tokens Studio changelog](https://feedback.tokens.studio/changelog); [Release 2.0 changelog](https://feedback.tokens.studio/changelog/release-20)
- **Figma native DTCG import/export:**
  - Announced at **Schema 2025**, alongside extended variable collections.
  - Users report right-click export of a collection → zip with **one JSON file per mode**.
  - Reported limits: export omits `description`, and the **REST API does not return DTCG**.
  - The REST Local Variables endpoint is reportedly Enterprise-only.

  **[S]**, community sources — [Figma forum: native variable export](https://forum.figma.com/ask-the-community-7/native-variable-export-feature-47831); [atomize.tools](https://atomize.tools/blog/figma-variables-export-json/); [Reddit snapshot](https://reddit.sentinel-team.org/posts/1rrc2du/snapshots/2026-03-12T15%3A31%3A35.539586Z)
- **Figma Dev Mode variables** (help article updated June 2025): developers can view variable details, get suggested variables for raw values, and see a table of all variables in a file when nothing is selected. **[S]** — [Figma help mirror: Variables in Dev Mode](https://figma-signup.helpjuice.com/inspect-designs/variables-in-dev-mode)
- **Figma Code Connect:**
  - Supports **React (or React Native)**.
  - The CLI's `figma connect publish` scans `*.figma.tsx` files in the repo and uploads their metadata so Dev Mode shows real component code.
  - Requires **Organization or Enterprise plan** and a full Design or Dev Mode seat.

  **[S]** — [Figma help mirror: Code Connect](https://figma-signup.helpjuice.com/turn-designs-to-code/code-connect); [figma/code-connect repo](https://github.com/figma/code-connect/blob/main/cli/README.md). Mapping helpers `figma.enum`, `figma.boolean`, `figma.string`, `figma.instance`, `figma.children` are **[K]**; verify in the [main README](https://github.com/figma/code-connect).

### Cited findings — testing
- **Visual regression:** Chromatic, from the Storybook team, is the common choice for component-heavy systems. TurboSnap only tests stories affected by a change. A token-change workflow screenshots every variant and fails CI over a diff threshold. Hand-rolled screenshot diffing is fragile (flaky baselines, OS rendering differences). **[S]** — [Porsche tech radar](https://opensource.porsche.com/porschedigital-technology-radar/tools/storybook/); [oneuptime: Chromatic VRT](https://oneuptime.com/blog/post/2026-01-15-visual-regression-testing-react-chromatic/view); [DEV: VRT for design tokens](https://dev.to/custodiaadmin/visual-regression-testing-for-design-tokens-and-component-libraries-3c6f); [Design Systems Collective: DS testing in CI/CD](https://www.designsystemscollective.com/design-system-testing-visual-regression-accessibility-and-performance-in-ci-cd-3d612cbb266e)
- **Contrast tests:** the web uses axe `color-contrast` via the Storybook a11y addon or Jest. That depends on the DOM and **does not apply directly to React Native**, so RN teams should compute contrast on token values. **[S]** — same DS Collective / oneuptime sources
- **WCAG contrast thresholds:**
  - 1.4.3: 4.5:1 for body text, 3:1 for large text (≥18pt, or ≥14pt bold)
  - 1.4.11: 3:1 for non-text UI components and graphics

  **[K]** — [WCAG 2.2 Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Storybook for React Native** has two modes:
  - **On-device:** high fidelity, limited features.
  - **Web** via `@storybook/react-native-web-vite`: requires RN ≥0.72, RNW ≥0.19, Vite ≥5. Works for most components; anything depending on native modules needs on-device.
  - Storybook 10.3 docs let you install "Both" at once.
  - Web mode is what makes Chromatic-style VRT and the addon ecosystem usable for RN.

  **[S]** — [Storybook docs: React Native Web (Vite)](https://storybook.js.org/docs/get-started/frameworks/react-native-web-vite.md); [v9 docs](https://storybook.js.org/docs/9/get-started/frameworks/react-native-web-vite)

### Naming conventions, synthesised
- Pattern: `{category}.{concept/role}.{variant}.{state}`. Examples: `color.text.primary`, `color.surface.raised`, `color.border.focus`, `color.action.primary.pressed`, `space.200`, `radius.md`, `motion.duration.medium`, `motion.easing.emphasized`.
- **Primitives** describe *what it is* (`color.orange.500`, `space.4`). **Semantics** describe *what it's for* (`color.feedback.success.bg`). Components reference only semantics. Light/dark = Figma variable **modes** on the semantic collection = DTCG resolver sets/modifiers.
- Minimum test suite for RN:
  1. A token schema/lint check: every semantic resolves, there are no raw hex values in components (ESLint rule), and there are no orphan tokens.
  2. A contrast matrix test in Jest that iterates declared foreground/background pairs per mode and asserts ≥4.5:1 or ≥3:1.
  3. Visual regression on the RN-web Storybook, or on-device screenshots (e.g. Maestro / Detox screenshot steps) for native-only components.

### Inferences
- For a 1–3 person Expo team without a Figma Org/Enterprise plan, Code Connect and the Variables REST API are likely unavailable. The pragmatic sync is: Figma native DTCG export or the Tokens Studio GitHub sync → `tokens/*.tokens.json` in the repo → Style Dictionary v5 build script → `theme.ts`.
- Treat the repo's token JSON as the source of truth once code exists. Treat Figma as the source while exploring.

### Gaps
- No primary-source confirmation that Figma's native *import* of DTCG is GA. Reports are community-level.
- No authoritative RN-specific contrast-testing tool was found. The recommendation above is an inference.

---

## 4. What do motion, haptics/sound and voice guidelines contain?

### Takeaway
- **Motion guidelines** define principles (purposeful, responsive, natural), a small set of **duration tokens** and **easing tokens**, and increasingly **spring tokens** (Material 3 Expressive). They also include choreography rules (enter/exit/shared-element), a "what animates what" table, and **reduced-motion fallbacks**.
- **Haptic/sound guides** map semantic events (success, warning, selection, impact) to platform primitives, and set rules on frequency and user control.
- **Voice guides** define stable voice traits plus a tone-by-context matrix, with do/don't examples and a word list.

### Cited findings — motion
- **Material 3 Expressive** splits motion into **spring-based "spatial" tokens** (position, size, shape; fast/default/slow; slight overshoot) and **"effects" tokens** (colour, opacity; no overshoot). Duration/easing pairs are kept for effects. **[S]**, third-party mirrors of M3 — [material_3_expressive M3EMotion](https://pub.dev/documentation/material_3_expressive/1.0.3/foundations_m3e_motion/M3EMotion-class.html); [Koder physics spec](https://meta.koder.dev/specs/themes/motion/physics/)
- **M3 easing curves**, as transcribed by third parties:
  - standard: `cubic-bezier(0.2, 0, 0, 1)`
  - standard-decelerate: `cubic-bezier(0, 0, 0, 1)`
  - emphasized-decelerate: `cubic-bezier(0.05, 0.7, 0.1, 1)`
  - Duration tiers reported: long ≈450–500 ms, extra-long 700–1000 ms. The **[K]** full scale is short1–4 = 50/100/150/200 ms, medium1–4 = 250/300/350/400 ms, long1–4 = 450/500/550/600 ms, extra-long1–4 = 700/800/900/1000 ms.

  **[S]**+**[K]** — [frust-material motion tokens](https://docs.rs/frust-material/0.6.2/src/frust_material/tokens/motion.rs.html); [material_3_expressive](https://pub.dev/documentation/material_3_expressive/1.0.3/foundations_m3e_motion/M3EMotion-class.html). Verify at [m3.material.io/styles/motion](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs).
- **Spring values conflict across sources.** The Koder spec gives spatial-fast stiffness 1400 / damping ratio 0.9, spatial-default 700 / 0.9, and effects-fast 3800 / 1.0. A Flutter package gives the AOSP spatial spring as 380 / 1.0. Treat both as unverified. **[S]** — [Koder](https://meta.koder.dev/specs/themes/motion/physics/); [material_3_expressive](https://pub.dev/documentation/material_3_expressive/1.0.3/foundations_m3e_motion/M3EMotion-class.html)
- The rationale for springs: they are interruptible by gestures, give natural overshoot, and chain smoothly mid-animation. **[S]** — [Koder physics spec](https://meta.koder.dev/specs/themes/motion/physics/)
- In DTCG, motion is expressible as `duration`, `cubicBezier` and the composite `transition` type (duration + delay + timingFunction). Springs have no native DTCG type, so they go in `$extensions` or a custom group. **[K]** — [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/)
- **Apple HIG Motion:** use motion purposefully, keep it brief and precise, make it optional, and honour **Reduce Motion** by replacing large movement with fades/dissolves. **[K]** — [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

### Cited findings — haptics & sound
- **Apple HIG "Playing haptics":**
  - Use haptics consistently, matched to the system meaning of each pattern.
  - Complement visual/audio feedback rather than replacing it.
  - Avoid overuse, and make haptics optional.
  - iOS primitives: notification (success/warning/error), impact (light/medium/heavy/soft/rigid), selection.

  In Expo these map to `expo-haptics` `notificationAsync` / `impactAsync` / `selectionAsync`. **[K]** — [HIG Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics); [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

### Cited findings — voice
- Atlassian defines a stable **voice** (personality: bold, optimistic, practical with a wink) and a **tone** that flexes by situation, with six principles. **[S]** — [Atlassian voice & tone](https://atlassian.design/foundations/content/voice-tone)
- Polaris's content section has four voice guidelines with do/don't screenshots (secondary report). **[S]** — verify at [polaris.shopify.com/content](https://polaris.shopify.com/content/voice-and-tone)

### Templates, synthesised
**Motion spec page:**
1. Principles (3–4)
2. Duration scale tokens
3. Easing tokens (standard / decelerate-enter / accelerate-exit / emphasized)
4. Spring tokens (stiffness, damping, mass), e.g. for Reanimated `withSpring`
5. Choreography: enter/exit/stagger/shared element
6. A component → motion map, e.g. button press = scale 0.96 spring-fast, sheet = spatial-default
7. Reduced-motion substitution table
8. Performance rules: UI-thread animations (Reanimated), no layout thrash

**Haptics & sound map:** a table of Event → haptic → sound → visual → can-disable? Rules: never haptic without a visual, never on scroll, and respect system settings and an in-app toggle.

**Voice:** voice traits (3) with "is / is not"; a tone matrix (onboarding, success, error, empty state, paywall, destructive confirm); a word list (preferred / avoid); casing and punctuation; an error formula (what happened + why + what to do); and mascot-voice rules if the mascot "speaks".

**Illustration/mascot usage rules** cover:
- the approved poses/states, mapped to emotional moments
- minimum size and clear space
- which backgrounds it may sit on
- never distort, recolour or crop off-model
- frequency: not on every screen
- an animation-state library (Rive/Lottie) with naming that mirrors states
- accessibility: decorative illustrations are hidden from screen readers (`accessible={false}`), and meaningful ones get labels

### Gaps
- Official m3.material.io spring values could not be fetched, and the third-party sources conflict.
- No primary source was retrieved for mascot/illustration guideline structure. The template above is a synthesis drawing on brand-guideline practice, unsourced.

---

## 5. Governance, versioning, and measuring adoption

### Takeaway
- **Governance:** pick a contribution model: centralised, federated, or hybrid. Define acceptance criteria (GOV.UK: *useful, unique*, then reviewed for *usable, consistent, versatile*).
- **Versioning:** version the code package and tokens with **semver**. Deprecate with a replacement and a grace period.
- **Adoption:** measure with Figma Library Analytics (inserts, detaches, variables/styles usage), code-side import scans, and outcome metrics.

### Cited findings
- **GOV.UK contribution criteria:** a proposal must show the component/pattern is **useful** (serves many teams/services) and **unique** (doesn't duplicate existing work). After prioritisation in the community backlog, a working group reviews the implementation for **usable, consistent, versatile** before publishing. **[S]** — [GOV.UK contribution criteria](https://design-system.service.gov.uk/community/contribution-criteria); [ONS](https://service-manual.ons.gov.uk/community/how-to-contribute/contribution-criteria); [MoJ](https://design-patterns.service.justice.gov.uk/community/criteria); [GDS blog 2018: opening up for contributions](https://designnotes.blog.gov.uk/2018/09/26/opening-up-the-gov-uk-design-system-for-contributions/)
- **Semver for design systems:**
  - patch = bug/doc fixes with no API change
  - minor = additive
  - major = breaking (prop removal/rename, token removal, visual changes that break layouts)

  Keep deprecated items working for at least one minor cycle before removal, and announce them alongside their replacement. **[S]**, secondary — [designer-skills governance](https://supercode.sh/en/skills/owl-listener/designer-skills/design-system-governance)
- DTCG has a `$deprecated` property (boolean or message string), so token deprecations can be machine-readable and surfaced in docs and lint. **[K]** — [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/)
- **Figma Library Analytics** shows component insertions and detachments, which teams use an asset, and comparisons of old vs new library adoption. Org/Enterprise plans add variables and styles tracking. Data refreshes daily with up to one year of history. **[S]** — [Figma help: library analytics](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage); [Figma blog: design system analytics](https://www.figma.com/blog/introducing-design-system-analytics/)
- **Pinterest** found raw instance/insert counts insufficient and built **FigStats** on the REST API to compute adoption scores. **[S]** — [Figma blog: Pinterest measures adoption](https://www.figma.com/blog/how-pinterests-design-systems-team-measures-adoption/)
- **Coverage:** the share of patterns existing in both Figma and code. Plugins like Coverage Report score per-frame adoption and count "ghost detaches". Adoption metrics alone can be gamed, so pair them with outcome measures such as time-to-ship and UI defect rate. **[S]** — [Figma: Design systems 104 metrics](https://www.figma.com/blog/design-systems-104-making-metrics-matter/); [Coverage Report plugin](https://designops-tools.pages.dev/coverage-report/); [Into Design Systems: measuring impact](https://intodesignsystems.substack.com/p/measuring-design-system-impact-lessons); [Supernova: DS analytics](https://www.supernova.io/blog/design-system-analytics-metrics)
- **Doc-site tooling:**
  - **Storybook** (code-first, living props/stories)
  - **Zeroheight** (designer-friendly CMS embedding Figma and Storybook; publishes token docs, with an SD v5 migration guide)
  - **Supernova** (token pipelines, analytics, docs)

  **[S]** — [Supernova blog](https://www.supernova.io/blog/design-system-analytics-metrics); [zeroheight help](https://help.zeroheight.com/hc/en-us/articles/48049028236187); [Storybook RN docs](https://storybook.js.org/docs/get-started/frameworks/react-native-web-vite.md)

### Inferences: small team vs large org
| Concern | 1–3 people | Large org |
|---|---|---|
| Doc site | Markdown in repo (`docs/reference/…`) plus Storybook (RN-web) for components. No Zeroheight/Supernova cost. | Zeroheight/Supernova or a custom site; Storybook embedded; search; analytics |
| Tokens | One `tokens/` folder in DTCG, a Style Dictionary v5 script, and 2 modes (light/dark) | Multi-brand, multi-platform builds; resolver module; token governance board |
| Figma ↔ code | Name parity plus manual Dev Mode inspection. Code Connect only if on an Org plan. | Code Connect for every component; CI publishes; Figma variables synced by bot PRs |
| Governance | A changelog file plus a "decision log/ADR"; lightweight semver on an internal package or just git tags | Formal contribution model, RFCs, office hours, working group, deprecation policy, LTS majors |
| Testing | Jest contrast-pair test, ESLint no-raw-colours, occasional screenshot diffs | Chromatic/Loki VRT on every PR, a11y CI, on-device screenshot farm |
| Adoption | grep for raw hex/px and for non-DS components; a periodic audit (e.g. a `/polish`-style sweep) | Figma Library Analytics, code import scanners, adoption dashboards, OKRs |

### Gaps
- Brad Frost's own governance writing and Carbon's exact contribution/versioning policy pages were not retrieved.
- No primary data was found on typical adoption-rate benchmarks.

---

## 6. What should a technical creative director own vs. engineers?

### Takeaway
Role split is not formally specified in the sources found. The split below is inferred from how the documentation layers are authored in the systems studied: principles/voice/foundations are design-authored, and the package/pipeline/tests are engineering-authored.

### Cited findings
- Atlassian says its voice must be followed by "anyone writing customer-facing communications", so voice is a cross-functional standard owned centrally. **[S]** — [Atlassian voice & tone principles](https://Atlassian.design/content/voice-and-tone-principles)
- Curtis argues that component API (anatomy + props) should be crafted *together* by design and code. It is shared ownership, not a handoff. **[S]** — [EightShapes UI components list](https://medium.com/@nathanacurtis/list/ui-components-90c74982dd7e)
- The hybrid model: the core team owns foundations, product teams contribute patterns. **[S]** — [designer-skills governance](https://supercode.sh/en/skills/owl-listener/designer-skills/design-system-governance)

### Inferences: proposed RACI
- **Creative director owns (accountable):**
  - design principles, brand and voice, colour/type scales and their *semantic intent*
  - illustration/mascot rules, motion principles and the feel of the token values (durations, springs), the haptic/sound palette
  - do/don't examples, pattern-level UX decisions, final visual QA, and the deprecation call on visual grounds
- **Engineers own:**
  - the token pipeline (Style Dictionary build, naming lint), the component implementation and props API types, performance of motion (Reanimated UI thread)
  - Storybook, the CI tests (contrast, VRT, lint), package versioning/release notes, Code Connect files
  - platform a11y wiring (roles, labels, Dynamic Type)
- **Co-owned (a technical CD often bridges these):**
  - token *naming and tiering*, component anatomy/prop names (Figma ⇔ TS parity)
  - accessibility acceptance criteria, the motion token → component map, the changelog and semver decisions for breaking visual changes
- In a 1–3 person team, the technical CD likely writes the spec pages *and* the token JSON, and engineers (or AI builders) consume them. In a large org, a dedicated DS team (designers + engineers + content designer + a11y specialist) splits these.

### Gaps
- No authoritative published RACI for "technical creative director" within design systems was found. This section is inference.
