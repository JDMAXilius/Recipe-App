// I1 entry point — the iOS/Android share sheet (expo-share-intent). The
// native side ships with the NEXT dev build; until then (and on web) this
// degrades to an inert hook so nothing crashes on the current binary —
// the exact lesson C23 taught with expo-crypto. The in-app paste box stays
// the universal fallback either way.
let realUseShareIntent = null;
try {
  ({ useShareIntent: realUseShareIntent } = require("expo-share-intent"));
} catch {
  // module absent from this binary/platform — inert fallback below
}

const INERT = { hasShareIntent: false, shareIntent: null, resetShareIntent: () => {} };

// True once the native module ships (the iOS rebuild). Lets the UI teach the
// share-to-Otto flow with a live "Try it" only when it actually works, and
// show it as "coming soon" until then — the C23 dormant/gated pattern.
export const shareIntentAvailable = () => Boolean(realUseShareIntent);

export function useShareIntentSafe() {
  // Hook order is stable for the app's lifetime: realUseShareIntent is
  // resolved once at module load, so this branch never flips mid-session.
  if (!realUseShareIntent) return INERT;
  try {
    return realUseShareIntent({ debug: false, resetOnBackground: true });
  } catch {
    return INERT;
  }
}

// Pull the first usable URL (or raw text) out of a share payload.
export function sharedUrlFrom(shareIntent) {
  if (!shareIntent) return null;
  if (shareIntent.webUrl) return shareIntent.webUrl;
  const text = shareIntent.text || "";
  const match = text.match(/https?:\/\/\S+/i);
  return match ? match[0] : null;
}
