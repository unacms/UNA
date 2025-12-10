# AI Agent Instructions for NEO Monorepo

> **Purpose:** This document provides structured guidance for LLM coding agents working on the NEO monorepo. Follow these instructions to maintain code quality, consistency, and project integrity.

---

## Table of Contents

- [Project Separation Rules](#project-separation-rules)
- [Framework Awareness](#framework-awareness)
- [Server vs Client Components](#server-vs-client-components)
- [Component Architecture](#component-architecture)
- [Styling Guidelines](#styling-guidelines)
- [UNA CMS API Integration](#una-cms-api-integration)
- [Code Quality Checklist](#code-quality-checklist)

---

## Project Separation Rules

### Critical: Main vs Test Apps

The monorepo contains **two distinct ecosystems** that must be kept separate:

```
MAIN APPS (Production)          TEST APPS (Experimental)
├── apps/next                   ├── apps/webtest
├── apps/expo                   ├── apps/nativetest
└── packages/app                └── packages/test-components
```

### Rules for Test Apps

When working on `webtest` or `nativetest`:

1. **NEVER import from `packages/app`** - Use `packages/test-components` instead
2. **NEVER modify files in `apps/next` or `apps/expo`**
3. **Create new components in `packages/test-components/src/components/`**
4. **Use different styling systems:**
   - `webtest`: Tailwind CSS 4 + HeroUI v3
   - `nativetest`: Tailwind CSS 4 + Uniwind

### Rules for Main Apps

When working on `next` or `expo`:

1. **Share code through `packages/app`**
2. **Follow the established component hierarchy** (see Component Architecture)
3. **Never import from `packages/test-components`**
4. **Use NativeWind 4 + Tailwind CSS 3.4**

### Import Verification

Before adding imports, verify the source:

```javascript
// ✅ CORRECT for main apps
import { Button } from 'app/ui/atoms/button';
import { settings } from 'app/settings';

// ✅ CORRECT for test apps
import { Button } from '@neo/test-components';
import { tokens } from '@neo/test-components/theme';

// ❌ WRONG - mixing ecosystems
import { Button } from 'app/ui/atoms/button'; // in webtest
import { Button } from '@neo/test-components'; // in next/expo
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
| **Next.js** | 16.x | React Compiler support (stable), new caching patterns, `use cache` directive |
| **React** | 19.x | Actions, `use()` hook, improved Suspense |
| **Expo** | 54.x | New Architecture enabled by default, expo-router 6 |
| **React Native** | 0.81.x | Bridgeless mode, concurrent features |

### Lookup Documentation When Uncertain

If you're unsure about best practices for the installed version:

1. **Next.js 16:** Check https://nextjs.org/docs for latest patterns
2. **Expo 54:** Check https://docs.expo.dev for latest APIs
3. **React 19:** Check https://react.dev for new patterns
4. **HeroUI v3:** Check https://v3.heroui.com/docs (for webtest only)

### React Compiler

Next.js 16 has **stable React Compiler support**. This means:

- Manual `useMemo`, `useCallback`, and `React.memo` are often unnecessary
- The compiler auto-memoizes components and values
- Remove redundant memoization when it doesn't serve a specific purpose

---

## Server vs Client Components

### Default to Server Components

**Server Components are the default and preferred choice.** Only use Client Components when absolutely necessary.

```javascript
// ✅ PREFERRED - Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data.title}</div>;
}

// ⚠️ ONLY WHEN NECESSARY - Client Component
'use client';
export default function InteractiveWidget() {
  const [state, setState] = useState();
  // ...
}
```

### When Client Components Are Required

Use `'use client'` **only** for:

1. **React hooks that require client state:** `useState`, `useEffect`, `useRef`
2. **Browser APIs:** `window`, `document`, `localStorage`, `navigator`
3. **Event handlers that need state:** Click handlers with state updates
4. **Third-party client-only libraries**

### Island Architecture Pattern

When you must use client components, **wrap them as islands** to prevent blocking parent server components:

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
│   │   ├── button.js
│   │   ├── input.js
│   │   └── badge.js
│   └── molecules/      # Composite components
│       ├── card.js
│       ├── dropdown-menu.js
│       └── profile-hover-card.js
├── components/
│   ├── elements/       # Page section components
│   ├── units/          # List item renderers
│   ├── forms/          # Form components
│   └── nav/            # Navigation components
```

### Component Creation Rules

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
   // packages/app/ui/molecules/_map.js
   import { componentsMapDefault } from './_map_default';
   import CustomComponent from 'app/ui/molecules/custom/my-component';
   
   componentsMapDefault['my-component'] = CustomComponent;
   export const componentsMap = componentsMapDefault;
   ```

### Test Components (webtest/nativetest)

For test apps, use `packages/test-components`:

```
packages/test-components/src/
├── components/
│   ├── button/
│   │   ├── button.tsx        # Web version
│   │   ├── button.native.tsx # Native version
│   │   └── index.ts
│   └── ...
├── theme/
│   ├── tokens.ts
│   └── index.ts
└── index.ts
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

Reference tokens from `packages/app/settings-default.js`:

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
// In settings-default.js - separate container and text classes
feed: {
  post_trigger: 'active:bg-muted rounded-lg flex-auto',           // Container styles
  post_trigger_text: 'font-medium text-muted-foreground',         // Text styles
}

// In component - apply to correct elements
<Pressable className={appSetting('feed', 'post_trigger')}>
  <Text className={appSetting('feed', 'post_trigger_text')}>Content</Text>
</Pressable>
```

**Note:** Semantic tokens work perfectly in NativeWind - ensure they're applied to the correct element type.

---

## UNA CMS API Integration

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
import { settings } from 'app/settings';

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
- [ ] Run `npx tsc --noEmit` in the relevant app directory
- [ ] No "Object is possibly 'undefined'" errors
- [ ] Array access uses optional chaining (`array[0]?.prop`)
- [ ] Object property access handles null/undefined cases

### Project Separation
- [ ] Changes to test apps don't import from `packages/app`
- [ ] Changes to main apps don't import from `packages/test-components`
- [ ] No cross-contamination between ecosystems

### Framework Compliance
- [ ] Using latest patterns for installed Next.js version
- [ ] Using latest patterns for installed Expo version
- [ ] Server Components preferred over Client Components
- [ ] Client Components wrapped in Suspense where appropriate

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
# Check specific app
cd apps/webtest && npx tsc --noEmit
cd apps/next && npx tsc --noEmit
cd apps/expo && npx tsc --noEmit
```

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

**Note:** Development builds may not catch all TypeScript errors that strict production builds will catch. Always verify with `tsc --noEmit` before pushing.

---

## Quick Reference

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | kebab-case | `profile-hover-card.js` |
| Pages (Next.js) | lowercase | `page.js`, `layout.js` |
| Screens (Expo) | kebab-case in folders | `app/(tabs)/index.tsx` |
| Utilities | kebab-case | `form-helpers.js` |
| Types | PascalCase | `UserTypes.ts` |

### Import Aliases

```javascript
// Main apps
import { X } from 'app/...';           // packages/app
import { Y } from 'lucide-react';      // Web icons
import { Z } from 'lucide-react-native'; // Native icons

// Test apps
import { X } from '@neo/test-components';
import { Y } from '@neo/test-components/theme';
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

