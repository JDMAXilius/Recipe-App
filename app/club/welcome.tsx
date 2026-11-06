import { ClubWelcomeScreen } from '@/features/profile';
import { ensurePermission, useNotifPrefs } from '@/features/notifications';

// "You're all set" + the reminders ask (R2.4, R2.5). The route joins profile
// and notifications; neither imports the other.
export default function ClubWelcome() {
  const notif = useNotifPrefs();
  return (
    <ClubWelcomeScreen
      onRemind={async () => {
        if (await ensurePermission()) notif.setTonight(true);
      }}
    />
  );
}
