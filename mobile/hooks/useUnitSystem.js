import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Global units preference. "weight" (food-scale grams/ml — the default) or
// "us" (classic US cups, the account-screen alternative). Set in the account
// screen only; read everywhere ingredients render.
// Legacy values from the old US/Metric toggle map: "metric" → "weight"
// (metric readers are exactly who weight-first serves), "us" stays "us".
const KEY = "otto.unitSystem.v1";
let cached = null;
const listeners = new Set();

const normalize = (v) => (v === "us" ? "us" : "weight");

export function useUnitSystem() {
  const [system, setSystemState] = useState(cached || "weight");

  useEffect(() => {
    if (cached == null) {
      AsyncStorage.getItem(KEY)
        .then((v) => {
          cached = normalize(v);
          setSystemState(cached);
        })
        .catch(() => {});
    }
    const listener = (v) => setSystemState(v);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const setSystem = (v) => {
    cached = normalize(v);
    listeners.forEach((l) => l(cached));
    AsyncStorage.setItem(KEY, cached).catch(() => {});
  };

  return [system, setSystem];
}
