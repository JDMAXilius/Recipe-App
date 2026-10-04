// Crash reporting (Sentry). Off unless EXPO_PUBLIC_SENTRY_DSN is set in the EAS
// environment, and native only — web is a dev target.
//
// Privacy contract (App Privacy label: Crash Data, not linked to the user, not
// tracking): no user id or email is ever attached, no screenshots or view
// hierarchy, no performance tracing, and every event and breadcrumb goes through
// monitoring.logic's scrubber before it is sent.
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { keepBreadcrumb, scrubEvent } from './monitoring.logic';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let started = false;

export function initMonitoring(): void {
  if (started || !DSN || Platform.OS === 'web') return;
  started = true;
  Sentry.init({
    dsn: DSN,
    enabled: !__DEV__,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 30,
    beforeBreadcrumb: (crumb) => (keepBreadcrumb(crumb) ? crumb : null),
    beforeSend: (event) => scrubEvent(event),
  });
}

/** For errors a boundary catches (Sentry only sees unhandled ones on its own). */
export function reportError(error: unknown): void {
  if (!started) return;
  Sentry.captureException(error);
}
