// One home for "pick one of these, or cancel" (HIG: destructive actions are
// confirmed with a clearly marked destructive button, never a timed toast).
// iOS gets a real action sheet; Android an Alert (max 3 buttons, so at most two
// options); web confirm(), because Alert buttons no-op there (useDeleteAccount).
// Resolves to the chosen option's index, or null for cancel / dismiss.
import { ActionSheetIOS, Alert, Platform } from 'react-native';

export interface ActionSheetOptions {
  title?: string;
  message?: string;
  options: string[];
  destructiveIndex?: number;
  cancelLabel?: string;
}

export function showActionSheet({
  title,
  message,
  options,
  destructiveIndex,
  cancelLabel = 'Cancel',
}: ActionSheetOptions): Promise<number | null> {
  // An action sheet's options name themselves; a dialog needs a question.
  const question = title ?? `${options[0]}?`;
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          message,
          options: [...options, cancelLabel],
          cancelButtonIndex: options.length,
          destructiveButtonIndex: destructiveIndex,
        },
        (i) => resolve(i < options.length ? i : null),
      );
      return;
    }
    if (Platform.OS === 'web') {
      // ponytail: confirm() can only say yes/no, so web offers the first option
      // only; a caller with two real choices branches on web before calling.
      resolve(window.confirm([question, message].filter(Boolean).join('\n\n')) ? 0 : null);
      return;
    }
    Alert.alert(
      question,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(null) },
        ...options.map((text, i) => ({
          text,
          style: i === destructiveIndex ? ('destructive' as const) : ('default' as const),
          onPress: () => resolve(i),
        })),
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
