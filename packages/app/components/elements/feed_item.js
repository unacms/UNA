import { View, Row } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { useState, useEffect, useMemo } from 'react'
import { useLayoutData } from 'app/context/layout';
import Embed from 'app/ui/molecules/embed'
import { storageSet, getDataFromCache } from 'app/lib/util';
import { Platform } from 'react-native'
import { appSetting } from 'app/lib/util'
import { ActionMenu, CounterMenu } from 'app/lib/feed-helpers'
import { UnitImages } from 'app/lib/feed-items'
import { PollItem } from 'app/components/elements/entity_poll';

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



    return (
        <View className="relative sm:my-0 w-full mx-auto max-w-5xl">
            <View className=" p-3 sm:p-4 lg:pt-0">
                <Html data={tlContent} customClassName='u-vanilla-html' />
                {!!content.embed && <Embed data={content.embed} />}

                <View className='w-full'>
                    {content.polls_attach && content.polls_attach.map((item, index) => {
                        return <View key={"att" + index} className='mt-4'><PollItem  data={item} showTitle={true} results_url='/api.php?r=bx_timeline/get_block_poll_results' /></View>
                    })}
                </View>
            </View>

            <UnitImages images={content_attach} />
            {
                data.event.menu_actions.items.length > 0 && (<View className=" flex-row items-center ">
                    <View className=" flex-auto flex-wrap text-wrap ">
                        {(!!data.event.menu_counters && appSetting('feed', 'counters_menu')) && <Row className='w-full px-2'><CounterMenu data={data.event.menu_counters} /></Row>}
                        <View className=' p-2 border-t mt-1 border-bdr dark:border-bdr-d w-full'><ActionMenu data={data.event.menu_actions} /></View>
                    </View>
                </View>)
            }
        </View>
    )
}