// Household actions (R0.9): the shared kitchen and its shared shopping list.
// Specs only; the runners are householdRun in household.queries.ts. The
// personal list still lives on the Shopping screen (kv), so it has no actions yet.
import { z } from 'zod';
import { defineActions } from '../../shared/actions/action';

// The screen knows its household and passes it; Otto leaves it out and the
// runner looks it up.
const householdId = z.string().uuid().optional().describe('Leave out: the user\'s household is found for you');
const itemKey = z.string().min(1).max(200).describe('The shopping list item key');
const ownKey = z.string().startsWith('custom-').max(200).describe('The key of an item the user added (custom-…)');
const list = ['household-list'] as const;

export const householdActions = defineActions({
  check: {
    name: 'check_list_item',
    summary: 'Tick an item on the shared shopping list, or untick it.',
    risk: 'safe',
    touches: list,
    input: z.object({ householdId, itemKey, checked: z.boolean() }),
  },
  addItem: {
    name: 'add_to_list',
    summary: 'Add an item of the user\'s own to the shared shopping list.',
    risk: 'safe',
    touches: list,
    input: z.object({ householdId, name: z.string().trim().min(1).max(80) }),
  },
  removeItem: {
    name: 'remove_own_list_item',
    summary: 'Delete an item the user added to the shared shopping list.',
    risk: 'safe',
    touches: list,
    input: z.object({ householdId, itemKey: ownKey }),
  },
  hideItem: {
    name: 'hide_list_item',
    summary: 'Take a planned ingredient off the shared shopping list for everyone, or put it back.',
    risk: 'safe',
    touches: list,
    input: z
      .object({
        householdId,
        itemKey,
        removed: z.boolean(),
        sources: z.array(z.string()).nullable().describe('The recipe ids the ingredient came from; required to hide'),
      })
      // A hide without its recipes matches no row on the list: a silent no-op.
      .refine((v) => !v.removed || (v.sources?.length ?? 0) > 0, { message: 'Give the recipe ids the ingredient came from.' }),
  },
  create: {
    name: 'create_household',
    summary: 'Start a shared kitchen the user can invite people to.',
    risk: 'safe',
    touches: ['household'],
    input: z.object({ displayName: z.string().max(40).describe('The name others see for the user') }),
  },
  join: {
    name: 'join_household',
    summary: 'Join a shared kitchen with its invite code.',
    risk: 'safe',
    touches: ['household'],
    input: z.object({ code: z.string().trim().min(4).max(12), displayName: z.string().max(40) }),
  },
  leave: {
    name: 'leave_household',
    summary: 'Leave the shared kitchen; the shared list and plans stop being shared.',
    risk: 'confirm',
    touches: ['household'],
    input: z.object({ householdId }),
  },
});
