/**
 * /pg/agents — dev-only route for the Agents admin block (`ai_agents_admin`).
 *
 * The real block comes from UNA `system/get_block_ai_agents_admin` (operators
 * only); this page feeds the element the same payload shape so it can be styled
 * without a logged-in operator. The history / toggle calls still go to the API,
 * so mock `window.fetch` for `get_ai_agent_*` / `set_ai_agent_active` when
 * the server is not reachable.
 */

import { Suspense } from 'react';
import Root from 'app/root-client';

export const metadata = {
    title: 'Agents admin playground',
    description: 'Development playground for the agents admin block.',
};

const agents = [
    {
        id: 12, name: 'comments_reply', title: 'Ответчик на комментарии', description: '',
        trigger: 'alert', trigger_title: 'Alert', alert: 'bx_posts:commentPost', active: 1, async: 1, has_chat: 0,
        model: 'GPT-4.1', profile: { id: 740, display_name: 'Комментатор', url: false, url_avatar: '' },
        activity_count: 14, activity_last: 1789646812, added: 1789600000,
    },
    {
        id: 6, name: 'pets_helper', title: 'Pets helper', description: '',
        trigger: 'message', trigger_title: 'Message', alert: '', active: 1, async: 1, has_chat: 1,
        model: 'GPT-4.1', profile: { id: 22, display_name: 'Robot', url: false, url_avatar: '' },
        activity_count: 0, activity_last: 0, added: 1789500000,
    },
    {
        id: 3, name: 'dashboard_helper', title: 'Dashboard helper', description: '',
        trigger: 'manual', trigger_title: 'Manual', alert: '', active: 0, async: 0, has_chat: 1,
        model: 'Claude Sonnet', profile: { id: 22, display_name: 'Robot', url: false, url_avatar: '' },
        activity_count: 0, activity_last: 0, added: 1789400000,
    },
    {
        id: 9, name: 'nightly_digest', title: 'Nightly digest', description: '',
        trigger: 'scheduler', trigger_title: 'Scheduler', alert: '', active: 1, async: 0, has_chat: 0,
        model: 'GPT-4.1', profile: { id: 22, display_name: 'Robot', url: false, url_avatar: '' },
        activity_count: 0, activity_last: 0, added: 1789300000,
    },
];

const data = {
    uri: 'pg/agents',
    url: '/pg/agents',
    title: 'Agents',
    layout: 'default',
    elements: {
        1: [
            {
                id: 'agents-admin',
                title: 'Agents',
                type: 'service',
                source: 'get_block_ai_agents_admin',
                designbox_id: 11,
                content: [
                    {
                        id: 1,
                        type: 'ai_agents_admin',
                        data: {
                            agents,
                            studio_url: 'https://ci.una.io/test3/studio/agents.php?page=agents',
                            // operator chat tab — same payload the ai_agent block gets
                            chat_title: 'Welcome agent',
                            chat: {
                                agent_id: 6,
                                agent_profile: { id: 22, display_name: 'Robot', url: false, url_avatar: '' },
                                context_profile_id: 0,
                                hidden_first_message: '',
                                allow_images: 1,
                                allow_new: 1,
                                show_history: 1,
                                max_images: 4,
                                max_input_chars: 2000,
                            },
                        },
                    },
                ],
            },
        ],
    },
};

export default function AgentsAdminPlaygroundPage() {
    return (
        <Suspense fallback={null}>
            <Root
                settings={null}
                path="pg/agents"
                data={data}
                uri="pg/agents"
                url="/pg/agents"
                code={200}
            />
        </Suspense>
    );
}
