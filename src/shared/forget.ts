// Forget the last person (S1): sign-out, account deletion and an account
// switch leave nothing of theirs on the phone. Keys are listed here; parts of
// the app that hold a copy in memory register a reset with onForget.
//
import { kv, type StoreKey } from './storage';

/** Kept on purpose: the phone's, not the person's ("onboarded" = this phone
 *  has been used; rcSynced only skips a RevenueCat sync per uid; reminder
 *  settings are the phone's, the scheduled reminders are cancelled). The events
 *  queue is dropped by track.ts in its own order. forget.test.mjs fails when
 *  a new key isn't in one of the three lists. */
export const KEPT: StoreKey[] = ['notifPrefs', 'unitSystem', 'soundsEnabled', 'firstSaveCelebrated', 'reviewPrompt', 'onboarded', 'deviceId', 'rcSynced', 'eventsQueue'];

/** The person's data: cleared on every sign-out, and on a signed-out launch. */
export const PERSONAL: StoreKey[] = ['prefs', 'journal', 'chats', 'cookRatings', 'aiConsentOpenAI', 'shoppingState', 'household', 'householdRecent', 'purchasePending'];

/** Waiting for the NEXT account (draft week, remembered link, queued events):
/** Waiting for the NEXT account (draft week, remembered link): cleared only
 *  when a signed-in person leaves, never on a signed-out launch. */
export const HANDOVER: StoreKey[] = ['onboardingDraft', 'intent'];

const resets = new Set<() => void | Promise<void>>();

export function onForget(reset: () => void | Promise<void>): () => void {
  resets.add(reset);
  return () => {
    resets.delete(reset);
  };
}

export async function forgetPersonalData({ personLeft }: { personLeft: boolean }): Promise<void> {
  const keys = personLeft ? [...PERSONAL, ...HANDOVER] : PERSONAL;
  await Promise.all(keys.map((k) => kv.remove(k)));
  await Promise.all([...resets].map(async (r) => {
    try {
      await r();
    } catch {
      // one reset failing must not keep the rest from running
    }
  }));
}
