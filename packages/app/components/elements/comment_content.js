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

export default function (props) {

    const data = props.data;

    return (
        <View className="w-full lg:px-4">
            <ContentMore numberOfSymbols={200} showLess={true} content={data.text} numberOfLines={3} openSmall={false} textClassName="  text-base text-neutral-600 dark:text-neutral-400" />
            <Link href={data.link}>
                
                    <Button size="sm" title="View all comments" variant="link" endDecorator="ChevronRight"/>
             
            </Link>
            
        </View>
    );
}

