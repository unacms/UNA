/**
 * A UNA page the app was asked to open by a link (`neo://view-post?id=1`,
 * `https://<site>/view-post?id=1`). expo-router routes every incoming link
 * itself: app routes such as `/pg` or `/tab3` open directly, and any other path
 * reaches the `[...path]` catch-all, which queues it here. The tab navigator
 * opens it over the right tab once a member is signed in.
 */
let pendingPath: string | null = null;
const listeners = new Set<() => void>();

export function queueDeepLink(path: string) {
    pendingPath = path;
    listeners.forEach((listener) => listener());
}

/** Returns the queued page path and clears it. */
export function takeDeepLink() {
    const path = pendingPath;
    pendingPath = null;
    return path;
}

/** Calls `listener` whenever a page is queued; returns the unsubscribe function. */
export function subscribeDeepLink(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

type RouteParams = Record<string, string | string[] | undefined>;

/**
 * Page path for the `[...path]` catch-all's params (`path` segments plus the
 * query), or null for the app root (`/`), which expo-router also sends there.
 */
export function catchAllPagePath(params: RouteParams) {
    const { path, ...query } = params;
    const segments = (Array.isArray(path) ? path : [path]).filter((s): s is string => !!s);
    if (!segments.length) return null;
    const queryString = Object.entries(query)
        .flatMap(([key, value]) => (Array.isArray(value) ? value : [value])
            .filter((v): v is string => v !== undefined)
            .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`))
        .join('&');
    return '/' + segments.map(encodeURIComponent).join('/') + (queryString ? '?' + queryString : '');
}
