import { init } from "@sentry/node";

init({
  dsn: process.env.APP_SENTRY_DSN,
  sendDefaultPii: true,
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
});
