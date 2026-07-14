# Mascot assets — "Otto" the otter chef

> ✅ **All assets are committed** (downloaded from the generation CDN 2026-07-14, before
> link expiry). The CDN links below are kept for provenance only — the files in this
> folder are now the source of truth. See [`docs/MASCOT.md`](../../../docs/MASCOT.md)
> for the character bible.

## Approved assets (locked)

| File to save as | What it is | Job ID | Download |
|---|---|---|---|
| `otto-hero.png` | Hero / canonical reference (candidate B) | `5f74831c-0126-44d0-9dd8-731d331fb75a` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_144110_5f74831c-0126-44d0-9dd8-731d331fb75a.png) |
| `otto-hero-alt.png` | Approved alternate (candidate C) | `92cf0f1c-0bf3-41d8-99c1-9cb0bbe9f5b8` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_144111_92cf0f1c-0bf3-41d8-99c1-9cb0bbe9f5b8.png) |
| `otto-turnaround.png` | Front / side / back turnaround | `470c6b41-ee55-4ca8-8bec-6e7a30ded144` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_145709_470c6b41-ee55-4ca8-8bec-6e7a30ded144.png) |
| `otto-expressions.png` | 6-expression sheet | `90bb70d5-2c01-4d16-9cd9-c22cb0ac4c0a` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_145735_90bb70d5-2c01-4d16-9cd9-c22cb0ac4c0a.png) |
| `otto-scenes.png` | Scene set: cooking / floating / loading / empty | `6346faf3-77f9-4712-88e4-cc9c500ec828` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_154458_6346faf3-77f9-4712-88e4-cc9c500ec828.png) |
| `otto-appicon-a.png` | App-icon lockup (option A) | `02953cca-9aa5-43c6-84fa-6e8bbd42694f` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_154502_02953cca-9aa5-43c6-84fa-6e8bbd42694f.png) |
| `otto-appicon-b.png` | App-icon lockup (option B) | `249941cb-6f21-4f95-98f5-2f3f7382be3a` | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260714_154502_249941cb-6f21-4f95-98f5-2f3f7382be3a.png) |

## Derived assets (committed)

**App icon:** option **B** (larger, more centered face — reads better at small sizes) is
live as `mobile/assets/images/icon.png` + `adaptive-icon.png` (1024×1024, white lockup
corners cropped out so the terracotta field bleeds full-square). Swap to option A by
re-running the crop against `otto-appicon-a.png`.

**Sheet slices** (baked-in labels cropped off; background is the sheets' painted cream,
which sits naturally on the app's `bg`/`surfaceWarm` — true transparent cutouts remain
a backlog item, see `docs/MASCOT.md` §7.2):

| File | Source cell | App usage |
|---|---|---|
| `otto-happy.png` | expressions (1,1) | Home greeting, default presence |
| `otto-excited.png` | expressions (1,2) | Recipe saved, success moments |
| `otto-thinking.png` | expressions (1,3) | Search before query |
| `otto-sleepy.png` | expressions (2,1) | Loading states |
| `otto-sad.png` | expressions (2,2) | Empty states, soft errors |
| `otto-proud.png` | expressions (2,3) | Onboarding finale, achievements |
| `otto-scene-cooking.png` | scenes (1,1) | Onboarding / feature moments |
| `otto-scene-floating.png` | scenes (1,2) | Onboarding / delight moments |
| `otto-scene-loading.png` | scenes (2,1) | Full-screen loading |
| `otto-scene-empty.png` | scenes (2,2) | Full-screen empty states |

## Regenerating

Regenerate any new pose with the hero as the image reference — see `docs/MASCOT.md` §7.

> Filenames here are the plan of record; keep them stable so code can import predictably.
