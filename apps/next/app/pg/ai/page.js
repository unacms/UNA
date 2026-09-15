/**
 * /pg/ai — dev-only UNA Agent playground (live `/sys-ai-chat/{AgentId}` or emulator).
 */

import { Suspense } from 'react';
import Root from 'app/root-client';

export const metadata = {
    title: 'AI Chat playground',
    description: 'Development playground for UNA Agents chat (live sys-ai-chat or local AG-UI emulator).',
};

const data = {
    uri: 'pg/ai',
    url: '/pg/ai',
    title: 'AI Chat',
    layout: 'playground-ai-chat',
    elements: {},
};

export default function PlaygroundAiChatPage() {
    return (
        <Suspense fallback={null}>
            <Root
                settings={null}
                path="pg/ai"
                data={data}
                uri="pg/ai"
                url="/pg/ai"
                code={200}
            />
        </Suspense>
    );
}
