# TERMINAL TICKET — REBUILD 00 · Source control setup

**Goal:** archive the pre-rebuild code to a separate repo, then create the
branch structure the rebuild runs on — starting from a **green** baseline.

**Executor:** terminal (needs real GitHub push credentials cloud doesn't have).
**Kick-off:** this ticket exists on `main`. Nothing blocks it.

---

## Step 1 — Sync and confirm the baseline

```bash
cd <your Recipe-App checkout>
git checkout main
git pull --rebase origin main
git log --oneline -1        # should be the cloud "Rebuild tickets + merge" commit
```

Run both suites to see the baseline:

```bash
cd backend && npm install && npm test        # expect 115/115 pass
cd ../mobile && npm install && npm test       # expect 59 pass, 1 FAIL (see Step 2)
```

## Step 2 — Fix the one known-red test (archive a GREEN tree)

`mobile/test/foodScale.test.mjs` → "every seed-vocabulary name has a resolution
path (no orphans)" fails with **10 orphans**:

```
raw yucca · yucca · yuca · meringue nests · meringue nest ·
maria cookies · mars bar · cafe la llave · knafeh · alinos sauce
```

Cause: these novelty/composite foods were added to `usdaTable.json` (the
757/758-high work) but have no resolution path in `mobile/lib/foodScale.js` —
`formatIngredientLine("1 cup"|"2", name)` falls through to raw passthrough, so
their amounts display wrong in the app. This is YOUR domain (nutrition /
foodScale) — pick the honest resolution per food, do NOT guess a density that
would fabricate a weight:

- `yuca` / `yucca` / `raw yucca` → root vegetable; a real density/per-item
  weight exists (cassava ~0.62 g/ml-ish; verify against USDA portion).
- `mars bar` / `maria cookies` / `meringue nests` / `knafeh` → per-item weight
  is the honest path (a bar/cookie/nest is a count, not a volume).
- `cafe la llave` (espresso) → liquid (→ml).
- `alinos sauce` → sauce; liquid or density.

Add the minimal entries so all 10 resolve to an INTENDED kind
(`weight | volume-ml | seasoning | asis`). Then:

```bash
cd mobile && npm test        # expect 60/60 pass
git commit -am "Baseline green: resolve 10 orphan novelty foods in foodScale"
git push origin main
```

Do this on `main` first so the archive and `v1-legacy` snapshot are both green.

## Step 3 — Archive the old code to Old-recipe-app.git (one-time mirror)

A full mirror preserves all history, branches and tags:

```bash
git clone --mirror https://github.com/JDMAXilius/Recipe-App.git /tmp/otto-archive
cd /tmp/otto-archive
git push --mirror https://github.com/JDMAXilius/Old-recipe-app.git
cd - && rm -rf /tmp/otto-archive
```

Verify on GitHub that `Old-recipe-app` now shows the code + history. (Old-recipe-app.git
must already exist and be empty; create it in the GitHub UI first if needed.)

## Step 4 — Return to the working repo

The mirror above was a throwaway clone in /tmp; your Recipe-App checkout is
untouched. Confirm you're still pointed at the working repo:

```bash
cd <your Recipe-App checkout>
git remote -v        # origin → github.com/JDMAXilius/Recipe-App.git  ✅
```

All rebuild work continues HERE. Old-recipe-app is never worked in again.

## Step 5 — Create the branch structure

```bash
git checkout main
# frozen in-repo snapshot + tag (belt-and-suspenders with the archive repo)
git branch v1-legacy
git tag -a v1.0-legacy -m "Frozen v1 app, immediately before the v2 rebuild"
git push origin v1-legacy
git push origin v1.0-legacy

# the long-lived integration branch all rebuild work merges into
git checkout -b rebuild/v2
git push -u origin rebuild/v2
```

`main` stays the shippable v1 app. `rebuild/v2` may go red mid-flight; it never
touches `main` until the M4 cutover PR.

## Acceptance (all must be true)

- [ ] `main` is green on BOTH suites (backend 115, mobile 60)
- [ ] `Old-recipe-app.git` contains the full mirror (verified on GitHub)
- [ ] working checkout's origin is still `Recipe-App.git`
- [ ] `v1-legacy` branch + `v1.0-legacy` tag pushed
- [ ] `rebuild/v2` branch created and pushed

## Report-back (fill in, commit on `main`, then start ticket 01)

```
baseline tests:   backend __/__ · mobile __/__
orphan fix:       <commit sha>
archive:          Old-recipe-app.git populated? Y/N · <commit sha archived>
branches:         v1-legacy @ <sha> · tag v1.0-legacy · rebuild/v2 @ <sha>
notes / deviations:
```
Then flip the relevant lines in `docs/REBUILD_STATE.md` and move this ticket to
`docs/archive/`.
