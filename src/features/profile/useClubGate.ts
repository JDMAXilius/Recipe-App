// useClubGate() — the one place a free-tier limit is enforced in the UI.
//
// Two calls, not one, and the split is deliberate: `check()` asks whether the
// action may proceed, `spend()` records that it did. An import that fails
// (dead link, unreadable photo, Otto having a bad day) must not cost someone
// one of their five — charging for a failure is the kind of thing people
// screenshot. So the caller checks first and spends only on success.
//
// Saves are NOT handled here. They are counted from the saved rows themselves
// inside `useSaved()`, which is where every save in the app already routes;
// gating them here would mean importing cookbook from profile while cookbook
// imports profile, and a cycle is a worse bug than the duplication it saves.
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from '@/shared/ui';
import { kv } from '@/shared/storage';
import { useMembership } from './club.purchases';
import {
  allowed,
  blockedMessage,
  bump,
  emptyUsage,
  remaining,
  type ClubUsage,
  type GateKind,
} from './club.limits';

/** Kinds this hook owns. 'save' lives in useSaved() — see the note above. */
export type CountedKind = Extract<GateKind, 'import' | 'ask'>;

async function readUsage(): Promise<ClubUsage> {
  return kv.get<ClubUsage>('clubUsage', emptyUsage);
}

export interface ClubGate {
  member: boolean;
  /** True if the action may go ahead. Toasts + offers the paywall if not. */
  check: (kind: CountedKind) => Promise<boolean>;
  /** Record a successful use. Members are free, so this is a no-op for them. */
  spend: (kind: CountedKind) => Promise<void>;
  /** How many are left right now — for "2 imports left this month" copy. */
  left: (kind: CountedKind) => Promise<number>;
}

export function useClubGate(): ClubGate {
  const { member } = useMembership();
  const router = useRouter();
  const toast = useToast();

  const check = useCallback(
    async (kind: CountedKind) => {
      if (member) return true;
      const usage = await readUsage();
      if (allowed(kind, { member, usage, savedCount: 0, now: new Date() })) return true;
      // Not a redirect: the person asked for something else, and hijacking the
      // screen to a paywall is how freemium turns into a hard gate. The offer
      // rides the toast and they take it or they don't.
      toast.show(blockedMessage(kind), 'info', {
        actionLabel: 'See Otto Club',
        onAction: () => router.push('/otto-club'),
      });
      return false;
    },
    [member, router, toast],
  );

  const spend = useCallback(
    async (kind: CountedKind) => {
      if (member) return;
      const usage = await readUsage();
      await kv.set('clubUsage', bump(kind, usage, new Date()));
    },
    [member],
  );

  const left = useCallback(
    async (kind: CountedKind) =>
      remaining(kind, { member, usage: await readUsage(), savedCount: 0, now: new Date() }),
    [member],
  );

  return { member, check, spend, left };
}
