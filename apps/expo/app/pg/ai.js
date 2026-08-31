/**
 * /pg/ai — dev-only Expo route for the UNA AI chat playground.
 *
 * Native stays on the local AG-UI emulator until sys-ai-chat accepts Bearer.
 * Mirrors `apps/next/app/pg/ai/page.js`.
 */

import { Root } from 'app/root';

const data = {
    uri: 'pg/ai',
    url: '/pg/ai',
    title: 'AI Chat',
    layout: 'playground-ai-chat',
    elements: {},
};

export default function PlaygroundAiChatScreen() {
    return (
        <Root
            settings={null}
            path="pg/ai"
            data={data}
            uri="pg/ai"
            url="/pg/ai"
            code={200}
        />
    );
}
