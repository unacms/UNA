import { View, Row } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import Menu from 'app/components/menu';
import { useState, useEffect, useMemo } from 'react'
import Carousel from 'app/ui/molecules/carousel'
import { useLayoutData } from 'app/context/layout';
import Embed from 'app/ui/molecules/embed'
import { storageSet, getDataFromCache } from 'app/lib/util';
import { Platform } from 'react-native'
import { appSetting } from 'app/lib/util'
import { ActionMenu, CounterMenu } from 'app/lib/feed-helpers'


export default function ElementFeedItem({ data }) {
    const { layoutData } = useLayoutData();
    const [content, setContent] = useState(data.event.content)
    const isWeb = Platform.OS == 'web' ? true : false;
    useEffect(() => {
        if (layoutData && layoutData.type == 'feed_item:content') {
            setContent(layoutData.data.content)
        }
    }, [layoutData]);

    if (isWeb) {
        const sKey = 'feed_' + data.event.id;
        const dataCache = getDataFromCache('li:data', sKey)
        if (dataCache) {
            dataCache.ts = -1;
        }
        storageSet('li:data', sKey, dataCache)
    }

    const tlContent = content.text;//truncateHTML(data.content.text, 380);


    let content_attach = [];
    if (content.images_attach && content.images_attach.length > 0) {
        content_attach = content_attach.concat(content.images_attach);
    }
    if (content.videos_attach && content.videos_attach.length > 0) {
        content_attach = content_attach.concat(content.videos_attach);
    }

    function UnitImages(images) {

        const aImg = useMemo(() => {
            if (!images?.images || images?.images?.length === 0) return [];

            let photo = images.images.filter(item => item.src).map((obj) => ({
                src: obj.src_orig ? obj.src_orig : obj.src,
                width: obj.width,
                height: obj.height,
                type: 'image',
            }));

            let video = images.images.filter(item => item.src_poster).map((obj) => ({
                src: obj.src_poster ? obj.src_poster : obj.src_poster,
                type: 'video',
            }));
            return [...photo, ...video]
        }, [images]);

        if (!aImg.length) return null;

        return (

            <View className='mb-4'><Carousel data={aImg} /></View>

        )
    }

    return (
        <View className="relative sm:my-0 w-full mx-auto max-w-5xl">
            <View className="my-4">
                <Html data={tlContent} customClassName='u-vanilla-html'/>
                {!!content.embed && <Embed data={content.embed} />}
            </View>
            <UnitImages images={content_attach} />
            {
                data.event.menu_actions.items.length > 0 && (<View className=" flex-row items-center ">
                    <View className=" flex-auto flex-wrap text-wrap ">
                        {(!!data.event.menu_counters && appSetting('feed', 'counters_menu')) && <Row><CounterMenu data={data.event.menu_counters}  /></Row>}
                        <View className=' py-2 border-t mt-1 border-bdr dark:border-bdr-d '><ActionMenu data={data.event.menu_actions}  /></View>
                    </View>
                </View>)
            }
        </View>
    )
}