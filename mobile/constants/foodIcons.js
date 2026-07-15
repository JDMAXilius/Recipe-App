// Hand-painted Otto-style food icons, one per TheMealDB category (D5).
// Source art: mobile/assets/food/ — see docs/DESIGN_SYSTEM.md B5.1.

export const FOOD_ICONS = {
  Beef: require("../assets/food/cat-beef.webp"),
  Breakfast: require("../assets/food/cat-breakfast.webp"),
  Chicken: require("../assets/food/cat-chicken.webp"),
  Dessert: require("../assets/food/cat-dessert.webp"),
  Goat: require("../assets/food/cat-goat.webp"),
  Lamb: require("../assets/food/cat-lamb.webp"),
  Miscellaneous: require("../assets/food/cat-miscellaneous.webp"),
  Pasta: require("../assets/food/cat-pasta.webp"),
  Pork: require("../assets/food/cat-pork.webp"),
  Seafood: require("../assets/food/cat-seafood.webp"),
  Side: require("../assets/food/cat-side.webp"),
  Starter: require("../assets/food/cat-starter.webp"),
  Vegan: require("../assets/food/cat-vegan.webp"),
  Vegetarian: require("../assets/food/cat-vegetarian.webp"),
};

export const getFoodIcon = (category) => FOOD_ICONS[category] || FOOD_ICONS.Miscellaneous;
