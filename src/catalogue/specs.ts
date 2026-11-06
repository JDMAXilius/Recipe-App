// Every action spec in the app, in one list (R0.9). Pure: `node --test` and the
// tool generator load it. The catalogue is the one place besides app/ allowed
// to read several features (feature-module.md, "Actions").
import { planActions } from '../features/planner/plan.actions';
import { savedActions } from '../features/cookbook/saved.actions';

export const specGroups = { plan: planActions, saved: savedActions } as const;

export const allSpecs = Object.values(specGroups).flatMap((g) => Object.values(g));
