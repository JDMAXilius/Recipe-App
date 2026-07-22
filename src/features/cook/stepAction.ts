// Detect the primary cooking ACTION of a step so cook mode can show the
// matching Otto spot illustration (ported from mobile/lib/stepAction.js).
// Deterministic: the earliest action keyword wins (a step's primary action is
// almost always its first verb). In v2 the action maps to an OttoArt name — the
// painted assets ship behind that catalog; OttoArt renders a placeholder until.

import type { OttoArtName } from '@/shared/ui';

export type StepAction =
  | 'chop' | 'mix' | 'saute' | 'simmer' | 'bake'
  | 'wait' | 'season' | 'pour' | 'serve' | 'cook';

const ACTIONS: { id: StepAction; words: string[] }[] = [
  { id: 'chop', words: ['chop', 'slice', 'dice', 'cut ', 'mince', 'peel', 'shred', 'grate', 'trim', 'halve'] },
  { id: 'mix', words: ['stir', 'mix', 'whisk', 'combine', 'fold', 'beat', 'toss', 'blend', 'knead'] },
  { id: 'saute', words: ['sauté', 'saute', 'sear', 'brown ', 'fry', 'skillet', 'wok', 'heat oil', 'heat the oil', 'frying pan'] },
  { id: 'simmer', words: ['simmer', 'boil', 'poach', 'steam', 'reduce', 'bubbl'] },
  { id: 'bake', words: ['bake', 'oven', 'roast', 'preheat', 'broil', 'grill'] },
  { id: 'wait', words: ['rest', 'marinate', 'chill', 'stand', 'cool', 'refrigerat', 'soak', 'set aside', 'let sit', 'leave to', 'rise', 'prove'] },
  { id: 'season', words: ['season', 'sprinkle', 'garnish', 'drizzle', 'glaze', 'brush with', 'salt and pepper'] },
  { id: 'pour', words: ['pour', 'spread', 'layer', 'arrange', 'transfer', 'place ', 'spoon over', 'spoon the', 'top with', 'cover'] },
  { id: 'serve', words: ['serve', 'plate up', 'enjoy', 'portion'] },
];

export function detectStepAction(text: string): StepAction {
  const haystack = ` ${(text || '').toLowerCase()} `;
  let best: { id: StepAction; index: number } = { id: 'cook', index: Infinity };
  for (const action of ACTIONS) {
    for (const word of action.words) {
      const index = haystack.indexOf(word);
      if (index !== -1 && index < best.index) {
        best = { id: action.id, index };
      }
    }
  }
  return best.id;
}

// Action → OttoArt catalog name (shared/ui OttoArt renders it; placeholder until
// the painted assets port in — same catalog v1 keyed its require()s on).
export const ACTION_ART: Record<StepAction, OttoArtName> = {
  chop: 'action-chop',
  mix: 'action-mix',
  saute: 'action-saute',
  simmer: 'action-simmer',
  bake: 'action-bake',
  wait: 'action-wait',
  season: 'action-season',
  pour: 'action-pour',
  serve: 'action-serve',
  cook: 'action-cook',
};

// Convenience for the UI: text → the OttoArt name to render.
export const stepActionArt = (text: string): OttoArtName => ACTION_ART[detectStepAction(text)];
