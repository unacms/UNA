import Html from 'app/ui/atoms/html';
import { BlockWrapper } from 'app/components/block-wrapper'
import { View } from 'app/design/view'

export default function ElementLang({ data, blockWrapperProps }) {

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Html data={data.content} />
        </BlockWrapper>
    );
}
