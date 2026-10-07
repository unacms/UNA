'use client'
import type { ReactNode } from 'react';

import { lazy, Suspense } from 'react'

/**
 * Code-split a registry component without changing the registry contract.
 *
 * Returns a normal component, so `_map.js` entries, `registerComponent()` and
 * fork overrides (`componentsMapDefault['x'] = Custom`) keep working as before.
 * On web (webpack) the module lands in its own chunk and is fetched on first
 * render; on Metro `import()` is inlined, so native behaves exactly as static.
 *
 *   textarea_markdown: lazyComponent(() => import('./editor-markdown')),
 *   // named export:
 *   lazyComponent(() => import('./x').then((m) => ({ default: m.Named })))
 *
 * `checkEmpty` and other statics used by dispatchers must be attached to the
 * returned wrapper (they are not forwarded from the lazy module) — keep such
 * elements eager unless you copy the static over.
 */
export function lazyComponent(loader: any, { fallback = null, name }: { fallback?: ReactNode; name?: string } = {}) {
    const Lazy = lazy(loader)

    function LazyBoundary(props: any) {
        return (
            <Suspense fallback={fallback}>
                <Lazy {...props} />
            </Suspense>
        )
    }
    LazyBoundary.displayName = name ? `Lazy(${name})` : 'LazyComponent'
    return LazyBoundary
}
