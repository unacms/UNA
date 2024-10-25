import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H1 } from 'app/design/typography';
import { appSetting, clearLinks, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';
import TextMore from 'app/ui/molecules/textmore';
import Video from 'app/ui/atoms/video';

export default function (props) {
    const data = props.data;
    const block = props.block;
    const view = appSetting('entry', 'default_view');
    switch (view) {
        case 'small':
            return <Small data={data} showPad={props.showPad} />;
        default:
            return <Default block={block} data={data} showPad={props.showPad} sidebar={props.sidebar} />;
    }
}

function Small({ data, showPad }) {

    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight: 22
        }
    };
    const text = clearLinks(data.entry_text);

    return (
        <View className=" bg-bgrcard  dark:bg-bgrcard-d sm:border-x  border-bdr dark:border-bdr-d w-full mx-auto  ">
            <View className=' bg-primary/10 dark:bg-primary-d/10 sm:bg-transparent dark:bg-bgritem-d rounded-lg flex-col px-2.5 py-2 sm:p-0 mx-4 mb-2 mt-4'>
                <Text className="font-bold text-neutral-900 dark:text-neutral-50 text-base sm:text-xl ">{data.entry_title}</Text>
                <ContentMore content={text} numberOfLines={3} textStyle={oCommentTextStyle} openSmall={false} textClassName=" text-sm text-neutral-600 dark:text-neutral-400" />
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

function Default({ data, showPad, sidebar, block }) {
    console.log("datadatadata", data)
    let att = getImagesData(data);
    const text = clearLinks(data.entry_text);
    const isSmall = block?.module == "bx_market";
    return (
        <View className="w-full">
            {(!!data.video) && <View className='w-full aspect-video rounded-xl overflow-hidden my-2 lg:mt-6'>
                <Video poster={data.video.src_poster} src={data.video.src_mp4} cover={true}  controls={true} muted={"muted"} />
            </View>}
            {(!!data.image && !data.video) && <View className="w-full aspect-[2/1] rounded-xl overflow-hidden my-2 lg:mt-6"><Image {...data.image} alt={data.title} sizes={LAYOUT_BREAKPOINTS.lg} className=" u-cover" view="cover" /></View>}
            <View className={"mx-auto w-full " + (showPad == false || sidebar ? '' : ' ')}>
                {isSmall ? <TextMore tagName='h1' text={data.entry_title} numberOfLines={2} className="font-bold tracking-tight  text-neutral-900 dark:text-neutral-50 "></TextMore> :  <H1 className="font-bold tracking-tight  text-neutral-900 dark:text-neutral-50 ">{data.entry_title}</H1>}
                {isSmall ? <ContentMore numberOfSymbols={200} showLess={true} content={text} numberOfLines={3}  openSmall={false} textClassName="  text-sm text-neutral-600 dark:text-neutral-400" /> :  <Html data={text} />}
                
            </View>
            <EntityAttachments data={att} />
        </View>
    );
}
