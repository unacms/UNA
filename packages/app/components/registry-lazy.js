'use client';

import React, { Suspense, lazy } from 'react';

/**
 * Wraps a dynamic import for the component registry. Registered synchronously so
 * getComponent / isComponent stay sync; the module loads on first render (Suspense).
 * Works on web (webpack) and native (Metro).
 */
/** Minimal fallback keeps TBT lower than mounting full Loading animation trees. */
function LazyFallback() {
    return null;
}

export function createLazyComponent(loader) {
    const Lazy = lazy(loader);

    function LazyRegistryComponent(props) {
        return (
            <Suspense fallback={<LazyFallback />}>
                <Lazy {...props} />
            </Suspense>
        );
    }

    LazyRegistryComponent.displayName = 'LazyRegistryComponent';
    return LazyRegistryComponent;
}
