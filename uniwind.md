# Uniwind Migration Notes

This document is the reference checklist for the NativeWind to Uniwind transition in NEO. It is intended for developers who need to review this branch or manually reproduce the migration in a production branch.

## What Changed

- Replaced NativeWind and `react-native-css-interop` with `uniwind` in the Expo app.
- Removed the NativeWind Babel preset and `withNativeWind` Metro wrapper.
- Added `withUniwindConfig` in `apps/expo/metro.config.js` with `cssEntryFile: './global.combined.css'` and `polyfills: { rem: 14 }`.
- Moved native styling tokens into `apps/expo/global.combined.css` using Tailwind CSS 4 `@theme` variables and `@source` entries for `apps/expo/app` and `packages/app`.
- Kept the web app on its existing Tailwind CSS 3 pipeline and replaced key React Native Web styling paths with lean DOM primitives in `packages/app/design/view.js`, `view.web.js`, and `typography.js`.
- Added web-compatible `onLayout` support via `packages/app/design/view.web.js`, using `ResizeObserver` only when a component passes `onLayout`.
- Added web-specific form controls in `packages/app/design/controls/inputs.web.tsx` so common RN input props are translated to DOM props instead of depending on native styling interop.
- Removed migration-only Playwright logs/snapshots and the dashboard theme test component.

## Manual Migration Steps

1. Remove NativeWind dependencies:

```bash
yarn remove nativewind react-native-css-interop
```

1. Add Uniwind and Tailwind CSS 4 to `apps/expo`:

```bash
cd apps/expo
yarn add uniwind tailwindcss
```

1. Remove NativeWind config files and patches:

- Delete `apps/expo/nativewind-env.d.ts`.
- Delete `packages/app/nativewind.d.ts`.
- Delete `patches/react-native-css-interop+*.patch`.
- Remove `nativewind/babel` from `apps/expo/babel.config.js`.
- Remove `withNativeWind` from `apps/expo/metro.config.js`.

1. Configure Expo Metro:

```js
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.combined.css',
  polyfills: { rem: 14 },
})
```

Keep `withUniwindConfig` as the outermost wrapper if the app also customizes SVG transformers or resolver settings.

1. Create or update `apps/expo/global.combined.css`:

```css
@import 'tailwindcss';
@import 'uniwind';

@source './app';
@source '../../packages/app';

@theme inline {
  /* map NEO semantic tokens here */
}
```

1. Import theme switching in the Expo root layout:

```js
import { Uniwind } from 'uniwind'

Uniwind.setTheme(themeName !== 'auto' ? themeName : 'system')
```

1. Do not wrap core React Native components with `withUniwind`. Core `View`, `Text`, `Pressable`, `Image`, `TextInput`, and related primitives already support `className` through Uniwind.

1. Keep web separate from native where performance benefits are clear:

- Native: use React Native primitives with Uniwind.
- Web: use DOM primitives for `View`, `Text`, `Pressable`, and inputs, plus a small compatibility layer for RN props that the app actually uses.

## Measurement Pattern

Use CSS layout first. Measure only when behavior depends on rendered dimensions.

- Native: use React Native `onLayout`.
- Web: use the shared `useWebLayout` wrapper behavior from `packages/app/design/view.web.js`.
- Do not add per-feature `ResizeObserver` code unless the feature cannot be expressed through primitive `onLayout`.
- Do not measure all components. The observer only exists for components that pass `onLayout`.
- Deduplicate layout updates by comparing the last layout before calling `onLayout`.

Preferred app code:

```js
<View onLayout={({ nativeEvent: { layout } }) => setWidth(layout.width)} />
```

Avoid feature-local DOM measurement unless you need popup positioning or viewport-relative coordinates.

## Performance Expectations

Expected gains:

- Native avoids runtime css-interop work.
- Expo startup and style resolution should be more predictable.
- Web avoids extra React Native Web/css-interop styling work in high-volume primitives.
- Fewer styling dependencies and patches reduce maintenance risk.

Do not assume the transition is complete based only on visual parity. Validate with production builds, native smoke tests, and profiler data for high-traffic screens.

## Wins and Benefits for NEO

The main architectural win is a cleaner platform split: Uniwind owns native styling, while the web app uses lean DOM primitives where that is faster and easier to debug. This better matches NEO's shared `packages/app` model because common components can keep the same API while each platform gets a more natural implementation underneath.

Runtime benefits:

- Native should spend less work resolving styles at runtime because Uniwind replaces NativeWind/css-interop with a more compiled styling path.
- Web primitives such as `View`, `Text`, `Pressable`, and inputs avoid unnecessary React Native Web styling interop in high-volume UI.
- Browser layout measurement is more intentional: `ResizeObserver` only runs for components that pass `onLayout`.
- The migration removes recurring framework noise: web `useNativeDriver` warnings, `/api/icon` static-generation warnings, missing panel resize-handle warnings, and route debug logs.
- The dependency surface is smaller because `nativewind`, `react-native-css-interop`, and the css-interop patch are gone.

Development benefits:

- Platform behavior is easier to reason about: native uses React Native primitives with Uniwind, web uses DOM primitives plus a small RN compatibility layer.
- Web debugging is simpler in browser DevTools because core primitives render as direct DOM elements.
- Styling bugs are less hidden behind css-interop behavior; prop translation for web (`onPress`, `onLayout`, `pointerEvents`, inputs) lives in the design layer.
- The migration branch is easier to review because migration-only logs, snapshots, and theme test UI were removed.
- This document gives production teams a repeatable checklist instead of forcing them to infer the migration from the diff.

The strongest NEO-specific areas to measure for hard proof are native startup/style resolution, logged-in `/home`, post pages, messenger, tab navigation, dropdown-heavy menus, and animated icon usage.

## Verification Checklist

Run these after migrating:

```bash
yarn list --pattern "nativewind|react-native-css-interop|uniwind" --depth=2
cd apps/next && npx tsc --noEmit
cd apps/expo && npx tsc --noEmit
yarn build
```

Expected dependency result: `uniwind` is present, `nativewind` and `react-native-css-interop` are absent.

Also verify:

- Logged-in `/home` three-column layout resizes left and right panels.
- Menus, tabs, dropdowns, tooltips, messenger layout, post composer, and chart blocks still receive layout measurements where needed.
- Pressables show pointer cursor on web.
- Native text colors are applied directly to `Text`, not inherited from parent `View` or `Pressable`.
- Dynamic class names used by native screens are explicit enough for Tailwind CSS 4 scanning, or are represented by static mapping objects.
- Native shadow tokens do not depend on CSS variable colors inside `box-shadow`; use static native-safe color values or platform-specific classes.
- Web-only arbitrary values like `w-[calc(100%-20rem)]` are not present in files scanned by Uniwind; move those to web styles or web-only class names that native does not scan.

## Known Non-Blocking Noise

- Local HTTP development can show OneSignal errors because the SDK requires HTTPS.
