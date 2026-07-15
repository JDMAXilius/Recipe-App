import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Global US/Metric preference — set once in any Ingredients section,
// remembered everywhere (SideChef rule: unit system is a reading preference).
const KEY = "otto.unitSystem.v1";
let cached = null;
const listeners = new Set();

export function useUnitSystem() {
  const [system, setSystemState] = useState(cached || "us");

  useEffect(() => {
    if (cached == null) {
      AsyncStorage.getItem(KEY)
        .then((v) => {
          cached = v === "metric" ? "metric" : "us";
          setSystemState(cached);
        })
        .catch(() => {});
    }
    const listener = (v) => setSystemState(v);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const setSystem = (v) => {
    cached = v;
    listeners.forEach((l) => l(v));
    AsyncStorage.setItem(KEY, v).catch(() => {});
  };

  return [system, setSystem];
}
