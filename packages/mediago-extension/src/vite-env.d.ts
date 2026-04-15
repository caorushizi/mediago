/// <reference types="vite/client" />

/**
 * Extra build-time env vars injected via `define` in vite.config.ts.
 * Values originate from the repo root `.env` (see `loadEnv(...)` there).
 */
interface ImportMetaEnv {
  readonly APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
