# 🧰 App Kit — replicate a full app (frontend + backend) on any new project

A **portable, app-agnostic kit** for standing up a new app the way Otto was built: a complete
**Figma master board** (frontend/design) *and* a **backend data-services spine** — with a **clean
separation** between the two so each is built by a focused track and neither muddies the other.

## The core idea: separate tracks, one contract
```
                     ┌─────────────────────────────┐
                     │   shared/ (both tracks read) │
                     │   • APP-CONFIG  (identity,   │
                     │     brand, IA, voice, paths) │
                     │   • CONTRACT    (features,   │
                     │     data model, API, gating) │  ← the ONLY seam
                     └───────────┬─────────────────┘
              ┌──────────────────┴───────────────────┐
     ┌────────▼─────────┐                    ┌────────▼─────────┐
     │   frontend/      │                    │   backend/       │
     │  Figma master    │  ── talks only ──▶ │  data + services │
     │  board + screens │     via CONTRACT   │  spine + roadmap │
     └──────────────────┘                    └──────────────────┘
```
**Frontend and backend never reference each other's internals — only `shared/CONTRACT.md`.** That's
what makes each track independently buildable (by a person or an agent) and keeps results clean: the
FE agent designs against the contract's endpoints; the BE agent implements the contract's data model.
Change the contract deliberately, in one place, and both sides update.

## Folder map
```
app-kit/
  README.md                    ← this file
  EXAMPLE-otto.md              ← one worked example (shared + FE + BE), filled for Otto
  shared/
    APP-CONFIG.template.md     ← identity · brand tokens · IA · voice · source-of-truth paths
    CONTRACT.template.md       ← features · data entities · API endpoints · providers · gating (THE SEAM)
  frontend/
    CONTEXT.md                 ← the 6-page master-board methodology (craft/naming/honesty laws)
    MASTER-PROMPT.md           ← reusable prompt: build the Figma master board
    SCREEN-MAP.template.md     ← per-screen content blocks + which contract data each screen needs
    CHECKLIST.md               ← frontend acceptance
  backend/
    CONTEXT.md                 ← the data-services-spine methodology (layers/adapters/pipelines/honesty)
    MASTER-PROMPT.md           ← reusable prompt: produce the backend roadmap + build the foundations
    CHECKLIST.md               ← backend acceptance
```

## How to use it (per new app)
1. **Fill `shared/APP-CONFIG.md`** (identity, brand tokens, IA, voice, where the code lives).
2. **Fill `shared/CONTRACT.md`** — the features, data entities, and API endpoints. *This is the most
   important step: it's the seam both tracks build to.* Then fill `frontend/SCREEN-MAP.md`.
3. **Run the two tracks — independently, even in parallel:**
   - Frontend: hand `frontend/MASTER-PROMPT.md` + the shared files + screen-map to a Figma-capable
     agent → the master board.
   - Backend: hand `backend/MASTER-PROMPT.md` + the shared files to a backend agent → the roadmap +
     the foundation build.
4. **QA** each track against its `CHECKLIST.md`. Re-run either track to keep it 1:1 as the app evolves.

## Why the separation "gets better results"
- **Focused context** — each agent loads only its track + the contract, not the whole app; less
  confusion, tighter output.
- **A real interface** — the contract forces you to decide the data model and API *once*, so the UI
  can't design screens the backend can't serve, and the backend can't ship data the UI never shows.
- **Parallelism** — the two tracks run at the same time without stepping on each other.
- **Honest by construction** — both `CONTEXT.md`s carry the same honesty law (state only true facts;
  label estimates; no invented data), so the board and the API tell the same truth.

*(Supersedes the earlier `docs/figma-kit/` — that content now lives, generalized, under `frontend/`.)*
