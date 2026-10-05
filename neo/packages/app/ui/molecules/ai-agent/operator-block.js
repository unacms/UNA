/**
 * Operator agent block lookup. Kept apart from `helper.js`: the floating
 * operator widget is mounted on every page, and `helper.js` pulls
 * `@tanstack/ai-client` into whatever imports it statically.
 */

import { fetcher } from 'app/lib/fetcher';

function asAgentBlockData(item) {
    if (!item || typeof item !== 'object') return null;
    if (item.agent_id || item.agent_profile || Object.prototype.hasOwnProperty.call(item, 'hidden_first_message')) {
        return item;
    }
    const nested = item.data;
    if (
        nested
        && typeof nested === 'object'
        && (item.type === 'ai_agent' || item.content_type === 'ai_agent' || nested.agent_id || nested.agent_profile)
    ) {
        return nested;
    }
    return null;
}

/**
 * UNA `system/get_block_ai_agent_operator/TemplServices` — the operator agent block,
 * exactly what the Dashboard page block renders (`agent_id`, `agent_profile`,
 * `hidden_first_message`, flags). Which agent, and with which settings, is decided
 * on the server only — so this widget and the page block cannot disagree.
 *
 * Resolves to null when there is no operator agent or the viewer may not chat with it.
 */
export async function fetchOperatorAgentBlock() {
    const response = await fetcher('/api.php?r=system/get_block_ai_agent_operator/TemplServices');
    const payload = response?.data;
    if (Array.isArray(payload)) {
        for (const item of payload) {
            const data = asAgentBlockData(item);
            if (data?.agent_id) return data;
        }
    }
    const direct = asAgentBlockData(payload);
    if (direct?.agent_id) return direct;
    if (Array.isArray(payload?.content)) {
        for (const item of payload.content) {
            const data = asAgentBlockData(item);
            if (data?.agent_id) return data;
        }
    }
    return null;
}
