# Animated icons (NEO)

Some Lucide icons in menus and tab bars move a little when you point at them (web) or choose them (native), and take a light duotone fill while active. This document covers how that works and how to add an icon.

## How it works

One engine draws every animated icon from a small **spec**: the icon's Lucide node data for the 24px grid, split into parts, plus what each part does.

- **Web** ([`animated-lucide-icon.web.tsx`](packages/app/ui/atoms/animated-icons/animated-lucide-icon.web.tsx)) renders plain SVG with classes and CSS variables. All motion is CSS, in the `.nai` block of [`design/styles/global.web.css`](packages/app/design/styles/global.web.css): hovering the row (its `group` class, or the icon itself) or focusing it from the keyboard starts the motion, `data-active` gives the fill and active shapes, `:active` on the row presses the icon to 0.96. `prefers-reduced-motion: reduce` keeps the state changes (fill, Menu → X) and drops the movement. React never re-renders on hover.
- **Native** ([`animated-lucide-icon.tsx`](packages/app/ui/atoms/animated-icons/animated-lucide-icon.tsx)) renders the same parts with react-native-svg. There is no hover: the motion plays once when the icon becomes active (a tab is chosen), never on mount, from one `Animated` value; the active fill and shapes switch at once; a `pressed` scale runs on the native driver. Reduce Motion (`useReduceMotion`) turns the motion off. `draw` doesn't play on native, since it would animate path geometry every frame.
- **Loading on web.** `Icon` ([`ui/atoms/icon.tsx`](packages/app/ui/atoms/icon.tsx)) hands animated icons to [`host.web.tsx`](packages/app/ui/atoms/animated-icons/host.web.tsx), which draws the static icon (the `/lucide/*` mask, or the inline copy from `icons-svg.web.js`) until the engine and specs have loaded, then swaps in the animated SVG. They load in their own chunks once the page is idle after hydration, or on the first pointer or focus move. The static and animated icons have the same geometry, so the swap moves nothing; an active icon's fill fades in. Hydration always renders the static icon, so server and client HTML match. Native ([`host.tsx`](packages/app/ui/atoms/animated-icons/host.tsx)) draws the spec synchronously.
- **Names.** Lookups take the name `Icon` resolved: `findIconFromRemote`, then `currentLucideName` for icons Lucide renamed, then Lucide aliases (`LUCIDE_ASSET_ALIASES`, so UNA's `Home` finds `House`).

## Using it

Set **`animated: true`** on the menu or tab item; the row passes it to `Icon` along with `active`. Navbar items and More (`lib/util/menu.ts`), the main menu's popup rows (`components/nav/menu-header-navigation-entries.ts`; an item can opt out with `animated: false`), the tab bars (`lib/navigation/tab-bar-menu.ts`, footer and native JS tabs) and launcher items that carry it do this. On touch screens (`hover: none`) there is no hover motion, so taps never leave an icon stuck mid-hover. The row must have Tailwind's `group` class (all of these do) for hover to reach the icon on web.

`icon-scene-*` tokens in the icon's `className` turn parts off: `icon-scene-fill` alone gives only the fill, `icon-scene-draw` alone only the motion. Without a token both are on. They are not CSS utilities; `Icon` strips them.

An icon of the same name in a fork's `customization/icons-svg.js` wins over the animated registry, so a fork's own drawing is never animated. Upstream's inline copies of hot Lucide icons in `default/icons-svg.web.js` (Menu, Search, Bell, Plus, Image, Camera, ...) are marked `lucideInline` and do animate.

iOS SwiftUI menus and the native SwiftUI tab bar draw bundled images and can't animate.

## Registry

- **Default:** [`default/animated-icons.ts`](packages/app/default/animated-icons.ts) (native: the specs themselves) and [`default/animated-icons.web.ts`](packages/app/default/animated-icons.web.ts) (web: a loader per name), both keyed by resolved Lucide name. The specs are in [`ui/atoms/animated-icons/specs.ts`](packages/app/ui/atoms/animated-icons/specs.ts); their names are listed in [`names.ts`](packages/app/ui/atoms/animated-icons/names.ts) so the web registry needn't load them (`node --test packages/app/ui/atoms/animated-icons/names.test.ts` checks the two agree).
- **Forks:** spread the default in [`customization/animated-icons.js`](packages/app/customization/animated-icons.js) and add or override keys. A value can be a spec, a lazy spec, or (as before) a component:

```javascript
import { animatedIcons as animatedIconsDefault } from 'app/default/animated-icons';
import { lazyAnimatedIcon } from 'app/ui/atoms/animated-icons/lazy';

export const animatedIcons = {
    ...animatedIconsDefault,
    // Loaded on demand on web; draws statically until then.
    Rocket: lazyAnimatedIcon(() => import('app/customization/animated-icons/rocket')),
};
```

A component value (`MyIcon: AnimatedMyIcon`) still works and gets the props it always had (`active`, `hovered`, `pressed`, `scenes`, ...), but it lands in the first chunk, and rows no longer pass `hovered`: on web it only sees its own mouse events. `animated-icons/shared.tsx` and `fill-props.ts` stay for such components. Prefer a spec.

**Default keys (upstream):** House, Compass, TvMinimalPlay, Store, Shapes, Calendar, Bell, Info, Mail, Menu, MessageCircleMore, UsersRound, UserRound, File, FileText, MessagesSquare, SquareCheck, LayoutDashboard, Search, Plus, CircleStar, Image, Hash, BookText, Briefcase, ShoppingCart, Building, Camera, Film, BookOpenText, CircleLetterC, Handshake, ShieldCheck, CircleGauge, QrCode.

## Writing a spec

Types are in [`types.ts`](packages/app/ui/atoms/animated-icons/types.ts).

```ts
Bell: {
    parts: [
        {
            nodes: [path('M3.262 15.326A1 1 0 0 0 4 17h16a1 ...'), path('M10.268 21a2 2 0 0 0 3.464 0')],
            fill: [0],                                               // fill the body, not the clapper
            motion: { kind: 'wiggle', deg: 10, origin: [12, 2.5] }, // swing from the top
        },
    ],
},
```

- **Nodes:** copy them from the installed `lucide-static` `icon-nodes.json` (the version the web masks and the iOS assets come from), in Lucide's order unless a part needs its own group. Recheck them after a Lucide bump.
- **`fill`:** `true` or node indexes. Closed shapes only; the active fill is 20% `currentColor`.
- **`motion`:** one quiet movement that says what the icon is.
  - `rotate` / `shift` hold while hovered and return on leave (Search tilts, Plus turns 90°).
  - `swing`, `wiggle`, `lift`, `pulse`, `draw` and `appear` play once each time the hover starts (Bell rings, Camera's lens pulses, a check is drawn).
  - `origin` is the pivot on the 24px grid; `ms` overrides the duration (defaults are 200–500 ms).
- **`stagger` / `delay`:** delay consecutive moving parts (Calendar's binder rings, Hash's strokes).
- **`active`:** a part's shape while active (`x`, `y`, `deg`, `origin`, `hide`), as Menu folds into an X; `stillWhenActive` stops the hover motion then.

Motion rules: ease-out or ease-in-out curves without overshoot, colour and fill changes around 200 ms, no hover scale, press 0.96, nothing on mount. Check the icon on web (hover, keyboard focus, reduced motion) and on a native JS tab bar.
