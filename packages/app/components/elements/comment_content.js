import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H2 } from 'app/design/typography';
import { appSetting, clearLinks } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';
import TextMore from 'app/ui/molecules/textmore';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ({data, blockWrapperProps}) {
    return (
        <BlockWrapper {...blockWrapperProps}><View className="w-full px-3 sm:px-4">
            <ContentMore numberOfSymbols={360} showLess={true} content={data.text} numberOfLines={3} openSmall={false} customClassName="u-vanilla-html-small" />
            <Link href={data.link}>
                <Button size="sm" title="View all comments" variant="link" endDecorator="ChevronRight"/>
            </Link>
        </View></BlockWrapper>
    );
}

