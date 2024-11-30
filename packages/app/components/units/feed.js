import React, { memo, useState, useEffect, useMemo, useRef } from 'react'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsSection, MenuManage, ActionMenu, CounterMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { GroupView, AdView, MarketView, DefaultView } from 'app/lib/feed-items'
import { appSetting } from 'app/lib/util'

function DefaultUnit(data) {
    const { t } = useTranslation();
    const [viewState, setViewState] = useState({ view: '' })

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

    if (viewState.view == 'deleted')
        return <></>

    if (viewState.view == 'edited')
        return <FeedEditForm setViewState={setViewState} id={data.id} viewState={viewState} />

    // return<View className='w-full h-12 bg-red-500 my-2'><Author data={data} url={url} t={t} /></View>
    return (
        <AnimatedBlock>
            <Card rounded=' rounded-none sm:rounded-2xl ' margin=' mb-1 sm:mb-4 md:mx-auto ' addClassName={' border-y w-full max-w-3xl p-3 sm:p-4 tl-' + data.id} >
                <View className="flex-auto flex-row items-top pb-3">
                    <Author data={data} url={url} t={t} />
                    <View className="flex-auto justify-end flex-row mb-auto">
                        <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} />
                    </View>
                </View>

                {MainContentComponent}
                <View className="pt-3">
                    {(!!data.menu_counters && appSetting('feed', 'counters_menu')) && <View className=' pt-3 sm:pt-4'><CounterMenu data={data.menu_counters}  /></View>}
                    <ActionMenu data={data.menu_actions} showCommentsModal={false} />
                </View>
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={false} showCommentsModal={false} commentsDataInline={commentsData} data={data} />}
            </Card>
        </AnimatedBlock>
    )
}

export default function UnitFeed_({ data, mode }) {
    //return useMemo(() => (
    return <UnitFeed data={data} mode={mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />
    //), [data, mode]);
}
