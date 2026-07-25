// The drift stopper (motion.md §5, DELIGHT ticket Phase 1): the vocabulary is
// only law if CI can see a violation. Scans src/ for the three drifts that
// keep happening; each rule names its allowed homes. Not a linter — a tripwire.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const files = walk(SRC).map((p) => ({
  rel: relative(SRC, p).replace(/\\/g, '/'),
  text: readFileSync(p, 'utf8'),
}));

const offenders = (allowed, re) =>
  files
    .filter((f) => !allowed.some((a) => f.rel === a))
    .filter((f) => re.test(f.text))
    .map((f) => f.rel);

// Quote-agnostic module matcher — a REFUTER pass walked a double-quoted
// `import * as Haptics from "expo-haptics"` straight past the first version of
// this file, and nothing in the lint config forces quote style.
const importsModule = (name) =>
  new RegExp(`(from|require\\()\\s*['"]${name.replace('/', '\\/')}['"]`);

test('haptics: raw expo-haptics only inside the kit', () => {
  assert.deepEqual(
    offenders(['shared/haptics.ts'], importsModule('expo-haptics')),
    [],
    'import the haptics wrapper, not expo-haptics (ui-components.md §3)',
  );
});

test('haptics: Vibration only inside the kit (it has no off-ramps of its own)', () => {
  assert.deepEqual(
    offenders(['shared/haptics.ts'], /\bVibration\.vibrate\s*\(/),
    [],
    'the alarm pattern lives in haptics.alarm() (motion.md §2)',
  );
});

test('sound: audio players only inside the kit (+ the cook alarm exception)', () => {
  // CookScreen's timer alarm predates the kit and is an ALERT, not palette —
  // the one documented exception (motion.md §3).
  const allowed = ['shared/sound.ts', 'features/cook/CookScreen.tsx'];
  assert.deepEqual(
    offenders(allowed, /useAudioPlayer|createAudioPlayer/),
    [],
    'play sounds through shared/sound.ts (motion.md §3)',
  );
  assert.deepEqual(offenders(allowed, importsModule('expo-audio')), [], 'ditto');
});

test('sound: setAudioModeAsync is the one API that voids the silent-switch off-ramp', () => {
  // It is process-global. A stray call anywhere makes every sound in the app
  // ignore the mute switch — the exact P1 a review caught in CookScreen, which
  // keeps the call ONLY because it also restores the mode on unmount.
  // Match the CALL, not the word — the kit's own doc comment names the API it
  // promises never to use, and a guard that can't tell prose from code is a
  // guard people learn to ignore.
  assert.deepEqual(
    offenders(['features/cook/CookScreen.tsx'], /setAudioModeAsync\s*\(/),
    [],
    'audio mode is global — off-ramp #1 (motion.md §3)',
  );
});

test('motion: no inline spring configs or duration literals outside the motion home', () => {
  const allowed = ['shared/theme/tokens.ts', 'shared/motion.ts'];
  assert.deepEqual(
    offenders(allowed, /\bdamping\s*:\s*\d|\bstiffness\s*:\s*\d/),
    [],
    'spring configs live in tokens.ts (motion.md §1)',
  );
  assert.deepEqual(
    offenders(allowed, /\bduration\s*:\s*\d/),
    [],
    'durations are role-named tokens (timing.enter/exit/emphasis/…), not literals (motion.md §1)',
  );
  // The BUILDER form — FadeIn.duration(320) — is the same violation wearing a
  // different hat, and the first version of this guard didn't see it.
  assert.deepEqual(
    offenders(allowed, /\.duration\(\s*\d/),
    [],
    'builder-form durations are literals too (motion.md §1)',
  );
  // motion.md §1 names a raw Easing in a component a review failure by itself.
  assert.deepEqual(
    offenders(allowed, /\bEasing\.[a-z]/),
    [],
    'curves are role-named in motion.ts `easings` (motion.md §1)',
  );
});
