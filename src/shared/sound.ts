// One typed sound kit (contract: motion.md §3) — the haptics.ts of audio.
// Features call sound.play('save') — never useAudioPlayer/createAudioPlayer
// directly (the timer alarm in CookScreen predates the kit and keeps its own
// player: an alarm is an alert with a job, not palette). Fire-and-forget,
// preloaded players, no-op on web (mirrors haptics).
//
// Off-ramps, in precedence order (motion.md §3 — the user holds the dial):
// 1. iOS silent switch: respected by default — the kit never touches
//    setAudioModeAsync. (Known ceiling: CookScreen sets playsInSilentMode:true
//    for its alarm during a cook session, which is global; step-done sounding
//    in silent mode DURING a cook rides that deliberate exception.)
// 2. Sounds toggle (below): kv-persisted, default ON, read synchronously from
//    a hydrated module flag.
// 3. Reduced motion mutes CELEBRATION sounds (allDone) — motion and its
//    fanfare are one dial. Feedback ticks (save/send/stepDone/gentleError)
//    stay: they are feedback, not flourish.
import { AccessibilityInfo, Platform } from 'react-native';
import { kv } from './storage';
import { soundKit } from './assets';

export type SoundEvent = keyof typeof soundKit; // save | send | stepDone | allDone | gentleError

const CELEBRATION: ReadonlySet<SoundEvent> = new Set(['allDone'] as SoundEvent[]);

const isWeb = Platform.OS === 'web';

// ── Sounds toggle (module store, hydrated once — the usePrefs pattern) ──────
let enabled = true;
let hydrated = false;
let explicit = false; // a user choice this session outranks the async kv read
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const raw = await kv.get<unknown>('soundsEnabled', true);
  if (explicit) return; // setEnabled won the race — don't clobber the choice
  enabled = raw !== false; // anything but a stored false means ON (default ON)
  emit();
}
// Kick the read at MODULE LOAD, not at first play. Reading it lazily meant the
// first sound after every cold start escaped the toggle entirely: the read
// hadn't resolved, `enabled` was still the default true, and a user who turned
// sounds off heard one anyway on every launch. Starting at import puts the
// resolve well before any tap is physically possible.
void hydrate();

// Reduced-motion flag, kept fresh by the OS listener (the kit is not a hook,
// so useReducedMotion isn't available — this is the imperative mirror).
let reducedMotion = false;
if (!isWeb) {
  void AccessibilityInfo.isReduceMotionEnabled()
    .then((v) => {
      reducedMotion = v;
    })
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
    reducedMotion = v;
  });
}

// ── Players: created lazily on first play (native only), then reused ────────
type Player = { play: () => void; seekTo: (s: number) => Promise<void>; volume: number };
const players = new Map<SoundEvent, Player>();

function playerFor(event: SoundEvent): Player | null {
  if (isWeb) return null;
  let p = players.get(event);
  if (!p) {
    try {
      // Required lazily so the web bundle never evaluates the native player.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only, mirrors the share/view-shot pattern
      const { createAudioPlayer } = require('expo-audio');
      p = createAudioPlayer(soundKit[event]) as Player;
      players.set(event, p);
    } catch {
      return null; // missing native module → silence, never a crash
    }
  }
  return p;
}

export const sound = {
  /** Fire-and-forget. Safe to call anywhere; respects all three off-ramps. */
  play(event: SoundEvent): void {
    void hydrate();
    if (!enabled) return;
    if (reducedMotion && CELEBRATION.has(event)) return;
    const p = playerFor(event);
    if (!p) return;
    try {
      void p.seekTo(0).catch(() => {});
      p.play();
    } catch {
      // fire-and-forget — a failed sound never blocks anything
    }
  },

  /** The preferences toggle (default ON). */
  isEnabled(): boolean {
    void hydrate();
    return enabled;
  },
  setEnabled(v: boolean): void {
    enabled = v;
    hydrated = true;
    explicit = true; // outranks any in-flight hydrate
    void kv.set('soundsEnabled', v);
    emit();
  },
  /** Subscribe for UI (the Profile switch re-renders on change). */
  subscribe(l: () => void): () => void {
    listeners.add(l);
    void hydrate();
    return () => {
      listeners.delete(l);
    };
  },
};
