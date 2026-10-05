# Animated icons (NEO)

This document describes how **Lucide-based animated icons** are wired in the monorepo so they work on **web and native** without breaking `react-native-svg` on the web.

## When to use this

Use animated icons for nav items, tabs, or buttons where `Icon` is called with `animated={true}` and optional **scene** classes. Static icons keep using [`packages/app/ui/atoms/icon.tsx`](packages/app/ui/atoms/icon.tsx) (with [`iconset.tsx`](packages/app/ui/atoms/iconset.tsx) / [`iconset.web.tsx`](packages/app/ui/atoms/iconset.web.tsx)) as usual.

## End-to-end flow

1. **`Icon`** receives `animated`, `className`, and interaction props (`active`, `selected`, `hovered`, `pressed`). When `animated` is true and the icon resolves to a **string** Lucide name, it looks up a component from the registry (see below).
2. **Scene classes** in `className` are parsed by `parseIconSceneClasses` in [`packages/app/ui/atoms/icon.tsx`](packages/app/ui/atoms/icon.tsx). Tokens like `icon-scene-fill` and `icon-scene-draw` are turned into a `scenes` object and **stripped** from the class string passed to the animated component.
3. **Web-only hover for draw:** If `scenes.draw` is set and `hovered` is not controlled from the parent, `Icon` attaches `onMouseEnter` / `onMouseLeave` on web so hover-driven animations run without a parent tracking hover.
4. The animated component receives `scenes`, `active` (often from route/selection), and merged `hovered`.

## Registry (required)

- **Default map:** [`packages/app/default/animated-icons.js`](packages/app/default/animated-icons.js) — exports `animatedIcons` keyed by **Lucide component names** as returned after `findIconFromRemote` (e.g. `House`, `Compass`). Add new entries here for upstream NEO.
- **Forks / custom apps:** extend via [`packages/app/customization/animated-icons.js`](packages/app/customization/animated-icons.js) by spreading the default `animatedIcons` and adding or overriding keys. **Do not** edit the customization file in the main upstream repo unless the project is a fork.

```javascript
import { animatedIcons as animatedIconsDefault } from 'app/default/animated-icons';
import { AnimatedMyIcon } from 'app/ui/atoms/animated-icons/icons/my-icon';

export const animatedIcons = {
    ...animatedIconsDefault,
    MyIcon: AnimatedMyIcon,
};
```

If a name is missing from the registry, `Icon` falls back to the normal (non-animated) Lucide path.

**Default registry keys (upstream NEO):** `House`, `Compass`, `TvMinimalPlay`, `Store`, `Shapes`, `Calendar`, `Bell`, `Info`, `Mail`, `Menu`, `MessageCircleMore`, `UsersRound` (see [`packages/app/default/animated-icons.js`](packages/app/default/animated-icons.js)).

## Enabling animation in menus / UI

- Set **`animated: true`** on the item (e.g. in [`packages/app/settings/menus.js`](packages/app/settings/menus.js) or tab config) where the row passes props into `Icon`. That enables **fill** (active/selected duotone) and **draw** (hover path / motion on web) by default.
- Override scenes only when needed via `className` / `addClassName` tokens such as `icon-scene-draw` (draw only) or `icon-scene-fill`. Any explicit `icon-scene-*` token replaces the default set. Do not prefix these with `web:` / `group-hover:` — they are not CSS utilities; hover is driven by the `hovered` prop / mouse handlers in `Icon`.

Scene names supported by the parser: `fill`, `draw`, `morph`, `smoke`, `custom1`–`custom6` (see `parseIconSceneClasses` in `packages/app/ui/atoms/icon.tsx`).

## Implementing a new `Animated*` component

Reference implementations:

- [`packages/app/ui/atoms/animated-icons/icons/house.js`](packages/app/ui/atoms/animated-icons/icons/house.js) — fill opacity, scale, and **draw** (stroke dash) on hover.
- [`packages/app/ui/atoms/animated-icons/icons/compass.js`](packages/app/ui/atoms/animated-icons/icons/compass.js) — fill opacity, rotation, **paths aligned with Lucide**.

Guidelines:

1. **`'use client'`** — animated icons use React state / `Animated` from `react-native`.
2. **Paths** — Copy path data from the same Lucide icon the app uses (`lucide-react-native` / `lucide-react` sources) so geometry matches the static icon.
3. **Colors** — Use `currentColor` / theme-driven stroke and fill; avoid hardcoded palette colors.
4. **Active / “duotone”** — Prefer stroked shapes plus **`fill` + `fillOpacity`** animated from `Animated` (see House/Compass), not ad hoc SVG elements that render differently on web vs native.
5. **Transforms on web** — Do **not** rely on `originX` / `originY` on `svg` `<G>` for pivot rotation. On web, `react-native-svg` can emit DOM properties that conflict with React 19. Use a **nested group**: translate to the pivot, apply rotation, translate back (see Compass).
6. **Hover edge** — For one-shot hover effects (e.g. door draw), use a ref to detect **transition from not-hovered to hovered** so the animation does not re-fire every render.
7. **Timing** — Adjust `duration`, `easing`, or spring `friction` / `tension` inside the icon file; keep durations in a sensible range (roughly hundreds of ms for UI feedback unless intentionally slow).

## Checklist

- [ ] Registry key matches the **resolved** Lucide name (`House`, `Compass`, …).
- [ ] Menu or parent passes `animated` (fill + draw are default; override with `icon-scene-*` only when needed).
- [ ] New icon tested on **web** and **native** (or native-only features gated with `Platform.OS`).
- [ ] No `measureLayout` / layout thrash introduced from the icon itself (icons should stay self-contained).

For general icon and styling rules, see [AGENTS.md](AGENTS.md) (Styling Guidelines, cross-platform components).