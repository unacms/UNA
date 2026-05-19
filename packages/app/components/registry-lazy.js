'use client';

import React, { Suspense, lazy } from 'react';
import { Loading } from 'app/customization/loading';

/**
 * Wraps a dynamic import for the component registry. Registered synchronously so
 * getComponent / isComponent stay sync; the module loads on first render (Suspense).
 * Works on web (webpack) and native (Metro).
 */
export function createLazyComponent(loader) {
    const Lazy = lazy(loader);

    function LazyRegistryComponent(props) {
        return (
            <Suspense fallback={<Loading />}>
                <Lazy {...props} />
            </Suspense>
        );
    }

    LazyRegistryComponent.displayName = 'LazyRegistryComponent';
    return LazyRegistryComponent;
}
