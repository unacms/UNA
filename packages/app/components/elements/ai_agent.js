'use client';

import { BlockWrapper } from 'app/components/block-wrapper';
import { components } from 'app/components/registry';
import { useLocalSearchParams } from 'app/lib/hooks/router';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

export default function ElementAiAgent({ data, blockWrapperProps }) {
    const AiAgent = components['molecule']['ai_agent'];
    const params = useLocalSearchParams();
    const initialMessage = hiddenFirstMessageFromData(data, params);
    const agentId = data?.agent_id ?? '';
    const contextProfileId = Number(data?.context_profile_id) || 0;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <AiAgent
                key={`${agentId}:${contextProfileId}`}
                data={data}
                initialMessage={initialMessage}
                hideInitialMessage={!!initialMessage}
            />
        </BlockWrapper>
    );
}
