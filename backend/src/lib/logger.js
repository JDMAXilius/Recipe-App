// Structured logging (B0.2). pino JSON logs; Sentry activates itself only
// when SENTRY_DSN is present in env — dormant otherwise, zero config drift.
import pino from "pino";
import * as Sentry from "@sentry/node";
import { ENV } from "../config/env.js";

export const logger = pino({
  level: ENV.NODE_ENV === "production" ? "info" : "debug",
  base: undefined, // drop pid/hostname noise
});

export const sentryEnabled = Boolean(ENV.SENTRY_DSN);
if (sentryEnabled) {
  Sentry.init({ dsn: ENV.SENTRY_DSN, environment: ENV.NODE_ENV || "development" });
}

// Route-level catch helper: log with context, report, answer user-safe.
export function reportError(error, context) {
  logger.error({ err: error, ...context }, context?.msg || "unhandled error");
  if (sentryEnabled) Sentry.captureException(error, { extra: context });
}
