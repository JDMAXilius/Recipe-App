// Unit tests for the otto_recipes serving-copy seam (Phase-4 cutover adapter).
// Run by `npm test` (node --test, type-stripped TS via ts-ext-resolve).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  USE_OTTO_RECIPES,
  canonicalToRecipe,
  canonicalToSummary,
  parseCanonical,
} from './canonical.transform.ts';
import { mealToRecipe } from './mealdb.transform.ts';

// A sample silver record — the shape OWN_RECIPE_DB.md documents.
const canonical = {
  id: '52764',
  title: 'Garides Saganaki',
  category: 'Seafood',
  area: 'Greek',
  servings: 4,
  instructions: ['Boil the prawns.', 'Warm the oil and cook the onion.'],
  ingredients: [
    { original: '500g Raw king prawns', measure: '500g', name: 'Raw king prawns', key: 'raw king prawns', grams: 500, cooked: true, frying_medium: false, note: null },
    { original: '3 tablespoons Olive oil', measure: '3 tablespoons', name: 'Olive oil', key: 'olive oil', grams: 41, cooked: false, frying_medium: false, note: null },
  ],
  media: { image: 'https://img/prawns.jpg', youtube: 'https://youtu.be/x', source: null },
  provenance: { source: 'themealdb', fetched_at: 'x', canonicalized_at: 'y', model: 'z' },
};

test('the cutover flag DEFAULTS OFF (absent env → false → TheMealDB path runs)', () => {
  // No EXPO_PUBLIC_USE_OTTO_RECIPES set in the test env → the flag must be false,
  // so useRecipe/useDiscover/useRelated stay on the unchanged content path.
  assert.equal(process.env.EXPO_PUBLIC_USE_OTTO_RECIPES, undefined);
  assert.equal(USE_OTTO_RECIPES, false);
});

test('canonicalToRecipe maps to the app Recipe shape, seed-branded', () => {
  const r = canonicalToRecipe(parseCanonical(canonical));
  assert.equal(r.id, '52764');
  assert.equal(r.title, 'Garides Saganaki');
  assert.equal(r.category, 'Seafood');
  assert.equal(r.area, 'Greek');
  assert.equal(r.image, 'https://img/prawns.jpg');
  assert.equal(r.youtubeUrl, 'https://youtu.be/x');
  assert.equal(r.source, 'themealdb');
  assert.equal(r.sourceName, null);
  assert.equal(r.sourceUrl, null);
  assert.deepEqual(r.steps, ['Boil the prawns.', 'Warm the oil and cook the onion.']);
  assert.equal(r.ingredients.length, 2);
});

test('canonicalToRecipe splits measure/name into separate columns (no measure prefix in name)', () => {
  // The detail screen renders measure + name in SEPARATE columns and
  // NutritionCard/ShareCard read `.name` alone — so name must NOT carry the
  // measure prefix. canonical now carries the bronze-recovered split.
  const r = canonicalToRecipe(parseCanonical(canonical));
  assert.deepEqual(r.ingredients[0], { measure: '500g', name: 'Raw king prawns', grams: 500 });
  assert.deepEqual(r.ingredients[1], { measure: '3 tablespoons', name: 'Olive oil', grams: 41 });
});

test('canonicalToRecipe surfaces each line’s canonical grams (SSOT for the amount)', () => {
  // grams is the total weight seed_nutrition was computed from — the detail shows
  // it (÷ servings) so the amount and the kcal describe the same portion.
  const r = canonicalToRecipe(parseCanonical(canonical));
  assert.equal(r.ingredients[0].grams, 500);
  assert.equal(r.ingredients[1].grams, 41);
});

test('pre-split record (no measure/name) falls back to original in the name column', () => {
  // Forward/back-compat: a canonical record still lacking the split keeps the
  // old behaviour (whole line in name, empty measure) so nothing crashes.
  const r = canonicalToRecipe(
    parseCanonical({ id: '1', title: 'Old', ingredients: [{ original: '1 Onion' }] }),
  );
  assert.deepEqual(r.ingredients[0], { measure: '', name: '1 Onion', grams: null });
});

test('canonicalToRecipe surfaces the canonical servings (SSOT for per-serving scaling)', () => {
  // Was hard-null; now the real yield flows through so the detail scales the
  // ingredient grams by the SAME servings seed_nutrition used (amount == kcal).
  const r = canonicalToRecipe(parseCanonical(canonical));
  assert.equal(r.servings, 4);
  // unknown yield stays null → the detail falls back to its `|| 4` default.
  assert.equal(canonicalToRecipe(parseCanonical({ id: '1', title: 'x' })).servings, null);
});

test('ingredient line the engine parses is byte-identical to the OFF path', () => {
  // The nutrition engine (compute.ts) joins [measure, name] back into one line.
  // '' + original === original, so the joined line matches what mealToRecipe
  // would feed for the same TheMealDB row → identical grams/nutrition.
  const r = canonicalToRecipe(parseCanonical(canonical));
  const joined = r.ingredients.map((i) => [i.measure, i.name].filter(Boolean).join(' ').trim());
  assert.deepEqual(joined, ['500g Raw king prawns', '3 tablespoons Olive oil']);
});

test('canonicalToSummary mirrors mealToSummary — category is the filter arg only', () => {
  const rec = parseCanonical(canonical);
  // category filter → carries the filtered category
  assert.deepEqual(canonicalToSummary(rec, 'Seafood'), {
    id: '52764',
    title: 'Garides Saganaki',
    image: 'https://img/prawns.jpg',
    category: 'Seafood',
  });
  // area-only filter (no category arg) → null, NOT rec.category, matching the
  // OFF path where filter.php omits strCategory (keeps the card's kcal estimate
  // byte-identical).
  assert.equal(canonicalToSummary(rec).category, null);
});

test('parseCanonical rejects a record with no id (jsonb trust boundary)', () => {
  assert.throws(() => parseCanonical({ title: 'no id' }));
});

test('adapter tolerates absent media / ingredients (nullish)', () => {
  const r = canonicalToRecipe(parseCanonical({ id: '1', title: 'Bare' }));
  assert.equal(r.image, null);
  assert.equal(r.youtubeUrl, null);
  assert.equal(r.sourceUrl, null);
  assert.deepEqual(r.ingredients, []);
  assert.deepEqual(r.steps, []);
  assert.equal(r.source, 'themealdb'); // provenance absent → default
  // shares the OFF path's defaults for a minimal row
  const off = mealToRecipe({ idMeal: '1', strMeal: 'Bare' });
  assert.equal(r.servings, off.servings);
  assert.equal(r.sourceName, off.sourceName);
});
