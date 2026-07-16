# 🧰 Figma Master-Board Kit — replicate this design system on any app

A **portable, app-agnostic kit** for generating a complete 6-page Figma "master board" (design
system + app map + wireframes + full-length screens + user flows + App Store kit + brand & voice)
for *any* app, at the same craft level as the Otto board. Copy this whole folder into a new repo and
follow the 3 steps.

## What's in here
| File | Role |
|---|---|
| `CONTEXT.md` | **The methodology** (reusable knowledge). What a master board is, the 6-page anatomy, craft laws, naming system, design/honesty laws, lessons baked in. Read once. |
| `APP-CONFIG.template.md` | **The intake form.** Copy → fill in your app's identity, tokens, IA, screens, voice, mascot, source-of-truth paths. This is the *context engineering* input. |
| `MASTER-PROMPT.md` | **The reusable prompt engineer.** Hand this + your filled config to a coding/design agent with Figma write access; it builds all 6 pages. |
| `CHECKLIST.md` | **Acceptance/QA.** Craft + honesty gates the finished board must pass. |
| `EXAMPLE-otto.md` | A **filled config** for the Otto app — a worked reference so you see how to fill the template. |

## How to use it (3 steps)
1. **Fill the config.** Copy `APP-CONFIG.template.md` → `APP-CONFIG.md` in your new repo and fill every
   `{{PLACEHOLDER}}` from that app's code + brand. Point the source-of-truth fields at the real files
   (token constants, a screen-map doc). If you don't have a screen-map yet, write one first — the board
   is only as honest as its inputs. (`EXAMPLE-otto.md` shows a finished one.)
2. **Run the master prompt.** Give an agent with the **Figma MCP** (write access) `MASTER-PROMPT.md`
   + your filled `APP-CONFIG.md`. It loads the Figma skills, then builds Pages 1→6 in order.
   *(Figma writes need an interactive/authorized session — a headless/cloud session can author the
   spec but usually can't approve the writes; run the build where Figma auth works.)*
3. **QA + keep synced.** Verify against `CHECKLIST.md`. Re-run the prompt whenever the app changes to
   keep the board **1:1 with the running app** (the board is a mirror, not a one-off).

## Principle
**The board is a *view* of two sources of truth — the app's token constants and its screen-map doc —
never an independent invention.** Everything on it must trace to real code or a labeled placeholder.
That's what makes it reusable *and* trustworthy.
