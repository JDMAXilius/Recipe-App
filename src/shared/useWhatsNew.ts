// The kv side of "What's new" (R8.4): rules in whatsNew.ts.
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { kv } from './storage';
import { releaseOf, shouldShowWhatsNew } from './whatsNew';

const VERSION = Constants.expoConfig?.version ?? null;

/** The current release, for keying notes ("1.1"). */
export const CURRENT_RELEASE = releaseOf(VERSION);

/** Mark this release seen without showing anything (a new install on Welcome). */
export function markReleaseSeen(): void {
  if (VERSION) void kv.set('lastSeenVersion', VERSION);
}

/** visible + close (close marks it seen). hasNotes: the caller has words for this release. */
export function useWhatsNew(hasNotes: boolean): { visible: boolean; close: () => void } {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let alive = true;
    void kv.get<unknown>('lastSeenVersion', null).then((seen) => {
      if (alive && shouldShowWhatsNew(seen, VERSION, hasNotes)) setVisible(true);
    });
    return () => {
      alive = false;
    };
  }, [hasNotes]);
  return {
    visible,
    close: () => {
      setVisible(false);
      markReleaseSeen();
    },
  };
}
