/**
 * /pg — dev-only Expo route for trying out the new NeoButton.
 *
 * Mirrors `apps/next/app/pg/page.js`. More specific than `[...path].tsx`, so it wins.
 */

import { Root } from 'app/root';
import PlaygroundProviders from '../../playground-providers';

const data = {
    uri: 'pg',
    url: '/pg',
    title: 'NeoButton playground',
    layout: 'playground',
    elements: {},
};

export default function PlaygroundScreen() {
    return (
        <PlaygroundProviders>
            <Root
                settings={null}
                path="pg"
                data={data}
                uri="pg"
                url="/pg"
                code={200}
            />
        </PlaygroundProviders>
    );
}
