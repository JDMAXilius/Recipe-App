// Product events (R0.8): every name and prop lives in
// docs/product/TRACKING_PLAN.md first, then here. Pure: the queue rules are
// tested in events.test.mjs; the phone queue and the write are in track.ts.
//
// No content goes in props: no recipe text, no answers to the allergy
// question, no free text. Counts, booleans, small enums only.

type Surface = 'reveal' | 'plan' | 'otto' | 'home' | 'list';

export interface EventProps {
  onboarding_started: { variant: string };
  question_answered: { step: 1 | 2 | 3; skipped: boolean };
  first_week_revealed: { ms_since_launch: number; household_size: number; filters_count: number; dinners: number };
  day_swapped: { day_offset: number; surface: Surface };
  plan_saved: { method: 'apple' | 'google' | 'facebook' | 'email' };
  paywall_viewed: { variant: 'generic' | 'your_week'; assigned?: 'generic' | 'your_week' };
  purchase_result: { product: string; result: 'ok' | 'pending' | 'cancelled' | 'error' | 'unconfirmed' };
  shopping_list_opened: { surface: Surface; items: number };
  tonight_card_viewed: { has_plan: boolean };
  cooking_started: { source: 'plan' | 'recipe' | 'otto' };
  item_cooked: { source: 'plan' | 'recipe' | 'otto'; via: 'button' | 'cook_mode' };
  dish_snapped: { ok: boolean; before_account: boolean; questions_asked: number; matched_catalogue: boolean };
  recipe_from_photo_saved: { edited: boolean };
  week_planned_by_otto: { items: number; new_recipes: number; constraints: number };
}
export type EventName = keyof EventProps;

export interface QueuedEvent {
  name: EventName;
  props: Record<string, unknown>;
  at: number; // ms epoch, when it happened
}

export const MAX_QUEUE = 200;
export const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // a buffer nobody signs up for goes

/** Add an event, oldest dropped past the cap, stale ones dropped. */
export function enqueue(queue: readonly QueuedEvent[], e: QueuedEvent, now: number): QueuedEvent[] {
  return [...queue, e].filter((q) => now - q.at <= MAX_AGE_MS).slice(-MAX_QUEUE);
}

/** A stored queue as events we trust: anything malformed is dropped. */
export function readQueue(raw: unknown): QueuedEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (q): q is QueuedEvent =>
      !!q && typeof q === 'object' && typeof q.name === 'string' && /^[a-z][a-z0-9_]{2,40}$/.test(q.name) && typeof q.at === 'number' && !!q.props && typeof q.props === 'object',
  );
}

export function toRows(queue: readonly QueuedEvent[], userId: string, deviceId: string, appVersion: string | null) {
  return queue.map((q) => ({
    user_id: userId,
    device_id: deviceId,
    name: q.name,
    props: q.props as never,
    app_version: appVersion,
    occurred_at: new Date(q.at).toISOString(),
  }));
}
