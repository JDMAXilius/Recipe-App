// track(name, props): queue the event on the phone and write the queue once
// someone is signed in (R0.8). Never throws, never blocks the UI: an event
// that can't be written waits in the queue for the next try. Events from
// before an account are written with the new user right after sign-up;
// a queue nobody signs up for ages out (events.ts MAX_AGE_MS).
import Constants from 'expo-constants';
import { kv } from './storage';
import { supabase } from './supabase/client';
import { enqueue, readQueue, toRows, type EventName, type EventProps, type QueuedEvent } from './events';

const APP_VERSION = Constants.expoConfig?.version ?? null;
/** When this JS bundle started: the clock for ms_since_launch. */
export const LAUNCHED_AT = Date.now();
const BATCH = 50;

let chain: Promise<unknown> = Promise.resolve();
const serial = (job: () => Promise<void>) => {
  chain = chain.then(job, job).catch(() => undefined);
  return chain;
};

const loadQueue = async (): Promise<QueuedEvent[]> => readQueue(await kv.get<unknown>('eventsQueue', []));

async function deviceId(): Promise<string> {
  const known = await kv.get<string | null>('deviceId', null);
  if (typeof known === 'string' && known.length >= 8) return known;
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await kv.set('deviceId', id);
  return id;
}

async function writeQueue(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return; // before the account: keep it for after sign-up
  let queue = await loadQueue();
  const device = await deviceId();
  while (queue.length > 0) {
    const batch = queue.slice(0, BATCH);
    const { error } = await supabase.from('app_events').insert(toRows(batch, userId, device, APP_VERSION));
    if (error) return; // offline or refused: try again on the next event or sign-in
    queue = queue.slice(batch.length);
    await kv.set('eventsQueue', queue);
  }
}

export function track<N extends EventName>(name: N, props: EventProps[N]): void {
  void serial(async () => {
    const now = Date.now();
    await kv.set('eventsQueue', enqueue(await loadQueue(), { name, props: props as Record<string, unknown>, at: now }, now));
    await writeQueue();
  });
}

/** After sign-in or sign-up: write what's waiting. */
export function flushEvents(): void {
  void serial(writeQueue);
}

/** Someone else is about to use the phone: their events aren't the last user's. */
export function dropQueuedEvents(): void {
  void serial(() => kv.remove('eventsQueue'));
}
