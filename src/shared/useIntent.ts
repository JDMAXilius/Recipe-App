// The intent store on the phone (kv 'intent'), for app/index.tsx: remember the
// link that brought someone in while the app can't open it yet, and hand it
// back once it can (R0.2). Pure rules in intent.ts.
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { kv } from './storage';
import { remember, stillWanted } from './intent';

/** `canOpen`: the launch says the app is open to this person. Returns the
 *  href to open (taken, so it opens once), null for none, undefined while reading. */
export function useIntent(canOpen: boolean): string | null | undefined {
  const url = Linking.useURL();
  const [href, setHref] = useState<string | null | undefined>(undefined);

  // A link that arrives while the app can't open it yet is remembered.
  useEffect(() => {
    if (canOpen) return;
    // Linking.parse handles both the app scheme and the dev client's exp:// URL.
    const path = url ? Linking.parse(url).path : null;
    const intent = remember(path ? `/${path}` : null, Date.now());
    if (intent) void kv.set('intent', intent);
  }, [url, canOpen]);

  useEffect(() => {
    if (!canOpen) return;
    let alive = true;
    void kv.get<unknown>('intent', null).then(async (raw) => {
      const wanted = stillWanted(raw, Date.now());
      if (raw) await kv.remove('intent');
      if (alive) setHref(wanted);
    });
    return () => {
      alive = false;
    };
  }, [canOpen]);

  return canOpen ? href : null;
}
