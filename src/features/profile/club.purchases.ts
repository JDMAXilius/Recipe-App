// Otto Club purchase state — the one hook the paywall consumes. Wraps
// RevenueCat: current offering (yearly/monthly packages), live membership via
// the customer-info listener, and buy/restore actions. If offerings can't load
// (no products configured yet, store down, offline) the screen falls back to
// its honest "opens soon" state — never a broken buy button.
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { hasClubEntitlement, introTrialDays } from './club.logic';

// 'unconfirmed' = Apple finished but RevenueCat hasn't granted `club` yet, even
// after a sync. Never call that a success: the 2026-10-02 sandbox test charged a
// trial and unlocked nothing, while the old code said "Welcome to the Club".
export type BuyResult = 'ok' | 'unconfirmed' | 'pending' | 'cancelled' | { error: string };
/** 'none' = nothing to restore on this Apple ID; error carries the RevenueCat code. */
export type RestoreResult = 'ok' | 'none' | { error: string };

// A purchase can complete at Apple while RevenueCat's copy of it lags or failed to
// post. Pull Apple's transactions into RevenueCat and re-read before giving up.
async function syncedInfo(): Promise<CustomerInfo | null> {
  try {
    return (await Purchases.syncPurchasesForResult()).customerInfo;
  } catch {
    return null;
  }
}

// The one place the RevenueCat key lives (_layout configures with it). Public
// App Store SDK key — safe to ship in the binary.
export const RC_API_KEY = 'appl_BUeOnXkZitkSNMjkCbkTJxicpaN';

// Apple's own subscription sheet in-app; Apple's web page if it can't open.
// Account's Otto Club row and the delete-account alert both route here.
const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
export function openManageSubscriptions(): void {
  void Purchases.showManageSubscriptions().catch(() =>
    Linking.openURL(MANAGE_SUBSCRIPTIONS_URL).catch(() => {}),
  );
}

/**
 * Membership alone — no offerings fetch. Every gated screen in the app mounts
 * this, and `getOfferings()` is a network call the gates have no use for: they
 * ask one question, "is this person a member?", which the customer-info
 * listener already answers locally and keeps fresh after a purchase or a
 * restore. `useClub()` (the paywall's hook) is the one that needs products.
 */
export function useMembership(): { member: boolean; known: boolean; failed: boolean } {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // RevenueCat answers from its on-device cache when offline, so a member who
    // has opened Otto before is never locked out by a network blip. Only a
    // fresh install with no network fails — and that fails CLOSED onto the
    // paywall (Try again / Restore), never into the app (hard paywall, 2026-10-04).
    Purchases.getCustomerInfo()
      .then((i) => alive && setInfo(i))
      .catch(() => alive && setFailed(true));
    const listener = (i: CustomerInfo) => {
      setInfo(i);
      setFailed(false);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      alive = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return { member: hasClubEntitlement(info), known: info !== null || failed, failed };
}

export function useClub() {
  const [yearly, setYearly] = useState<PurchasesPackage | null>(null);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    Purchases.getOfferings()
      .then((offerings) => {
        if (!alive) return;
        setYearly(offerings.current?.annual ?? null);
        setMonthly(offerings.current?.monthly ?? null);
        setFailed(!offerings.current?.annual || !offerings.current?.monthly);
      })
      .catch(() => alive && setFailed(true)); // offline / store down → retry state
    Purchases.getCustomerInfo().then((i) => alive && setInfo(i)).catch(() => {});
    const listener = (i: CustomerInfo) => setInfo(i);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      alive = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [attempt]);

  const buy = useCallback(async (pkg: PurchasesPackage): Promise<BuyResult> => {
    setPurchasing(true);
    try {
      let customerInfo: CustomerInfo | null = (await Purchases.purchasePackage(pkg)).customerInfo;
      if (!hasClubEntitlement(customerInfo)) customerInfo = (await syncedInfo()) ?? customerInfo;
      setInfo(customerInfo);
      return hasClubEntitlement(customerInfo) ? 'ok' : 'unconfirmed';
    } catch (e) {
      const err = e as { userCancelled?: boolean; code?: string; readableErrorCode?: string; message?: string };
      if (err.userCancelled) return 'cancelled';
      if (err.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
      // The charge may have gone through even though the call failed: check once.
      const synced = await syncedInfo();
      if (synced) setInfo(synced);
      if (hasClubEntitlement(synced)) return 'ok';
      console.warn('[club] purchase failed', err.code, err.readableErrorCode, err.message);
      return { error: err.code ?? 'unknown' };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<RestoreResult> => {
    try {
      let customerInfo: CustomerInfo | null = await Purchases.restorePurchases();
      if (!hasClubEntitlement(customerInfo)) customerInfo = (await syncedInfo()) ?? customerInfo;
      setInfo(customerInfo);
      return hasClubEntitlement(customerInfo) ? 'ok' : 'none';
    } catch (e) {
      // A restore can fail for a reason worth naming (the subscription belongs
      // to another Otto account, no network) — "nothing found" would be a lie.
      const err = e as { code?: string; message?: string };
      console.warn('[club] restore failed', err.code, err.message);
      return { error: err.code ?? 'unknown' };
    }
  }, []);

  return {
    member: hasClubEntitlement(info),
    yearly,
    monthly,
    // trial length comes from the store's intro offer (yearly is the preselected
    // plan); null = no trial configured
    trialDays: introTrialDays(yearly?.product.introPrice),
    live: Boolean(yearly && monthly),
    purchasing,
    failed,
    reload: () => {
      setFailed(false);
      setAttempt((n) => n + 1);
    },
    buy,
    restore,
  };
}
