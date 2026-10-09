import { View } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { useState, useEffect } from 'react'
import Embed from 'app/ui/molecules/content/embed'
import { cloneObject, appSetting } from 'app/lib/util';
import { subscribeTimelineEdit } from 'app/lib/timeline-edits';
import { ActionMenu, CounterMenu } from 'app/components/elements/feed-item-parts'
import { UnitImages } from 'app/lib/feed-items'
import { PollItem } from 'app/components/elements/entity-poll';
import { BlockWrapper } from 'app/components/block-wrapper'
import { fetcher } from 'app/lib/fetcher'

export default function ElementFeedItem({ data, isModal, blockWrapperProps }) {
    const eventId = data?.event?.id
    const [content, setContent] = useState(data.event.content)

    // Same as UnitFeed card: refetch on timeline "edited" socket
    useEffect(() => {
        if (eventId == null) return undefined

        return subscribeTimelineEdit(eventId, async () => {
            const result = await fetcher(
                '/api.php?r=' +
                appSetting('urls', 'feed_item') +
                '{"params":{"browse":"id","value":' +
                eventId +
                '}}'
            )
            if (result.data?.content) setContent(result.data.content)
        })
    }, [eventId])

    const tlContent = content?.text

    let content_attach = [];
    if (content?.images_attach?.length > 0) {
        content_attach = content_attach.concat(content.images_attach);
    }
    if (content?.videos_attach?.length > 0) {
        content_attach = content_attach.concat(content.videos_attach);
    }

    let menu_actions2 = cloneObject(data.event.menu_actions)
    if (isModal) {
        menu_actions2.items = menu_actions2.items.filter(
            (x) => x.name !== "item-comment"
        );
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
                {/* Same stack and gap as the feed card (DefaultView in units/feed-views.js). */}
                <View className="w-full gap-y-3">
                    <Html key={tlContent || 'empty'} data={tlContent} customClassName="u-vanilla-html-small" />
                    {!!content?.embed && <Embed data={content.embed} />}
                    {content?.polls_attach?.length > 0 && (
                        <View className='w-full'>
                            {content.polls_attach.map((item, index) => {
                                return <View key={"att" + index} className='mt-4'><PollItem data={item} showTitle={true} results_url='/api.php?r=bx_timeline/get_block_poll_results' /></View>
                            })}
                        </View>
                        )
                    }
                    {content_attach.length > 0 && <UnitImages images={content_attach} />}
                </View>
                {
                    data.event.menu_actions.items.length > 0 && (<View className=" flex-row items-center ">
                        <View className="flex-auto  gap-2 mt-2 ">
                            
                            {(!!data.event.menu_counters && appSetting('feed', 'counters_menu')) && <CounterMenu data={data.event.menu_counters} />}
                            <ActionMenu data={menu_actions2} />
                        </View>
                    </View>)
                }
            
        </BlockWrapper>
    )
}