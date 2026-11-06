// The bound catalogue: every action with its runner, for the agent, notification
// buttons, widgets and Siri (R0.9). The type of bind() makes a spec without a
// runner a compile error.
import { bind, type Action, type Runners } from '@/shared/actions/action';
import { planRun } from '@/features/planner/plan.queries';
import { savedRun } from '@/features/cookbook/saved.queries';
import { getMyHousehold, householdRun } from '@/features/household/household.queries';
import { recipeRun } from '@/features/import/import.queries';
import { listRun } from '@/features/planner/shopping.store';
import { specGroups } from './specs';

export const actions: readonly Action[] = [
  ...bind(specGroups.plan, planRun),
  ...bind(specGroups.saved, savedRun),
  ...bind(specGroups.household, householdRun),
  ...bind(specGroups.recipe, recipeRun),
  ...bind(specGroups.list, soloOnly(listRun)),
];

// The personal list is for people NOT in a shared kitchen: for them the
// screen shows the household list, so a personal-list write would be a
// change nobody sees.
function soloOnly<T extends typeof specGroups.list>(runners: Runners<T>): Runners<T> {
  const guarded = {} as Runners<T>;
  for (const k of Object.keys(runners) as (keyof T)[]) {
    guarded[k] = (async (input, ctx) => {
      if (await getMyHousehold(ctx.userId)) throw new Error('You share a kitchen: use the shared list.');
      return runners[k](input, ctx);
    }) as Runners<T>[keyof T];
  }
  return guarded;
}
