// Allergen and diet heuristics against real ingredient strings, including
// every miss an independent review found in the catalogue (2026-11-06), and a
// regression run over the raw catalogue itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allergensIn, fitsDiet } from './allergens.ts';

const has = (name, allergen) => allergensIn([name]).has(allergen);

const MUST_FLAG = {
  gluten: ['plain flour', 'self-raising flour', 'Rigatoni', 'Farfalle', 'Baguette', 'Sesame Seed Burger Buns', 'Ciabatta', 'English Muffins', 'Wonton Skin', 'Pretzels', 'Malt Vinegar', 'Shaoxing wine', 'Oats', 'cous cous', 'couscous', 'hoisin sauce', 'teriyaki', 'udon', 'ramen', 'fusilli', 'ravioli', 'spelt', 'naan bread', 'breadcrumbs', 'puff pastry', 'soy sauce', 'egg noodles', 'Beef Gravy', 'Christmas Pudding', 'Gochujang', 'flatbread'],
  fish: ['Pilchards', 'Hake', 'Seafood stock', 'Thai red curry paste', 'fish sauce', 'worcestershire sauce', 'anchovies', 'Codfish Bulljaw', 'barramundi', 'Prahok', 'catfish'],
  shellfish: ['prawns', 'oyster sauce', 'Seafood stock', 'Thai green curry paste', 'Conchs', 'shrimp paste'],
  dairy: ['double cream', 'unsalted butter', 'greek yoghurt', 'creme fraiche', 'crème fraîche', 'parmigiano-reggiano', 'Pecorino', 'Fromage Frais', 'manchego', 'queso fresco', 'gorgonzola', 'stilton', 'paneer', 'ghee', 'pesto', 'Dulce de leche', 'White Chocolate'],
  peanut: ['peanuts', 'Ground Nut Oil', 'groundnut oil', 'satay sauce', 'mixed nuts'],
  treeNut: ['pine nuts', 'ground almonds', 'pesto', 'mixed nuts', 'hazlenuts', 'Nougatine'],
  egg: ['free-range eggs', 'mayo', 'Smoky Aïoli', 'egg noodles'],
  soy: ['soy sauce', 'miso paste', 'hoisin', 'teriyaki', 'kecap manis', 'black bean sauce', 'Fermented Black Beans', 'tofu'],
  sesame: ['toasted sesame oil', 'tahini', 'Hummus'],
};
const MUST_NOT = {
  dairy: ['coconut milk', 'Coconut Cream', 'peanut butter', 'butternut squash', 'butter beans', 'cream of tartar', 'vegan butter'],
  gluten: ['rice noodles', 'Rice Vermicelli', 'corn tortillas', 'Corn Flour', 'Rice Flour', 'Buckwheat Flour', 'gluten-free pasta', 'tamari'],
  egg: ['Eggplant', 'aubergine'],
  treeNut: ['Nutmeg', 'Water Chestnut', 'Coconut', 'Ground Nut Oil'],
  fish: ['shellfish'],
};

test('every known allergen-bearing ingredient is flagged', () => {
  const misses = [];
  for (const [a, names] of Object.entries(MUST_FLAG)) for (const n of names) if (!has(n, a)) misses.push(`${a}: ${n}`);
  assert.deepEqual(misses, []);
});

test('the known look-alikes are not flagged', () => {
  const wrong = [];
  for (const [a, names] of Object.entries(MUST_NOT)) for (const n of names) if (has(n, a)) wrong.push(`${a}: ${n}`);
  assert.deepEqual(wrong, []);
});

test('diets: meat words and meat categories rule out vegetarian; look-alikes do not', () => {
  for (const n of ['Doner Meat', 'Shredded Meat', 'black pudding', 'goose fat', 'kielbasa', 'meatballs', 'pastrami', 'pheasant', 'Pork Back Ribs', 'haggis', 'dashi', 'bonito flakes', 'gelatine', 'chicken stock', 'lard', 'beef stock', 'bacon', 'pancetta', 'Pilchards', 'Thai red curry paste', 'Mincemeat', 'Pigs Trotters'])
    assert.equal(fitsDiet([n], 'vegetarian'), false, n);
  assert.equal(fitsDiet(['beans'], 'vegetarian', 'Lamb'), false);
  assert.equal(fitsDiet(['minced garlic', 'kidney beans', 'beef tomatoes', 'duck sauce', 'vegetable stock cube'], 'vegetarian'), true);
  for (const n of ['honey', 'Clear Honey', 'honeycomb', 'ghee', 'paneer', 'eggs']) assert.equal(fitsDiet([n], 'vegan'), false, n);
  assert.equal(fitsDiet(['chickpeas', 'coconut milk', 'vegan butter'], 'vegan'), true);
});

// The catalogue the first week is built from: dishes that leaked in review
// must stay out for their allergen.
test('catalogue regression: reviewed leaks stay out', () => {
  const raw = JSON.parse(readFileSync(new URL('../../supabase/otto-recipes/raw/themealdb-2026-07.json', import.meta.url), 'utf8'));
  const meals = raw.meals ?? raw;
  const ingredientsOf = (m) => Array.from({ length: 20 }, (_, i) => m[`strIngredient${i + 1}`]).filter((x) => x && x.trim());
  const leaks = [];
  for (const m of meals) {
    const found = allergensIn(ingredientsOf(m));
    const t = m.strMeal;
    if (/carbonara/i.test(t) && !found.has('dairy')) leaks.push(`dairy: ${t}`);
    if (/pilchard|hake/i.test(t) && !found.has('fish')) leaks.push(`fish: ${t}`);
    if (/big mac|prego/i.test(t) && !found.has('gluten')) leaks.push(`gluten: ${t}`);
    if (/hummus/i.test(t) && !found.has('sesame')) leaks.push(`sesame: ${t}`);
  }
  assert.deepEqual(leaks, []);
});
