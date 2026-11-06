// Build-time feature flags (rework roadmap R0.7). One place, read once.
// EXPO_PUBLIC_* values are inlined by Metro at build time, so a flag is fixed
// for a build: set it per EAS environment, never at runtime.
//
// flowV2: the rework (first run, Snap a meal, yield/serving units, free-list
// plan). Its database columns (20261106042712_recipe_size,
// 20261106042714_plan_list) are applied to production; it stays off in
// shipped builds until the rework release (R10.1).
export const flags = {
  flowV2: process.env.EXPO_PUBLIC_FLOW_V2 === 'true',
} as const;

/** Where Otto AI lives: the trailing Otto tab (flowV2, R3.4) or the old ＋ tab. */
export const ottoHref = (chatId?: string) =>
  `${flags.flowV2 ? '/(tabs)/otto' : '/create'}${chatId ? `?chat=${chatId}` : ''}`;
