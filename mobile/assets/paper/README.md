# Paper — asset manifest

The 3D torn-notepad composition behind the shopping list screen and the
`/l/:token` share page (shopping list v3, founder ask 2026-07-17: "texture,
more 3D paper styling" — crumpled cream sheet, chunky spiral-tear top,
creases, curled corner, drop shadow, on a painterly warm wood table).
Palette-locked to the DS (cream `#FAF4EA`, terracotta `#C4562E`).

Three committed files derive from ONE painting (two-layer composition —
`cover` on the full scene spilled content onto the wood on tall screens, so
the sheet is a stretched cutout whose edges always land where the content
expects them):

| File | What it is | Used by |
|---|---|---|
| `mobile/assets/paper/table-wood.jpg` | wood table only | app back layer (cover — crops freely) |
| `mobile/assets/paper/note-cut.png` | paper-only **alpha cutout**, cropped tight to sheet + painted shadow | app front layer (stretch) |
| `backend/src/assets/paper-note.png` | same cutout | share page `.sheet` — stretched 100%/100% so painted tear/curl/shadow follow any list length |

> ⚠️ **CDN egress is blocked in the cloud session** (same as the splash run).
> Committed files are an **interim procedural render** of the same
> composition so code builds and screens are reviewable. **The terminal must
> download the chosen painting and regenerate both files.** Links expire.

| Painting | Job ID | URL |
|---|---|---|
| **v3 A (3D composition — preferred)** | `25a35737-2ad3-40d7-846e-9f2e423abbc8` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260717_041622_25a35737-2ad3-40d7-846e-9f2e423abbc8.png |
| **v3 B (3D composition)** | `eef1ac75-b9c3-458c-aca6-a54ea8e23e68` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260717_041622_eef1ac75-b9c3-458c-aca6-a54ea8e23e68.png |
| v2 A/B (flat torn page — rejected by founder as too flat) | `3e842b63…` / `4120ba38…` | in git history of this file |

Swap recipe (terminal):

```bash
curl -o /tmp/paper.png "<chosen URL>"
# 1. wood layer: crop a clean table patch (e.g. the bottom strip below the
#    sheet + corners), upscale/cover-safe -> mobile/assets/paper/table-wood.jpg
# 2. paper cutout: flood-fill the wood from the corners (standard repo
#    pipeline, tol 14-26 — cutouts beat background-matching), crop tight to
#    the sheet + its cast shadow, save WITH alpha ->
#    mobile/assets/paper/note-cut.png AND backend/src/assets/paper-note.png
```

After the swap, verify on sim: header/list insets must sit inside the
painted paper edges (`shopping.styles.js` uses `SPACING.xl + SPACING.xs`
side insets and `SPACING.xxl + SPACING.md` top — nudge if the painting's
margins differ), and list text must stay comfortably readable over the
creases. Model `nano_banana_pro` (resolved `nano_banana_2`), 9:16, 768×1376.
