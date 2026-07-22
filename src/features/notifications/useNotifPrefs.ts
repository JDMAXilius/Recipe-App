// The persisted reminder-prefs store — device-local client state, so a module
// store hydrated from `kv` is the right home, not TanStack Query (same shape as
// profile's usePrefs). One writer surface: the Reminders screen.
//
// ponytail: module-state + listener pub/sub. Fine for three scalar prefs read
// on one screen; reach for useSyncExternalStore only if tearing shows up.
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import { DEFAULT_PREFS, type NotifPrefs } from './notifications.logic';

// Validate-before-trust: a corrupt/legacy blob falls back to defaults.
const schema = z.object({
  tonight: z.boolean(),
  hour: z.number().int().min(0).max(23),
  sunday: z.boolean(),
});

let state: NotifPrefs = DEFAULT_PREFS;
const listeners = new Set<() => void>();
let hydrated = false;
const emit = () => listeners.forEach((l) => l());

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  state = await kv.get<NotifPrefs>('notifPrefs', DEFAULT_PREFS, schema);
  emit();
}

// Writes persist best-effort (kv.set swallows failures) and never block the UI.
function save(next: NotifPrefs) {
  state = next;
  void kv.set('notifPrefs', state);
  emit();
}

function setTonight(on: boolean) {
  save({ ...state, tonight: on });
}
function setHour(hour: number) {
  save({ ...state, hour });
}
function setSunday(on: boolean) {
  save({ ...state, sunday: on });
}

const actions = { setTonight, setHour, setSunday } as const;

export type UseNotifPrefs = NotifPrefs & typeof actions;

export function useNotifPrefs(): UseNotifPrefs {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap(state);
    listeners.add(l);
    void hydrate();
    setSnap(state); // catch a hydrate that resolved before this subscribe
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { ...snap, ...actions };
}
