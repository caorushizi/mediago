# @mediago/core-sdk

TypeScript client for the MediaGo Core API.

## Development

This package is developed as part of the MediaGo pnpm workspace. Run these
commands from the repository root; pnpm-lock.yaml is the shared dependency lock.
Do not generate a separate npm lockfile in this directory.

```sh
pnpm install --frozen-lockfile
pnpm --filter @mediago/core-sdk test
pnpm --filter @mediago/core-sdk build
```

Consumers of a published SDK package may still use their own package manager.
