import React, { memo, useState, useEffect, useMemo, useRef } from 'react'
import { appSetting } from 'app/lib/util'
import { View } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { componentsMap } from 'app/ui/molecules/_map'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsModal, CommentsSection, MenuManage, ActionMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { GroupView, AdView, MarketView, DefaultView } from 'app/lib/feed-items'

function DefaultUnit(data) {

    const { t } = useTranslation();
    const [viewState, setViewState] = useState({ view: '' })
    const [cmtsData, setCmtsData] = useState(false)

    const isCommentsModal = appSetting('layout', 'comments_in_modal');
    if (isCommentsModal && data.menu_actions?.items[0].data?.callback)
        data.menu_actions.items.find(x => x.name == "item-comment").data.callback = showCommentsModal

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

    if (viewState.view == 'deleted')
        return <></>

    if (viewState.view == 'edited')
        return <FeedEditForm setViewState ={setViewState} id={data.id} viewState={viewState}/>

    return (
        <AnimatedBlock>
            {isCommentsModal && <Modal
                outerClickClose={false}
                onClose={() => setCmtsData(false)}
                onVisible={!!cmtsData}
                title={cmtsData.title}
            ><View className='p-2 sm:p-0'>
                    {cmtsData.data}
                </View>
            </Modal>}
            <Card rounded=' rounded-none sm:rounded-2xl ' margin=' mb-1 sm:mb-4 sm:mx-4 ' addClassName={' p-3 sm:p-4 tl-' + data.id} >
                <View className="flex-auto flex-row items-top pb-3 sm:pb-4">
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
                <View className="flex-col ">
                    {MainContentComponent}
                    <View className="pt-3 sm:pt-4">
                        <ActionMenu data={data.menu_actions} showCommentsModal={showCommentsModal} />
                    </View>

                </View>
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={isCommentsModal} showCommentsModal={showCommentsModal} commentsDataInline={commentsData} data={data} isShowMoreComments={isShowMoreComments} />}
            </Card>
        </AnimatedBlock>
    )
}

export default function UnitFeed_(props) {
    return <UnitFeed data={props.data} mode={props.mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />;
}
