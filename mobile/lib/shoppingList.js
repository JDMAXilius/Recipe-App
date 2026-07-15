// Shopping list engine (roadmap Phase 4): ONE row per ingredient with summed
// quantities + provenance. Deterministic — parseMeasure canonicalizes units,
// same-unit amounts sum, mixed units list honestly side by side.
import { parseMeasure, formatQty } from "./ingredientParser";

export const AISLES = [
  "Produce",
  "Meat & fish",
  "Dairy & eggs",
  "Bakery",
  "Pantry",
  "Spices",
  "Other",
];

// Order matters: pantry phrases first ("chicken stock" is Pantry, not Meat).
const AISLE_RULES = [
  {
    aisle: "Pantry",
    words: ["stock", "broth", "sauce", "paste", "canned", "tinned", "flour", "sugar", "rice", "pasta", "noodle", "spaghetti", "lasagna sheet", "lasagne", "oil", "vinegar", "bean", "lentil", "chickpea", "coconut milk", "honey", "syrup", "oats", "cereal", "cornstarch", "corn starch", "baking", "yeast", "breadcrumb", "wine", "sherry", "mirin", "soy", "worcestershire", "mustard", "ketchup", "mayo", "peanut butter", "jam", "chocolate", "cocoa", "vanilla", "nut", "almond", "walnut", "cashew", "raisin", "sultana", "date", "tomato purée", "tomato puree", "passata"],
  },
  {
    aisle: "Meat & fish",
    words: ["chicken", "beef", "pork", "lamb", "sausage", "bacon", "fish", "salmon", "tuna", "cod", "prawn", "shrimp", "turkey", "beef mince", "pork mince", "mincemeat", "steak", "ham", "chorizo", "anchov", "duck", "veal", "meatball"],
  },
  {
    aisle: "Dairy & eggs",
    words: ["milk", "butter", "cheese", "cream", "yogurt", "yoghurt", "egg", "mozzarella", "parmesan", "cheddar", "ricotta", "feta", "crème", "creme fraiche"],
  },
  {
    aisle: "Bakery",
    words: ["bread", "tortilla", "bun", "pita", "naan", "baguette", "roll", "croissant", "wrap"],
  },
  {
    aisle: "Spices",
    words: ["salt", "black pepper", "white pepper", "paprika", "cumin", "oregano", "cinnamon", "nutmeg", "turmeric", "curry powder", "chilli powder", "chili powder", "cayenne", "coriander seed", "fennel seed", "bay lea", "thyme", "rosemary", "sage", "allspice", "clove", "cardamom", "garam masala", "italian seasoning", "seasoning", "dried"],
  },
  {
    aisle: "Produce",
    words: ["onion", "garlic", "carrot", "tomato", "potato", "pepper", "lettuce", "spinach", "broccoli", "lemon", "lime", "apple", "banana", "parsley", "basil", "coriander", "cilantro", "ginger", "mushroom", "celery", "zucchini", "courgette", "cucumber", "avocado", "chilli", "chili", "scallion", "spring onion", "leek", "cabbage", "kale", "berry", "orange", "aubergine", "eggplant", "squash", "pumpkin", "corn", "pea", "green bean", "cauliflower", "radish", "beet", "herb", "mint", "dill", "chive", "shallot", "salad"],
  },
];

export function aisleFor(name) {
  const hay = ` ${name.toLowerCase()} `;
  for (const rule of AISLE_RULES) {
    if (rule.words.some((w) => hay.includes(w))) return rule.aisle;
  }
  return "Other";
}

const keyFor = (name) =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Pluralize display units the same way scaledIngredient does.
const PLURAL_UNITS = new Set(["cup", "clove", "can", "slice", "pound", "stick"]);
const displayAmount = (qty, unit) => {
  if (qty == null) return "";
  const q = formatQty(qty);
  if (!unit) return q;
  const plural = qty > 1 && PLURAL_UNITS.has(unit) ? "s" : "";
  return `${q} ${unit}${plural}`;
};

// recipes: [{ id, title, ingredientPairs: [{measure, name}] }]
// → items grouped one-per-ingredient, in AISLES order, stable within aisle.
export function buildShoppingList(recipes) {
  const map = new Map();
  for (const recipe of recipes) {
    for (const pair of recipe.ingredientPairs || []) {
      const name = (pair.name || "").trim();
      if (!name) continue;
      const key = keyFor(name);
      if (!key) continue;
      let item = map.get(key);
      if (!item) {
        item = { key, name, aisle: aisleFor(key), entries: [], sources: [] };
        map.set(key, item);
      }
      const parsed = parseMeasure(pair.measure);
      item.entries.push({ qty: parsed.qty, unit: parsed.unit, raw: (pair.measure || "").trim() });
      if (!item.sources.includes(recipe.title)) item.sources.push(recipe.title);
    }
  }

  const items = [];
  for (const item of map.values()) {
    const units = new Set(item.entries.map((e) => e.unit ?? "(count)"));
    const allQty = item.entries.every((e) => e.qty != null);
    let amount;
    if (units.size === 1 && allQty) {
      const total = item.entries.reduce((sum, e) => sum + e.qty, 0);
      amount = displayAmount(total, item.entries[0].unit);
    } else {
      // mixed units / unparseable — list honestly, never fake a sum
      const raws = [...new Set(item.entries.map((e) => e.raw).filter(Boolean))];
      amount = raws.join(" + ");
    }
    items.push({
      key: item.key,
      name: item.name,
      aisle: item.aisle,
      amount,
      sources: item.sources,
    });
  }

  items.sort((a, b) => AISLES.indexOf(a.aisle) - AISLES.indexOf(b.aisle));
  return items;
}
