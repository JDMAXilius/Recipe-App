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

test('haptics: raw expo-haptics only inside the kit', () => {
  assert.deepEqual(
    offenders(['shared/haptics.ts'], /from 'expo-haptics'|require\('expo-haptics'\)/),
    [],
    'import the haptics wrapper, not expo-haptics (ui-components.md §3)',
  );
});

test('sound: audio players only inside the kit (+ the cook alarm exception)', () => {
  // CookScreen's timer alarm predates the kit and is an ALERT, not palette —
  // the one documented exception (motion.md §3).
  assert.deepEqual(
    offenders(
      ['shared/sound.ts', 'features/cook/CookScreen.tsx'],
      /useAudioPlayer|createAudioPlayer|from 'expo-audio'/,
    ),
    [],
    'play sounds through shared/sound.ts (motion.md §3)',
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
});
