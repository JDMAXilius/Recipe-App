// Cookbook actions (R0.9): saving and unsaving a catalogue recipe. Specs only;
// the runners are savedRun in saved.queries.ts.
import { z } from 'zod';
import { defineActions } from '../../shared/actions/action';

const recipeId = z.number().int().positive().describe('The catalogue recipe id');

export const savedActions = defineActions({
  save: {
    name: 'save_recipe',
    summary: 'Save a catalogue recipe to the cookbook. Saving one already saved does nothing.',
    risk: 'safe',
    touches: ['saved'],
    input: z.object({
      recipeId,
      title: z.string().min(1).max(200),
      image: z.string().nullable(),
      category: z.string().nullable(),
      cookTime: z.string().nullable(),
      servings: z.string().nullable(),
    }),
  },
  unsave: {
    name: 'unsave_recipe',
    summary: 'Take a saved recipe out of the cookbook.',
    risk: 'safe',
    touches: ['saved'],
    input: z.object({ recipeId }),
  },
});
