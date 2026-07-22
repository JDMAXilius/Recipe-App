// Branded recipe ids (docs/contracts/engine.md §Data shapes).
// SeedId: numeric content ("52772") — keys recipeFacts.json and seed_nutrition.
// UserRecipeId: "u-" prefixed — user-created recipes, never in recipeFacts.
// Constructors VALIDATE; an invalid string throws rather than silently brands.

export type SeedId = string & { readonly __brand: "SeedId" };
export type UserRecipeId = string & { readonly __brand: "UserRecipeId" };

export function toSeedId(value: string | number): SeedId {
  const s = String(value);
  if (!/^\d+$/.test(s)) throw new Error(`invalid SeedId: ${JSON.stringify(value)}`);
  return s as SeedId;
}

export function toUserRecipeId(value: string): UserRecipeId {
  if (!/^u-.+$/.test(value)) throw new Error(`invalid UserRecipeId: ${JSON.stringify(value)}`);
  return value as UserRecipeId;
}
