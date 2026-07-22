import React, { useEffect, useMemo, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { colors, radii, space } from '../theme/tokens';

export type ToastKind = 'info' | 'success' | 'error';

type ToastEvent = { message: string; kind: ToastKind };

// Module-level emitter — no context/provider needed; ToastHost subscribes,
// useToast() emits. One host mounted at the app root shows every toast.
const listeners = new Set<(t: ToastEvent) => void>();

export function useToast(): { show: (message: string, kind: ToastKind) => void } {
  return useMemo(
    () => ({
      show(message: string, kind: ToastKind) {
        listeners.forEach((l) => l({ message, kind }));
      },
    }),
    [],
  );
}

const kindColor: Record<ToastKind, string> = {
  info: colors.ink,
  success: colors.success,
  error: colors.danger,
};

export function ToastHost() {
  const [toast, setToast] = useState<(ToastEvent & { id: number }) | null>(null);

  useEffect(() => {
    const listener = (t: ToastEvent) => setToast({ ...t, id: Date.now() });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: space[4],
        right: space[4],
        bottom: space[7],
        alignItems: 'center',
      }}
    >
      <View
        accessibilityRole="alert"
        style={{
          backgroundColor: kindColor[toast.kind],
          borderRadius: radii.pill,
          paddingVertical: space[3],
          paddingHorizontal: space[5],
          maxWidth: 480,
        }}
      >
        <RNText style={{ color: colors.white, fontSize: 14, fontWeight: '500' }}>
          {toast.message}
        </RNText>
      </View>
    </View>
  );
}
