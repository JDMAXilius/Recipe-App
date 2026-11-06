// Connectivity for TanStack Query (gap audit P1-12). Imported once, for its side
// effects, by app/_layout. NetInfo drives onlineManager, so offline queries pause
// instead of failing into "Couldn't…" toasts and resume on reconnect; AppState
// drives focusManager, so returning to the app refetches stale data (web already
// gets this from visibilitychange).
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

// isInternetReachable is null until NetInfo has probed: unknown counts as online,
// so a launch never flashes the offline banner.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)),
);

if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
    return () => sub.remove();
  });
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

/** Right now, outside React. TanStack PAUSES a mutation while offline (it
 *  doesn't fail), so an AI call started offline would spin until the
 *  connection returns: callers ask first and say so (R8.3). */
export const isOnline = (): boolean => onlineManager.isOnline();
