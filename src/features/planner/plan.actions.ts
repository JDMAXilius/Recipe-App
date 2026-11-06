// Planner actions (R0.9): what a person can do to their week by hand, defined
// once for the screen and for Otto. Specs only; the runners are planRun in
// plan.queries.ts. Relative imports so `node --test` can load this file.
import { z } from 'zod';
import { defineActions } from '../../shared/actions/action';
import { PLAN_KINDS } from './plan.list';

const id = z.number().int().positive().describe('The plan item id');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('The day, YYYY-MM-DD');
const dish = {
  recipeId: z.string().min(1).describe('Recipe id: a catalogue id ("52772") or one of the user\'s own ("u-12")'),
  title: z.string().min(1).max(200),
  image: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  note: z.string().max(200).nullable().optional(),
};
const label = z.string().max(24).nullable().describe('breakfast, lunch, dinner, snack, the user\'s own word, or null');

export const planActions = defineActions({
  add: {
    name: 'put_in_plan',
    summary: 'Put a dish on a day of the plan, at the end of that day.',
    risk: 'safe',
    touches: ['plan'],
    input: z.object({ day, ...dish, label: label.optional(), kind: z.enum(PLAN_KINDS).optional(), position: z.number().optional() }),
  },
  remove: {
    name: 'remove_from_plan',
    summary: 'Take an item off the plan.',
    risk: 'safe',
    touches: ['plan'],
    input: z.object({ id }),
  },
  swap: {
    name: 'swap_in_plan',
    summary: 'Replace the dish of a plan item with another; the item keeps its day, label and place.',
    risk: 'safe',
    touches: ['plan'],
    input: z.object({ id, ...dish }),
  },
  setCooked: {
    name: 'mark_cooked',
    summary: 'Mark a plan item cooked, or not cooked.',
    risk: 'safe',
    touches: ['plan'],
    input: z.object({ id, cooked: z.boolean() }),
  },
  setLabel: {
    name: 'label_plan_item',
    summary: 'Give a plan item a label such as dinner, or clear it with null.',
    risk: 'safe',
    touches: ['plan'],
    input: z.object({ id, label }),
    flag: 'flowV2',
  },
  move: {
    name: 'move_plan_item',
    summary: 'Move a plan item to a day and a place in that day\'s list.',
    risk: 'safe',
    touches: ['plan'],
    input: z.object({ id, day, position: z.number().describe('Sort key; between its new neighbours') }),
    flag: 'flowV2',
  },
});
