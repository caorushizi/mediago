import { init } from "@sentry/electron/main";

init({
  dsn: process.env.APP_SENTRY_DSN,
  _experiments: { enableLogs: true },
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
});
