// The catalogue's guarantees (R0.9): names are valid and unique, the server's
// manifest is current, and no screen writes data without going through an action.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { allSpecs } from './specs.ts';
import { toManifest, TOOL_NAME } from '../shared/actions/action.ts';

const root = new URL('../../', import.meta.url).pathname;

test('action names are valid tool names and unique', () => {
  const names = allSpecs.map((s) => s.name);
  for (const n of names) assert.match(n, TOOL_NAME, n);
  assert.equal(new Set(names).size, names.length);
  for (const s of allSpecs) assert.match(s.summary, /\.$/, `${s.name}: summary is one sentence ending in a full stop`);
});

test('supabase/functions/_shared/actions.json is current (npm run actions:manifest)', () => {
  const file = JSON.parse(readFileSync(join(root, 'supabase/functions/_shared/actions.json'), 'utf8'));
  assert.deepEqual(file, JSON.parse(JSON.stringify(toManifest(allSpecs))));
});

// Writes not yet behind an action, each with its reason. Shrink this list;
// never grow it without a ticket.
const PENDING = {
  'src/features/import/import.queries.ts': 'saving a recipe from a draft: next catalogue slice',
  'src/features/share/share.queries.ts': 'makes a share link; not app state',
};

const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });

test('every UI mutation goes through an action runner', () => {
  const offenders = [];
  for (const p of files(join(root, 'src/features'))) {
    const rel = relative(root, p);
    if (PENDING[rel]) continue;
    const src = readFileSync(p, 'utf8');
    // each mutationFn body (to the next mutation option) must call a runner
    for (const m of src.matchAll(/mutationFn:([\s\S]*?)(?=\n\s*on[A-Z]\w*:|\n\s*\}\);)/g)) {
      if (!/\w+Run\.\w+\(/.test(m[1])) offenders.push(`${rel}: ${m[1].trim().split('\n')[0]}`);
    }
  }
  assert.deepEqual(offenders, [], 'call a *Run runner from the feature\'s *.queries.ts, or add a spec');
});

test('the pending list only names files that still have mutations', () => {
  for (const rel of Object.keys(PENDING)) {
    assert.match(readFileSync(join(root, rel), 'utf8'), /mutationFn:/, `${rel} is done; remove it from PENDING`);
  }
});
