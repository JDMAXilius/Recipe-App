// Public surface of the share feature (feature-module.md §allowlist).
// ShareCard is the allowlisted cross-feature component recipes' detail renders;
// the rest is what recipes/planner legitimately consume to mint links and
// build share copy. Nothing else leaks.
export { ShareCard, type ShareCardProps } from './ShareCard';
export {
  useRecipeShare,
  useListShare,
  useCreateRecipeShare,
  useCreateListShare,
} from './share.queries';
export { buildRecipeShareText, buildShoppingListShareText } from './shareText';
export type {
  ShareRecipe,
  ShoppingItem,
  ShoppingListState,
  ShareStatus,
  RecipeShareResult,
  ListShareResult,
} from './share.types';
