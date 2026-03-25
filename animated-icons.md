# Animated icons (NEO)

This document describes how **Lucide-based animated icons** are wired in the monorepo so they work on **web and native** without breaking `react-native-svg` on the web.

## When to use this

Use animated icons for nav items, tabs, or buttons where `Icon` is called with `animated={true}` and optional **scene** classes. Static icons keep using [`packages/app/ui/atoms/icon.js`](packages/app/ui/atoms/icon.js) / [`icon.web.js`](packages/app/ui/atoms/icon.web.js) as usual.

## End-to-end flow

1. **`Icon`** receives `animated`, `className`, and interaction props (`active`, `selected`, `hovered`, `pressed`). When `animated` is true and the icon resolves to a **string** Lucide name, it looks up a component from the registry (see below).
2. **Scene classes** in `className` are parsed by [`packages/app/ui/atoms/animated-icons/parse-icon-scene-classes.js`](packages/app/ui/atoms/animated-icons/parse-icon-scene-classes.js). Tokens like `icon-scene-fill` and `icon-scene-draw` are turned into a `scenes` object and **stripped** from the class string passed to the animated component.
3. **Web-only hover for draw:** If `scenes.draw` is set and `hovered` is not controlled from the parent, `Icon` attaches `onMouseEnter` / `onMouseLeave` on web so hover-driven animations run without a parent tracking hover.
4. The animated component receives `scenes`, `active` (often from route/selection), and merged `hovered`.

## Registry (required)

- **Default map:** [`packages/app/default/animated-icons-registry.js`](packages/app/default/animated-icons-registry.js) — export `animatedIconRegistry` keyed by **Lucide component names** as returned after `findIconFromRemote` (e.g. `House`, `Compass`). Add new entries here for upstream NEO.
- **Forks / custom apps:** extend via [`packages/app/customization/animated-icons-registry.js`](packages/app/customization/animated-icons-registry.js) by spreading `animatedIconRegistryDefault` and adding or overriding keys. **Do not** edit the customization file in the main upstream repo unless the project is a fork.

```javascript
import { animatedIconRegistry as animatedIconRegistryDefault } from 'app/default/animated-icons-registry';
import { AnimatedMyIcon } from 'app/ui/atoms/animated-icons/icons/my-icon';

export const animatedIconRegistry = {
    ...animatedIconRegistryDefault,
    MyIcon: AnimatedMyIcon,
};
```

If a name is missing from the registry, `Icon` falls back to the normal (non-animated) Lucide path.

**Default registry keys (upstream NEO):** `House`, `Compass`, `TvMinimalPlay`, `Store`, `Shapes`, `Calendar`, `Info`, `Mail`, `Menu` (see [`packages/app/default/animated-icons-registry.js`](packages/app/default/animated-icons-registry.js)).

## Enabling animation in menus / UI

- Set **`animated: true`** on the item (e.g. in [`packages/app/settings/menus.js`](packages/app/settings/menus.js) or tab config) where the row passes props into `Icon`.
- Use **`addClassName`** (or the appropriate class hook for that component) for scenes, e.g.  
  `icon-scene-fill web:hover:icon-scene-draw`  
  — **fill** for active/selected duotone-style treatment, **draw** for hover path / motion on web (`web:hover:` limits the variant to web).

Scene names supported by the parser: `fill`, `draw`, `morph`, `smoke`, `custom1`–`custom6` (see `parse-icon-scene-classes.js`).

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
- [ ] Menu or parent passes `animated` + scene classes if fill/hover behavior is required.
- [ ] New icon tested on **web** and **native** (or native-only features gated with `Platform.OS`).
- [ ] No `measureLayout` / layout thrash introduced from the icon itself (icons should stay self-contained).

For general icon and styling rules, see [agents.md](agents.md) (Styling Guidelines, cross-platform components).
