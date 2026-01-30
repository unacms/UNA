import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H1 } from 'app/design/typography';
import { appSetting, clearLinks, getYouTubeVideoId } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';
import TextMore from 'app/ui/molecules/textmore';
import Video from 'app/ui/atoms/video';
import Youtube from 'app/ui/molecules/youtube'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function EntityTextBlock ({blockWrapperProps, data, block, showPad, sidebar}) {
    const view = appSetting('entry', 'default_view');
    switch (view) {
        case 'small':
            return <Small blockWrapperProps={blockWrapperProps}  data={data} showPad={showPad} />;
        default:
            return <Default blockWrapperProps={blockWrapperProps} block={block} data={data} showPad={showPad} sidebar={sidebar} />;
    }
}

function Small({ data, showPad }) {

    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight: 20
        }
    };
    const text = clearLinks(data.entry_text);

    return (
        <View className="bg-card sm:border-x w-full mx-auto">
            <View className=' bg-primary/10 sm:bg-transparent dark:bg-bgritem-d rounded-lg flex-col px-2.5 py-2 sm:p-0 mx-4 mb-2 mt-4'>
                <Text className="font-bold text-neutral-900 dark:text-neutral-50 text-base sm:text-xl ">{data.entry_title}</Text>
                <ContentMore content={text} numberOfLines={3} numberOfSymbols={360} openSmall={false} customClassName="u-vanilla-html" />
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

function Default({ data, showPad, sidebar, block, blockWrapperProps }) {
    const att = getImagesData(data);
    const isSmall = block?.module == "bx_market";
    const {text, videoId} = _checkEmpty(data);

    if (!text && !data.video && !data.image && !videoId)
        return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full p-2">
                {(!!data.video?.src_mp4) && <View className='w-full aspect-video rounded-xl overflow-hidden mb-3'>
                    <Video poster={data.video.src_poster} src={data.video.src_mp4} cover={true} controls={true} muted={"muted"} />
                </View>}
                {(videoId) && <View className='w-full aspect-video rounded-xl overflow-hidden mb-3'>
                    <Youtube videoId={videoId} size={3} />
                </View>}
                {(!!data.image && !data.video) && <View className="w-full h-[30vh] mb-4 sm:rounded-xl overflow-hidden"><Image {...data.image} alt={data.title} className=" u-cover" view="cover" /></View>}
                <View className={`mx-auto w-full ${(showPad == false || sidebar ? '' : ' ')}`}>
                    {isSmall ? <TextMore tagName='h1' text={data.entry_title} numberOfLines={2} className="font-bold tracking-tight text-foreground"></TextMore> : <H1>{data.entry_title}</H1>}
                    {isSmall ? <ContentMore showLess={true} content={text} numberOfLines={3} numberOfSymbols={360} openSmall={false} customClassName="u-vanilla-html" /> : <Html data={text} />}
                </View>
                <EntityAttachments data={att} />
            </View>
        </BlockWrapper>
    );
}

const _checkEmpty = (data) => {
    const text = clearLinks(data.entry_text);
    const videoId = data.video_embed && getYouTubeVideoId(data.video_embed) || null;
    if (!text && !data.video && !data.image && !videoId)
        return false

    return {text: text, videoId: videoId}
}

EntityTextBlock.checkEmpty = (item) => {
    return _checkEmpty(item.data)
};
