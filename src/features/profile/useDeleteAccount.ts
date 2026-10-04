// Account deletion, one implementation for both doors: the Account tab and the
// Otto Club paywall. The paywall needs it because the app is behind a hard
// paywall (2026-10-04) — someone who signs up and doesn't subscribe can't reach
// the Account tab, and Apple requires in-app deletion for every account
// (5.1.1(v)). One native confirm, then the delete-account function.
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useToast } from '@/shared/ui';
import { appleAuthorizationCode, useAuth } from '@/features/auth';
import { deleteAccount } from './profile.queries';
import { openManageSubscriptions } from './club.purchases';

const DELETE_TITLE = 'Delete account?';
const DELETE_BODY = "Your recipes, saves and plan are erased. This can't be undone.";
// Apple's deletion rule for subscription apps: billing continues via Apple
// until cancelled, and offer a way to manage it (the alert's extra button).
const DELETE_BODY_MEMBER =
  'Your Otto Club subscription is billed by Apple and continues until you cancel it.';

export function useDeleteAccount(member: boolean) {
  const { show } = useToast();
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const runDelete = useCallback(async () => {
    setDeleting(true);
    try {
      // Signed in with Apple: one Apple sheet tap so the server can revoke the
      // Apple tokens (required for Sign in with Apple apps).
      const viaApple = (user?.identities ?? []).some((i) => i.provider === 'apple');
      let appleCode: string | undefined;
      if (viaApple && Platform.OS === 'ios') {
        const code = await appleAuthorizationCode();
        if (!code) {
          show('Confirm with Apple to finish deleting your account.', 'info');
          setDeleting(false);
          return;
        }
        appleCode = code;
      }
      await deleteAccount(appleCode);
      show("Everything's deleted. Otto will miss you.", 'success');
      await signOut();
    } catch {
      show("Couldn't delete right now. Try again, or email us.", 'error');
      setDeleting(false);
    }
  }, [show, user, signOut]);

  const onDelete = useCallback(() => {
    const message = member ? `${DELETE_BODY} ${DELETE_BODY_MEMBER}` : DELETE_BODY;
    // Alert buttons no-op on web; confirm() keeps web usable.
    if (Platform.OS === 'web') {
      if (window.confirm(`${DELETE_TITLE}\n\n${message}`)) void runDelete();
      return;
    }
    Alert.alert(DELETE_TITLE, message, [
      ...(member ? [{ text: 'Manage subscription', onPress: openManageSubscriptions }] : []),
      { text: 'Delete', style: 'destructive' as const, onPress: () => void runDelete() },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, [member, runDelete]);

  return { deleting, onDelete };
}
