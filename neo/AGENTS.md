# NEO: guide for coding agents and contributors

NEO is the web and native client for [UNA CMS](https://unacms.com). Shared code in `packages/app` runs as a Next.js site (`apps/next`) and as an Expo app for iOS and Android (`apps/expo`). This file covers how to change NEO; [README.md](README.md) covers setup, environment variables and deployment.

Paths are relative to the NEO root: `neo/` in the UNA repo, or the repository root in a fork.

## Upstream or fork: check before you change anything

| | Upstream NEO | Client fork |
|---|---|---|
| Repository | `neo/` in [unacms/UNA](https://github.com/unacms/UNA) | a fork of [unacms/neo](https://github.com/unacms/neo) |
| How to tell | the folder above `neo/` holds UNA's `api.php`, `inc/` and `modules/` | `apps/` and `packages/` are at the repository root |
| What you change | anything under `neo/` | only `packages/app/customization/` (see [Forks](#forks-and-the-customization-layer)) |
| Where it lands | a PR to unacms/UNA from a branch off `master` | the fork's own branches |

If a fork needs a change outside `customization/`, make it upstream as a PR to unacms/UNA, then sync it into the fork. Patching shared code in a fork makes every later sync conflict, and other clients never get the fix.

## Upstream workflow

- NEO is a git subtree of the UNA repo since October 2026. The rest of that repo is the UNA backend (PHP), so one PR can change an API and the NEO code that calls it. UNA's own agent notes are in the root `AGENTS.md`; the [`una-api` skill](.agents/skills/una-api/SKILL.md) covers what NEO needs from UNA services.
- Branch from UNA `master` and open the PR against unacms/UNA. Start the title of a NEO-only PR with `Neo:`, for example "Neo: allow only http(s) URLs in inline post embeds" ([#5787](https://github.com/unacms/UNA/pull/5787)).
- unacms/neo is a mirror: on every push to UNA `master`, [`.github/workflows/sync-neo.yml`](https://github.com/unacms/UNA/blob/master/.github/workflows/sync-neo.yml) runs `git subtree push --prefix neo` to unacms/neo `main`. Never commit, merge or open PRs there; one commit on the mirror makes the next push non-fast-forward and stops the sync. There is nothing to `git subtree pull` from it either: it only holds what UNA already has, and pulling an outdated copy reverts newer UNA changes.
- Run `yarn typecheck` and `yarn lint` from `neo/` before you push. UNA CI has no NEO job and the Next build ignores type errors. Neither command is clean on `master` yet, so compare with `master` and add no new errors.

Upstream changes to `packages/app/customization/` reach every fork, so treat that folder as an interface:

- Keep each customization file a short re-export of a core default. New behaviour and new defaults go into core (`default/`, `settings/`, components), where forks can override them.
- Don't rename, move or delete a customization file, a default it re-exports (`settingsDefault`, `resourcesDefault`, `componentsMapDefault`, `skeletonsMapDefault`, `staticDefault`, `animatedIcons`, ...) or a function in `default/functions.js` without a fallback. Forks override them by name, and a rename silently orphans the override: renaming `config/images_allowlist.js` to `images-allowlist.js` did that to one fork in August 2026.
- Never add a file that forks create for themselves: `customization/config/app.config.js`, `apps/expo/eas.json`, `apps/next/public/.well-known/*`. Each one would conflict in every fork that has its own.

## Forks and the customization layer

Core code imports fixed paths under `app/customization/...`. Upstream, each of those files re-exports a default from core. A fork changes behaviour by changing what the file exports; nothing in the build swaps files.

Rules for forks:

1. Edit only `packages/app/customization/**`. Files that upstream doesn't have are yours too: `apps/expo/eas.json`, `.github/workflows/*`, `apps/next/public/.well-known/*`. Leave `.gitignore`, `.easignore`, `apps/expo/app.config.js`, `apps/*/package.json` and all core code alone; put local ignores in `.git/info/exclude`.
2. Extend defaults instead of copying them: mutate or spread the default export, so later upstream additions still reach you.
3. Keep secrets out of git. Use `.env.local` locally and Vercel or EAS environment variables for builds. Never put `UNA_API_KEY` in `config/app.config.js` `extra`: everything in `extra` ships inside the app binary, and the native app doesn't use the key.
4. Take upstream changes by syncing from unacms/neo `main` (GitHub "Sync fork", or `gh repo sync <owner>/<fork> --branch main`). After a sync, check whether a seam you override was renamed or removed: `git diff --name-status --diff-filter=DR <old> <new> -- packages/app/customization packages/app/default`.
5. Write fork-specific notes for agents in `packages/app/customization/resources/agents.md`, below its "Per-project additions" line. Agents working in a fork must read that file too.

| Seam | How to override |
|---|---|
| `settings.js` | Mutate nested keys of `settingsDefault` (`app/default/settings`, built from `app/settings/*.js`) in place, at module top level. Don't replace whole sections: some core code imports `settings/*` modules directly. |
| `translation.js` | Add or change keys in `resourcesDefault[lang].translation`. |
| `icons-svg.js` | Custom icons for web and native (inline SVG by name). They win over Lucide and over animated icons. |
| `icons.js` | Native-only icon components. Web draws Lucide icons by name from `/lucide/<stroke>/<Name>.svg`. |
| `animated-icons.js` | Spread the default registry and add keys; see [animated-icons.md](animated-icons.md). |
| `static.js` | Static components. A `components_<uri>` key also replaces that page. |
| `functions.js` | Re-exports `app/default/functions`. Declare a local export with the same name to replace one function. |
| `loading.js`, `sounds.js`, `covers/`, `splash-mockups/`, `nav/footer.web.js` | Replace the export. |
| `<type>/_map.js` for elements, form-fields, forms, molecules, page-layout, menu-items, units, units/content-list, units/profile-list, skeletons, workers | Import `componentsMapDefault` from the core `_map.js`, add or replace keys, re-export it. Put new components under `customization/<type>/`. |
| `design/styles/global.css`, `global.web.css` | CSS variable and `@theme` overrides (both platforms; the second is web only). |
| `design/fonts/fonts-web.js`, `design/fonts/fonts.js` | Web `next/font` variables and the native `useFonts` map. |
| `config/fonts.js` | Font family per role and platform; see [Fonts](#fonts). |
| `config/next.config.js` | Deep-merged into `apps/next/next.config.js`. Arrays are concatenated. Functions (`webpack`, `rewrites`, `headers`) replace upstream's, so define one only if you reimplement upstream's. This is the fork hook despite the "don't edit" comment at its top. |
| `config/app.config.js` | Create it. It's deep-merged into the Expo config, but `ios.infoPlist`, `ios.associatedDomains`, `android.permissions`, `android.intentFilters` and `plugins` replace upstream's when you set them. If you set `plugins`, copy upstream's full list (it includes `expo-build-properties` with `ios.enableSceneSupport`, which iOS 27 requires) and re-check it after every sync. A syntax error in this file is swallowed and the app builds as stock NEO. |
| `config/images-allowlist.js` | Extra image hosts, used by `next/image` and at runtime. |
| `config/package.next.js`, `config/package.expo.js` | Extra npm dependencies. The root `preinstall` script merges them into `apps/next/package.json` and `apps/expo/package.json`; don't commit those rewritten files, and restore them before a sync. |
| `resources/web/` | Flat files copied into `apps/next/public/static/` (gitignored) whenever the Next config loads: `favicon.svg`, `manifest.json` and every icon the manifest names. |
| `resources/native/` | App icon, splash and other native assets. Reference them from `config/app.config.js` as `../../packages/app/customization/resources/native/...`. |
| `resources/sounds/` | Default sounds. Point `sounds.js` at your own files. |

## Layout and stack

```
apps/next        Next.js app: route shells, proxy.js, next.config.js
apps/expo        Expo app: expo-router routes, app.config.js, config plugins in plugins/
packages/app     shared code, imported as app/...
  design/        View, Text, controls (NeoButton), theme CSS, fonts
  ui/            atoms, molecules, primitives (headless), workers
  components/    block renderers (elements), units, forms, form-fields, menu-items, page-layout, nav
  context/, lib/ state, fetcher, hooks and helpers
  default/, settings/   defaults that customization/ re-exports
  customization/ fork overrides
scripts/         typecheck.js, merge-package-customization.js, check-translations.js
patches/         patch-package patches, applied on postinstall
```

- Next.js 16 with React 19.2, built with webpack (`next dev --webpack`), not Turbopack. `@expo/next-adapter` aliases `react-native` to `react-native-web`. `typescript.ignoreBuildErrors` is on and `reactStrictMode` is off. `apps/next/proxy.js` is Next 16's middleware. Next ships its docs in `node_modules/next/dist/docs/`; `apps/next/AGENTS.md` (written by `next dev`) points there.
- Expo SDK 57 with React Native 0.86 (New Architecture only), expo-router and Hermes. `apps/expo/ios` and `android` are generated by prebuild and gitignored. A change to `app.config.js`, a config plugin or a native dependency needs a prebuild and a native rebuild.
- Styling: Tailwind CSS 4 on web and Uniwind (Tailwind 4 for React Native) on native. Tailwind is pinned in the root `resolutions` because 4.3.3 broke Uniwind breakpoints ([uni-stack/uniwind#668](https://github.com/uni-stack/uniwind/issues/668)).
- TypeScript 6, Node 24, Yarn 1 workspaces. No local script runs Turborepo, but Vercel builds through it, and its strict env mode hides any variable that `turbo.json` `globalEnv` doesn't list. Add a new environment variable the web build reads to that list.
- `yarn.lock` is gitignored, so every fresh `yarn install` re-resolves the ranges in `package.json`, native modules included. Don't change a dependency range in passing. To check what is installed, run `node -p "require('next/package.json').version"` from `neo/`; declared ranges differ from installed versions.
- Run everything through the root yarn scripts (`yarn web2`, `yarn native`, `yarn ios`, `yarn android`, `yarn build`, `yarn typecheck`, `yarn lint`; see [README.md](README.md)). They load `.env.local` through dotenv. Running `next` or `expo` directly skips it, and Expo bakes the variables into `expo.extra` at native build time.

## How a page renders

- UNA decides the routes. Each app has one catch-all route (`apps/next/app/[...path]/page.js`, `apps/expo/app/[...path].js`, plus the tabs in `apps/expo/app/(tabs)/tab0` to `tab4`). It asks UNA for the page with `system/get_page_by_request/TemplServicePages` and renders the returned blocks.
- Blocks render through the component registry: `components[type][name]` from `app/components/registry`. It is a plain object on purpose; a `getComponent()` call trips `react-hooks/static-components`. `components/registry-init.js` registers each type from its customization `_map.js`. Default maps load components with `next/dynamic`; on native, `apps/expo/babel-inline-dynamic-imports.js` and the Metro shim turn those into `require` calls.
- On web, `[...path]/page.js` is a Server Component. It fetches the page JSON with `fetch` (`cache: 'no-store'`), sending `Authorization: Bearer <UNA_API_KEY or tenant key>` and the viewer's cookies. React `cache()` shares that request between `generateMetadata` and `Page`, and `apps/next/lib/una-page-cache.js` keeps results per URL, tenant and cookie for `appSetting('cache', 'una_page_ttl')` seconds (20; 30 for profiles). It renders `Root` from `app/root-client` inside `Suspense`.
- `cacheComponents` is off, so `'use cache'`, `cacheLife` and PPR don't work here. Don't add them.
- All other data is fetched on the client with `fetcher`, because the same code runs in Expo, which has no server.
- The client boundary is `app/root-client.js`, `app/root.js` and `apps/next/app/providers.js`. Most of `packages/app` has no `'use client'` and needs none. Don't remove the directives that exist, and don't turn shared code into Server Components.

## Talking to UNA

- Call UNA through `fetcher` from `app/lib/fetcher`:
  - `fetcher(path)` does a GET; `fetcher([path, token, body])` POSTs `body`. The full signature is `fetcher(req, useProxy = false, { signal, timeoutMs, maxAttempts, silent, onUploadProgress })`.
  - It appends `&lang=`, so the path must already contain `?r=`.
  - It returns UNA's envelope `{status, module, method, params, data, hash}`; read `.data`. A body that isn't JSON comes back as `{}`.
  - GETs are retried three times on network errors, never on a timeout (`config.fetch_timeout_ms`, 30 s).
  - On web it calls same-origin `/api/...`, and `proxy.js` forwards that to UNA with the API key and the viewer's cookies. Native calls `UNA_URL` directly with `Origin: APP_ORIGIN` and the session cookie.
- Routes are `/api.php?r={module}/{method}/{class}` with `params[]=...` or `params=[...]`; the class defaults to `Module`, system services use `Templ*` classes. UNA only allows services marked safe or public. Many endpoints come from UNA data (`'/api.php?r=' + data.request_url`); fixed ones live in `appSetting('urls', ...)`.
- Three places bypass `fetcher` on purpose: the web page shell above, AI chat streaming (`ui/molecules/ai-agent/helper.js`) and direct uploads (`lib/util/upload.ts`).
- If the page JSON can't be parsed (a PHP fatal or an HTML error page), web shows the maintenance screen for the whole page and home falls back to a static splash. Fix the UNA service; the [`una-api` skill](.agents/skills/una-api/SKILL.md) lists the rules, the usual cause being a block that fails for guests.
- Auth: `useCurrentUser()` from `app/context/user` returns `{ currentUser, setCurrentUser }`. `currentUser` is `null` until known, `false` for a guest and an object when signed in. `Root` and the layouts hold rendering until it is known, so components rarely need to wait themselves. The guest sign-in prompt is `layout.show_login_modal`.
- The UNA session cookie identifies the viewer. `UNA_API_KEY` identifies the NEO server to UNA and stays on the server (`proxy.js` and the page shell). Never expose it to client code or put it in `expo.extra`.
- Real-time updates: `subscribe(channel, event, callback)` from `app/ui/atoms/socket` returns an unsubscribe function; return it from a `useEffect`. The server is Soketi (Pusher protocol), configured in `config.sockets`. Channels include `bx_timeline_0` (`added`, `deleted`, `edited`), `cmts_<module>_<id>` (`comment_added`, `comment_edited`, `comment_deleted`), `profile_<id>` and `sys_connections_<id>` (`changed`), and `bx_messenger` (`convo_<id>`, `profile_<id>`).

### Images

Never pass an original upload (`src_orig`) to `Image` or `next/image`, on web or native. UNA transcodes images; NEO only resizes the display URL further.

1. Pick the URL with `pickUnaDisplaySrc` / `toUnaDisplayImageItem` from `app/lib/image-helpers` (`src`, then `medium`, `small`, `thumb`, `file`).
2. Render through `app/ui/atoms/image` only. Web uses `next/image`; native requests the same optimizer at `${native_app_images_url}/_next/image`.
3. Spreading a UNA object (`<Image {...image} />`) is safe because `getImageSrc` ignores `src_orig`. When you flatten a list, call `toUnaDisplayImageItem` so the original isn't copied into `src`.
4. `useOriginalImage` in the atom means "the optimizer request failed, use the UNA display URL", not `src_orig`.

## Code conventions

- Write new files in TypeScript (`.ts` / `.tsx`) with typed props. When you substantially rework a `.js` file, `git mv` it to TypeScript first so history follows.
- File names are kebab-case; shared prop types go in `<name>.types.ts`.
- Platform files: the base file is the native or shared version, `.web.*` replaces it on web, and `.ios.*` / `.android.*` hold platform-only native code. A platform pair shares props through `<name>.types.ts`; don't import types from the base file, because `./video` inside `video.web.tsx` resolves to `video.web.tsx` itself.
- `yarn typecheck` (`scripts/typecheck.js`) checks every `.ts` / `.tsx` file in `packages/app` and the apps once per platform, resolving `.web` / `.native` / `.ios` / `.android` the way webpack and Metro do. Plain `tsc` misses platform files, and JS isn't typechecked at all. The native run uses the root `tsconfig.json` with `strict`, `strictNullChecks` and `noUncheckedIndexedAccess`, so `items[0]` is possibly `undefined`.
- Keep these as JavaScript: `packages/app/settings/**` (config data read by string path through `appSetting`; `settings/images-allowlist.js` is also required by `next.config.js`), `packages/app/customization/**` (the fork surface), and `lib/image/circle-png.js`.
- Imports: shared code is `app/...`. Use `View`, `Pressable`, `ScrollView`, `Row` from `app/design/view`, `Text` and `H1`–`H6` from `app/design/typography`, controls from `app/design/controls`, `appSetting` and `isWeb` from `app/lib/util`. Don't import these primitives from `react-native` in shared code.
- Check for an existing component before writing one, and wrap a new third-party UI library in `ui/atoms` or `ui/molecules` before features use it.
- Lazy loading: `lib/lazy-component.tsx`, or `next/dynamic` (the Metro shim makes it work on native).

### React Compiler

The React Compiler is on in both apps: `reactCompiler: true` in `apps/next/next.config.js` (client bundle only) and `experiments.reactCompiler: true` in `apps/expo/app.config.js`. Shared code in `packages/app` is compiled by both.

- The compiler skips any component or hook that breaks the Rules of React and leaves it as written. `yarn lint` reports these as `react-hooks/*` errors (`refs`, `immutability`, `static-components`, `preserve-manual-memoization`, ...); fixing them is how a component gets compiled.
- Don't mass-remove `useMemo`, `useCallback` or `memo`: in a skipped component they still do their job. Drop manual memoization only in files that lint clean, and only when it serves no other purpose (a stable callback for a subscription, for example).
- `'use no memo'` at the top of a file or component body opts it out. A fork can turn the compiler off with `reactCompiler: false` in `customization/config/next.config.js` and `experiments: { reactCompiler: false }` in its `customization/config/app.config.js`.
- Code that mutates an object from props or state in place and expects children to re-render shows stale UI: memoized children see the same reference. Create new objects.
- Don't dispatch no-op state updates from effects (`setState(prev => prev)`). While a fiber still holds a low-priority update (idle hydration of the page `Suspense`, for example), React can't bail out early, and a no-op dispatch keeps a sync render loop going. See `MenuTop` in `components/nav/menu-top.js`.

### Icons

Render icons with `<Icon icon="House" />` from `app/ui/atoms/icon`, using Lucide names. Web draws them as CSS-mask SVGs from `/lucide/<stroke>/<Name>.svg` (generated by `apps/next/lib/generate-lucide-icons.js` from `lucide-static`); native uses `lucide-react-native` through the icon set. Never import `lucide-react`; it isn't installed. Animated icons: [animated-icons.md](animated-icons.md).

## Styling

- Design tokens (colours, radii, shadows) are the Tailwind `@theme inline` map in `packages/app/design/styles/theme.css`, with light and dark values in `palette.css`. `apps/next/tailwind.config.js` and `design/tailwind/theme.js` are not loaded by any build; a token added there does nothing.
- Settings hold class presets per component (`settings/theme/*.js`), read with `appSetting`. Use tokens and existing presets, not raw colours or arbitrary values.
- Edit the style partials in `design/styles/` (`theme.css`, `palette.css`, `utilities.css`, `global.css`), not `apps/expo/global.combined.css`, which only imports them for Uniwind.
- Variants: `web:`, `native:`, `ios:` and `android:` are defined in `design/styles/global.css`, as is `dark:`. Native switches themes with `Uniwind.setTheme`. For a JS value per theme, use `useThemeValue(light, dark)` from `app/design/theme`.
- Breakpoint tiers are mobile (no prefix), tablet (`sm:`) and desktop (`lg:`), as in `lib/responsive-classes.ts`; there is also `3xl:`. Lists size by container queries (`@container/list`, `@list-sm/list:`).
- Cards, blocks, buttons and inputs draw their outline with a shadow (`shadow-card-outline`, `shadow-block-outline`, `shadow-btn-outline`, `shadow-input-outline`). Always pair it with the dark variant, `dark:shadow-*-deep`.
- Class names must be static strings or come from static mapping objects; Tailwind and Uniwind only see classes written out in scanned files.
- In files native scans, don't use CSS-variable colours inside `box-shadow`, and don't use `calc()` that mixes `%` with a length. Put those in web-only files.
- `withUniwind` is only for third-party components; core `View`, `Text`, `Pressable`, `Image` and `TextInput` take `className` already.
- Measure only when behaviour depends on rendered size, and then with `onLayout` (web emulates it in `design/view.web.tsx` with a `ResizeObserver` only for components that pass it). Avoid feature-level DOM measurement.

### Text styles on native

On React Native, text styles don't cascade from a `View` or `Pressable` to the `Text` inside. Put text classes on the `Text` itself:

```tsx
// Wrong: the text stays black on native
<Pressable className="text-muted-foreground"><Text>Label</Text></Pressable>

// Right
<Pressable className="bg-muted"><Text className="text-muted-foreground">Label</Text></Pressable>
```

Settings follow the same split, with separate container and text presets (for example `theme.accordion.trigger` and `trigger_text`).

### Overflow and clipping

Outlines are shadows, and shadows paint outside the element box, so any clipping ancestor cuts them off (most visibly on the first and last grid columns).

- Blocks never clip. `BlockWrapper`, `Block` and `BlockContent` don't set `overflow-hidden`; `BlockWrapper`'s `clip` prop only works together with `fill`. Don't turn it on to hide a layout bug. (Blocks with `overlayHeader` are the exception.)
- Every web `ScrollView` clips both axes: `.neo-sv` is `overflow-y: auto; overflow-x: hidden`, and CSS can't scroll one axis and leave the other visible. Don't wrap block content in a `ScrollView`; page blocks already live inside the page scroller.
- Put `overflow-*` or a `ScrollView` on the one element that really scrolls or clips (a message list, a table, a fixed-height pane). For modals, use `<Modal scrollable>` instead of nesting a `ScrollView`.
- Give shadows room inside a scroller: pad the content and cancel the padding outside, for example `<ScrollView horizontal className="-mx-1" contentContainerClassName="px-1 py-1 gap-3">`.
- Clipping leaf elements is fine: rounded media (`rounded-xl overflow-hidden`), avatars, progress bars, `truncate`.

### Block design box per breakpoint

A block's chrome (background, padding, title) comes from UNA's `designbox_id`, which is one setting for every screen size. The block's App config (Studio → Developer → Pages → block → "Config (for App in JSON format)", sent as `config_api`) can set it per tier:

```json
{ "designbox": { "bg": ["tablet", "desktop"], "padding": ["mobile", "tablet", "desktop"], "title": ["desktop"], "rounded": ["tablet", "desktop"] } }
```

- Each key lists the tiers where that part shows: `mobile` (no prefix), `tablet` (`sm:`), `desktop` (`lg:`). `true` and `false` mean every tier or none.
- A missing key keeps `designbox_id`. Props passed from code (`showBg`, `showPadding`, `showTitle`) win over both.
- Keys sit under `designbox` because every `config_api` key is also spread into each element of the block as a prop.
- `components/block-wrapper.js` reads them and `ui/molecules/page/page-block.js` turns tiers into classes through `responsiveClasses`. Prefixed classes must stay listed in `@source inline(...)` in `design/styles/utilities.css`; update that list if `theme.blocks` `u-block-bg` or the block padding changes.
- List (browse) blocks skip `BlockWrapper`. The list endpoint carries their `designbox`, and `paddingForList` (`default/functions.js`) turns `bg` / `rounded` into a card around the list. This is web only: a native list scrolls under the overlaid page header.
- Use this rather than per-page or per-block overrides in code: block ids and pages differ between UNA sites.

### Fonts

Text uses two roles, `font-main` (the default in `design/typography.tsx`) and `font-title` (headings). Pick the family per role and platform in `customization/config/fonts.js` (defaults in `design/fonts/font-config.js`), for example `main: { web: 'inter', ios: 'system', android: 'inter' }`.

- `'system'` is the platform UI font: SF Pro on iOS, the device sans-serif on Android, the OS font stack on web.
- Any other value is a key of `design/fonts/font-families.js` (`'inter'`). Native needs one static file per weight (iOS and Android pick the face by `fontWeight`; variable fonts don't work). Web needs a `next/font` instance per role in `webFontFamilies` (`design/fonts/fonts-web.web.ts`).
- iOS and Android values are build settings: `apps/expo/plugins/with-app-fonts.js` embeds only the selected families, so changing them needs a prebuild and a native rebuild. At runtime `design/fonts/native-fonts.ts` points the Uniwind font variables and the navigation header fonts at the family.
- Don't set `fontFamily` inline; use `font-main` / `font-title`. Expo UI (SwiftUI / Compose) views are the exception and take `nativeFonts.main`.

## Components

### Buttons

Use `NeoButton`, `NeoButtonLink` or `NeoButtonRef` from `app/design/controls`. The legacy `Button`, `ButtonRef` and `ButtonLink` are deprecated.

- Axes: `style` (`plain`, `bordered`, `borderedProminent`, `borderless`, `link`, `glass`, `glassProminent`), `role` (`default`, `cancel`, `close`, `confirm`, `destructive`), `controlSize` (`mini`, `small`, `regular`, `large`, `xlarge`), `borderShape` and `tint`.
- Code lives in `design/controls/neo-button/`: props in `neo-button.types.ts`, scope and style precedence in `neo-button-resolver.tsx`, the legacy variant mapping in `control-scale.ts`. The theme is `neo_button` in `settings/theme/buttons.js`.
- On iOS and Android, `native.expo_ui_buttons` (`settings/configs.js`) renders buttons with native Expo UI (SwiftUI / Compose) views; the `expoUI` prop controls it per button.
- `/pg` is a playground for every axis (`apps/next/app/pg/page.js`, `apps/expo/app/pg/`). It isn't gated, so production builds serve it too.

### Page header

The page header is mounted once per `Layout` (`ui/molecules/header/page-header.js` / `.web.js`). A page never writes header state from an effect; it declares what it needs in its render tree with `PageHeaderOptions` from `app/ui/molecules/header/options`:

```tsx
<PageHeaderOptions sub={subHeader} mobileOnly />   // sub row on mobile only (feed switcher, tab bar)
<PageHeaderOptions backButton title="Post" />      // item page
<PageHeaderOptions main={<MobileChatHeader />} /> // replace the whole bar
<PageHeaderOptions actions={actions} />            // header actions
<PageHeaderOptions hidden />                       // no header (a cover owns the top)
```

Only passed props take part in the merge. Mount registers, unmount removes, a prop change updates: gate with JSX or `mobileOnly`, not with `useEffect` / `useFocusEffect`. Later-mounted instances win per key and fall back on unmount (a modal over a page). Memoize `sub` and `main` elements. Hidden native tabs have their own `Layout`, so no focus bookkeeping is needed. Only the measured height flows back, through `useHeaderHeight()` (`context/jotai/layout.ts`).

## Before you push

- [ ] `yarn typecheck` and `yarn lint` from `neo/` add no new errors compared with `master`.
- [ ] Web and native both checked for anything visible; the same bug often exists on the other platform.
- [ ] Shared code is in `packages/app`; app-only code stays in `apps/next` or `apps/expo`.
- [ ] Text classes are on `Text`, colours come from tokens, outline shadows have their `dark:` pair.
- [ ] UNA calls go through `fetcher` and handle guests and `{}`; images never use `src_orig`.
- [ ] Upstream: nothing added to `customization/` beyond a default re-export; no seam renamed or removed.
- [ ] Fork: nothing changed outside `customization/`.

`doctor.config.json` configures [react-doctor](https://react.doctor) (`npx -y react-doctor`), an optional sweep for dead code, accessibility and bundle size. Nothing runs it automatically.
