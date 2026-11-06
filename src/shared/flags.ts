// Build-time feature flags (rework roadmap R0.7). One place, read once.
// EXPO_PUBLIC_* values are inlined by Metro at build time, so a flag is fixed
// for a build: set it per EAS environment, never at runtime.
//
// flowV2: the rework (Snap a meal, yield/serving units, free-list plan). Off in
// production until its migrations are applied; on in development.
export const flags = {
  flowV2: process.env.EXPO_PUBLIC_FLOW_V2 === 'true',
} as const;
