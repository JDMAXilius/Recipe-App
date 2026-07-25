// One typed haptics wrapper (contract: ui-components.md §3). Features call
// haptics.select()/impact()/notify() — never raw Haptics.*. Fire-and-forget
// (never blocks a tap) and a no-op on web (expo-haptics rejects there).
import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

const swallow = (p: Promise<unknown>) => {
  void p.catch(() => {});
};

export const haptics = {
  select(): void {
    swallow(Haptics.selectionAsync());
  },
  impact(weight: 'light' | 'medium' = 'light'): void {
    swallow(
      Haptics.impactAsync(
        weight === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      ),
    );
  },
  notify(type: 'success' | 'warning' | 'error'): void {
    const map = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    } as const;
    swallow(Haptics.notificationAsync(map[type]));
  },
  // The ONE alert pattern: a long insistent buzz for the cook timer, which has
  // to reach someone across a kitchen. Documented as the alarm exception in
  // motion.md §2 — it deliberately ignores the Sounds toggle (it is not a
  // sound) but NOT accessibility: it lives here so it's inside the kit, not
  // a raw Vibration call at a call site with no vocabulary at all.
  alarm(): void {
    if (Platform.OS === 'web') return;
    Vibration.vibrate([0, 500, 350, 500, 350, 500, 350, 500, 350, 500]);
  },
};
