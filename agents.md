# AI Agent Instructions for NEO Monorepo

> **Purpose:** This document provides structured guidance for LLM coding agents working on the NEO monorepo. Follow these instructions to maintain code quality, consistency, and project integrity.

---

## Table of Contents

- [NEO project summary](#neo-project-summary)
- [Installed agent skills](#installed-agent-skills)
- [Skill precedence (NEO vs generic guidance)](#skill-precedence-neo-vs-generic-guidance)
- [Customization and fork branches](#customization-and-fork-branches)
- [Project Structure Rules](#project-structure-rules)
- [Framework Awareness](#framework-awareness)
- [Server vs Client Components](#server-vs-client-components)
- [Component Architecture](#component-architecture)
- [Styling Guidelines](#styling-guidelines)
- [Animated icons (NEO)](#animated-icons-neo)
- [UNA CMS API Integration](#una-cms-api-integration)
- [Image sources (UNA → next/image)](#image-sources-una--nextimage)
- [Code Quality Checklist](#code-quality-checklist)

---

## NEO project summary

NEO is a **Yarn workspaces monorepo** with **Turborepo** ([`turbo.json`](turbo.json)): shared application code lives in [`packages/app`](packages/app), the web app in [`apps/next`](apps/next) (Next.js 16, App Router), and the native app in [`apps/expo`](apps/expo) (Expo 57, React Native). Styling uses **Uniwind** (Tailwind CSS v4 syntax for React Native) on native and **Tailwind CSS 4** (via `@tailwindcss/postcss`) on web, with semantic design tokens from settings—see [README.md](README.md) for versions, scripts (`yarn web`, `yarn native`), and setup, and [uniwind.md](uniwind.md) for the NativeWind→Uniwind migration notes.

**Product integration** (see also [.cursorrules](.cursorrules)): the frontend targets **UNA CMS** APIs (not a generic REST backend). Use [`app/lib/fetcher`](packages/app/lib/fetcher.ts) for requests, follow `/api.php?r=module/action/Template` patterns, respect proxy/env configuration for web vs native, and use **Pusher** where real-time updates are required. Authentication and menus follow existing `currentUser` and [`app/lib/util`](packages/app/lib/util.ts) patterns. **Routing**: Expo Router under `apps/expo/app/`, Next.js App Router under `apps/next/app/`.

**Backend contract for UNA developers** ([`una-api` skill](.agents/skills/una-api/SKILL.md)): blocks and services must tolerate **guest (non-logged-in) users**—guard user/profile access, avoid PHP fatals, and return **JSON** for NEO. A fatal or HTML error page on a block breaks page JSON parsing and can blank the whole screen.

**How installed skills help**: Vercel-oriented skills add React/Next performance guidance, cache/PPR notes, Turborepo usage, UI/accessibility audits, deploy automation, browser automation, and Expo/native UI patterns. They **do not** replace NEO-specific rules above when the two conflict—see [Skill precedence](#skill-precedence-neo-vs-generic-guidance).

---

## Installed agent skills

Skills are installed with the [Vercel Agent Skills](https://vercel.com/docs/agent-resources/skills) workflow (`npx skills add <owner/repo>`, optionally `--skill <id>`). **Canonical copy:** [`.agents/skills/`](.agents/skills/) at the repo root (one directory per skill, typically with `SKILL.md`). The CLI also writes **`skills-lock.json`** at the repo root (version pins/hashes for reproducibility) and may create **`.claude/skills/`** symlinks into `.agents/skills/`. **Trae** and **Windsurf** are not used—`.trae/` and `.windsurf/` are gitignored if recreated. This repo also ships **local** skills (not from `npx skills`): [`una-api`](.agents/skills/una-api/SKILL.md) and [`react-doctor`](.agents/skills/react-doctor/SKILL.md). Commit **`.agents/`**, **`skills-lock.json`**, and **`.claude/skills/`** so the team shares the same capabilities; they are not ignored by default.

**CLI note:** the `skills` package uses **different `--skill` ids** than some GitHub folder names—for `vercel-labs/agent-skills`, use ids such as `vercel-react-best-practices`, `vercel-composition-patterns`, and `vercel-react-native-skills` (not always the short folder names). Run `npx skills add <owner/repo>` interactively or check the CLI’s “Available skills” list if a flag fails.

| Skill (install id / folder) | Source repo | Use when |
|----------------------------|-------------|----------|
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React/Next performance, bundles, rerenders, server/client data patterns |
| `vercel-composition-patterns` | same | Compound components, reducing boolean prop sprawl, scalable component APIs |
| `vercel-react-native-skills` | same | React Native / Expo performance, lists, navigation, images, gestures |
| `web-design-guidelines` | same | Auditing web UI for a11y, UX, forms, motion—map suggestions to **design tokens** where applicable |
| `deploy-to-vercel` | same | Deploy flows and Vercel-oriented deployment tasks |
| `next-best-practices` | [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) | Next.js app patterns, bundling, fonts, hydration, async |
| `next-cache-components` | same | Cache Components / `use cache` / PPR-oriented guidance |
| `next-upgrade` | same | Next.js upgrade assistance (CLI may flag **higher codegen risk**—review changes) |
| `turborepo` | [vercel/turborepo](https://github.com/vercel/turborepo) | Task graph, caching, CI, monorepo boundaries |
| `agent-browser` | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | Browser automation / debugging workflows tied to that toolchain |
| `building-native-ui` | [expo/skills](https://github.com/expo/skills) | Expo Router native UI patterns (tabs, media, controls)—complements shared `packages/app` code |
| `uniwind` | [uni-stack/uniwind](https://github.com/uni-stack/uniwind) | Uniwind / Tailwind CSS v4 styling in React Native: `className` on RN components, theming, variants, Metro config |
| `una-api` | NEO (local, [`.agents/skills/una-api`](.agents/skills/una-api)) | UNA CMS guest-safe blocks, JSON API responses, `fetcher`/`/api.php?r=...` alignment with `packages/app` |
| `react-doctor` | NEO (local, [`.agents/skills/react-doctor`](.agents/skills/react-doctor)) | Code-quality sweep when finishing a feature or before committing: lint, dead code, a11y, bundle size, architecture diagnostics |

---

## Skill precedence (NEO vs generic guidance)

1. **UNA integration** — Always use [`fetcher`](packages/app/lib/fetcher.ts), correct `/api.php?r=...` endpoints, env/proxy rules, and expectations in the [`una-api` skill](.agents/skills/una-api/SKILL.md). Generic Next/React skills may assume arbitrary APIs.
2. **Cross-platform** — Shared UI and logic belong in `packages/app`; keep [`icon.tsx`](packages/app/ui/atoms/icon.tsx) / [`iconset.tsx`](packages/app/ui/atoms/iconset.tsx) / [`iconset.web.tsx`](packages/app/ui/atoms/iconset.web.tsx) and other platform splits consistent with [.cursorrules](.cursorrules). For **animated** Lucide icons (registry, scenes, SVG constraints), follow [animated-icons.md](animated-icons.md).
3. **Design system** — Prefer semantic tokens and existing components over hardcoded colors or ad hoc Tailwind from generic “design audit” outputs.
4. **React Compiler** — This repo targets Next.js 16 with React Compiler; follow [Framework Awareness](#framework-awareness) here. Skills that push blanket `memo`/`useCallback` should be applied only when justified (profiling or clear benefit).
5. **Server vs client** — RSC applies in [`apps/next/app`](apps/next/app) only. Shared code in [`packages/app`](packages/app) is predominantly client (`'use client'`) because it must also run under Expo. Do not strip `'use client'` from `packages/app` for “RSC purity.”

---

## Customization and fork branches

**Extension point for derivative work:** [`packages/app/customization/resources/agents.md`](packages/app/customization/resources/agents.md) and [`packages/app/customization/resources/claude.md`](packages/app/customization/resources/claude.md) **reference** this file and [`CLAUDE.md`](CLAUDE.md) at the repo root and hold **per-project** notes (client UNA setup, deployment, team conventions). See [`packages/app/customization/resources/README.md`](packages/app/customization/resources/README.md) for the full workflow.

**Merge hygiene:** On the **upstream** monorepo, keep those customization files **small** so they seldom conflict. In **branch or fork projects** that track upstream, **prefer changing only files under `packages/app/customization/`** (including `resources/`) instead of editing root `AGENTS.md` / `CLAUDE.md` or default files under `packages/app/` when a customization hook exists—so upstream merges stay straightforward.

---

## Project Structure Rules

The active monorepo surface is:

```
apps/next
apps/expo
packages/app
```

### Rules for Main Apps

When working on `next` or `expo`:

1. **Share code through `packages/app`**
2. **Follow the established component hierarchy** (see Component Architecture)
3. **Keep web and native implementations aligned**
4. **Use Uniwind (native) + Tailwind CSS 4 conventions already established in the repo**

### Import Verification

Before adding imports, verify the source:

```javascript
// ✅ CORRECT for main apps
import { Button } from 'app/ui/atoms/button';
import { settings } from 'app/customization/settings';

// ❌ WRONG - bypassing shared app code from feature files
import { SomeExternalComponent } from 'external-lib';
```

---

## Framework Awareness

### Always Check Installed Versions

Before implementing features, **verify the installed framework versions**:

```bash
# Check package.json in the relevant app directory
cat apps/next/package.json | grep -E '"next"|"react"'
cat apps/expo/package.json | grep -E '"expo"|"react-native"'
```

### Current Framework Versions (Keep Updated)

| Framework | Version | Key Changes |
|-----------|---------|-------------|
| **Next.js** | 16.3.x | React Compiler support (stable), new caching patterns, `use cache` directive |
| **React** | 19.2.x | Actions, `use()` hook, improved Suspense |
| **Expo** | 57.x | New Architecture enabled by default, expo-router 57 |
| **React Native** | 0.86.x | Bridgeless mode, concurrent features |
| **Tailwind CSS** | 4.2.x | Web via `@tailwindcss/postcss` |
| **Uniwind** | 1.6.x | Native Tailwind v4 (`apps/expo/global.combined.css`) |

### Lookup Documentation When Uncertain

If you're unsure about best practices for the installed version:

1. **Next.js 16:** Check https://nextjs.org/docs for latest patterns
2. **Expo 57:** Check https://docs.expo.dev for latest APIs
3. **React 19:** Check https://react.dev for new patterns

### React Compiler

The React Compiler is **enabled** in both apps: `reactCompiler: true` in [`apps/next/next.config.js`](apps/next/next.config.js) (client bundle only) and `experiments.reactCompiler: true` in [`apps/expo/app.config.js`](apps/expo/app.config.js) (via `babel-preset-expo`, app code only). Shared code in `packages/app` is compiled by both.

- The compiler **skips** any component or hook that breaks the Rules of React and leaves it as written — nothing breaks, it just stays unoptimized. `yarn lint` reports these as `react-hooks/*` errors (`refs`, `immutability`, `static-components`, `preserve-manual-memoization`, …); fixing them is how a component *gets* compiled.
- Do **not** mass-remove `useMemo` / `useCallback` / `memo`. In a skipped component they still do their job. Drop manual memoization only in files that lint clean, and only when it serves no other purpose (e.g. a stable callback for a subscription).
- Escape hatch: the `'use no memo'` directive at the top of a file or component body opts it out. Forks can turn the compiler off entirely via `customization/config/next.config.js` (`reactCompiler: false`) and `customization/config/app.config.js` (`experiments: { reactCompiler: false }`).
- Watch for "stale UI" after enabling: code that mutates an object from props/state in place (handlers, `emitter` callbacks) and expects children to re-render will not — memoized children see the same reference. Create new objects instead.
- Do not dispatch no-op state updates from effects (`setState(prev => prev)` "just in case"). Compare first and return. While a fiber still holds a low-priority update (e.g. idle hydration of the page `<Suspense>`) React cannot bail out eagerly, and a no-op dispatch keeps a sync render loop alive — see `MenuTop` in [`components/nav/menu-top.js`](packages/app/components/nav/menu-top.js).

---

## Server vs Client Components

### Where each model applies (NEO)

| Layer | Default | Notes |
|-------|---------|--------|
| [`apps/next/app`](apps/next/app) | **Server Components** | Thin shells: fetch page JSON, pass into shared client tree |
| [`packages/app`](packages/app) | **Client** (`'use client'`) | Shared with Expo/React Native — not RSC |
| [`apps/expo`](apps/expo) | Client / native | Expo Router; no RSC |

Prefer Server Components **inside `apps/next/app`** when they do not need hooks or browser APIs. Do **not** refactor shared `packages/app` UI into RSC.

```javascript
// ✅ PREFERRED in apps/next/app — Server Component page shell
export default async function Page() {
  const data = await fetchData();
  return <Root initialData={data} />; // packages/app Root is client
}

// ✅ EXPECTED in packages/app — Client Component
'use client';
export default function InteractiveWidget() {
  const [state, setState] = useState();
  // ...
}
```

### When Client Components Are Required (Next app routes)

Use `'use client'` in `apps/next` **only** for:

1. **React hooks that require client state:** `useState`, `useEffect`, `useRef`
2. **Browser APIs:** `window`, `document`, `localStorage`, `navigator`
3. **Event handlers that need state:** Click handlers with state updates
4. **Third-party client-only libraries**
5. **Anything imported from `packages/app` that already needs the client boundary** (usually already marked)

### Island Architecture Pattern

When you must use client components under Next, **wrap them as islands** so parent server components can still stream:

```javascript
// ✅ CORRECT - Island pattern
// components/interactive-widget.client.js
'use client';
export function InteractiveWidget({ initialData }) {
  const [state, setState] = useState(initialData);
  return <button onClick={() => setState(s => s + 1)}>{state}</button>;
}

// app/page.js (Server Component)
import { Suspense } from 'react';
import { InteractiveWidget } from './components/interactive-widget.client';

export default async function Page() {
  const data = await fetchData(); // Server-side fetch
  return (
    <div>
      <h1>{data.title}</h1> {/* Server rendered */}
      <Suspense fallback={<div>Loading...</div>}>
        <InteractiveWidget initialData={data.count} />
      </Suspense>
    </div>
  );
}
```

### Next.js 16 Caching Patterns

Use the new `use cache` directive for data caching:

```javascript
// ✅ Modern caching pattern (Next.js 16+)
import { cacheLife } from 'next/cache';

async function getCachedData() {
  'use cache';
  cacheLife('hours'); // or 'minutes', 'days', 'weeks', 'max'
  return await fetchExpensiveData();
}

// ❌ AVOID - Old pattern
// unstable_cache is deprecated in favor of 'use cache'
```

### Data Fetching Hierarchy

1. **Server Components** - Fetch directly with async/await
2. **`use cache` directive** - For expensive operations needing caching
3. **Route Handlers** - For API endpoints
4. **Client-side fetching** - Only when server-side is impossible (real-time updates, user-specific client data)

---

## Component Architecture

### Component Hierarchy

Follow the established pattern for organizing components:

```
packages/app/
├── ui/
│   ├── primitives/     # Basic building blocks (View, Text wrappers)
│   ├── atoms/          # Simple, single-purpose components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   └── molecules/      # Composite components
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       └── profile-hover-card.tsx
├── components/
│   ├── elements/       # Page section components
│   ├── units/          # List item renderers
│   ├── forms/          # Form components
│   └── nav/            # Navigation components
```

### Component Creation Rules

0. **Write new files in TypeScript.** New files in `packages/app` are `.ts` / `.tsx` with typed props; when you substantially rework a `.js` file, convert it (`git mv` first so history follows). A `.web` / `.native` pair shares its props through a `*.types.ts` file (see [TypeScript Safety](#typescript-safety-critical-for-production-builds)). Run `yarn typecheck` before finishing.

1. **Never add external components directly to pages/features**
   
   ```javascript
   // ❌ WRONG - Installing component in page
   // app/dashboard/page.js
   import { SomeExternalComponent } from 'external-lib';
   
   // ✅ CORRECT - Wrap in ui/atoms or ui/molecules first
   // packages/app/ui/atoms/some-component.js
   import { SomeExternalComponent } from 'external-lib';
   export function SomeComponent(props) {
     return <SomeExternalComponent {...props} />;
   }
   
   // Then use in pages
   import { SomeComponent } from 'app/ui/atoms/some-component';
   ```

2. **Check for existing components before creating new ones**
   
   ```bash
   # Search for existing components
   grep -r "ComponentName" packages/app/ui/
   grep -r "similar-functionality" packages/app/
   ```

3. **Follow the component map pattern for overridable components**
   
   ```javascript
   // packages/app/customization/molecules/_map.js
   import { componentsMapDefault } from 'app/ui/molecules/_map';
   import CustomComponent from 'app/customization/molecules/my-component';
   
   componentsMapDefault['my-component'] = CustomComponent;
   export const componentsMap = componentsMapDefault;
   ```

### Cross-Platform Components

When creating components for both web and native:

```javascript
// component.tsx (shared logic or web default)
export function Component({ ...props }) {
  return <View><Text>Web/Shared</Text></View>;
}

// component.native.tsx (native-specific)
export function Component({ ...props }) {
  return <View><Text>Native</Text></View>;
}

// component.web.tsx (web-specific, if needed)
export function Component({ ...props }) {
  return <div>Web Only</div>;
}
```

### Page header (title, back, sub row, custom bar)

The page header is mounted once per `Layout` ([`ui/molecules/header/page-header.js`](packages/app/ui/molecules/header/page-header.js) / `.web.js`). A page never writes header state from an effect — it **declares** what it needs in its own render tree with [`PageHeaderOptions`](packages/app/ui/molecules/header/options.js):

```jsx
import { PageHeaderOptions } from 'app/ui/molecules/header/options';

// mobile-only sub row (feed switcher, conductor tab bar, wiki controls)
{isDesktop ? null : <PageHeaderOptions sub={subHeader} />}
// item page: title + back button
<PageHeaderOptions backButton title="Post" />
// replace the whole bar (messenger chat header)
<PageHeaderOptions main={<MobileChatHeader … />} />
// no page header at all (profile cover owns the top)
<PageHeaderOptions hidden />
```

Rules: only passed props take part in the merge; mount registers, unmount removes, prop change updates — so gate with JSX (`isDesktop ? null : …`), not with `useEffect`/`useFocusEffect`. Later-mounted instances win per key and fall back on unmount (modal over a page). Memo `sub`/`main` elements. Hidden native tabs have their own `Layout`, so no focus/blur bookkeeping is needed. Only the measured height flows back through `useHeaderHeight()` ([`context/jotai/layout.js`](packages/app/context/jotai/layout.ts)).

---

## Styling Guidelines

### Use Existing Design Tokens

**Always use design tokens from settings** - never hardcode colors or spacing:

```javascript
// ✅ CORRECT - Using design tokens
<View className="bg-card text-card-foreground border-border rounded-xl p-4">

// ❌ WRONG - Hardcoded values
<View className="bg-white text-gray-900 border-gray-200 rounded-[12px] p-[16px]">
```

### Theme Token Categories

Reference tokens from `packages/app/default/settings.js` (and the `packages/app/settings/` modules it composes):

| Category | Examples |
|----------|----------|
| **Colors** | `bg-card`, `text-foreground`, `border-border`, `bg-primary` |
| **Spacing** | Use Tailwind scale: `p-2`, `p-3`, `p-4`, `gap-2`, `gap-4` |
| **Typography** | `text-sm`, `text-base`, `text-lg`, `font-medium`, `font-semibold` |
| **Borders** | `rounded-lg`, `rounded-xl`, `rounded-2xl`, `border`, `border-border/60` |
| **Shadows** | `shadow-sm`, `shadow-md`, `shadow-lg` |

### Button Styling

Use button variants from settings:

```javascript
// Available variants (from settings.theme.button_styles)
<Button variant="default" />   // Neutral/popover style
<Button variant="primary" />   // Primary action
<Button variant="secondary" /> // Secondary action
<Button variant="text" />      // Text-only button
<Button variant="link" />      // Link-style button
<Button variant="outline" />   // Bordered button
<Button variant="danger" />    // Destructive action
```

### Responsive Design

Use Tailwind breakpoints consistently:

```javascript
// Mobile-first responsive design
<View className="
  p-2 gap-2           // Mobile
  sm:p-3 sm:gap-3     // Small screens (640px+)
  md:p-4 md:gap-4     // Medium screens (768px+)
  lg:p-6              // Large screens (1024px+)
  xl:max-w-7xl        // Extra large (1280px+)
  2xl:max-w-screen-2xl // 2XL (1536px+)
">
```

### Dark Mode

Use semantic color tokens that automatically adapt:

```javascript
// ✅ CORRECT - Automatic dark mode
<View className="bg-card text-card-foreground">

// ⚠️ AVOID - Manual dark mode (only when necessary)
<View className="bg-white dark:bg-gray-900">
```

### Native Text Style Inheritance (Critical)

**On React Native, text styles do NOT cascade from View/Pressable parents to Text children.** This is a fundamental difference from web CSS.

```javascript
// ❌ WRONG - Text color on Pressable won't apply to Text child on native
<Pressable className="text-muted-foreground">
  <Text>This text will be BLACK on native, correct on web</Text>
</Pressable>

// ✅ CORRECT - Apply text styles directly to Text component
<Pressable className="bg-muted">
  <Text className="text-muted-foreground">This works on both platforms</Text>
</Pressable>
```

**When to watch for this issue:**
- Text appears black on native but correct color on web
- Text color semantic tokens (`text-foreground`, `text-muted-foreground`) seem "broken" on native
- Components using `inheritColor` patterns from web CSS

**Solution pattern for settings-based styles:**

```javascript
// In packages/app/default/settings.js (or settings/* modules) - separate container and text classes
feed: {
  post_trigger: 'active:bg-muted rounded-lg flex-auto',           // Container styles
  post_trigger_text: 'font-medium text-muted-foreground',         // Text styles
}

// In component - apply to correct elements
<Pressable className={appSetting('feed', 'post_trigger')}>
  <Text className={appSetting('feed', 'post_trigger_text')}>Content</Text>
</Pressable>
```

**Note:** Semantic tokens work perfectly in Uniwind - ensure they're applied to the correct element type.

### Overflow and Clipping in Blocks

Cards, tiles, and bordered buttons draw their outline with `shadow-*`, which paints **outside** the element box. Any clipping ancestor cuts it off, most visibly on the first and last grid columns.

- **Blocks never clip.** `BlockWrapper` / `Block` / `BlockContent` don't set `overflow-hidden`. `BlockWrapper`'s `clip` prop is opt-in (only honored with `fill`) — don't turn it on to hide a layout bug.
- **Every web `ScrollView` clips both axes.** `.neo-sv` is `overflow-y: auto; overflow-x: hidden`, and CSS can't scroll one axis while leaving the other visible. Don't wrap block content in a `ScrollView` "just in case": page blocks already live inside the page scroller.
- **The scroller owns overflow.** Put `overflow-*` / `ScrollView` on the one element that actually needs to scroll or clip (a message list, a table, a fixed-height pane), not on a shared wrapper. For modals, use `<Modal scrollable>` rather than nesting a `ScrollView`.
- **Give shadows room inside a scroller.** When a scroller holds shadowed cards, pad the content and cancel the padding outside so alignment doesn't shift:

```javascript
// ✅ Shadows fit inside the clipped box, edges still line up with siblings
<ScrollView horizontal className="-mx-1" contentContainerClassName="px-1 py-1 gap-3">
  {cards}
</ScrollView>

// ❌ Cards touch the scroller edge; outline shadow is clipped
<ScrollView horizontal contentContainerClassName="gap-3">{cards}</ScrollView>
```

Leaf-level clipping is fine and expected: rounded media (`rounded-xl overflow-hidden` around an image or video), avatars, progress bars, and `truncate` text.

### Block Design Box per Breakpoint

A block's chrome (card background, padding, title) comes from UNA's `designbox_id`, which is one setting for every screen size. The block's App config (Studio → page builder → block → "Config (for App in JSON format)", sent as `config_api`) can set it per breakpoint, with the same tiers as the page config's `padding` / `gap`:

```json
{ "designbox": { "bg": ["tablet", "desktop"], "padding": ["mobile", "tablet", "desktop"], "title": ["desktop"], "rounded": ["tablet", "desktop"] } }
```

- Each key lists the tiers where that part shows: `mobile` (base), `tablet` (`sm:`), `desktop` (`lg:`). `true` / `false` mean every tier / none.
- A missing key keeps `designbox_id`. Props passed from code (`showBg`, `showPadding`, `showTitle`) still win over both.
- Keys are nested under `designbox` because `config_api` keys are also spread into every element of the block as props.
- `BlockWrapper` reads them and `page-block.js` turns tiers into classes through `responsiveClasses` (presets `bg`, `block-pad-x` / `block-pad-y`, `title`, `rounded`). Prefixed classes must stay listed in `@source inline(...)` in `design/styles/utilities.css`; update that list if a fork changes `theme.blocks` `u-block-bg` or the block padding.
- **List (browse) blocks** skip `BlockWrapper`. The conductor carries their `designbox` on the list endpoint, and `paddingForList` (`default/functions.js`) turns `bg` / `rounded` into a card around the list, with space around it where it shows. Web only: a native list scrolls under the overlaid page header, so a card would reach up under it. Example: Notifications (`bx_notifications_view`) uses `{"designbox": {"bg": ["desktop"]}}`, a card from 1024px up only.
- Use this instead of per-page or per-block overrides in app code: block ids and pages differ between UNA sites.

---

## Animated icons (NEO)

NEO supports optional **animated** Lucide icons (filled/active states, web hover “draw” scenes, etc.) via a small registry and scene classes on `Icon`. **Do not** guess the wiring: read **[animated-icons.md](animated-icons.md)** for registry keys, `icon-scene-*` classes, fork customization, and implementation pitfalls (especially **web + react-native-svg**).

## NeoButton (design-system button)

`NeoButton` is the SwiftUI-faithful button in [`packages/app/design/controls/`](packages/app/design/controls/) (`role`, `style`, `controlSize`, `borderShape`, `tint` axes, providers, transitions, shadow-based surfaces). Full API reference, resolver/scope precedence, SwiftUI/Expo UI mapping, and migration table live in **[`packages/app/design/controls/README.md`](packages/app/design/controls/README.md)**. A live playground for every axis is at the dev-only `/pg` route ([`apps/next/app/pg/page.js`](apps/next/app/pg/page.js)).

---

## UNA CMS API Integration

UNA **backend** requirements (guest users, JSON responses, block safety) for NEO are documented in the **[`una-api` skill](.agents/skills/una-api/SKILL.md)**.

### Using the Fetcher

**Always use the `fetcher` function** for UNA API calls:

```javascript
import { fetcher } from 'app/lib/fetcher';

// Fetch data from UNA CMS
const data = await fetcher('/api.php?r=module/action/Template&params[]=JSON');
```

### UNA API Endpoint Pattern

UNA APIs follow this structure:

```
/api.php?r={module}/{action}/{Template}&params[]={param1}&params[]={param2}
```

Examples:
```javascript
// Get user profile
'/api.php?r=system/get_data_api/TemplServiceProfiles&params[]=' + userId

// Get timeline feed
'/api.php?r=bx_timeline/get/&params[]=' + JSON.stringify(params)

// Get comments
'/api.php?r=system/get_data_api/TemplCmtsServices'
```

### Image sources (UNA → next/image)

**Never send original uploads (`src_orig`) to `Image` / next/image** — web or native. UNA already transcodes; NEO only further optimizes that display URL.

1. Pick the URL with [`pickUnaDisplaySrc`](packages/app/lib/image-helpers.ts) / [`toUnaDisplayImageItem`](packages/app/lib/image-helpers.ts) (`src`, then `medium` / `small` / `thumb` / `file`). Do not read `src_orig`.
2. Render through `app/ui/atoms/image` only. Web uses next/image; native uses the same helper → `/_next/image`.
3. Spreading a UNA object (`<Image {...image} />`) is safe: `getImageSrc` ignores `src_orig`. Flattening a list must still call `toUnaDisplayImageItem` so the original is not copied into `src`.
4. `useOriginalImage` in the atom means “optimizer request failed, use the UNA display URL” — not `src_orig`.

```javascript
import { pickUnaDisplaySrc, toUnaDisplayImageItem } from 'app/lib/image-helpers';

<Image {...image} /> // Image atom drops src_orig
const slides = images.map(toUnaDisplayImageItem).filter(Boolean);
```

### Authentication Handling

Check authentication state before protected operations:

```javascript
import { useCurrentUser } from 'app/context/user';

function ProtectedComponent() {
  const { currentUser, isLoading } = useCurrentUser();
  
  if (isLoading) return <Loading />;
  if (!currentUser) return <LoginPrompt />;
  
  return <AuthenticatedContent user={currentUser} />;
}
```

### Server-Side Authentication

For server components, use Bearer token authentication:

```javascript
// Server-side fetch with auth
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Real-Time Updates

Use Pusher for real-time features:

```javascript
import Pusher from 'pusher-js';
import { settings } from 'app/customization/settings';

// Connect to Pusher (configured in settings)
const pusher = new Pusher(settings.config.sockets.key, {
  cluster: settings.config.sockets.host,
});

// Subscribe to channels
const channel = pusher.subscribe('channel-name');
channel.bind('event-name', (data) => {
  // Handle real-time update
});
```

---

## Code Quality Checklist

Before submitting changes, verify:

### TypeScript Verification
- [ ] Run `yarn typecheck` from the repo root (web + native)
- [ ] No "Object is possibly 'undefined'" errors
- [ ] Array access uses optional chaining (`array[0]?.prop`)
- [ ] Object property access handles null/undefined cases

### Project Boundaries
- [ ] Shared code lives in `packages/app`
- [ ] App-specific code stays inside `apps/next` or `apps/expo`
- [ ] No dead or removed app references are introduced

### Framework Compliance
- [ ] Using latest patterns for installed Next.js version
- [ ] Using latest patterns for installed Expo version
- [ ] In `apps/next/app`: Server Components preferred for page shells / data fetch
- [ ] In `packages/app`: client shared UI — do not strip `'use client'` for RSC
- [ ] Client islands under Next wrapped in Suspense where appropriate

### Component Architecture
- [ ] New external libraries wrapped in ui/atoms or ui/molecules
- [ ] Checked for existing similar components before creating new
- [ ] Following established naming conventions
- [ ] Component placed in correct hierarchy (primitives → atoms → molecules)

### Styling
- [ ] Using design tokens, not hardcoded values
- [ ] Responsive breakpoints used consistently
- [ ] Dark mode handled via semantic tokens
- [ ] Following existing button/input variant patterns

### UNA CMS Integration
- [ ] Using `fetcher` function for API calls
- [ ] Following UNA endpoint patterns
- [ ] Images use UNA display `src` via `pickUnaDisplaySrc` / `toUnaDisplayImageItem` — never `src_orig`
- [ ] Backend expectations aligned with [`una-api` skill](.agents/skills/una-api/SKILL.md) when changing UNA blocks/services
- [ ] Authentication properly handled
- [ ] Error states managed appropriately

### Performance
- [ ] No unnecessary `'use client'` directives
- [ ] Data fetched on server when possible
- [ ] Heavy components code-split or lazy loaded
- [ ] No redundant memoization (React Compiler handles it)

### TypeScript Safety (Critical for Production Builds)

**Always run TypeScript check before committing:**

```bash
yarn typecheck          # web + native
yarn typecheck web      # one platform
```

[`scripts/typecheck.js`](scripts/typecheck.js) checks every `.ts`/`.tsx` in `packages/app` (plus the apps' own TS) once per platform, resolving `.web` / `.native` variants like webpack and Metro, and skipping a base file where a platform variant replaces it. `.ios` / `.android` files are checked in the native run too (their imports still resolve through `.native` / base files). Plain `tsc` in `apps/next` or `apps/expo` does **not** do this: it never checks `.web.tsx` / `.native.tsx` files. The Next build ignores type errors (`ignoreBuildErrors`), so this script is the only gate.

**Platform pairs share types through a `*.types.ts` file** (e.g. `video.types.ts` for `video.tsx` + `video.web.tsx`). Don't import shared types from the base file: with platform resolution, `./video` inside `video.web.tsx` resolves to `video.web.tsx` itself.

**Intentionally kept as JavaScript** (don't convert):
- `packages/app/settings/**`: plain config data read through `appSetting(...)` by string path, so types on these objects wouldn't reach callers. Forks override them from JS in `customization/settings.js`. `settings/images-allowlist.js` is also `require`d by Node in `apps/next/next.config.js`.
- `packages/app/design/tailwind/theme.js`: read by the Tailwind build.
- `packages/app/lib/image/circle-png.js`: self-contained PNG encoder; no gain from types.
- `packages/app/customization/**`: fork-override surface, see [Customization and fork branches](#customization-and-fork-branches).

**Common patterns that cause production TypeScript errors:**

1. **Array access without bounds checking:**
   ```javascript
   // ❌ WRONG - Object is possibly 'undefined'
   const firstItem = items[0].id;
   
   // ✅ CORRECT - Safe access with fallback
   const firstItem = items[0]?.id ?? defaultValue;
   ```

2. **Object property access on potentially undefined:**
   ```javascript
   // ❌ WRONG - Object is possibly 'undefined'
   const name = user.profile.name;
   
   // ✅ CORRECT - Optional chaining
   const name = user?.profile?.name ?? 'Unknown';
   ```

3. **Function parameters that could be null:**
   ```javascript
   // ❌ WRONG - Parameter might be null
   function process(data) {
     return data.value;
   }
   
   // ✅ CORRECT - Handle null case
   function process(data) {
     if (!data) return null;
     return data.value;
   }
   ```

4. **Map/filter results assumed to exist:**
   ```javascript
   // ❌ WRONG - find() can return undefined
   const item = items.find(i => i.id === id);
   console.log(item.name);
   
   // ✅ CORRECT - Check before use
   const item = items.find(i => i.id === id);
   if (item) {
     console.log(item.name);
   }
   ```

**Note:** Neither dev nor production builds fail on type errors. Always run `yarn typecheck` before pushing.

---

## Quick Reference

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | kebab-case | `profile-hover-card.js` |
| Pages (Next.js) | lowercase | `page.js`, `layout.js` |
| Screens (Expo) | kebab-case in folders | `app/(tabs)/index.tsx` |
| Utilities | kebab-case | `form-helpers.ts` |
| Types | PascalCase | `UserTypes.ts` |

### Import Aliases

```javascript
// Main apps
import { X } from 'app/...';           // packages/app
import { Y } from 'lucide-react';      // Web icons
import { Z } from 'lucide-react-native'; // Native icons
```

### Common Patterns

```javascript
// Conditional platform code
import { Platform } from 'react-native';
const isWeb = Platform.OS === 'web';

// Conditional client/server
'use client'; // Only at top of file when needed

// Cached server function (Next.js 16+)
async function getData() {
  'use cache';
  return await expensiveFetch();
}
```