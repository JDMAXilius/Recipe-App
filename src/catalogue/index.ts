// The bound catalogue: every action with its runner, for the agent, notification
// buttons, widgets and Siri (R0.9). The type of bind() makes a spec without a
// runner a compile error.
import { bind, type Action } from '@/shared/actions/action';
import { planRun } from '@/features/planner/plan.queries';
import { savedRun } from '@/features/cookbook/saved.queries';
import { specGroups } from './specs';

export const actions: readonly Action[] = [
  ...bind(specGroups.plan, planRun),
  ...bind(specGroups.saved, savedRun),
];
