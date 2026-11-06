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

const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });

// Every useMutation(...) call, whole (parens balanced), with the two lines
// before it, where an `// action-exempt: <reason>` comment goes.
export function mutationCalls(src) {
  const out = [];
  for (const m of src.matchAll(/useMutation\(/g)) {
    let depth = 0;
    let end = m.index;
    for (let i = m.index + 'useMutation'.length; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')' && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    const before = src.slice(0, m.index).split('\n').slice(-3).join('\n');
    out.push({ before, call: src.slice(m.index, end) });
  }
  return out;
}

test('every UI mutation goes through an action runner, or says why not', () => {
  const offenders = [];
  let checked = 0;
  for (const p of files(join(root, 'src/features'))) {
    const src = readFileSync(p, 'utf8');
    for (const { before, call } of mutationCalls(src)) {
      checked++;
      const code = call.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''); // a runner named in a comment doesn't count
      if (/\w+Run\.\w+\(/.test(code) || /action-exempt: \S/.test(before)) continue;
      offenders.push(`${relative(root, p)}: ${call.split('\n').slice(0, 2).join(' ').trim()}`);
    }
  }
  assert.ok(checked >= 20, `found only ${checked} mutations; the scan is broken`);
  assert.deepEqual(offenders, [], 'call a *Run runner from the feature\'s *.queries.ts, or mark it // action-exempt: <reason>');
});

test('the scan sees through one-liners and nested parens', () => {
  const src = "x\n// action-exempt: a draft\nreturn useMutation({ mutationFn: (u) => f(g(u)) });\nconst m = useMutation({ mutationFn: (v) => planRun.add(v, ctx()) });\nconst bad = useMutation({ mutationFn: (v) => write(v) });";
  const calls = mutationCalls(src);
  assert.equal(calls.length, 3);
  assert.match(calls[0].before, /action-exempt/);
  assert.match(calls[1].call, /planRun\.add\(v, ctx\(\)\) \}\)$/);
  assert.doesNotMatch(calls[2].call, /Run\./);
});
