# Onboarding illustrations — asset manifest

Generated art for the 3-screen onboarding showcase (`docs/ONBOARDING_BRIEF.md`, screens B1–B3).
Otto locked to hero reference `5f74831c-0126-44d0-9dd8-731d331fb75a`; model `nano_banana_pro`
(resolved `nano_banana_2`), 2:3 portrait, 848×1264.

> ⚠️ **CDN egress is blocked in the cloud session** — these PNGs could not be downloaded/committed
> from there (403 CONNECT). **The terminal must download each URL and commit the file** at the path
> below, then wire it into the onboarding component. CDN links can expire — download soon.
> Optional: `upscale_image` to 2K for retina before committing.

| Screen | Commit as | Job ID | URL |
|---|---|---|---|
| **B1 — Every recipe in one place** | `onboarding-1-collect.png` | `52c078e5-2fb6-4589-a2cc-d67306a1833d` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260715_175413_52c078e5-2fb6-4589-a2cc-d67306a1833d.png |
| **B2 — Cook it right, every time** | `onboarding-2-cook.png` | `44b0d5b4-b1d4-4062-8fd1-b8c4ca9b9683` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260715_175430_44b0d5b4-b1d4-4062-8fd1-b8c4ca9b9683.png |
| **B3 — Plan the week, shop in one tap** 🟣 | `onboarding-3-plan.png` | `ce3750fb-0006-45f8-a540-5a8f84b88aca` | https://d8j0ntlcm91z4.cloudfront.net/user_3F2pTx5PGN5wbaAnefPnE17SwfD/hf_20260715_175435_ce3750fb-0006-45f8-a540-5a8f84b88aca.png |

**Take 1** of each (single pass). If the founder wants alternates, regenerate with the prompts in
`docs/ONBOARDING_BRIEF.md` (always pass the hero reference; keep 2 takes, pick the tighter).

**B3 is membership-dependent:** if Plan is NOT in the launch build, onboarding drops to 2 screens
(B1 → B2) and this asset waits for the Plan release — see the brief.
