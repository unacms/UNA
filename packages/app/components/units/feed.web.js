import React, { memo, useState, useEffect, useMemo, useRef } from 'react'
import { appSetting } from 'app/lib/util'
import { View } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { componentsMap } from 'app/ui/molecules/_map'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsModal, CommentsSection, MenuManage, ActionMenu, CounterMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { GroupView, AdView, MarketView, DefaultView } from 'app/lib/feed-items'

function DefaultUnit(data) {

    const { t } = useTranslation();
    const [viewState, setViewState] = useState({ view: '' })
    const [cmtsData, setCmtsData] = useState(false)

    const isCommentsModal = appSetting('layout', 'comments_in_modal');


    const { url, commentsData, isShowMoreComments } = useMemo(() => prepareData(data), [data]);

    const MainContentComponent = useMemo(() => (
        <MainContent
            url={url}
            data={data}
            GroupView={GroupView}
            AdView={AdView}
            MarketView={MarketView}
            DefaultView={DefaultView}
        />
    ), [url, data]);

    const showCommentsModal = async (initFormData) => {
        const res = await fetcher('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + data?.cmts?.module + '","object_id":' + data?.cmts?.object_id + '}');
        setCmtsData({
            title: data.author_data.display_name + "'s post", data: <CommentsModal initFormData={initFormData}
                itemContent={{
                    id: "block-comments", data: <><View className='pb-4'><Author data={data} url={url} t={t} /></View>{MainContentComponent}</>
                }}
                commentsData={res.data} />
        })
    }
    if (isCommentsModal && data.menu_actions?.items[0].data?.callback)
        data.menu_actions.items.find(x => x.name == "item-comment").data.callback = showCommentsModal

    if (viewState.view == 'deleted')
        return <></>

    return (
        <AnimatedBlock>
            {viewState.view == 'edited' && <FeedEditForm setViewState={setViewState} id={data.id} viewState={viewState} />}
            {isCommentsModal && <Modal
                outerClickClose={false}
                onClose={() => setCmtsData(false)}
                onVisible={!!cmtsData}
                title={cmtsData.title}
                padding= ''
            >
                {cmtsData.data}
            </Modal>}
            <Card rounded=' rounded-none sm:rounded-2xl ' margin=' mb-1 sm:mb-4 md:mx-auto ' addClassName={' w-full max-w-screen-lg p-3 sm:p-4 tl-' + data.id} >
                <View className="flex-auto flex-row items-top">
                    <Author data={data} url={url} t={t} />
                    <View className="flex-auto justify-end flex-row mb-auto">
                        {data.author_actions.map((item, index) => {
                            const Element = componentsMap[item.type]
                            if (!Element) return
                            return <Element params={{ button_variant: 'text' }} key={`action-${index}`} {...item} />
                        })}
                        <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} />
                    </View>
                </View>
                {MainContentComponent}
                {(!!data.menu_counters && appSetting('feed', 'counters_menu')) && <View className=' pt-3'><CounterMenu data={data.menu_counters} showCommentsModal={showCommentsModal} /></View>}
                <ActionMenu data={data.menu_actions} showCommentsModal={showCommentsModal} />
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={isCommentsModal} showCommentsModal={showCommentsModal} commentsDataInline={commentsData} data={data} isShowMoreComments={isShowMoreComments} />}
            </Card>
        </AnimatedBlock>
    )
}

export default function UnitFeed_({ data, mode }) {
    //  return useMemo(() => (
    return <UnitFeed data={data} mode={mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />
    //), [data, mode]);
}
