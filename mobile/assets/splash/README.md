# Splash — asset manifest

Launch/splash art (`docs/SPLASH_BRIEF.md`). Otto locked to hero reference
`5f74831c-0126-44d0-9dd8-731d331fb75a`; model `nano_banana_pro` (resolved `nano_banana_2`),
2:3 portrait, 848×1264. Wordmark "Otto" (Lora) is composited **in-app** over the reserved
lower third — not painted into the image.

> ⚠️ **CDN egress blocked in the cloud session** (403 CONNECT). **The terminal must download +
> commit** the still, then set it as the native splash. Links can expire — download soon.

| Asset | Commit as | Job ID | URL |
|---|---|---|---|
| **Splash still** (brand lockup) | `otto-splash.png` | `3411c1ab-f513-41cf-a86a-daa5a664f46d` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260715_175442_3411c1ab-f513-41cf-a86a-daa5a664f46d.png |

## Next steps for the terminal
1. Download + commit the still as `otto-splash.png`; optionally `upscale_image` → 2K/4K, then
   export the exact iOS native-splash sizes.
2. Wire as the native splash: `app.json` → `splash` (image = this, `backgroundColor: "#FAF4EA"`,
   `resizeMode: "contain"`).
3. **Video (fast-follow):** once the founder approves this still, generate the 2.5s Otto video with
   `generate_video` (image-to-video, **seed = this still's job id `3411c1ab-…`**) using the storyboard
   + prompt in `docs/SPLASH_BRIEF.md §7`. The video's final frame must match this still pixel-for-pixel.
   Commit as `otto-splash.mp4` (or a Rive/Lottie export) + manifest row here.
