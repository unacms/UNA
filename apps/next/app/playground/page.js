'use client';

/**
 * /playground — dev-only route for trying out the new NeoButton component.
 *
 * Goes through the standard Root → Layouts → Layout flow so:
 *   - the `theme` / `data-theme` html attributes get set (so Tailwind
 *     `dark:` variants actually fire on this route),
 *   - components are registered (`registerAll()`),
 *   - the page-layout is dispatched via the registry by `data.layout`
 *     (we registered `'playground'` in
 *     `packages/app/components/page-layout/_map.js`).
 *
 * Safe to delete with the page-layout file once NeoButton is approved.
 */

import { Suspense } from 'react';
import Root from 'app/root-client';

const data = {
    uri: 'playground',
    url: '/playground',
    title: 'NeoButton playground',
    // Routes layouts.js → getLayoutName → `data.layout && isComponent('layout', …)`
    // matches and resolves to the `playground` page-layout component.
    layout: 'playground',
    // PageLayoutContent guards on `data.elements` before rendering; an empty
    // object satisfies the check without contributing any cells (the
    // playground renders its own content directly).
    elements: {},
};

export default function PlaygroundPage() {
    return (
        <Suspense fallback={null}>
            <Root
                settings={null}
                path="playground"
                data={data}
                uri="playground"
                url="/playground"
                code={200}
            />
        </Suspense>
    );
}