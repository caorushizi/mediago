# Biome Configuration Guide

This document explains the Biome configuration for the MediaGo project.

## Overview

Biome is a fast, modern linter and formatter for JavaScript, TypeScript, JSON, and CSS. It's configured via `biome.json` at the root of the project.

## Configuration Structure

### Files

The configuration includes specific file patterns to check:
- Application source files: `apps/**/src/**/*.{js,jsx,ts,tsx,json,css,scss}`
- Package source files: `packages/**/src/**/*.{js,jsx,ts,tsx,json,css,scss}`
- Configuration files: `apps/**/*.{js,jsx,ts,tsx,json}`, `packages/**/*.{js,jsx,ts,tsx,json}`
- Scripts: `scripts/*.{js,ts}`
- Documentation: `docs/.vitepress/**/*.{js,ts,json,css,scss}`

### Linter Rules

#### Suspicious
- `noExplicitAny`: **warn** - Discourages the use of `any` type but allows it when necessary

#### Style
- `noNegationElse`: **off** - Allows if-else statements with negated conditions
- `useConst`: **error** - Enforces using `const` for variables that are never reassigned
- `useNodejsImportProtocol`: **error** - Requires `node:` protocol for Node.js built-in imports
- `useTemplate`: **warn** - Suggests using template literals instead of string concatenation

#### Correctness
- `useExhaustiveDependencies`: **warn** - Checks React hook dependencies
- `useHookAtTopLevel`: **error** - Enforces hooks are called at the top level
- `noUnusedFunctionParameters`: **warn** - Flags unused function parameters
- `noUnusedVariables`: **error** - Flags unused variables
- `noUnusedImports`: **error** - Removes unused imports

#### Complexity
- `noForEach`: **off** - Allows using `.forEach()` method
- `useOptionalChain`: **warn** - Suggests using optional chaining

#### Accessibility
- `useKeyWithClickEvents`: **off** - Disabled for UI flexibility
- `noStaticElementInteractions`: **off** - Disabled for UI flexibility

### Formatter

- **Indent Style**: Spaces
- **Indent Width**: 2 spaces
- **Line Width**: 120 characters
- **Line Ending**: LF (Unix-style)
- **Format With Errors**: Disabled (won't format files with syntax errors)

#### JavaScript/TypeScript Formatting
- **JSX Quote Style**: Double quotes
- **Quote Properties**: As needed
- **Semicolons**: Always required
- **Arrow Parentheses**: Always included
- **Bracket Spacing**: Enabled
- **Bracket Same Line**: Disabled
- **Quote Style**: Double quotes
- **Attribute Position**: Auto
- **Trailing Commas**: All (includes in function parameters and object literals)

#### JSON Formatting
- **Indent Width**: 2 spaces
- **Trailing Commas**: None
- **Allow Comments**: Enabled (for .jsonc files)
- **Allow Trailing Commas**: Disabled

#### CSS Formatting
- **Indent Width**: 2 spaces
- **Line Width**: 120 characters
- **Linter**: Enabled

### Overrides

#### React Applications
For `apps/ui/**` and `packages/mobile-player/**`:
- Enhanced React hook dependency checking

#### CSS/SCSS Files
For all `**/*.css` and `**/*.scss` files:
- Disables `noUnknownAtRules` to support Tailwind CSS and other CSS-in-JS solutions

#### Electron Build Scripts
For `apps/electron/scripts/**/*.ts`:
- Disables `noTemplateCurlyInString` to support electron-builder template strings

## Usage

### Check Code Quality
```bash
# Check all files
pnpm lint:check

# Check with workspace-specific linting
pnpm lint
```

### Fix Issues
```bash
# Auto-fix safe issues
pnpm lint:fix

# Auto-fix all issues (including unsafe fixes)
pnpm lint:unsafe
```

### Format Code
```bash
# Format all files
pnpm format
```

### Workspace-Specific Linting
Each workspace package has its own `lint` script that runs `biome check .`:
- `pnpm -F @mediago/electron run lint`
- `pnpm -F @mediago/server run lint`
- `pnpm -F @mediago/ui run lint`

## Integration with CI/CD

The linter runs as part of the build process through `turbo run lint`, which executes linting for all workspace packages in parallel.

## Migration Notes

This configuration has been optimized to:
1. Reduce false positives with tailored rule configurations
2. Support project-specific patterns (Tailwind CSS, electron-builder)
3. Enforce consistent code style across all packages
4. Provide clear warnings for potential issues without blocking development

## Troubleshooting

### Unknown at-rules in CSS
If you see warnings about unknown at-rules in CSS files, verify that the file is matched by the CSS override pattern in `biome.json`.

### Template string warnings in build scripts
Template strings in electron-builder configuration files are intentional. The override for `apps/electron/scripts/**/*.ts` disables these warnings.

### Any type warnings
While the configuration warns about `any` type usage, it doesn't error. Consider using proper types, but `any` is acceptable when working with dynamic or third-party APIs.
