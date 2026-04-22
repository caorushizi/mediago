# Contributing translations

Thanks for helping translate MediaGo! This guide walks you through adding a
new language from scratch, with a live-preview workflow so you can iterate
without rebuilding the app.

## TL;DR

```shell
git clone https://github.com/caorushizi/mediago.git
cd mediago
pnpm install
pnpm deps:download
pnpm dev:electron
```

1. Copy `packages/shared/common/src/i18n/resources/en.ts` to `<lang>.ts`,
   translate every value.
2. Register the new locale (four small edits — see below).
3. Open **Settings → Language**, pick your locale, and iterate. Vite HMR
   reflects edits in the running app within a second.
4. Open a PR — we review and merge.

## Where strings live

- **Main app UI** (desktop + self-hosted web):
  `packages/shared/common/src/i18n/resources/{en,zh}.ts`
- **Browser extension** (separate, smaller catalog):
  `packages/mediago-extension/src/i18n/resources/{en,zh}.ts`

Resources are plain TypeScript modules — each file exports a flat object of
`key: "translation"` pairs. Keys are shared across languages; only values
change.

## Adding a new language end-to-end

Example: French (`fr`). Adjust the code to whichever language you're adding.

### 1. Create the resource file

Copy `en.ts` to `fr.ts` in the same directory and translate every **value**.
Leave all keys untouched:

```ts
// packages/shared/common/src/i18n/resources/fr.ts
export const fr = {
  // ...translated values...
  followSystem: "Système",
  chinese: "中文",
  english: "English",
  french: "Français", // add your language's own name
  displayLanguage: "Langue",
  // ...
} as const;
```

Don't forget to add the new `french: "Français"` key to **every** resource
file (`en.ts`, `zh.ts`, and your new `fr.ts`) so the Settings dropdown can
render it in each language.

### 2. Register the resource

Three tiny edits:

**`packages/shared/common/src/i18n/resources/index.ts`** — import the new
locale and add it to both exports:

```ts
import { fr } from "./fr";
// ...
export const i18nResources = { en, zh, fr } as const;
export const SUPPORTED_LANGUAGES = ["en", "zh", "fr"] as const;
export { en, zh, fr };
```

**`packages/shared/common/src/i18n/config.ts`** — widen the
`resolveAppLanguage` return type and the check inside:

```ts
export function resolveAppLanguage(
  language: string | undefined,
  systemLocale: string | undefined,
): "zh" | "en" | "fr" {
  if (language === "zh" || language === "en" || language === "fr") {
    return language;
  }
  // ...existing fallback...
}
```

**`packages/shared/common/src/types/index.ts`** — extend the `AppLanguage`
enum:

```ts
export enum AppLanguage {
  System = "system",
  ZH = "zh",
  EN = "en",
  FR = "fr",
}
```

### 3. Add the Settings dropdown option

**`apps/ui/src/pages/setting-page/index.tsx`** — inside the **Language**
`<Select>`, add one line:

```tsx
options={[
  { label: t("followSystem"), value: AppLanguage.System },
  { label: t("chinese"),      value: AppLanguage.ZH },
  { label: t("english"),      value: AppLanguage.EN },
  { label: t("french"),       value: AppLanguage.FR },  // new
]}
```

### 4. (Optional) Translate the browser extension

Same pattern, under `packages/mediago-extension/src/i18n/resources/`. It's a
much smaller catalog and lives in its own `index.ts`.

## Live preview workflow

The dev server uses **Vite HMR** — edits to any resource file are reflected
in the running app almost instantly, no restart required.

```shell
pnpm install
pnpm deps:download        # fetch ffmpeg / BBDown (first clone only)
pnpm dev:electron         # starts Electron with HMR
```

Once the window is up, open **Settings → Language** and switch to your new
locale. Then edit `fr.ts` in your editor — save, and the UI updates live.

Use this to catch overflowing strings, awkward wrapping, and untranslated
values before opening the PR.

## Submitting the PR

- **Branch**: `i18n/add-<lang>` — e.g. `i18n/add-fr`.
- **Commit**: follow [Conventional Commits](https://www.conventionalcommits.org/),
  e.g. `feat(i18n): add French translation`.
- In the PR description, please include:
  - A screenshot of **Settings → Language** with your new locale selected.
  - A screenshot of at least one main screen (e.g. the download list) in
    the new language.
  - Confirmation that `pnpm check` passes locally.

## Tips

- **Keep placeholders intact.** Tokens like `{{count}}` or `{name}` are
  interpolated at runtime — copy them verbatim into your translation.
- **Natural phrasing beats literal translation.** The English source is a
  guide, not a cage. Idiomatic phrasing in your language is always better.
- **Unsure how a string is used?** Grep the key across the repo (e.g.
  `rg '"displayLanguage"'`) — you'll find the component that renders it,
  which gives you the UI context.

Questions? Comment on [issue #638](https://github.com/caorushizi/mediago/issues/638)
or open a new discussion. Thanks for contributing! 🌍
