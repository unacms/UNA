/**
 * /pg/form — dev-only Expo route for the UNA Form kitchen sink.
 *
 * Mirrors `apps/next/app/pg/form/page.js`. More specific than `[...path].tsx`.
 */

import { Root } from 'app/root';

const data = {
    uri: 'pg/form',
    url: '/pg/form',
    title: 'Form playground',
    layout: 'playground-form',
    elements: {},
};

export default function PlaygroundFormScreen() {
    return (
        <Root
            settings={null}
            path="pg/form"
            data={data}
            uri="pg/form"
            url="/pg/form"
            code={200}
        />
    );
}
