// Cook-session preparation (ported from mobile/lib/cookSession.js): split long
// prose steps into stove-readable chunks and match which ingredients each step
// needs. Deterministic — regex-level parsing, no AI. Pure logic, colocated test.

export interface IngredientPair {
  measure: string;
  name: string;
}

const MAX_STEP_CHARS = 220;

// Split paragraph steps into sentence-boundary chunks ≤ MAX_STEP_CHARS so a
// step never scrolls (cook-mode blueprint F): long TheMealDB paragraphs become
// successive steps instead.
export function splitSteps(instructions: string[]): string[] {
  const out: string[] = [];
  for (const raw of instructions) {
    const text = (raw || '').trim();
    if (!text) continue;
    if (text.length <= MAX_STEP_CHARS) {
      out.push(text);
      continue;
    }
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
    let chunk = '';
    for (const sentence of sentences) {
      if (chunk && (chunk + sentence).length > MAX_STEP_CHARS) {
        out.push(chunk.trim());
        chunk = sentence;
      } else {
        chunk += sentence;
      }
    }
    if (chunk.trim()) out.push(chunk.trim());
  }
  return out;
}

// Significant words of an ingredient name ("plain flour" → ["flour"]).
const STOP_WORDS = new Set([
  'fresh', 'dried', 'ground', 'large', 'small', 'medium', 'chopped', 'minced',
  'sliced', 'whole', 'plain', 'extra', 'virgin', 'of', 'and', 'the', 'a',
]);

const significantWords = (name: string): string[] =>
  name
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

// Which of the recipe's ingredients does this step mention? Returns pairs in
// recipe order — feeds the "You'll need" chips.
export function matchStepIngredients(
  stepText: string,
  ingredientPairs: IngredientPair[],
): IngredientPair[] {
  const haystack = ` ${stepText.toLowerCase()} `;
  const matched: IngredientPair[] = [];
  for (const pair of ingredientPairs || []) {
    const words = significantWords(pair.name);
    if (words.length === 0) continue;
    // require EVERY significant word (singular/plural tolerant) — "the sauce"
    // must not match "soy sauce", "stir together" must not match "stir-fry".
    const hit = words.every((w) => {
      const stem = w.endsWith('es') ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w;
      return haystack.includes(stem.length > 3 ? stem : w);
    });
    if (hit) matched.push(pair);
  }
  return matched;
}

// mm:ss for the timer displays (used by CookScreen + TimerHub).
export const mmss = (s: number): string =>
  `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(
    Math.max(0, s) % 60,
  ).padStart(2, '0')}`;
