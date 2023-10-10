import { View } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import { Text, H1 } from 'app/design/typography';
import { appSetting  } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';

export default function ElementEntityText({data}) {
    const view = appSetting('entry', 'default_view');
    switch (view) {
        case 'small':
            return <Small data={data} />;
        default:
            return <Default data={data} />;
      }
}

function Small({ data }) {

    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight:22
        }
    }; 

    return (
        <View className=" bg-bgrcard  dark:bg-bgrcard-d sm:border-x  border-bdr dark:border-bdr-d w-full mx-auto  ">
           <View className=' bg-primary/10 dark:bg-primary-d/10 sm:bg-transparent dark:bg-bgritem-d rounded-lg flex-col px-2.5 py-2 sm:p-0 mx-4 my-2'>
                <Text className="font-bold text-neutral-900 dark:text-neutral-50 text-base sm:text-xl ">{data.entry_title}</Text>
                <ContentMore content={data.entry_text} numberOfLines={3} textStyle={oCommentTextStyle} openSmall={false} textClassName="text-base text-neutral-600 dark:text-neutral-400"/>
            </View>
        </View>
    );
}


const getImagesData = (data) => {
    if (!data["bx_if:show_screenshots"] || !data["bx_if:show_screenshots"].condition) {
        return [];
    }

    const screenshots = data["bx_if:show_screenshots"].content.screenshots;

    const att = screenshots.map(screenshot => ({
        type: 'image',
        data: { 'src': screenshot.url_bg }
    }));

    return att;
};

function Default({ data }) {
    let att = getImagesData(data);

    return (
        <View className="w-full">
            {(data.image) && <View className="w-full aspect-[3/1] mb-4"><Image {...data.image} alt={data.title} sizes="(max-width:1024px) 100vw, 1024px" className=" mt-4 u-cover" view="cover"   /></View>}              
            <View className="mx-auto p-4 lg:px-8  w-full">
                <H1 className="font-bold tracking-tight  text-neutral-900 dark:text-neutral-50 ">{data.entry_title}</H1>
                <Html data={data.entry_text} />
            </View>
            <EntityAttachments data={att}/>
        </View>
    );
}
