import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H2 } from 'app/design/typography';
import { appSetting, clearLinks } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';
import TextMore from 'app/ui/molecules/textmore';
import Link from 'app/ui/atoms/link'

export default function (props) {

    const data = props.data;
    console.log("data", data)

    return (
        <View className="w-full">
            
           
                <Link href={data.link}>
                <View className="w-full ">
                    <H2 numberOfLines={1} className="font-bold tracking-tight  text-neutral-900 dark:text-neutral-50 ">Comment to: {data.title}</H2>
                    </View>
                </Link>
               
                <ContentMore numberOfSymbols={200} showLess={true} content={data.text} numberOfLines={3}  openSmall={false} textClassName="  text-sm text-neutral-600 dark:text-neutral-400" />
           
           
        </View>
    );
}

