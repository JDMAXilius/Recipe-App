// A native confirm for actions that are hard to take back (Leave the kitchen,
// Delete account, Sign out). iOS: a system alert with a destructive button.
// Web (visual QA only): window.confirm, since Alert buttons no-op there.
import { Alert, Platform } from 'react-native';

export function confirmDestructive(o: { title: string; message: string; confirm: string; cancel?: string }): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${o.title}\n\n${o.message}`));
  }
  return new Promise((resolve) =>
    Alert.alert(o.title, o.message, [
      { text: o.cancel ?? 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: o.confirm, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
