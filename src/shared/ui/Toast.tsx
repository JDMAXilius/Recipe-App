import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, radii, space, timing } from '../theme/tokens';
import { OttoArt, type OttoArtName } from './OttoArt';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastOptions {
  ottoImage?: OttoArtName; // small celebration mascot (e.g. 'excited' on first save)
  actionLabel?: string; // e.g. "Undo"
  onAction?: () => void;
}

type ToastEvent = { message: string; kind: ToastKind } & ToastOptions;

// Module-level emitter — no context/provider needed; ToastHost subscribes,
// useToast() emits. One host mounted at the app root shows every toast.
const listeners = new Set<(t: ToastEvent) => void>();

export function useToast(): {
  show: (message: string, kind: ToastKind, opts?: ToastOptions) => void;
} {
  return useMemo(
    () => ({
      show(message: string, kind: ToastKind, opts?: ToastOptions) {
        listeners.forEach((l) => l({ message, kind, ...opts }));
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
    // Toasts with an action linger longer (undo needs a beat), per v1.
    const ms = toast.actionLabel ? 5000 : 3000;
    const timer = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  const interactive = !!(toast.actionLabel && toast.onAction);
  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: space[4],
        right: space[4],
        bottom: space[7],
        alignItems: 'center',
      }}
    >
      <Animated.View
        key={toast.id}
        entering={FadeIn.duration(timing.fade)}
        exiting={FadeOut.duration(timing.fade)}
        accessibilityRole="alert"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          backgroundColor: kindColor[toast.kind],
          borderRadius: radii.pill,
          paddingVertical: space[3],
          paddingHorizontal: space[5],
          maxWidth: 480,
        }}
      >
        {toast.ottoImage && <OttoArt name={toast.ottoImage} size={32} />}
        <RNText style={{ color: colors.white, fontSize: 14, fontWeight: '500', flexShrink: 1 }}>
          {toast.message}
        </RNText>
        {interactive && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
            hitSlop={8}
            onPress={() => {
              toast.onAction?.();
              setToast(null);
            }}
          >
            <RNText
              style={{
                color: colors.white,
                fontSize: 14,
                fontWeight: '700',
                textDecorationLine: 'underline',
              }}
            >
              {toast.actionLabel}
            </RNText>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}
