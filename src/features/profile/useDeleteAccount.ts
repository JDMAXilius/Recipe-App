// Account deletion, one implementation for both doors: the Account tab and the
// Otto Club paywall. The paywall needs it because the app is behind a hard
// paywall (2026-10-04) — someone who signs up and doesn't subscribe can't reach
// the Account tab, and Apple requires in-app deletion for every account
// (5.1.1(v)). Two-tap arm (works on web), then the delete-account function.
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useToast } from '@/shared/ui';
import { appleAuthorizationCode, useAuth } from '@/features/auth';
import { deleteAccount } from './profile.queries';

export function useDeleteAccount(member: boolean) {
  const { show } = useToast();
  const { user, signOut } = useAuth();
  const [armed, setArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = useCallback(async () => {
    if (!armed) {
      setArmed(true);
      show('This permanently deletes your recipes, saves, and week. Tap again to confirm.', 'info');
      // A subscriber gets time to cancel first (Apple's deletion guidance), so no auto-disarm.
      if (!member) setTimeout(() => setArmed(false), 6000);
      return;
    }
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
      setArmed(false);
    }
  }, [armed, member, show, user, signOut]);

  return { armed, deleting, onDelete };
}
