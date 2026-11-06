// Every action spec in the app, in one list (R0.9). Pure: `node --test` and the
// tool generator load it. The catalogue is the one place besides app/ allowed
// to read several features (feature-module.md, "Actions").
import { planActions } from '../features/planner/plan.actions';
import { savedActions } from '../features/cookbook/saved.actions';
import { householdActions } from '../features/household/household.actions';
import { recipeActions } from '../features/import/recipe.actions';
import { listActions } from '../features/planner/shopping.actions';

export const specGroups = { plan: planActions, saved: savedActions, household: householdActions, recipe: recipeActions, list: listActions } as const;

export const allSpecs = Object.values(specGroups).flatMap((g) => Object.values(g));
