// Crash-report scrubbing — pure, so node --test can pin it (monitoring.logic.test.mjs).
//
// The App Privacy label says Otto collects Crash Data that is NOT linked to the
// person. These rules keep that true: no user, no request, no URL that could
// carry an id, no breadcrumb text someone typed.

// Structural subsets of Sentry's Event/Breadcrumb — enough to scrub, no SDK import.
export interface ScrubbableEvent {
  user?: unknown;
  request?: unknown;
  server_name?: unknown;
  breadcrumbs?: ScrubbableBreadcrumb[];
}
export interface ScrubbableBreadcrumb {
  category?: string;
  type?: string;
  message?: string;
  data?: unknown;
}

// Network breadcrumbs carry Supabase URLs like /rest/v1/plan_entries?user_id=eq.<uid>;
// console breadcrumbs can carry anything; UI input breadcrumbs carry typed text.
const DROPPED_CATEGORIES = new Set(['xhr', 'fetch', 'http', 'console', 'ui.input']);

export function keepBreadcrumb(crumb: ScrubbableBreadcrumb): boolean {
  if (crumb.type === 'http') return false;
  return !DROPPED_CATEGORIES.has(crumb.category ?? '');
}

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  const out = { ...event };
  delete out.user;
  delete out.request;
  delete out.server_name;
  if (out.breadcrumbs) out.breadcrumbs = out.breadcrumbs.filter(keepBreadcrumb);
  return out;
}
