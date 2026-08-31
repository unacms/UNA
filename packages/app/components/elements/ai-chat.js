import { BlockWrapper } from 'app/components/block-wrapper';
import { getComponent } from 'app/components/registry';

export default function ElementAiChat({ data, params, settings, blockWrapperProps, ...rest }) {
    const AiChat = getComponent('molecule', 'ai_chat');

    return (
        <BlockWrapper {...blockWrapperProps}>
            <AiChat data={data} params={params} settings={settings} {...rest} />
        </BlockWrapper>
    );
}
