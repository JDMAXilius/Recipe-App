// S1 — painted share-card capture (IMPORT_SHARE_RESEARCH.md §3.2/G).
// Instagram accepts only pixels, so the IG answer is an image card. Both
// native modules ship with the NEXT dev build; on the current binary (and
// on web) they're absent, so everything is availability-gated the same way
// the SSO rows are (C23): the feature appears when the build carries it,
// and no button ever points at a module that isn't there.
import { Platform } from "react-native";

let viewShot = null;
let sharing = null;
if (Platform.OS !== "web") {
  try {
    viewShot = require("react-native-view-shot");
    sharing = require("expo-sharing");
  } catch {
    // old binary — modules land with the next prebuild
  }
}

export const shareCardAvailable = () => Boolean(viewShot && sharing);

// Captures the (off-screen, mounted) card view and hands the PNG to the
// system share sheet. Returns true when a sheet was actually shown.
export async function captureAndShareCard(ref, title) {
  if (!shareCardAvailable() || !ref?.current) return false;
  try {
    const uri = await viewShot.captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
      // 4:5 portrait at feed resolution — one capture works for feed + DMs
      width: 1080,
      height: 1350,
    });
    if (!(await sharing.isAvailableAsync())) return false;
    await sharing.shareAsync(uri, {
      dialogTitle: title,
      mimeType: "image/png",
      UTI: "public.png",
    });
    return true;
  } catch {
    return false; // caller falls back to the text share
  }
}

// Same capture, but at the view's own laid-out size (no forced dimensions) —
// a shopping list is variable-length, so squishing it into a fixed 4:5 frame
// would crop or distort it. pixelRatio 2 keeps text crisp.
export async function captureAndShareTallCard(ref, title) {
  if (!shareCardAvailable() || !ref?.current) return false;
  try {
    const uri = await viewShot.captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
      pixelRatio: 2,
    });
    if (!(await sharing.isAvailableAsync())) return false;
    await sharing.shareAsync(uri, {
      dialogTitle: title,
      mimeType: "image/png",
      UTI: "public.png",
    });
    return true;
  } catch {
    return false;
  }
}
