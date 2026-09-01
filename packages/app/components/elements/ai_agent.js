import { BlockWrapper } from 'app/components/block-wrapper';
import { getComponent } from 'app/components/registry';

export default function ElementAiAgent({ data, blockWrapperProps }) {
    const AiAgent = getComponent('molecule', 'ai_agent');

    const agentId = data?.agent_id ?? '';
    const contextProfileId = Number(data?.context_profile_id) || 0;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <AiAgent key={`${agentId}:${contextProfileId}`} data={data} />
        </BlockWrapper>
    );
}
