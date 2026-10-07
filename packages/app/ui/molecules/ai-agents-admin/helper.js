import { fetcher } from 'app/lib/fetcher';

/**
 * Operator-only UNA services behind the Agents admin block — a cut-down Studio >
 * Agents: the list with on/off, the chat history of manual / message agents and
 * the activity history (what the agent did) of event-driven ones.
 *
 * @typedef {object} AdminAgent
 * @property {number} id
 * @property {string} name
 * @property {string} title
 * @property {string} description
 * @property {string} trigger alert | scheduler | webhook | manual | agent | message | form-input
 * @property {string} trigger_title
 * @property {string} alert unit:action for trigger=alert
 * @property {number} active 0 | 1
 * @property {number} has_chat 1 when the agent is talked to (manual / message) — chat history instead of activity
 * @property {string} model
 * @property {{id:number, display_name:string, url:string|false, url_avatar:string}} profile
 * @property {number} activity_count
 * @property {number} activity_last unix ts
 *
 * @typedef {object} AgentActivityItem
 * @property {number} id
 * @property {string} action comment_add | content_update | db_write | ...
 * @property {string} tool
 * @property {number} ok
 * @property {string} text "Posted a comment on Posts #45"
 * @property {string} summary excerpt of what was written / changed
 * @property {string} url where it happened, '' when unknown
 * @property {string} title title of the content it happened on, '' when unknown
 * @property {number} added unix ts
 *
 * @typedef {object} AdminChatThread
 * @property {string} thread_id
 * @property {string} title
 * @property {'opened'|'closed'} status
 * @property {string} closed_reason
 * @property {string} updated_at
 * @property {number} messages_count
 * @property {string} preview
 */

function apiErrorMessage(response, fallback) {
    if (!response || typeof response !== 'object') return fallback;
    const code = Number(response.status);
    if (response.error || (Number.isFinite(code) && code >= 400)) {
        return String(response.error || response.msg || fallback);
    }
    return null;
}

/** `system/get_ai_agents` → {@link AdminAgent}[] */
export async function fetchAdminAgents() {
    const response = await fetcher('/api.php?r=system/get_ai_agents/TemplServices');
    const message = apiErrorMessage(response, 'Agents list failed.');
    if (message) throw new Error(message);
    const agents = response?.data?.agents;
    return Array.isArray(agents) ? agents : [];
}

/** `system/set_ai_agent_active` → the stored value */
export async function setAdminAgentActive(agentId, active) {
    const response = await fetcher(
        `/api.php?r=system/set_ai_agent_active/TemplServices&params[]=${encodeURIComponent(agentId)}&params[]=${active ? 1 : 0}`
    );
    const message = apiErrorMessage(response, 'Agent update failed.');
    if (message) throw new Error(message);
    return Number(response?.data?.active) === 1;
}

/** `system/get_ai_agent_activity` → {items: {@link AgentActivityItem}[], hasMore} */
export async function fetchAdminAgentActivity(agentId, start = 0, limit = 50) {
    const response = await fetcher(
        `/api.php?r=system/get_ai_agent_activity/TemplServices&params[]=${encodeURIComponent(agentId)}&params[]=${Number(start) || 0}&params[]=${Number(limit) || 50}`
    );
    const message = apiErrorMessage(response, 'Agent activity failed.');
    if (message) throw new Error(message);
    const items = response?.data?.items;
    return { items: Array.isArray(items) ? items : [], hasMore: Number(response?.data?.has_more) === 1 };
}

/** `system/get_ai_agent_chat_threads` — every conversation of the agent → {@link AdminChatThread}[] */
export async function fetchAdminAgentChatThreads(agentId) {
    const response = await fetcher(
        `/api.php?r=system/get_ai_agent_chat_threads/TemplServices&params[]=${encodeURIComponent(agentId)}`
    );
    const message = apiErrorMessage(response, 'Agent chats failed.');
    if (message) throw new Error(message);
    const threads = response?.data?.threads;
    return Array.isArray(threads) ? threads : [];
}

/** `system/get_ai_agent_chat_thread` — one transcript, same message shape the chat widget renders */
export async function fetchAdminAgentChatThread(agentId, threadId) {
    const response = await fetcher(
        `/api.php?r=system/get_ai_agent_chat_thread/TemplServices&params[]=${encodeURIComponent(agentId)}&params[]=${encodeURIComponent(threadId)}`
    );
    const message = apiErrorMessage(response, 'Agent chat failed.');
    if (message) throw new Error(message);
    const data = response?.data;
    return {
        messages: Array.isArray(data?.messages) ? data.messages : [],
        status: data?.status === 'closed' ? 'closed' : 'opened',
        closedReason: String(data?.closed_reason || ''),
    };
}
