# Paper — asset manifest

Torn-notepad page behind the shopping list screen and the `/l/:token` share
page (shopping list v2, founder ask 2026-07-17). Palette-locked to the DS
(cream `#FAF4EA`, terracotta `#C4562E` accents), watercolor, no text/rules —
the page must stay quiet under dynamic rows.

> ⚠️ **CDN egress is blocked in the cloud session** (same as the splash run).
> The files below are currently an **interim procedural texture** (same
> dimensions, tuned subtle) committed so the code builds and screens are
> reviewable. **The terminal must download the painted originals and overwrite
> both copies.** Links expire — download soon.

| Asset | Overwrite | Job ID | URL |
|---|---|---|---|
| **Torn-top v2 A (preferred)** — chunky spiral-tear top per founder's reference photos | `mobile/assets/paper/shopping-note.jpg` AND `backend/src/assets/paper-note.jpg` | `3e842b63-0bd9-439c-8602-64325a76295f` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260717_040911_3e842b63-0bd9-439c-8602-64325a76295f.png |
| **Torn-top v2 B** | same paths | `4120ba38-efba-4721-b582-496760996d86` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260717_040911_4120ba38-efba-4721-b582-496760996d86.png |
| v1 A (subtle tear — alternate) | same paths | `6c78f7f7-df11-4b6f-adfe-317dcdba5baf` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260717_035910_6c78f7f7-df11-4b6f-adfe-317dcdba5baf.png |
| v1 B (subtle tear — alternate) | same paths | `7e579219-93dc-4833-aad1-9bd555c7e425` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260717_035911_7e579219-93dc-4833-aad1-9bd555c7e425.png |

Swap recipe (terminal):

```bash
curl -o /tmp/paper.png "<chosen URL>"
python3 - <<'PY'
from PIL import Image
img = Image.open("/tmp/paper.png").convert("RGB")
img.save("mobile/assets/paper/shopping-note.jpg", quality=82)
img.save("backend/src/assets/paper-note.jpg", quality=82)
PY
```

Then eyeball contrast: rows of warm-ink text must stay comfortably readable
over the middle of the page (the prompt keeps the center clean; if a variant
came back busy, regenerate rather than dimming text). Model `nano_banana_pro`
(resolved `nano_banana_2`), 9:16, 768×1376. Prompt in the job record.
