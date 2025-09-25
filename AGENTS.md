# Repository Guidelines

## Project Structure & Module Organization
MediaGo is a pnpm/turbo monorepo. Feature apps live in `apps/` (`frontend-main`, `frontend-mobile`, `backend-web`, `backend-electron`) and cover the desktop shell, REST API, and web clients. Reusable logic is split across `packages/` (e.g. `packages/shared` for cross-runtime helpers, `packages/backend` for server orchestration, and `packages/main` for Electron packaging). Long-form docs and assets live in `docs/`, `images/`, and `docker/`, while end-to-end integration checks are collected in `tests/`.

## Build, Test, and Development Commands
Run `pnpm install` once per clone, then `pnpm dev` to launch the unified desktop + web experience. Use `pnpm dev:web` or `pnpm dev:electron` when iterating on a single surface. `pnpm build` triggers the Turborepo production pipeline, and `pnpm build:web-release` prepares the web bundle for Docker (`pnpm build:docker`). Keep types tight with `pnpm types`, rely on `pnpm lint` / `pnpm lint:fix`, and use `pnpm format` (Biome) before committing. `pnpm test` executes the integration suite through `tsx`.

## Coding Style & Naming Conventions
The codebase targets modern TypeScript with ECMAScript modules. Follow `.editorconfig`: UTF-8, LF endings, two-space indentation, and trimmed trailing whitespace. Components, hooks, and services use PascalCase (e.g. `UserPreferencesPanel.tsx`), utilities and helpers stay camelCase, and constants are SCREAMING_SNAKE_CASE. Co-locate test doubles beside source when practical, but prefer platform-neutral logic in `packages/shared-*`. Always format with Biome to avoid manual drift.

## Testing Guidelines
Integration coverage lives in `tests/*.test.ts` and runs under the Node `tsx` test runner. Add suites with descriptive filenames such as `download.queue.integration.test.ts`. Mock external services to keep runs deterministic, and place sample payloads in `tests/fixtures/` if new data is required. Cover happy path, failure recovery, and edge scenarios for every change. Run `pnpm test` locally and note the command in pull requests when you touch behavior.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits enforced by commitlint; run `pnpm commit` (Commitizen) to stay compliant. Keep subjects imperative and under 72 characters, add scopes such as `feat(frontend-main): ...`, and document breaking changes in the footer. For pull requests, include a concise summary, linked issues (`Closes #123`), testing notes, and UI screenshots or recordings when altering the client. Ensure automated checks pass and flag any required environment variables or migration steps in the description.
