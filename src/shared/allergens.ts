// Allergens and diets from ingredient names (R0.6). Pure; `node --test` loads it.
//
// THIS IS A KEYWORD HEURISTIC, NOT A SAFETY CHECK (docs/product/ALLERGEN_COVERAGE.md).
// It can miss hidden sources (stock cubes with wheat, seasoning with soy,
// cross-contact) and can over-flag. Otto filters as a convenience and always
// says so (LEAVE_OUT_NOTE); it never shows "allergen-free" or "safe for".
// The production path is a person-reviewed allergen tag on each of the ~970
// ingredient keys; this list then becomes the lint that flags new keys.

export const ALLERGENS = [
  { key: 'peanut', label: 'Peanuts' },
  { key: 'treeNut', label: 'Tree nuts' },
  { key: 'dairy', label: 'Milk' },
  { key: 'egg', label: 'Eggs' },
  { key: 'gluten', label: 'Wheat / gluten' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'fish', label: 'Fish' },
  { key: 'soy', label: 'Soy' },
  { key: 'sesame', label: 'Sesame' },
] as const;
export type Allergen = (typeof ALLERGENS)[number]['key'];

export const LEAVE_OUT_NOTE = 'Otto will leave these out. Always check labels.';

type Rule = { include: RegExp; exclude?: RegExp };
const w = (words: string) => new RegExp(`\\b(?:${words})`, 'i');

const RULES: Record<Allergen, Rule> = {
  peanut: { include: w('peanut|groundnut|satay') },
  treeNut: {
    include: w('almond|walnut|cashew|pecan|pistachio|hazelnut|macadamia|brazil nut|pine nut|chestnut|praline|marzipan|frangipane'),
  },
  dairy: {
    include: w(
      'milk|cream|butter|cheese|yogh?urt|ghee|parmesan|parmigiano|mozzarella|cheddar|feta|ricotta|mascarpone|halloumi|paneer|gruy[eè]re|brie|camembert|cr[eè]me fra[iî]che|custard|whey|quark',
    ),
    exclude: w('coconut (?:milk|cream)|almond milk|oat milk|soy milk|soya milk|rice milk|peanut butter|almond butter|cocoa butter|butternut|butter ?beans?|cream of tartar|vegan'),
  },
  egg: { include: w('eggs?\\b|egg yolk|egg white|mayonnaise|mayo\\b|meringue|aioli'), exclude: w('eggplant') },
  gluten: {
    include: w(
      'flour|wheat|bread|breadcrumb|panko|pasta|spaghetti|linguine|fettuccine|tagliatelle|penne|macaroni|lasagne|lasagna|noodle|couscous|bulgur|barley|rye|semolina|tortilla|pastry|filo|phyllo|soy sauce|beer|ale\\b|seitan|pitta|pita|naan|cracker|biscuit|brioche|bagel|croissant|dumpling|gnocchi|orzo',
    ),
    exclude: w('rice flour|corn ?flour|cornstarch|almond flour|coconut flour|gram flour|chickpea flour|buckwheat|rice noodle|glass noodle|gluten[- ]free|tamari|corn tortilla'),
  },
  shellfish: { include: w('shellfish|prawn|shrimp|crab|lobster|mussel|clam|oyster|scallop|crayfish|langoustine|squid|calamari|octopus|cockle') },
  fish: {
    include: w(
      'fish|salmon|tuna|cod\\b|haddock|anchov|sardine|mackerel|trout|tilapia|halibut|sea bass|monkfish|kipper|pollock|snapper|bream|herring|swordfish|worcestershire|caviar|roe\\b',
    ),
  },
  soy: { include: w('soy|soya|tofu|tempeh|edamame|miso|tamari') },
  sesame: { include: w('sesame|tahini|halva') },
};

export function allergensIn(ingredientNames: readonly string[]): Set<Allergen> {
  const found = new Set<Allergen>();
  for (const name of ingredientNames) {
    for (const [allergen, rule] of Object.entries(RULES) as [Allergen, Rule][]) {
      if (rule.include.test(name) && !rule.exclude?.test(name)) found.add(allergen);
    }
  }
  return found;
}

// --- diets ----------------------------------------------------------------

const MEAT = w(
  'chicken|beef|pork|lamb|mutton|bacon|ham\\b|sausage|turkey|duck|veal|mince|chorizo|prosciutto|pancetta|salami|pepperoni|gelatin|lard|goat\\b|venison|rabbit|steak|brisket|oxtail|liver|kidney|suet|stock cube|bouillon',
);
const MEAT_EXCEPT = w('vegetable stock|veg stock|vegan|plant[- ]based|mushroom stock');

export type Diet = 'none' | 'vegetarian' | 'vegan';

/** Does a dish fit the diet? Meat, fish and shellfish rule out vegetarian;
 *  vegan also rules out dairy, eggs and honey. A meat-free category is not
 *  trusted on its own: its ingredients must agree. */
export function fitsDiet(ingredientNames: readonly string[], diet: Diet): boolean {
  if (diet === 'none') return true;
  const all = ingredientNames.join(' | ');
  const meaty = ingredientNames.some((n) => MEAT.test(n) && !MEAT_EXCEPT.test(n));
  const a = allergensIn(ingredientNames);
  if (meaty || a.has('fish') || a.has('shellfish')) return false;
  if (diet === 'vegan') return !a.has('dairy') && !a.has('egg') && !/\bhoney\b/i.test(all);
  return true;
}
