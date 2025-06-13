# Routing Setup in NEO

This document outlines the routing architecture for both the native (iOS/Android) and web applications within the NEO monorepo.

## High-Level Overview

The NEO application utilizes a monorepo structure, but employs separate, specialized routing solutions for the native and web platforms to leverage the best features of each environment.

-   **Native App (React Native/Expo):** Routing is managed by `expo-router`.
-   **Web App (Next.js):** Routing is managed by the Next.js App Router.

A key architectural feature is the centralized router abstraction layer, which helps in maintaining clean code and simplifying navigation logic across the app.

## Centralized Router Abstraction

The file `packages/app/lib/hooks/router.js` serves as a "barrel" file for all routing-related imports. Instead of importing directly from `expo-router` in various components, the application imports from this central file.

**Key benefits:**

-   **Maintainability:** If the underlying routing library were to be changed, modifications would be concentrated in this single file.
-   **Consistency:** Ensures that all parts of the app use the same routing functions and components.
-   **Simplicity:** Provides a simplified and curated API for routing to the rest of the application.

```javascript
// Example: packages/app/lib/hooks/router.js
import { 
    useRouter as _useRouter, 
    Tabs as _Tabs,
} from 'expo-router';

export const Tabs = _Tabs;

export function useRouter() {
    return _useRouter();
}
```

## Native Routing (`expo-router`)

The native app uses `expo-router`'s file-based routing system. The route structure is defined by the directory structure within `apps/expo/app`.

### Tab Navigation

The primary navigation for the app is a tab bar, which is defined as a route group.

-   **Layout File:** `apps/expo/app/(tabs)/_layout.js` is the entry point for the tabbed section of the app. It sets up providers (Theme, QueryClient) and renders the custom `Tabs` component.
-   **Custom Tabs Component:** The actual tab bar is rendered by a custom component located at `packages/app/components/nav/tabs.js`. This is not the standard `expo-router` `Tabs` component, but a wrapper around it.

This custom component is responsible for:

1.  **Dynamic Tab Generation:** It reads the tab configuration from the application settings (`appSetting(...)`) and dynamically generates `Tabs.Screen` components. This allows for different tab layouts for logged-in and logged-out users.
2.  **Deep Linking:** It includes logic to handle deep links, parsing URLs and navigating to the correct tab or screen.
3.  **UI Customization:** It applies extensive custom styling to the tab bar, items, and badges, and handles user interactions like haptic feedback.
4.  **Context Integration:** It integrates with user data to display dynamic content, such as showing the user's profile picture as a tab icon.

## Web Routing (Next.js App Router)

The web application at `apps/next` uses the Next.js App Router. Similar to `expo-router`, it uses a file-based system where directories in `apps/next/app` define the routes.

-   **Route Structure:** The folder structure inside `apps/next/app` maps directly to URL paths. Each folder represents a URL segment.
-   **Page Content:** A `page.js` or `page.tsx` file within a route directory defines the UI for that specific route.
-   **Layouts:** `layout.js` or `layout.tsx` files are used to create shared UI that wraps around pages and child segments.

The web app does not share the native tab bar structure. It implements its own navigation and UI, which is more suitable for a web experience, while still sharing business logic and components from the `packages/` directory.

## Linking Between Screens

-   **Native:** Navigation is performed using the `useRouter` hook from the centralized `router.js` file, which calls `expo-router`'s functions like `router.push(...)` or `router.replace(...)`.
-   **Web:** Navigation uses the standard Next.js `Link` component or the `useRouter` hook from `next/navigation`.

While the routing mechanisms are platform-specific, the shared components in `packages/` are designed to be platform-agnostic where possible. However, navigation calls are inherently tied to the platform's routing system. 