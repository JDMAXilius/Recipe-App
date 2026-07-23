// Branded recipe ids (docs/contracts/engine.md §Data shapes).
// SeedId: numeric content ("52772") — keys recipeFacts.json and seed_nutrition.
// UserRecipeId: "u-" prefixed — user-created recipes, never in recipeFacts.
// Constructors VALIDATE; an invalid string throws rather than silently brands.

export type SeedId = string & { readonly __brand: "SeedId" };
export type UserRecipeId = string & { readonly __brand: "UserRecipeId" };
// auth.users.id (a UUID) — crosses feature lines via useAuth(); brand it so a
// raw string can't be passed where a user id is expected (feature-module.md §5).
export type UserId = string & { readonly __brand: "UserId" };

export function toSeedId(value: string | number): SeedId {
  const s = String(value);
  if (!/^\d+$/.test(s)) throw new Error(`invalid SeedId: ${JSON.stringify(value)}`);
  return s as SeedId;
}

export function toUserRecipeId(value: string): UserRecipeId {
  if (!/^u-.+$/.test(value)) throw new Error(`invalid UserRecipeId: ${JSON.stringify(value)}`);
  return value as UserRecipeId;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function toUserId(value: string): UserId {
  if (!UUID_RE.test(value)) throw new Error(`invalid UserId: ${JSON.stringify(value)}`);
  return value as UserId;
}
