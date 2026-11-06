// The user's own recipes (R0.9): save (create or update) and delete. Specs only;
// the runners are recipeRun in import.queries.ts. Reading a link, a photo or
// text into a draft saves nothing, so those are not actions.
import { z } from 'zod';
import { defineActions } from '../../shared/actions/action';
import { MAX_SERVINGS } from '../../shared/yield';

const id = z.number().int().positive().describe('The user\'s recipe id (the number in "u-12")');
const recipe = z.object({
  source: z.enum(['imported', 'manual', 'otto']),
  sourceUrl: z.string().nullable(),
  sourceName: z.string().nullable(),
  title: z.string().trim().min(1).max(120),
  image: z.string().nullable(),
  category: z.string().max(60).nullable(),
  area: z.string().max(60).nullable(),
  servings: z.number().int().min(1).max(MAX_SERVINGS),
  ingredients: z.array(z.object({ measure: z.string().max(80), name: z.string().min(1).max(200) })).max(60),
  steps: z.array(z.string().min(1).max(1500)).max(40),
  size: z
    .object({ yield: z.object({ qty: z.number().positive().max(MAX_SERVINGS), unit: z.string().min(1).max(24) }), servingUnit: z.string().min(1).max(24) })
    .nullable(),
});

export const recipeActions = defineActions({
  save: {
    name: 'save_my_recipe',
    summary: 'Save one of the user\'s own recipes: a new one without an id, or replace an existing one with its id.',
    risk: 'safe',
    touches: ['myRecipes', 'recipe', 'nutrition', 'plan-list'],
    input: z.object({ id: id.optional(), recipe }),
  },
  remove: {
    name: 'delete_my_recipe',
    summary: 'Delete one of the user\'s own recipes for good.',
    risk: 'confirm',
    touches: ['myRecipes', 'recipe', 'nutrition', 'plan-list'],
    input: z.object({ id }),
  },
});
