# Repository Guidelines

## Project Structure & Module Organization
MediaGo is a pnpm/turborepo monorepo. Feature apps live in `apps/` (`frontend-main`, `frontend-mobile`, `backend-web`, `backend-electron`) for the user surfaces and API. Reusable logic stays in `packages/` (`shared` for cross-runtime helpers, `backend` for orchestration, `main` for Electron packaging). Long-form docs and assets sit in `docs/`, `images/`, and `docker/`. End-to-end checks live in `tests/`.

## Build, Test, and Development Commands
Run `pnpm install` once per clone. Use `pnpm dev` for the unified desktop + web experience, or scope to `pnpm dev:web` / `pnpm dev:electron`. `pnpm build` triggers the production Turborepo pipeline; `pnpm build:web-release` plus `pnpm build:docker` produce the deployable web bundle. Keep the codebase healthy with `pnpm lint`, `pnpm lint:fix`, `pnpm format`, and verify types through `pnpm types`.

## Coding Style & Naming Conventions
Target modern TypeScript with ES modules, two-space indentation, UTF-8, and LF endings per `.editorconfig`. Components, hooks, and services adopt PascalCase (e.g. `UserPreferencesPanel.tsx`). Utilities and helpers stay camelCase, and constants use SCREAMING_SNAKE_CASE. Always run `pnpm format` before committing; reserve comments for clarifying complex logic.

## Testing Guidelines
Integration suites live under `tests/*.test.ts` and execute via `pnpm test` using the Node `tsx` runner. Name files descriptively like `download.queue.integration.test.ts`. Mock external services, prefer shared fixtures in `tests/fixtures/`, and cover happy path, recovery, and edge behaviors when touching runtime code.

## Commit & Pull Request Guidelines
Follow Conventional Commits (e.g. `feat(frontend-main): add download queue UI`) and use `pnpm commit` (Commitizen) to stay compliant. Pull requests should summarize the change, link issues with `Closes #123`, note local test runs (`pnpm test`), and attach screenshots or recordings for UI updates. Call out new environment variables, migrations, or follow-up tasks so reviewers can reproduce the setup quickly.
