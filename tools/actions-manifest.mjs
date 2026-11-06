// Writes supabase/functions/_shared/actions.json from the action specs (R0.9).
// Run: npm run actions:manifest. catalogue.test.mjs fails while it is stale.
import { writeFileSync } from 'node:fs';
import { allSpecs } from '../src/catalogue/specs.ts';
import { toManifest } from '../src/shared/actions/action.ts';

import { PLAN_TOOLS } from '../supabase/functions/otto-agent/agent.ts';

const out = new URL('../supabase/functions/_shared/actions.json', import.meta.url);
const manifest = toManifest(allSpecs);
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
// otto-agent ships only the actions it may use (smaller to deploy).
const agentOut = new URL('../supabase/functions/otto-agent/tools.json', import.meta.url);
writeFileSync(agentOut, JSON.stringify(manifest.filter((m) => PLAN_TOOLS.includes(m.tool.function.name)), null, 2) + '\n');
console.log(`wrote ${allSpecs.length} actions (${PLAN_TOOLS.length} for otto-agent)`);
