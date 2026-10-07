/**
 * /pg/form — dev-only route for the UNA Form kitchen sink.
 *
 * Goes through the standard Root → Layouts → Layout flow so:
 *   - the `theme` / `data-theme` html attributes get set,
 *   - components are registered (`registerAll()`),
 *   - the page-layout is dispatched via the registry by `data.layout`
 *     (`playground-form` in `packages/app/components/page-layout/_map.js`).
 */

import { Suspense } from 'react';
import Root from 'app/root-client';

export const metadata = {
    title: 'Form playground',
    description: 'Development playground for UNA Form fields and posted payload.',
};

const data = {
    uri: 'pg/form',
    url: '/pg/form',
    title: 'Form playground',
    layout: 'playground-form',
    elements: {},
};

export default function PlaygroundFormPage() {
    return (
        <Suspense fallback={null}>
            <Root
                settings={null}
                path="pg/form"
                data={data}
                uri="pg/form"
                url="/pg/form"
                code={200}
            />
        </Suspense>
    );
}
