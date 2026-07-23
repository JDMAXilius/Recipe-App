# 🎟️ Terminal Ticket — Ship the shopping-list / recipe SHARE CARD as an image

> **Symptom:** sharing a shopping list (or recipe) sends **plain text**, never the painted card image.
> **Root cause (found + fixed in the repo):** the card path is gated on two native modules that were
> **never in `package.json`** — so `shareCardAvailable()` was always false and it fell through to the
> text share. Added them + a Fabric safeguard in commit **`e2b4014`**. They're native → **needs a
> rebuild** to actually work. That's this ticket.

## Already done in the repo (commit `e2b4014`, do NOT redo)
- Added to `mobile/package.json`: **`react-native-view-shot` `~4.0.3`**, **`expo-sharing` `~14.0.7`**
  (ranges — reconcile to exact in step 1).
- Added **`collapsable={false}`** to the two off-screen capture wrappers (`app/shopping.jsx`,
  `app/recipe/[id].jsx`) so the New Architecture (Fabric) doesn't flatten the view and snapshot blank.
- The card component + capture/share code already exist (`lib/shareCard.js`
  `captureAndShareTallCard`/`captureAndShareCard`, `components/ShoppingListShareCard.jsx`,
  `components/ShareCard.jsx`). No logic change needed — it was just uninstalled.

> **Update 2026-07-19 (`bd3f2553`):** both packages are now in `mobile/package-lock.json` too —
> `expo-sharing 14.0.8`, `react-native-view-shot 4.0.3` — resolved by npm from the ranges above, not
> by `expo install`. Step 1 below is still worth running to confirm those are the versions Expo wants
> for SDK 54; if it changes them, commit the change. The rebuild is unaffected either way.

## Do this
```bash
cd mobile
npx expo install react-native-view-shot expo-sharing   # pins the exact SDK-54 versions over my ranges
npx expo-doctor                                          # confirm no version mismatch
eas build --platform ios --profile production            # native module → real rebuild required (not OTA)
eas submit --platform ios --profile production --latest
```

## Verify on device
1. Shopping list with a few items → **Share** → the sheet should offer WhatsApp/Messages/Save Image,
   and what lands is the **painted card PNG** (like the mockup), NOT text.
2. Recipe detail → **Share this recipe** (long-press = card) → same: image arrives.
3. If it still sends text: `shareCardAvailable()` is false → the modules didn't link; re-check the
   build actually included them (`npx expo install --check`, clean prebuild).

## If the capture comes back BLANK (the one real risk)
Off-screen (`left:-9999`) capture on Fabric is the known failure mode. Escalate in this order:
1. Confirm `collapsable={false}` is on the wrapper (it is, from `e2b4014`).
2. If still blank, render the card **on-screen but invisible during capture**: mount it in a
   full-screen `Modal` (or `opacity:0` overlay) → `await captureRef` → unmount. Keep the same
   `captureRef`/`Sharing.shareAsync` calls; only the mount location changes.
3. Alternative: wrap the card in the **`<ViewShot>` component** and capture via its ref (more reliable
   than `captureRef` on a plain `View` ref on some Fabric versions).

## Out of scope (note, don't build unless asked)
- `expo-sharing` opens the **generic iOS share sheet** — great for WhatsApp / Messages / Save to
  Photos. **Instagram Stories direct-share** needs `react-native-share` (`Share.shareSingle` with the
  IG Stories backgroundImage API). Only add if the founder wants one-tap-to-Stories.

## Done when
- [ ] `react-native-view-shot` + `expo-sharing` are installed at exact SDK-54 versions, doctor clean.
- [ ] On a real build, sharing a shopping list and a recipe both send the **image card**, not text.
