/**
 * /playground — dev-only Expo route for trying out the new NeoButton.
 *
 * Mirrors `apps/next/app/playground/page.js`: routes through the standard
 * Root → Layouts → Layout flow so:
 *   - components are registered (`registerAll()`),
 *   - the page-layout is dispatched via the registry by `data.layout`
 *     (we registered `'playground'` in
 *     `packages/app/components/page-layout/_map.lazy.js`, dev only).
 *
 * Lives at the file-based path `/playground` (more specific than
 * `[...path].js`, so it wins). Safe to delete with the page-layout file
 * once NeoButton is approved.
 */

import { Root } from 'app/root';

const data = {
    uri: 'playground',
    url: '/playground',
    title: 'NeoButton playground',
    layout: 'playground',
    elements: {},
};

export default function PlaygroundScreen() {
    return (
        <Root
            settings={null}
            path="playground"
            data={data}
            uri="playground"
            url="/playground"
            code={200}
        />
    );
}