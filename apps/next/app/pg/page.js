/**
 * /pg — dev-only route for trying out the new NeoButton component.
 *
 * Goes through the standard Root → Layouts → Layout flow so:
 *   - the `theme` / `data-theme` html attributes get set (so Tailwind
 *     `dark:` variants actually fire on this route),
 *   - components are registered (`registerAll()`),
 *   - the page-layout is dispatched via the registry by `data.layout`
 *     (we registered `'playground'` in
 *     `packages/app/components/page-layout/_map.js`).
 */

import { Suspense } from 'react';
import Root from 'app/root-client';

export const metadata = {
    title: 'NeoButton playground',
    description: 'Development playground for trying out the NeoButton component.',
};

const data = {
    uri: 'pg',
    url: '/pg',
    title: 'NeoButton playground',
    layout: 'playground',
    elements: {},
};

export default function PlaygroundPage() {
    return (
        <Suspense fallback={null}>
            <Root
                settings={null}
                path="pg"
                data={data}
                uri="pg"
                url="/pg"
                code={200}
            />
        </Suspense>
    );
}
