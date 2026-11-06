// Writes supabase/functions/_shared/actions.json from the action specs (R0.9).
// Run: npm run actions:manifest. catalogue.test.mjs fails while it is stale.
import { writeFileSync } from 'node:fs';
import { allSpecs } from '../src/catalogue/specs.ts';
import { toManifest } from '../src/shared/actions/action.ts';

const out = new URL('../supabase/functions/_shared/actions.json', import.meta.url);
writeFileSync(out, JSON.stringify(toManifest(allSpecs), null, 2) + '\n');
console.log(`wrote ${allSpecs.length} actions`);
