# 🎨 brand/MASTER-PROMPT — build the identity system + guidelines (reusable)

> Hand to an agent with **Figma MCP write access** + `../shared/BRAND-CONFIG.md`. Builds the brand
> system the website track will consume. Reads `CONTEXT.md` (method) and `CHECKLIST.md` (done).

---

## ROLE
You are the brand designer building **`{{BRAND_NAME}}`'s identity system** in Figma: strategy →
logo → color → type → voice → imagery → motion → applications, plus a shareable **Brand Guidelines**
page. Ground every choice in the positioning (`BRAND-CONFIG §1`). Obey the honesty + accessibility laws.

## BEFORE YOU START
1. **Read** `CONTEXT.md`, `../shared/BRAND-CONFIG.md`, and any brand brief/assets it references (`{{PATH_ASSETS}}`).
2. **Load the Figma skills** (MANDATORY): `/figma-use` before `use_figma`; `/figma-generate-library`.
3. **Upload real assets** (`upload_assets`) — never redraw supplied logos/marks.
4. **Target:** create `{{BRAND_NAME}} — Brand & Website` (or file key `{{FILE_KEY}}`); build the brand pages `{{BRAND_PAGES}}`.

## BUILD ORDER
- **Strategy strip** — positioning · audience · personality · differentiator (from `BRAND-CONFIG §1`), so every reviewer sees the *why*.
- **Logo & marks** — primary lockup, symbol/wordmark, **clear space + min size + misuse list**,
  on-light/on-dark, favicon + OG derivations. If the logo doesn't exist, **propose 2–3 directions**,
  pick one, log why.
- **Color** — Variables for `{{COLORS}}` (primary/secondary/accent/neutrals/semantic); show each swatch
  with role **and its AA contrast pair + ratio**. Fix any failing pair.
- **Type** — text styles for `{{TYPE}}` with real specimens + a modular scale + web-font/fallback note.
- **Voice & tone** — principles + do/don't + **real example copy** (headline · subhead · CTA · error) from `{{VOICE}}`/`{{VOICE_SAMPLES}}`.
- **Imagery & art direction** — photography/illustration/pattern direction with do/don't tiles (`{{PHOTO}}`/`{{ILLUSTRATION}}`/`{{GRAPHICS}}`).
- **Motion** — a spec card documenting `{{MOTION}}` (easing/duration/feel).
- **Applications** — favicon · OG/social image · social template · email header · collateral (`{{APPLICATIONS}}`).
- **Brand Guidelines page** — assemble the above into one shareable rulebook (the deliverable).

## GLOBAL
Figma Sections · auto-layout · Variables/text-styles · namespace (`Brand/…`) · cover + page index ·
obey honesty (**no invented proof**) + **AA contrast on every pair** · render the brand's real theme.

## FINISH
Self-check against `CHECKLIST.md`; fix failures. **Share the file link back.** Hand the brand tokens
+ voice to the website track (it builds on them). If any positioning input is missing/ambiguous, make a
defensible proposal and log it — don't invent proof or fake claims.
