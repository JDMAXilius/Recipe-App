// Otto Club purchase state — the one hook the paywall consumes. Wraps
// RevenueCat: current offering (yearly/monthly packages), live membership via
// the customer-info listener, and buy/restore actions. If offerings can't load
// (no products configured yet, store down, offline) the screen falls back to
// its honest "opens soon" state — never a broken buy button.
import { useCallback, useEffect, useState } from 'react';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { hasClubEntitlement, introTrialDays } from './club.logic';

export type BuyResult = 'ok' | 'cancelled' | 'error';

// The one place the RevenueCat key lives (_layout configures with it). While
// it's the Test Store key, its canned demo products carry fake prices — the
// paywall shows our real launch pricing instead and only trusts store prices
// once the real appl_ key replaces this.
export const RC_API_KEY = 'test_oSJcFKqwFPgFgcamzVtQcfdrYrV';
export const RC_TEST_STORE = RC_API_KEY.startsWith('test_');

/**
 * Membership alone — no offerings fetch. Every gated screen in the app mounts
 * this, and `getOfferings()` is a network call the gates have no use for: they
 * ask one question, "is this person a member?", which the customer-info
 * listener already answers locally and keeps fresh after a purchase or a
 * restore. `useClub()` (the paywall's hook) is the one that needs products.
 */
export function useMembership(): { member: boolean } {
  const [info, setInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    let alive = true;
    Purchases.getCustomerInfo()
      .then((i) => alive && setInfo(i))
      .catch(() => {}); // offline / not configured → treat as not a member
    const listener = (i: CustomerInfo) => setInfo(i);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      alive = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return { member: hasClubEntitlement(info) };
}

export function useClub() {
  const [yearly, setYearly] = useState<PurchasesPackage | null>(null);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let alive = true;
    Purchases.getOfferings()
      .then((offerings) => {
        if (!alive) return;
        setYearly(offerings.current?.annual ?? null);
        setMonthly(offerings.current?.monthly ?? null);
      })
      .catch(() => {}); // no offerings → opens-soon fallback
    Purchases.getCustomerInfo().then((i) => alive && setInfo(i)).catch(() => {});
    const listener = (i: CustomerInfo) => setInfo(i);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      alive = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const buy = useCallback(async (pkg: PurchasesPackage): Promise<BuyResult> => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setInfo(customerInfo);
      return 'ok';
    } catch (e) {
      return (e as { userCancelled?: boolean }).userCancelled ? 'cancelled' : 'error';
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setInfo(customerInfo);
      return hasClubEntitlement(customerInfo);
    } catch {
      return false;
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
    buy,
    restore,
  };
}
