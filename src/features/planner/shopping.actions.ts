// Personal shopping list actions (R0.9): the list of someone NOT in a shared
// kitchen (that list's actions are household's). Specs only; the runners are
// listRun in shopping.store.ts.
import { z } from 'zod';
import { defineActions } from '../../shared/actions/action';

const itemKey = z.string().min(1).max(200).describe('The shopping list item key');
const touches = ['shopping-local'] as const;
const personal = ' Personal list: only when the user is not in a shared kitchen.';

export const listActions = defineActions({
  tick: {
    name: 'tick_my_list_item',
    summary: `Tick an item on the shopping list, or untick it.${personal}`,
    risk: 'safe',
    touches,
    input: z.object({ itemKey, checked: z.boolean() }),
  },
  addItem: {
    name: 'add_to_my_list',
    summary: `Add an item of the user's own to the shopping list.${personal}`,
    risk: 'safe',
    touches,
    input: z.object({ name: z.string().trim().min(1).max(80) }),
  },
  removeItem: {
    name: 'remove_from_my_list',
    summary: `Delete an item the user added to the shopping list.${personal}`,
    risk: 'safe',
    touches,
    input: z.object({ itemKey: z.string().startsWith('custom-').max(200) }),
  },
  hideItem: {
    name: 'hide_my_list_item',
    summary: `Take a planned ingredient off the shopping list, or put it back.${personal}`,
    risk: 'safe',
    touches,
    input: z.object({
      itemKey,
      removed: z.boolean(),
      sources: z.array(z.string()).min(1).describe('The recipe ids the ingredient came from'),
    }),
  },
  dropDish: {
    name: 'drop_dish_from_list',
    summary: `Leave a planned dish's ingredients off the shopping list, or bring them back; the plan is unchanged.${personal}`,
    risk: 'safe',
    touches,
    input: z.object({ recipeId: z.string().min(1), dropped: z.boolean() }),
  },
});
