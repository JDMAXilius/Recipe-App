// "Waiting for approval" (R2.2): a purchase that returned pending (Ask to Buy)
// is remembered for 48 hours so the launch opens the waiting screen, not the
// paywall again. Cleared when the entitlement arrives or the person chooses
// another way.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kv } from '@/shared/storage';

const KEY = ['purchase-pending'] as const;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export const pendingStillOpen = (raw: unknown, now: number) =>
  typeof raw === 'number' && now - raw >= 0 && now - raw < MAX_AGE_MS;

export function usePurchasePending() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => pendingStillOpen(await kv.get<unknown>('purchasePending', null), Date.now()),
    networkMode: 'always',
    staleTime: 0,
  });
  const set = async (on: boolean) => {
    if (on) await kv.set('purchasePending', Date.now());
    else await kv.remove('purchasePending');
    await qc.invalidateQueries({ queryKey: KEY });
  };
  return { pending: query.data ?? false, known: query.isSuccess && query.isFetchedAfterMount, set };
}
