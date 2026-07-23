// One typed haptics wrapper (contract: ui-components.md §3). Features call
// haptics.select()/impact()/notify() — never raw Haptics.*. Fire-and-forget
// (never blocks a tap) and a no-op on web (expo-haptics rejects there).
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
};
