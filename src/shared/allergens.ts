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
// Word-start match: "\bpecorino" hits "Pecorino Romano"; words that live
// inside others (flatbread, catfish) are listed whole.
const w = (words: string) => new RegExp(`\\b(?:${words})`, 'i');

// Generic "nuts" counts as BOTH nut allergens: the label can't say which.
const NUTS_GENERIC = 'mixed nuts|nuts?\\b|nut oil|nut butter';

const RULES: Record<Allergen, Rule> = {
  peanut: { include: w(`peanut|ground ?nut|satay|monkey nut|${NUTS_GENERIC}`) },
  treeNut: {
    include: w(
      `nougat|almond|walnut|cashew|pecan|pistachio|hazel ?nut|hazlenut|macadamia|brazil nut|pine ?nut|chestnut|praline|marzipan|frangipane|pesto|nutella|amaretti|${NUTS_GENERIC}`,
    ),
    exclude: w('water chestnut|coconut|nutmeg|butternut|ground ?nut|peanut'),
  },
  dairy: {
    include: w(
      'pesto|malai|leche|chocolate|toffee|fudge|caramel sauce|knafeh|mars bar|milk|cream|butter|cheese|yogh?urt|ghee|parmesan|parmigiano|pecorino|grana padano|mozzarella|burrata|cheddar|feta|ricotta|mascarpone|halloumi|paneer|gruy[eè]re|emmental|gouda|edam|brie|camembert|manchego|gorgonzola|stilton|roquefort|queso|fromage|labneh|kefir|cr[eè]me|custard|whey|quark|curd|lassi|raita|tzatziki|b[eé]chamel',
    ),
    exclude: w('coconut (?:milk|cream)|almond milk|oat milk|soy milk|soya milk|rice milk|peanut butter|almond butter|cashew butter|nut butter|cocoa butter|butternut|butter ?beans?|cream of tartar|bean curd|lemon curd|vegan'),
  },
  egg: { include: w('a[iï]oli|mars bar|eggs?\\b|egg yolk|egg white|egg noodle|mayonnaise|mayo\\b|meringue|aioli|hollandaise|b[eé]arnaise|brioche|custard|fresh pasta'), exclude: w('eggplant') },
  gluten: {
    include: w(
      'gravy|toast\\b|cookie|rice krispies|pudding|mincemeat|knafeh|sevai|vermicelli|mixed grain|farine|gochujang|mars bar|flour|wheat|bread|flatbread|shortbread|gingerbread|breadcrumb|panko|pasta|spaghetti|linguine|fettuccine|tagliatelle|pappardelle|penne|rigatoni|farfalle|fusilli|conchiglie|orecchiette|macaroni|lasagne|lasagna|ravioli|tortellini|cannelloni|noodle|udon|ramen|soba|couscous|cous cous|bulgh?ur|freekeh|barley|rye|spelt|semolina|oats?\\b|oatmeal|porridge|tortilla|wrap\\b|pastry|filo|phyllo|soy sauce|hoisin|teriyaki|oyster sauce|beer|ale\\b|stout|malt|shaoxing|seitan|pitta|pita|naan|chapati|roti|paratha|cracker|biscuit|brioche|bagel|croissant|baguette|ciabatta|focaccia|sourdough|bun\\b|buns\\b|roll\\b|rolls\\b|muffin|crumpet|pretzel|crouton|dumpling|wonton|gyoza|gnocchi|orzo|stuffing|suet|cake|sponge',
    ),
    exclude: w('rice flour|rice cake|rice vermicelli|vermicelli rice|corn ?flour|cornstarch|potato starch|almond flour|coconut flour|gram flour|chickpea flour|buckwheat flour|tapioca|rice noodle|glass noodle|rice vermicelli|rice paper|gluten[- ]free|tamari|corn tortilla|spring roll wrappers? \\(rice|cabbage roll'),
  },
  shellfish: {
    include: w('conchs?|shrimp paste|chilli jam|shellfish|seafood|prawn|shrimp|crab|lobster|mussel|clam|oyster|scallop|crayfish|langoustine|squid|calamari|octopus|cockle|whelk|krill|(?:thai )?(?:red|green|yellow|massaman|panang) curry paste'),
  },
  fish: {
    include: w(
      'codfish|saltfish|salt cod|barramundi|prahok|shrimp paste|chilli jam|fish|catfish|monkfish|seafood|salmon|tuna|cod\\b|haddock|hake|pollock|coley|anchov|sardine|pilchard|sprat|mackerel|trout|tilapia|halibut|turbot|plaice|sea ?bass|bream|snapper|dory|kipper|herring|whitebait|swordfish|eel\\b|worcestershire|caviar|roe\\b|bonito|dashi|nam pla|(?:thai )?(?:red|green|yellow|massaman|panang) curry paste',
    ),
  },
  soy: { include: w('fermented black bean|gochujang|mars bar|soy|soya|tofu|tempeh|edamame|miso|tamari|hoisin|teriyaki|kecap|black bean sauce|bean paste|doubanjiang|bean curd|natto') },
  sesame: { include: w('sesame|tahini|tahina|halva|hummus|houmous|hummous|za.?atar|furikake|gomashio') },
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
  'meat|chicken|frogs?\\b|trotters?|morcilla|kabanos|jam[oó]n|shank|chuck roast|mincemeat|beef|pork|lamb|mutton|bacon|ham\\b|gammon|sausage|chorizo|kielbasa|salami|pepperoni|prosciutto|pancetta|pastrami|turkey|duck|goose|veal|venison|rabbit|pheasant|quail|goat\\b|mince\\b|meatball|steak|brisket|oxtail|ribs?\\b|liver|kidneys?\\b|black pudding|haggis|gelatine?|lard|dripping|suet|stock cube|bouillon|bone broth',
);
const MEAT_EXCEPT = w('vegetable stock|veg stock|vegan|vegetarian|plant[- ]based|meat[- ]free|mushroom stock|kidney beans?|beef tomato|duck sauce|minced (?:garlic|ginger|onion|shallot)|nutmeg|vegetable suet');

// Catalogue categories that are meat or fish whatever the ingredients say.
const MEAT_CATEGORIES = new Set(['Beef', 'Chicken', 'Lamb', 'Pork', 'Goat', 'Seafood', 'Miscellaneous meat']);

export type Diet = 'none' | 'vegetarian' | 'vegan';

/** Does a dish fit the diet? A meat or fish category, or any meat, fish or
 *  shellfish ingredient, rules out vegetarian; vegan also rules out dairy,
 *  eggs and honey. A meat-free category is not trusted on its own. */
export function fitsDiet(ingredientNames: readonly string[], diet: Diet, category?: string | null): boolean {
  if (diet === 'none') return true;
  if (category && MEAT_CATEGORIES.has(category)) return false;
  const all = ingredientNames.join(' | ');
  const meaty = ingredientNames.some((n) => MEAT.test(n) && !MEAT_EXCEPT.test(n));
  const a = allergensIn(ingredientNames);
  if (meaty || a.has('fish') || a.has('shellfish')) return false;
  if (diet === 'vegan') return !a.has('dairy') && !a.has('egg') && !/\bhoney/i.test(all);
  return true;
}
