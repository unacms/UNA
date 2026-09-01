import { BlockWrapper } from 'app/components/block-wrapper';
import { getComponent } from 'app/components/registry';

export default function ElementAiAgent({ data, blockWrapperProps }) {
    const AiAgent = getComponent('molecule', 'ai_agent');

    return (
        <BlockWrapper {...blockWrapperProps}>
            <AiAgent data={data} />
        </BlockWrapper>
    );
}
