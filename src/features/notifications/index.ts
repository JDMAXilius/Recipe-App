// Public surface: the screen app/notifications.tsx mounts, plus the sync
// primitives (so a future root-level mount can re-schedule on plan changes
// made off-screen — see contract_gaps).
export { NotificationsScreen } from './NotificationsScreen';
export { NotifSync } from './NotifSync';
export { useNotifPrefs, type UseNotifPrefs } from './useNotifPrefs';
export { ensurePermission, syncNotifications } from './notifications.queries';
