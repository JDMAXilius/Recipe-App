// First-run flag, device-local (persistence.md §4). onboarded=null means the kv
// read hasn't landed yet — the gate treats that as "show splash", not "false".
import { useCallback, useEffect, useState } from 'react';
import { kv } from '@/shared/storage';

export function useOnboarded() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    kv.get('onboarded', false).then((v) => {
      if (alive) setOnboarded(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const markOnboarded = useCallback(async () => {
    await kv.set('onboarded', true);
    setOnboarded(true);
  }, []);

  return { onboarded, markOnboarded };
}
