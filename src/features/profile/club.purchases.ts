// Otto Club purchase state — the one hook the paywall consumes. Wraps
// RevenueCat: current offering (yearly/monthly packages), live membership via
// the customer-info listener, and buy/restore actions. If offerings can't load
// (no products configured yet, store down, offline) the screen falls back to
// its honest "opens soon" state — never a broken buy button.
import { useCallback, useEffect, useState } from 'react';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { hasClubEntitlement, introTrialDays } from './club.logic';

export type BuyResult = 'ok' | 'cancelled' | 'error';

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
